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
      where: { status: "PENDING" },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ stores });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { storeId, companyId, status } = await request.json();
    const resolvedId = storeId || companyId;

    const statusMap = { approved: "APPROVED", rejected: "REJECTED", pending: "PENDING" };
    const prismaStatus = statusMap[status?.toLowerCase()] || status;

    const company = await prisma.company.update({
      where: { id: resolvedId },
      data: { status: prismaStatus, isActive: prismaStatus === "APPROVED" },
    });

    return NextResponse.json({ company, success: true, message: `Company ${status} successfully` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request) {
  return POST(request);
}
