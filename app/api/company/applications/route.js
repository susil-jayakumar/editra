import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";

export async function GET() {
  try {
    const { userId } = await auth();
    const companyId = await authSeller(userId);
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const applications = await prisma.jobApplication.findMany({
      where: { job: { companyId } },
      include: {
        job: true,
        editor: { include: { user: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    const companyId = await authSeller(userId);
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { applicationId, id, status, revisionNote } = await request.json();
    const resolvedId = applicationId || id;

    const validStatuses = ["APPLIED", "IN_REVIEW", "HIRED", "IN_PROGRESS", "DELIVERED", "REVISION", "COMPLETED", "REJECTED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const application = await prisma.jobApplication.findFirst({
      where: { id: resolvedId, job: { companyId } },
    });
    if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });

    const updated = await prisma.jobApplication.update({
      where: { id: resolvedId },
      data: {
        status,
        ...(revisionNote && { revisionNote }),
      },
    });

    return NextResponse.json({ application: updated, success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request) {
  return POST(request);
}
