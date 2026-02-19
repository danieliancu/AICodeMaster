import { NextResponse } from "next/server";
import { DEFAULT_LESSON_ID, LESSONS, getLessonById } from "@/src/lib/lessons";
import { AI_LANGUAGE_OPTIONS, isAiLanguage } from "@/src/lib/languages";
import { getSettingsState, updateSettingsState } from "@/src/lib/settingsStore";

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
    })),
    exercise_json: JSON.stringify(selectedLesson.exercise),
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const selectedLessonId = typeof body.selectedLessonId === "string" ? body.selectedLessonId : undefined;
  const selectedAiLanguage = isAiLanguage(body.selectedAiLanguage) ? body.selectedAiLanguage : undefined;
  const next = updateSettingsState({ selectedLessonId, selectedAiLanguage });
  const selectedLesson = getLessonById(next.selectedLessonId);

  return NextResponse.json({
    success: true,
    selectedLessonId: selectedLesson.id,
    selectedAiLanguage: next.selectedAiLanguage,
    exercise_json: JSON.stringify(selectedLesson.exercise),
  });
}
