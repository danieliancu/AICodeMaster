import { NextResponse } from "next/server";
import { teacherFeedback } from "@/src/lib/gemini";
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
    const result = await teacherFeedback(body.exercise, body.userCode, Boolean(body.isRealTime), aiLanguage);

    const authUser = await getAuthUserFromRequest(req);
    const lessonId = typeof body.lessonId === "string" ? body.lessonId : "";
    if (authUser && lessonId) {
      const lessonDbId = await getLessonDbIdBySlug(lessonId);
      if (lessonDbId) {
        const threadRows = await queryRows<{ id: number }>(
          `
          SELECT id FROM ai_threads
          WHERE user_id = ? AND lesson_id = ? AND thread_type = 'realtime_feedback'
          ORDER BY id ASC LIMIT 1
          `,
          [authUser.id, lessonDbId],
        );
        const threadId = threadRows[0]?.id
          ? threadRows[0].id
          : Number(
              (
                await execResult(
                  "INSERT INTO ai_threads (user_id, lesson_id, thread_type) VALUES (?, ?, 'realtime_feedback')",
                  [authUser.id, lessonDbId],
                )
              ).insertId,
            );

        await dbPool.query(
          "INSERT INTO ai_messages (thread_id, role, message, is_correct) VALUES (?, 'model', ?, ?)",
          [threadId, result.feedback, result.isCorrect ? 1 : 0],
        );

        if (result.isCorrect) {
          await dbPool.query(
            `
            INSERT INTO user_lesson_state (user_id, lesson_id, progress, last_accessed_at)
            VALUES (?, ?, 'completed', NOW())
            ON DUPLICATE KEY UPDATE progress = 'completed', last_accessed_at = NOW()
            `,
            [authUser.id, lessonDbId],
          );
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
