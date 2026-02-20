import { NextResponse } from "next/server";
import dbPool, { execResult, queryRows } from "@/src/lib/db";
import { createUserSession, hashPassword } from "@/src/lib/auth";
import { isAiLanguage } from "@/src/lib/languages";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const preferredAiLanguage = isAiLanguage(body.preferredAiLanguage) ? body.preferredAiLanguage : "ro";

    if (!fullName || !email || !password) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const existing = await queryRows<{ id: number }>("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (existing.length) {
      return NextResponse.json({ error: "Email already exists." }, { status: 409 });
    }

    const passwordHash = hashPassword(password);
    const result = await execResult(
      "INSERT INTO users (full_name, email, password_hash, preferred_ai_language) VALUES (?, ?, ?, ?)",
      [fullName, email, passwordHash, preferredAiLanguage],
    );
    const userId = Number(result.insertId);

    const token = await createUserSession(
      userId,
      req.headers.get("x-forwarded-for"),
      req.headers.get("user-agent"),
    );

    return NextResponse.json({
      token,
      user: {
        id: userId,
        fullName,
        email,
        preferredAiLanguage,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
