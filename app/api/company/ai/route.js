import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import authSeller from "@/middlewares/authSeller";

export async function POST(request) {
  try {
    const { userId } = await auth();
    const companyId = await authSeller(userId);
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "AI feature not configured" }, { status: 503 });
    }

    const { prompt } = await request.json();
    if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

    const { openai } = await import("@/configs/openai");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional job description writer for a freelance editing platform. Write clear, concise, and attractive job descriptions. Return only the job description text.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
    });

    const text = completion.choices[0]?.message?.content || "";
    return NextResponse.json({ text, success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
