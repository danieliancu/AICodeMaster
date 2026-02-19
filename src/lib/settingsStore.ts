import { DEFAULT_LESSON_ID } from "@/src/lib/lessons";
import { DEFAULT_AI_LANGUAGE, type AiLanguage } from "@/src/lib/languages";

type SettingsState = {
  selectedLessonId: string;
  selectedAiLanguage: AiLanguage;
};

const globalStore = globalThis as typeof globalThis & { __settings_state__?: SettingsState };

if (!globalStore.__settings_state__) {
  globalStore.__settings_state__ = {
    selectedLessonId: DEFAULT_LESSON_ID,
    selectedAiLanguage: DEFAULT_AI_LANGUAGE,
  };
}

export function getSettingsState() {
  return globalStore.__settings_state__!;
}

export function updateSettingsState(next: Partial<SettingsState>) {
  const state = getSettingsState();
  globalStore.__settings_state__ = { ...state, ...next };
  return globalStore.__settings_state__;
}
