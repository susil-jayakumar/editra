import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureUser } from "@/lib/ensureUser";

async function syncUser(userId) {
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  return await ensureUser(clerkUser);
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ cart: {} });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ cart: {} });
    return NextResponse.json({ cart: user.cart || {} });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Ensure user exists before updating
    await syncUser(userId);

    const { cart } = await request.json();
    const user = await prisma.user.update({
      where: { id: userId },
      data: { cart: cart || {} },
    });
    return NextResponse.json({ cart: user.cart, success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await syncUser(userId);
    await prisma.user.update({
      where: { id: userId },
      data: { cart: {} },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
