import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/company/create
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, username, description, logo, email, phone, address } = body;

    if (!name || !username || !description || !logo || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check username uniqueness
    const existing = await prisma.company.findUnique({ where: { username } });
    if (existing) return NextResponse.json({ error: "Username already taken" }, { status: 409 });

    const company = await prisma.company.create({
      data: { userId, name, username, description, logo, email, phone, address },
    });

    return NextResponse.json({ company, success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
