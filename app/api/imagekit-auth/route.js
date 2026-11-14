import { NextResponse } from "next/server";
import imagekit from "@/configs/imageKit";

// GET /api/imagekit-auth — returns auth params for client-side uploads
export async function GET() {
  try {
    const authParams = imagekit.getAuthenticationParameters();
    return NextResponse.json(authParams);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to get auth params" }, { status: 500 });
  }
}
