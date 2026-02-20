import type { AiLanguage } from "@/src/lib/languages";
import type { Exercise } from "@/src/lib/types";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("aicodemaster_auth_token") : null;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  let data: unknown = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const apiError =
      typeof data === "object" && data !== null && "error" in data
        ? String((data as { error?: unknown }).error ?? "")
        : "";
    throw new Error(apiError || `Request to ${url} failed: ${res.status} ${res.statusText}`);
  }

  return data as T;
}

export type { Exercise };

export async function getTeacherFeedback(
  exercise: Exercise,
  userCode: { html?: string; css?: string; js?: string },
  isRealTime: boolean,
  aiLanguage: AiLanguage,
  lessonId?: string,
): Promise<{ feedback: string; isCorrect: boolean }> {
  return postJson<{ feedback: string; isCorrect: boolean }>("/api/ai/feedback", {
    exercise,
    userCode,
    isRealTime,
    aiLanguage,
    lessonId,
  });
}

export async function getChatResponse(
  exercise: Exercise,
  userCode: { html?: string; css?: string; js?: string },
  userQuestion: string,
  chatHistory: { role: "user" | "model"; text: string }[],
  aiLanguage: AiLanguage,
  lessonId?: string,
): Promise<string> {
  const data = await postJson<{ text: string }>("/api/ai/chat", {
    exercise,
    userCode,
    userQuestion,
    chatHistory,
    aiLanguage,
    lessonId,
  });

  return data.text;
}
