import { NextResponse } from "next/server";
import { chatResponse } from "@/src/lib/gemini";
import { isAiLanguage } from "@/src/lib/languages";
import dbPool, { execResult, queryRows } from "@/src/lib/db";
import { getAuthUserFromRequest } from "@/src/lib/auth";

async function getLessonDbIdBySlug(slug: string) {
  const rows = await queryRows<{ id: number }>("SELECT id FROM lessons WHERE slug = ? LIMIT 1", [slug]);
  return rows[0]?.id ?? null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const aiLanguage = isAiLanguage(body.aiLanguage) ? body.aiLanguage : "ro";
    const answer = await chatResponse(body.exercise, body.userCode, body.userQuestion, body.chatHistory ?? [], aiLanguage);

    const authUser = await getAuthUserFromRequest(req);
    const lessonId = typeof body.lessonId === "string" ? body.lessonId : "";
    if (authUser && lessonId) {
      const lessonDbId = await getLessonDbIdBySlug(lessonId);
      if (lessonDbId) {
        const threadRows = await queryRows<{ id: number }>(
          `
          SELECT id FROM ai_threads
          WHERE user_id = ? AND lesson_id = ? AND thread_type = 'teacher_chat'
          ORDER BY id ASC LIMIT 1
          `,
          [authUser.id, lessonDbId],
        );
        const threadId = threadRows[0]?.id
          ? threadRows[0].id
          : Number(
              (
                await execResult(
                  "INSERT INTO ai_threads (user_id, lesson_id, thread_type) VALUES (?, ?, 'teacher_chat')",
                  [authUser.id, lessonDbId],
                )
              ).insertId,
            );

        if (typeof body.userQuestion === "string" && body.userQuestion.trim()) {
          await dbPool.query("INSERT INTO ai_messages (thread_id, role, message) VALUES (?, 'user', ?)", [
            threadId,
            body.userQuestion.trim(),
          ]);
        }
        await dbPool.query("INSERT INTO ai_messages (thread_id, role, message) VALUES (?, 'model', ?)", [threadId, answer]);
      }
    }

    return NextResponse.json({ text: answer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
