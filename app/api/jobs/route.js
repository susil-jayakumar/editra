import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // ===============================
    // FETCH SINGLE JOB
    // ===============================
    if (id) {
      const job = await prisma.job.findUnique({
        where: { id },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              username: true,
              logo: true,
              isActive: true,
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        }
      });

      if (!job || !job.company?.isActive) {
        return NextResponse.json(
          { error: "Job not found" },
          { status: 404 }
        );
      }

      // ✅ Remove empty images
      job.images = job.images?.filter(Boolean) || [];

      return NextResponse.json({ job });
    }

    // ===============================
    // FETCH ALL JOBS
    // ===============================
    let jobs = await prisma.job.findMany({
      where: { isOpen: true },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            username: true,
            logo: true,
            isActive: true,
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Only active companies
    jobs = jobs.filter(job => job.company.isActive);

    // ✅ Remove empty images from all jobs
    jobs = jobs.map(job => ({
      ...job,
      images: job.images?.filter(Boolean) || []
    }));

    return NextResponse.json({ jobs });

  } catch (error) {
    console.error("JOBS API ERROR:", error);

    // In local/dev environments the DB may be temporarily unreachable.
    // Return a safe empty payload so the homepage doesn't hard-fail.
    if (
      error?.name === "PrismaClientInitializationError" ||
      error?.message?.includes("Can't reach database server")
    ) {
      return NextResponse.json({
        jobs: [],
        warning: "Database unavailable. Returning empty jobs list.",
      });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}