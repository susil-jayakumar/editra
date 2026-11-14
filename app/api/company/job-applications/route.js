import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";

// PUT /api/company/job-applications  — update application status
export async function PUT(request) {
  try {
    const { userId } = await auth();
    const companyId = await authSeller(userId);
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, status } = await request.json();

    const validStatuses = ["APPLIED", "IN_REVIEW", "HIRED", "IN_PROGRESS", "COMPLETED", "REJECTED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Verify application belongs to this company
    const application = await prisma.jobApplication.findFirst({
      where: { id, job: { companyId } },
    });
    if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });

    const updated = await prisma.jobApplication.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ application: updated, success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
