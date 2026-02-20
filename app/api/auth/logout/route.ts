import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import dbPool from "@/src/lib/db";
import { getBearerToken } from "@/src/lib/auth";

export async function POST(req: Request) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ success: true });
    }
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await dbPool.query("UPDATE user_sessions SET revoked_at = NOW() WHERE token_hash = ?", [tokenHash]);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

