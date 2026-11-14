import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Add new address
export async function POST(request){
    try {
        const { userId } = getAuth(request)
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { address } = await request.json()
        if (!address || typeof address !== "object") {
            return NextResponse.json({ error: "Valid address is required" }, { status: 400 })
        }

        const requiredFields = ["name", "street", "city", "state", "country", "phone"]
        const missingField = requiredFields.find((field) => !address[field])
        if (missingField) {
            return NextResponse.json(
                { error: `${missingField} is required` },
                { status: 400 }
            )
        }

        address.userId = userId

        const newAddress = await prisma.address.create({
            data: address
        })

        return NextResponse.json({newAddress, message: 'Address added successfully' })
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to add address" }, { status: 500 })
    }
}

// Get all addresses for a user
export async function GET(request){
    try {
        const { userId } = getAuth(request)
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const addresses = await prisma.address.findMany({
            where: { userId }
        })

        return NextResponse.json({addresses})
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 })
    }
}