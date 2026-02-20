import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { LESSONS } from "../src/lib/lessons";
import { AI_LANGUAGE_OPTIONS } from "../src/lib/languages";
import type { Technology } from "../src/lib/types";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function getDbConfig() {
  return {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "ai_code_master",
  };
}

function buildTargetCodeJson(lesson: (typeof LESSONS)[number]) {
  const technologies = (lesson.exercise.technologies ?? ["html", "css", "javascript"]) as Technology[];
  const code: Partial<Record<Technology, string>> = {};
  if (technologies.includes("html")) code.html = lesson.exercise.targetHtml;
  if (technologies.includes("css")) code.css = lesson.exercise.targetCss;
  if (technologies.includes("javascript")) code.javascript = lesson.exercise.targetJs;
  return code;
}

async function getLessonId(conn: mysql.Connection, slug: string) {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT id FROM lessons WHERE slug = ? LIMIT 1",
    [slug],
  );
  if (!rows.length) throw new Error(`Lesson not found after upsert: ${slug}`);
  return Number(rows[0].id);
}

async function getTechnologyIds(conn: mysql.Connection, codes: string[]) {
  if (!codes.length) return new Map<string, number>();
  const placeholders = codes.map(() => "?").join(", ");
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT id, code FROM technologies WHERE code IN (${placeholders})`,
    codes,
  );
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(String(row.code), Number(row.id));
  }
  return map;
}

async function run() {
  loadEnvLocal();
  const db = getDbConfig();
  const conn = await mysql.createConnection(db);

  try {
    await conn.beginTransaction();

    // Ensure all core technologies exist.
    const allTechCodes = new Set<string>(["html", "css", "javascript", "python", "php", "sql"]);
    for (const lesson of LESSONS) {
      for (const tech of lesson.exercise.technologies ?? ["html", "css", "javascript"]) {
        allTechCodes.add(tech);
      }
    }

    for (const code of allTechCodes) {
      await conn.query(
        "INSERT INTO technologies (code, label) VALUES (?, ?) ON DUPLICATE KEY UPDATE label = VALUES(label)",
        [code, code === "javascript" ? "JavaScript" : code.toUpperCase()],
      );
    }

    const techIds = await getTechnologyIds(conn, [...allTechCodes]);

    for (const [idx, lesson] of LESSONS.entries()) {
      await conn.query(
        `
        INSERT INTO lessons (slug, internal_name, is_active, sort_order)
        VALUES (?, ?, 1, ?)
        ON DUPLICATE KEY UPDATE
          internal_name = VALUES(internal_name),
          is_active = VALUES(is_active),
          sort_order = VALUES(sort_order)
        `,
        [lesson.id, lesson.name, (idx + 1) * 10],
      );

      const lessonId = await getLessonId(conn, lesson.id);
      const technologies = lesson.exercise.technologies ?? ["html", "css", "javascript"];

      await conn.query("DELETE FROM lesson_technologies WHERE lesson_id = ?", [lessonId]);
      for (const [tIndex, tech] of technologies.entries()) {
        const techId = techIds.get(tech);
        if (!techId) {
          throw new Error(`Missing technology id for code=${tech}`);
        }
        await conn.query(
          "INSERT INTO lesson_technologies (lesson_id, technology_id, sort_order) VALUES (?, ?, ?)",
          [lessonId, techId, (tIndex + 1) * 10],
        );
      }

      const targetCodeJson = JSON.stringify(buildTargetCodeJson(lesson));
      const hintsJson = JSON.stringify(lesson.exercise.hints);

      // We insert localization row for every supported AI language.
      // Until dedicated translated lesson content is moved to DB, the same lesson text is used as fallback.
      for (const language of AI_LANGUAGE_OPTIONS.map((opt) => opt.code)) {
        await conn.query(
          `
          INSERT INTO lesson_localizations
            (lesson_id, language_code, lesson_name, lesson_title, lesson_description, target_code_json, hints_json)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            lesson_name = VALUES(lesson_name),
            lesson_title = VALUES(lesson_title),
            lesson_description = VALUES(lesson_description),
            target_code_json = VALUES(target_code_json),
            hints_json = VALUES(hints_json)
          `,
          [
            lessonId,
            language,
            lesson.name,
            lesson.exercise.title,
            lesson.exercise.description,
            targetCodeJson,
            hintsJson,
          ],
        );
      }
    }

    await conn.commit();
    console.log(`Migration done. Lessons migrated: ${LESSONS.length}`);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    await conn.end();
  }
}

run().catch((error) => {
  console.error("Lesson migration failed:", error);
  process.exit(1);
});

