import { NextResponse } from "next/server";
import { DEFAULT_LESSON_ID, LESSONS, getLessonById } from "@/src/lib/lessons";
import { AI_LANGUAGE_OPTIONS, isAiLanguage } from "@/src/lib/languages";
import { getSettingsState, updateSettingsState } from "@/src/lib/settingsStore";
import type { LessonProgress } from "@/src/lib/types";

function isLessonProgress(value: unknown): value is LessonProgress {
  return value === "not_started" || value === "in_progress" || value === "completed";
}

export async function GET() {
  const state = getSettingsState();
  const selectedLesson = getLessonById(state.selectedLessonId);

  return NextResponse.json({
    defaultLessonId: DEFAULT_LESSON_ID,
    selectedLessonId: selectedLesson.id,
    selectedAiLanguage: state.selectedAiLanguage,
    aiLanguageOptions: AI_LANGUAGE_OPTIONS,
    lessons: LESSONS.map((lesson) => ({
      id: lesson.id,
      name: lesson.name,
      title: lesson.exercise.title,
      description: lesson.exercise.description,
      progress: state.lessonProgress[lesson.id] ?? "not_started",
      technologies: lesson.exercise.technologies ?? ["html", "css", "javascript"],
    })),
    exercise_json: JSON.stringify(selectedLesson.exercise),
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const selectedLessonId =
    typeof body.selectedLessonId === "string" && LESSONS.some((lesson) => lesson.id === body.selectedLessonId)
      ? body.selectedLessonId
      : undefined;
  const selectedAiLanguage = isAiLanguage(body.selectedAiLanguage) ? body.selectedAiLanguage : undefined;
  const state = getSettingsState();
  const lessonProgressInput =
    typeof body.lessonProgress === "object" && body.lessonProgress !== null
      ? (body.lessonProgress as Record<string, unknown>)
      : null;
  const nextLessonProgress = { ...state.lessonProgress };

  if (lessonProgressInput) {
    for (const lesson of LESSONS) {
      const incoming = lessonProgressInput[lesson.id];
      if (isLessonProgress(incoming)) {
        nextLessonProgress[lesson.id] = incoming;
      }
    }
  }

  if (selectedLessonId && nextLessonProgress[selectedLessonId] === "not_started") {
    nextLessonProgress[selectedLessonId] = "in_progress";
  }

  const next = updateSettingsState({
    ...(selectedLessonId ? { selectedLessonId } : {}),
    ...(selectedAiLanguage ? { selectedAiLanguage } : {}),
    lessonProgress: nextLessonProgress,
  });
  const selectedLesson = getLessonById(next.selectedLessonId);

  return NextResponse.json({
    success: true,
    selectedLessonId: selectedLesson.id,
    selectedAiLanguage: next.selectedAiLanguage,
    lessonProgress: next.lessonProgress,
    exercise_json: JSON.stringify(selectedLesson.exercise),
  });
}
