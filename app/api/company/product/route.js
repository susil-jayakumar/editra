import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";

// GET /api/company/product
export async function GET() {
  try {
    const { userId } = await auth();
    const companyId = await authSeller(userId);
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const store = await prisma.store.findUnique({ where: { userId } });
    if (!store) return NextResponse.json({ products: [] });

    const products = await prisma.product.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/company/product
export async function POST(request) {
  try {
    const { userId } = await auth();
    const companyId = await authSeller(userId);
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const store = await prisma.store.findUnique({ where: { userId } });
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const { name, description, mrp, price, images, category } = await request.json();

    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        name,
        description,
        mrp: parseFloat(mrp),
        price: parseFloat(price),
        images: images || [],
        category,
      },
    });

    return NextResponse.json({ product, success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/company/product?id=ID
export async function DELETE(request) {
  try {
    const { userId } = await auth();
    const companyId = await authSeller(userId);
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    const store = await prisma.store.findUnique({ where: { userId } });
    const product = await prisma.product.findFirst({ where: { id, storeId: store?.id } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
