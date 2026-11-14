import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";

export async function GET() {
  try {
    const { userId } = await auth();
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const stores = await prisma.company.findMany({
      include: { user: true, jobs: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ stores: stores || [] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ stores: [], error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { storeId } = await request.json();
    const company = await prisma.company.findUnique({ where: { id: storeId } });
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const updated = await prisma.company.update({
      where: { id: storeId },
      data: { isActive: !company.isActive },
    });

    return NextResponse.json({ company: updated, success: true, message: `Company ${updated.isActive ? "activated" : "deactivated"} successfully` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
