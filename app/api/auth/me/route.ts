import { NextResponse } from "next/server";
import dbPool, { queryRows } from "@/src/lib/db";
import { getAuthUserFromRequest, hashPassword } from "@/src/lib/auth";
import { isAiLanguage } from "@/src/lib/languages";

export async function GET(req: Request) {
  try {
    const authUser = await getAuthUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({
      user: authUser,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const authUser = await getAuthUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : undefined;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : undefined;
    const password = typeof body.password === "string" ? body.password : undefined;
    const preferredAiLanguage = isAiLanguage(body.preferredAiLanguage) ? body.preferredAiLanguage : undefined;

    if (email && email !== authUser.email) {
      const existing = await queryRows<{ id: number }>(
        "SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1",
        [email, authUser.id],
      );
      if (existing.length) {
        return NextResponse.json({ error: "Email already exists." }, { status: 409 });
      }
    }

    await dbPool.query(
      `
      UPDATE users
      SET
        full_name = COALESCE(?, full_name),
        email = COALESCE(?, email),
        password_hash = CASE WHEN ? IS NULL OR ? = '' THEN password_hash ELSE ? END,
        preferred_ai_language = COALESCE(?, preferred_ai_language)
      WHERE id = ?
      `,
      [
        fullName ?? null,
        email ?? null,
        password ?? null,
        password ?? null,
        password ? hashPassword(password) : null,
        preferredAiLanguage ?? null,
        authUser.id,
      ],
    );

    const rows = await queryRows<{ id: number; full_name: string; email: string; preferred_ai_language: string }>(
      "SELECT id, full_name, email, preferred_ai_language FROM users WHERE id = ? LIMIT 1",
      [authUser.id],
    );
    const user = rows[0];

    return NextResponse.json({
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

export async function DELETE(req: Request) {
  try {
    const authUser = await getAuthUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await dbPool.query("DELETE FROM users WHERE id = ?", [authUser.id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
