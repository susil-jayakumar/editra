import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";

// GET /api/company/dashboard
export async function GET() {
  try {
    const { userId } = await auth();
    const companyId = await authSeller(userId);
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [totalJobs, totalApplications, hiredCount] = await Promise.all([
      prisma.job.count({ where: { companyId } }),
      prisma.jobApplication.count({ where: { job: { companyId } } }),
      prisma.jobApplication.count({ where: { job: { companyId }, status: "HIRED" } }),
    ]);

    const recentApplications = await prisma.jobApplication.findMany({
      where: { job: { companyId } },
      include: { job: true, editor: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({ totalJobs, totalApplications, hiredCount, recentApplications });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
