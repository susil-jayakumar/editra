import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";

// GET /api/admin/coupon
export async function GET() {
  try {
    const { userId } = await auth();
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/admin/coupon
export async function POST(request) {
  try {
    const { userId } = await auth();
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { code, description, discount, forNewUser, forMember, isPublic, expiresAt } = body;

    if (!code || !description || discount === undefined || !expiresAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        description,
        discount: parseFloat(discount),
        forNewUser: !!forNewUser,
        forMember: !!forMember,
        isPublic: !!isPublic,
        expiresAt: new Date(expiresAt),
      },
    });

    return NextResponse.json({ coupon, success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/admin/coupon?code=CODE
export async function DELETE(request) {
  try {
    const { userId } = await auth();
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    await prisma.coupon.delete({ where: { code } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
