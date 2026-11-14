import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const getStripeClient = () => {
    if (!process.env.STRIPE_SECRET_KEY) {
        return null
    }
    return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export async function POST(request){
    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            return NextResponse.json({ error: "Stripe webhook secret is not configured" }, { status: 500 })
        }

        const stripe = getStripeClient()
        if (!stripe) {
            return NextResponse.json({ error: "Stripe secret key is not configured" }, { status: 500 })
        }

        const body = await request.text()
        const sig = request.headers.get('stripe-signature')
        if (!sig) {
            return NextResponse.json({ error: "Missing stripe signature" }, { status: 400 })
        }

        const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)

        const handlePaymentIntent = async (paymentIntentId, isPaid) => {
            const session = await stripe.checkout.sessions.list({
                payment_intent: paymentIntentId
            })

            const checkoutSession = session.data?.[0]
            const metadata = checkoutSession?.metadata
            if (!metadata) {
                return
            }

            const {orderIds, userId, appId} = metadata
            
            if(appId !== 'gocart'){
                return
            }

            if (!orderIds || !userId) {
                return
            }

            const orderIdsArray = orderIds.split(',')

            if(isPaid){
                // mark order as paid
                await Promise.all(orderIdsArray.map(async (orderId) => {
                    await prisma.order.update({
                        where: {id: orderId},
                        data: {isPaid: true}
                    })
                }))
                // delete cart from user
                await prisma.user.update({
                    where: {id: userId},
                    data: {cart : {}}
                })
            }else{
                 // delete order from db
                 await Promise.all(orderIdsArray.map(async (orderId) => {
                    await prisma.order.delete({
                        where: {id: orderId}
                    })
                 }))
            }
        }

    
        switch (event.type) {
            case 'payment_intent.succeeded': {
                await handlePaymentIntent(event.data.object.id, true)
                break;
            }

            case 'payment_intent.canceled': {
                await handlePaymentIntent(event.data.object.id, false)
                break;
            }
        
            default:
                console.log('Unhandled event type:', event.type)
                break;
        }

        return NextResponse.json({received: true})
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Stripe webhook handling failed" }, { status: 400 })
    }
}

export const config = {
    api: {bodyparser: false }
}