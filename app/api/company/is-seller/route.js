import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/company/is-seller
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ isSeller: false });

    const company = await prisma.company.findFirst({
      where: { userId, status: "APPROVED", isActive: true },
    });

    return NextResponse.json({ isSeller: !!company, companyId: company?.id || null });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
