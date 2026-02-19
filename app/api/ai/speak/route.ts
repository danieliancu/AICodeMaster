import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Voice is disabled in this build." }, { status: 410 });
}
