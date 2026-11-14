import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/products — public product listing
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const storeId  = searchParams.get("storeId");

    const where = {
      inStock: true,
      ...(category && { category }),
      ...(storeId  && { storeId }),
    };

    const products = await prisma.product.findMany({
      where,
      include: { store: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
