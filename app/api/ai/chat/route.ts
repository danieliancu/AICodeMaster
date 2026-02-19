import { NextResponse } from "next/server";
import { chatResponse } from "@/src/lib/gemini";
import { isAiLanguage } from "@/src/lib/languages";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const aiLanguage = isAiLanguage(body.aiLanguage) ? body.aiLanguage : "ro";
    const answer = await chatResponse(body.exercise, body.userCode, body.userQuestion, body.chatHistory ?? [], aiLanguage);
    return NextResponse.json({ text: answer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
