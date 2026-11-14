import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";

export async function GET() {
  try {
    const { userId } = await auth();
    const companyId = await authSeller(userId);
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const jobs = await prisma.job.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products: jobs, jobs });
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

    const formData = await request.formData();
    const title       = formData.get("title");
    const description = formData.get("description");
    const budget      = formData.get("budget");
    const imageFiles  = formData.getAll("images");

    if (!title || !description || !budget) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let imageUrls = [];
    if (imageFiles && imageFiles.length > 0) {
      const { default: imagekit } = await import("@/configs/imageKit");
      for (const file of imageFiles) {
        if (file && file.size > 0) {
          const buffer = Buffer.from(await file.arrayBuffer());
          const uploaded = await imagekit.upload({
            file: buffer,
            fileName: `job_${companyId}_${Date.now()}`,
            folder: "/jobs",
          });
          imageUrls.push(uploaded.url);
        }
      }
    }

    const job = await prisma.job.create({
      data: {
        companyId,
        title,
        description,
        budget: parseFloat(budget),
        images: imageUrls,
      },
    });

    return NextResponse.json({ job, success: true, message: "Job posted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { userId } = await auth();
    const companyId = await authSeller(userId);
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, title, description, budget, images } = await request.json();

    const job = await prisma.job.findFirst({ where: { id, companyId } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const updated = await prisma.job.update({
      where: { id },
      data: { title, description, budget: parseFloat(budget), images: images || [] },
    });

    return NextResponse.json({ job: updated, success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { userId } = await auth();
    const companyId = await authSeller(userId);
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await request.json();

    const job = await prisma.job.findFirst({ where: { id, companyId } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    await prisma.job.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
