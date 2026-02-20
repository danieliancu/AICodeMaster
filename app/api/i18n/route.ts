import { NextResponse } from "next/server";
import { DEFAULT_AI_LANGUAGE, isAiLanguage } from "@/src/lib/languages";
import { queryRows } from "@/src/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const language = isAiLanguage(url.searchParams.get("language")) ? url.searchParams.get("language")! : DEFAULT_AI_LANGUAGE;

    const rows = await queryRows<{ key: string; value: string }>(
      `
      SELECT t.key, t.value
      FROM app_translations t
      WHERE t.language_code = ?
      `,
      [language],
    );

    const fallbackRows =
      language === "ro"
        ? []
        : await queryRows<{ key: string; value: string }>(
            `
            SELECT t.key, t.value
            FROM app_translations t
            WHERE t.language_code = 'ro'
            `,
          );

    const map: Record<string, string> = {};
    for (const row of fallbackRows) {
      map[row.key] = row.value;
    }
    for (const row of rows) {
      map[row.key] = row.value;
    }

    return NextResponse.json({ language, texts: map });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

