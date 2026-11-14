import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";

// GET /api/company/orders
export async function GET() {
  try {
    const { userId } = await auth();
    const companyId = await authSeller(userId);
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get the store linked to this company's user
    const store = await prisma.store.findUnique({ where: { userId } });
    if (!store) return NextResponse.json({ orders: [] });

    const orders = await prisma.order.findMany({
      where: { storeId: store.id },
      include: {
        orderItems: { include: { product: true } },
        address: true,
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
