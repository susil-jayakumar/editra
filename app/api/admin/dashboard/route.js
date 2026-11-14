import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";

export async function GET() {
  try {
    const { userId } = await auth();
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [totalJobs, totalApplications, totalCompanies] = await Promise.all([
      prisma.job.count(),
      prisma.jobApplication.count(),
      prisma.company.count(),
    ]);

    return NextResponse.json({
      dashboardData: { totalJobs, totalApplications, totalCompanies },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
