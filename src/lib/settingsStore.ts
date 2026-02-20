import { DEFAULT_LESSON_ID, LESSONS } from "@/src/lib/lessons";
import { DEFAULT_AI_LANGUAGE, type AiLanguage } from "@/src/lib/languages";
import type { LessonProgress } from "@/src/lib/types";

type SettingsState = {
  selectedLessonId: string;
  selectedAiLanguage: AiLanguage;
  lessonProgress: Record<string, LessonProgress>;
};

const globalStore = globalThis as typeof globalThis & { __settings_state__?: SettingsState };

if (!globalStore.__settings_state__) {
  const lessonProgress = LESSONS.reduce<Record<string, LessonProgress>>((acc, lesson) => {
    acc[lesson.id] = "not_started";
    return acc;
  }, {});
  globalStore.__settings_state__ = {
    selectedLessonId: DEFAULT_LESSON_ID,
    selectedAiLanguage: DEFAULT_AI_LANGUAGE,
    lessonProgress,
  };
}

export function getSettingsState() {
  const state = globalStore.__settings_state__!;
  for (const lesson of LESSONS) {
    if (!state.lessonProgress[lesson.id]) {
      state.lessonProgress[lesson.id] = "not_started";
    }
  }
  return state;
}

export function updateSettingsState(next: Partial<SettingsState>) {
  const state = getSettingsState();
  globalStore.__settings_state__ = { ...state, ...next };
  return globalStore.__settings_state__;
}
