import { NextResponse } from "next/server";
import { generateExercise } from "@/src/lib/gemini";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const theme = typeof body.theme === "string" && body.theme.trim() ? body.theme.trim() : "Basic Web Layout";
    const exercise = await generateExercise(theme);
    return NextResponse.json(exercise);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
