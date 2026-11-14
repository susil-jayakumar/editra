import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import authAdmin from "@/middlewares/authAdmin";

// GET /api/admin/is-admin
export async function GET() {
  try {
    const { userId } = await auth();
    const isAdmin = await authAdmin(userId);
    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
