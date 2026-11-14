import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";

export async function POST(request) {
  try {
    const { userId } = await auth();
    const companyId = await authSeller(userId);
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { jobId, id } = await request.json();
    const resolvedId = jobId || id;

    const job = await prisma.job.findFirst({ where: { id: resolvedId, companyId } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const updated = await prisma.job.update({
      where: { id: resolvedId },
      data: { isOpen: !job.isOpen },
    });

    return NextResponse.json({ job: updated, success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request) {
  return POST(request);
}
