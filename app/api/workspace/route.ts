import { NextResponse } from "next/server";
import dbPool, { queryRows } from "@/src/lib/db";
import { getAuthUserFromRequest } from "@/src/lib/auth";
import type { Technology } from "@/src/lib/types";

type WorkspaceCodeByTech = Partial<Record<Technology, string>>;

async function getLessonDbIdBySlug(slug: string) {
  const rows = await queryRows<{ id: number }>("SELECT id FROM lessons WHERE slug = ? LIMIT 1", [slug]);
  if (!rows.length) return null;
  return rows[0].id;
}

export async function GET(req: Request) {
  try {
    const authUser = await getAuthUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const lessonId = url.searchParams.get("lessonId");
    if (!lessonId) {
      return NextResponse.json({ error: "Missing lessonId." }, { status: 400 });
    }
    const lessonDbId = await getLessonDbIdBySlug(lessonId);
    if (!lessonDbId) {
      return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
    }

    const codeRows = await queryRows<{ code: string; value: string }>(
      `
      SELECT t.code, ulc.code AS value
      FROM user_lesson_code ulc
      JOIN technologies t ON t.id = ulc.technology_id
      WHERE ulc.user_id = ? AND ulc.lesson_id = ?
      `,
      [authUser.id, lessonDbId],
    );
    const codeByTech: WorkspaceCodeByTech = {};
    for (const row of codeRows) {
      codeByTech[row.code as Technology] = row.value;
    }

    const liveRows = await queryRows<{ rendered_output: string | null; result_json: unknown | null }>(
      `
      SELECT rendered_output, result_json
      FROM user_lesson_live_results
      WHERE user_id = ? AND lesson_id = ?
      LIMIT 1
      `,
      [authUser.id, lessonDbId],
    );

    const messageRows = await queryRows<{ id: number; role: "user" | "model" | "system"; message: string; created_at: string }>(
      `
      SELECT m.id, m.role, m.message, m.created_at
      FROM ai_threads t
      JOIN ai_messages m ON m.thread_id = t.id
      WHERE t.user_id = ? AND t.lesson_id = ? AND t.thread_type = 'teacher_chat'
      ORDER BY m.created_at ASC, m.id ASC
      `,
      [authUser.id, lessonDbId],
    );

    return NextResponse.json({
      codeByTech,
      renderedOutput: liveRows[0]?.rendered_output ?? null,
      resultJson: liveRows[0]?.result_json ?? null,
      aiMessages: messageRows.map((row) => ({
        id: String(row.id),
        role: row.role,
        text: row.message,
        time: new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const lessonId = typeof body.lessonId === "string" ? body.lessonId : "";
    const codeByTech =
      typeof body.codeByTech === "object" && body.codeByTech !== null
        ? (body.codeByTech as WorkspaceCodeByTech)
        : null;
    const renderedOutput = typeof body.renderedOutput === "string" ? body.renderedOutput : null;
    const resultJson =
      typeof body.resultJson === "object" && body.resultJson !== null ? (body.resultJson as object) : null;
    const eventType = typeof body.eventType === "string" ? body.eventType : null;
    const payloadJson = typeof body.payloadJson === "object" && body.payloadJson !== null ? body.payloadJson : null;

    if (!lessonId) {
      return NextResponse.json({ error: "Missing lessonId." }, { status: 400 });
    }
    const lessonDbId = await getLessonDbIdBySlug(lessonId);
    if (!lessonDbId) {
      return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
    }

    await dbPool.query(
      `
      INSERT INTO user_lesson_state (user_id, lesson_id, progress, last_accessed_at)
      VALUES (?, ?, 'in_progress', NOW())
      ON DUPLICATE KEY UPDATE
        progress = CASE WHEN progress = 'not_started' THEN 'in_progress' ELSE progress END,
        last_accessed_at = NOW()
      `,
      [authUser.id, lessonDbId],
    );

    if (codeByTech) {
      for (const [techCode, code] of Object.entries(codeByTech)) {
        if (typeof code !== "string") continue;
        const techRows = await queryRows<{ id: number }>("SELECT id FROM technologies WHERE code = ? LIMIT 1", [techCode]);
        if (!techRows.length) continue;
        const technologyId = techRows[0].id;
        await dbPool.query(
          `
          INSERT INTO user_lesson_code (user_id, lesson_id, technology_id, code)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE code = VALUES(code), updated_at = CURRENT_TIMESTAMP
          `,
          [authUser.id, lessonDbId, technologyId, code],
        );
      }
    }

    if (renderedOutput !== null || resultJson !== null) {
      await dbPool.query(
        `
        INSERT INTO user_lesson_live_results (user_id, lesson_id, rendered_output, result_json)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          rendered_output = VALUES(rendered_output),
          result_json = VALUES(result_json),
          updated_at = CURRENT_TIMESTAMP
        `,
        [authUser.id, lessonDbId, renderedOutput, resultJson ? JSON.stringify(resultJson) : null],
      );
    }

    if (eventType && payloadJson) {
      await dbPool.query(
        `
        INSERT INTO user_lesson_events (user_id, lesson_id, event_type, payload_json)
        VALUES (?, ?, ?, ?)
        `,
        [authUser.id, lessonDbId, eventType, JSON.stringify(payloadJson)],
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
