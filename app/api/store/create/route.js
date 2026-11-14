import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureUser } from "@/lib/ensureUser";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ store: null });

    const company = await prisma.company.findUnique({ where: { userId } });
    if (!company) return NextResponse.json({ store: null });

    return NextResponse.json({ status: company.status.toLowerCase(), company });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Ensure user exists in DB
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    await ensureUser(clerkUser);

    const formData = await request.formData();

    const name        = formData.get("name");
    const description = formData.get("description");
    const username    = formData.get("username");
    const email       = formData.get("email");
    const phone       = formData.get("phone") || formData.get("contact") || "";
    const address     = formData.get("address");
    const imageFile   = formData.get("image");

    if (!name || !username || !description || !email || !address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if company already exists for this user
    const existingUserCompany = await prisma.company.findUnique({ where: { userId } });
    if (existingUserCompany) {
      return NextResponse.json({ error: "You already have a company", status: existingUserCompany.status.toLowerCase() }, { status: 409 });
    }

    // Check username uniqueness
    const existingUsername = await prisma.company.findUnique({ where: { username } });
    if (existingUsername) return NextResponse.json({ error: "Username already taken" }, { status: 409 });

    // Upload logo to ImageKit if provided
    let logo = "";
    if (imageFile && imageFile.size > 0) {
      const { default: imagekit } = await import("@/configs/imageKit");
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const uploaded = await imagekit.upload({
        file: buffer,
        fileName: `logo_${userId}_${Date.now()}`,
        folder: "/logos",
      });
      logo = uploaded.url;
    }

    const company = await prisma.company.create({
      data: {
        userId,
        name,
        username,
        description,
        email,
        phone,
        address,
        logo,
        status: "PENDING",
        isActive: false,
      },
    });

    return NextResponse.json({ company, success: true, message: "Company submitted for review!" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
