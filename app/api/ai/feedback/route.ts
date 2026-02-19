import { NextResponse } from "next/server";
import { teacherFeedback } from "@/src/lib/gemini";
import { isAiLanguage } from "@/src/lib/languages";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const aiLanguage = isAiLanguage(body.aiLanguage) ? body.aiLanguage : "ro";
    const result = await teacherFeedback(body.exercise, body.userCode, Boolean(body.isRealTime), aiLanguage);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
