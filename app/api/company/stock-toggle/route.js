import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";

// PUT /api/company/stock-toggle
export async function PUT(request) {
  try {
    const { userId } = await auth();
    const companyId = await authSeller(userId);
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await request.json();

    const store = await prisma.store.findUnique({ where: { userId } });
    const product = await prisma.product.findFirst({ where: { id, storeId: store?.id } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const updated = await prisma.product.update({
      where: { id },
      data: { inStock: !product.inStock },
    });

    return NextResponse.json({ product: updated, success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
