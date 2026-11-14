import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureUser } from "@/lib/ensureUser";

async function syncUser(userId) {
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  await ensureUser(clerkUser);
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await syncUser(userId);
    const profile = await prisma.editorProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
    return NextResponse.json({ profile });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await syncUser(userId);
    const formData = await request.formData();
    const phone      = formData.get("phone") || null;
    const experience = formData.get("experience") || null;
    const portfolio  = formData.get("portfolio") || null;
    const youtube    = formData.get("youtube") || null;
    const instagram  = formData.get("instagram") || null;
    let skills = [];
    let software = [];
    try { skills   = JSON.parse(formData.get("skills")   || "[]"); } catch {}
    try { software = JSON.parse(formData.get("software") || "[]"); } catch {}
    let resumeUrl = null;
    const resumeFile = formData.get("resume");
    if (resumeFile && resumeFile.size > 0) {
      const { default: imagekit } = await import("@/configs/imageKit");
      const buffer = Buffer.from(await resumeFile.arrayBuffer());
      const uploaded = await imagekit.upload({
        file: buffer,
        fileName: `resume_${userId}_${Date.now()}.pdf`,
        folder: "/resumes",
      });
      resumeUrl = uploaded.url;
    }
    const updateData = {
      phone, experience, portfolio, youtube, instagram, skills, software,
      ...(resumeUrl && { resumeUrl }),
    };
    const profile = await prisma.editorProfile.upsert({
      where: { userId },
      update: updateData,
      create: { userId, ...updateData },
    });
    return NextResponse.json({ profile, success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
