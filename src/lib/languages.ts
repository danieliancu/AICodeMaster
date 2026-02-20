export type AiLanguage = "ro" | "en" | "es" | "fr" | "de" | "it" | "pt";

export const DEFAULT_AI_LANGUAGE: AiLanguage = "ro";

export const AI_LANGUAGE_OPTIONS: { code: AiLanguage; label: string }[] = [
  { code: "ro", label: "Romana" },
  { code: "en", label: "English" },
  { code: "es", label: "Espanol" },
  { code: "fr", label: "Francais" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Portugues" },
];

export function isAiLanguage(value: unknown): value is AiLanguage {
  return typeof value === "string" && AI_LANGUAGE_OPTIONS.some((item) => item.code === value);
}

export function getLanguageInstruction(language: AiLanguage): string {
  switch (language) {
    case "ro":
      return "Respond in Romanian.";
    case "en":
      return "Respond in English.";
    case "es":
      return "Respond in Spanish.";
    case "fr":
      return "Respond in French.";
    case "de":
      return "Respond in German.";
    case "it":
      return "Respond in Italian.";
    case "pt":
      return "Respond in Portuguese.";
    default:
      return "Respond in Romanian.";
  }
}

export function getTargetPanelLabel(language: AiLanguage): string {
  switch (language) {
    case "ro":
      return "Obiectiv";
    case "en":
      return "Target";
    case "es":
      return "Objetivo";
    case "fr":
      return "Objectif";
    case "de":
      return "Ziel";
    case "it":
      return "Obiettivo";
    case "pt":
      return "Objetivo";
    default:
      return "Obiectiv";
  }
}
