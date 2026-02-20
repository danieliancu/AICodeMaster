import { NextResponse } from "next/server";
import dbPool, { queryRows } from "@/src/lib/db";
import { createUserSession, verifyPassword } from "@/src/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password." }, { status: 400 });
    }

    const rows = await queryRows<{ id: number; full_name: string; email: string; password_hash: string; preferred_ai_language: string }>(
      "SELECT id, full_name, email, password_hash, preferred_ai_language FROM users WHERE email = ? LIMIT 1",
      [email],
    );
    if (!rows.length) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }
    const user = rows[0];
    if (!verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    await dbPool.query("UPDATE users SET last_login_at = NOW() WHERE id = ?", [user.id]);

    const token = await createUserSession(
      user.id,
      req.headers.get("x-forwarded-for"),
      req.headers.get("user-agent"),
    );

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        preferredAiLanguage: user.preferred_ai_language,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
