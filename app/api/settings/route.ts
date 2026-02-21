import { NextResponse } from "next/server";
import { AI_LANGUAGE_OPTIONS, DEFAULT_AI_LANGUAGE, isAiLanguage } from "@/src/lib/languages";
import { getAuthUserFromRequest } from "@/src/lib/auth";
import dbPool, { queryRows } from "@/src/lib/db";
import type { LessonProgress, Technology } from "@/src/lib/types";

type LessonRow = {
  lesson_id: number;
  slug: string;
  internal_name: string;
  lesson_name: string | null;
  lesson_title: string | null;
  lesson_description: string | null;
  target_code_json: string | null;
  hints_json: string | null;
};

const FALLBACK_LESSON_SLUG = "basic-layout";
type EditorTheme = "light" | "dark";
type BoolLike = 0 | 1;

function isEditorTheme(value: unknown): value is EditorTheme {
  return value === "light" || value === "dark";
}

function toBoolLike(value: unknown): BoolLike {
  return value === 1 || value === "1" || value === true ? 1 : 0;
}

function isLessonProgress(value: unknown): value is LessonProgress {
  return value === "not_started" || value === "in_progress" || value === "completed";
}

function safeParseJson<T>(input: string | null, fallback: T): T {
  if (!input) return fallback;
  try {
    return JSON.parse(input) as T;
  } catch {
    return fallback;
  }
}

async function loadLessons(language: string) {
  const rows = await queryRows<LessonRow>(
    `
    SELECT
      l.id AS lesson_id,
      l.slug,
      l.internal_name,
      COALESCE(ll.lesson_name, ll_ro.lesson_name, l.internal_name) AS lesson_name,
      COALESCE(ll.lesson_title, ll_ro.lesson_title, l.internal_name) AS lesson_title,
      COALESCE(ll.lesson_description, ll_ro.lesson_description, '') AS lesson_description,
      COALESCE(ll.target_code_json, ll_ro.target_code_json) AS target_code_json,
      COALESCE(ll.hints_json, ll_ro.hints_json) AS hints_json
    FROM lessons l
    LEFT JOIN lesson_localizations ll
      ON ll.lesson_id = l.id AND ll.language_code = ?
    LEFT JOIN lesson_localizations ll_ro
      ON ll_ro.lesson_id = l.id AND ll_ro.language_code = 'ro'
    WHERE l.is_active = 1
    ORDER BY l.sort_order ASC, l.id ASC
    `,
    [language],
  );

  const lessonIds = rows.map((r) => r.lesson_id);
  const techMap = new Map<number, Technology[]>();
  if (lessonIds.length) {
    const placeholders = lessonIds.map(() => "?").join(", ");
    const techRows = await queryRows<{ lesson_id: number; code: string }>(
      `
      SELECT lt.lesson_id, t.code
      FROM lesson_technologies lt
      JOIN technologies t ON t.id = lt.technology_id
      WHERE lt.lesson_id IN (${placeholders})
      ORDER BY lt.lesson_id, lt.sort_order
      `,
      lessonIds,
    );
    for (const row of techRows) {
      const current = techMap.get(row.lesson_id) ?? [];
      current.push(row.code as Technology);
      techMap.set(row.lesson_id, current);
    }
  }

  return rows.map((row) => {
    const technologies = techMap.get(row.lesson_id) ?? (["html", "css", "javascript"] as Technology[]);
    const targetCode = safeParseJson<Partial<Record<Technology, string>>>(row.target_code_json, {});
    const hints = safeParseJson<string[]>(row.hints_json, []);
    return {
      lessonDbId: row.lesson_id,
      id: row.slug,
      name: row.lesson_name || row.internal_name,
      title: row.lesson_title || row.internal_name,
      description: row.lesson_description || "",
      technologies,
      exercise: {
        title: row.lesson_title || row.internal_name,
        description: row.lesson_description || "",
        targetHtml: targetCode.html ?? "",
        targetCss: targetCode.css ?? "",
        targetJs: targetCode.javascript ?? "",
        hints,
        technologies,
      },
    };
  });
}

export async function GET(req: Request) {
  try {
    const authUser = await getAuthUserFromRequest(req);
    const url = new URL(req.url);
    const guestLanguageParam = url.searchParams.get("language");
    const guestLessonParam = url.searchParams.get("lessonId");
    const selectedAiLanguage = authUser
      ? (isAiLanguage(authUser.preferredAiLanguage) ? authUser.preferredAiLanguage : DEFAULT_AI_LANGUAGE)
      : (isAiLanguage(guestLanguageParam) ? guestLanguageParam : DEFAULT_AI_LANGUAGE);

    const lessons = await loadLessons(selectedAiLanguage);
    const defaultLessonId = lessons.find((lesson) => lesson.id === FALLBACK_LESSON_SLUG)?.id ?? lessons[0]?.id ?? "";

    const progressBySlug = new Map<string, LessonProgress>();
    let selectedLessonId = defaultLessonId;

    if (authUser) {
      const progressRows = await queryRows<{ slug: string; progress: LessonProgress }>(
        `
        SELECT l.slug, uls.progress
        FROM user_lesson_state uls
        JOIN lessons l ON l.id = uls.lesson_id
        WHERE uls.user_id = ?
        `,
        [authUser.id],
      );
      for (const row of progressRows) {
        progressBySlug.set(row.slug, row.progress);
      }

      const lastRows = await queryRows<{ slug: string }>(
        `
        SELECT l.slug
        FROM user_lesson_state uls
        JOIN lessons l ON l.id = uls.lesson_id
        WHERE uls.user_id = ?
        ORDER BY COALESCE(uls.last_accessed_at, uls.updated_at) DESC
        LIMIT 1
        `,
        [authUser.id],
      );
      if (lastRows.length && lessons.some((l) => l.id === lastRows[0].slug)) {
        selectedLessonId = lastRows[0].slug;
      }
    } else if (guestLessonParam && lessons.some((lesson) => lesson.id === guestLessonParam)) {
      selectedLessonId = guestLessonParam;
    }

    const selectedLesson =
      lessons.find((l) => l.id === selectedLessonId) ??
      lessons.find((l) => l.id === defaultLessonId) ??
      lessons[0];

    let preferredEditorTheme: EditorTheme = "light";
    let preferredXrayEnabled = false;
    if (authUser) {
      const prefRows = await queryRows<{ preferred_editor_theme: string | null; preferred_xray_enabled: number | null }>(
        "SELECT preferred_editor_theme, preferred_xray_enabled FROM users WHERE id = ? LIMIT 1",
        [authUser.id],
      );
      const rawTheme = prefRows[0]?.preferred_editor_theme;
      preferredEditorTheme = isEditorTheme(rawTheme) ? rawTheme : "light";
      preferredXrayEnabled = toBoolLike(prefRows[0]?.preferred_xray_enabled) === 1;
    }

    return NextResponse.json({
      defaultLessonId,
      selectedLessonId: selectedLesson?.id ?? defaultLessonId,
      selectedAiLanguage,
      preferredEditorTheme,
      preferredXrayEnabled,
      aiLanguageOptions: AI_LANGUAGE_OPTIONS,
      lessons: lessons.map((lesson) => ({
        id: lesson.id,
        name: lesson.name,
        title: lesson.title,
        description: lesson.description,
        progress: progressBySlug.get(lesson.id) ?? "not_started",
        technologies: lesson.technologies,
      })),
      exercise_json: selectedLesson ? JSON.stringify(selectedLesson.exercise) : null,
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
    const selectedLessonId = typeof body.selectedLessonId === "string" ? body.selectedLessonId : undefined;
    const selectedAiLanguage = isAiLanguage(body.selectedAiLanguage) ? body.selectedAiLanguage : undefined;
    const preferredEditorTheme = isEditorTheme(body.preferredEditorTheme) ? body.preferredEditorTheme : undefined;
    const preferredXrayEnabled =
      body.preferredXrayEnabled === undefined ? undefined : toBoolLike(body.preferredXrayEnabled);
    const lessonProgressInput =
      typeof body.lessonProgress === "object" && body.lessonProgress !== null
        ? (body.lessonProgress as Record<string, unknown>)
        : null;

    if (selectedAiLanguage) {
      await dbPool.query("UPDATE users SET preferred_ai_language = ? WHERE id = ?", [selectedAiLanguage, authUser.id]);
    }

    if (preferredEditorTheme) {
      await dbPool.query("UPDATE users SET preferred_editor_theme = ? WHERE id = ?", [preferredEditorTheme, authUser.id]);
    }

    if (preferredXrayEnabled !== undefined) {
      await dbPool.query("UPDATE users SET preferred_xray_enabled = ? WHERE id = ?", [preferredXrayEnabled, authUser.id]);
    }

    const lessonRows = await queryRows<{ id: number; slug: string }>(
      "SELECT id, slug FROM lessons WHERE is_active = 1",
    );
    const lessonIdBySlug = new Map<string, number>(lessonRows.map((row) => [row.slug, row.id]));

    if (selectedLessonId && lessonIdBySlug.has(selectedLessonId)) {
      const lessonDbId = lessonIdBySlug.get(selectedLessonId)!;
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
    }

    if (lessonProgressInput) {
      for (const [slug, value] of Object.entries(lessonProgressInput)) {
        if (!isLessonProgress(value)) continue;
        const lessonDbId = lessonIdBySlug.get(slug);
        if (!lessonDbId) continue;
        await dbPool.query(
          `
          INSERT INTO user_lesson_state (user_id, lesson_id, progress, last_accessed_at)
          VALUES (?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE
            progress = VALUES(progress),
            last_accessed_at = NOW()
          `,
          [authUser.id, lessonDbId, value],
        );
      }
    }

    // Return refreshed payload from source of truth.
    return GET(req);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
