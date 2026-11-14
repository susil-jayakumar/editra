import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


// Add new rating
export async function POST(request){
    try {
        const { userId } = getAuth(request)
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const {orderId, productId, rating, review} = await request.json()
        const parsedRating = Number(rating)

        if (!orderId || !productId || Number.isNaN(parsedRating)) {
            return NextResponse.json(
                { error: "orderId, productId and numeric rating are required" },
                { status: 400 }
            )
        }

        if (parsedRating < 1 || parsedRating > 5) {
            return NextResponse.json(
                { error: "Rating must be between 1 and 5" },
                { status: 400 }
            )
        }

        const order = await prisma.order.findUnique({ where: { id: orderId } })

        if(!order || order.userId !== userId){
            return NextResponse.json({ error: "Order not found" }, { status: 404 })
        }

         const isAlreadyRated = await prisma.rating.findFirst({where: {productId, orderId}})

         if(isAlreadyRated){
            return NextResponse.json({ error: "Product already rated" }, { status: 400 })
         }

         const response = await prisma.rating.create({
            data: {userId, productId, rating: parsedRating, review, orderId}
         })

         return NextResponse.json({message: "Rating added successfully", rating: response})

      
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: "Failed to add rating"}, { status: 500 })
    }
}

// Get all ratings for a user
export async function GET(request){
    try {
        const {userId} = getAuth(request)
        if(!userId){
            return NextResponse.json({error: "Unauthorized"}, { status: 401 })
        }
        const ratings = await prisma.rating.findMany({
            where: {userId}
        })

        return NextResponse.json({ratings})
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: "Failed to fetch ratings"}, { status: 500 })
    }
}