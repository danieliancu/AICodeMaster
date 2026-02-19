import { GoogleGenAI, Type } from "@google/genai";
import { getLanguageInstruction, type AiLanguage } from "@/src/lib/languages";
import type { Exercise } from "@/src/lib/types";

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY. Set it in .env.local and Vercel project settings.");
  }
  return new GoogleGenAI({ apiKey });
}

function requireText(text: string | undefined) {
  if (!text) {
    throw new Error("Empty response from Gemini model.");
  }
  return text;
}

export async function generateExercise(theme: string): Promise<Exercise> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Generate a web development exercise based on the theme: "${theme}".
Provide title, description, targetHtml, targetCss, targetJs and 3 hints.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          targetHtml: { type: Type.STRING },
          targetCss: { type: Type.STRING },
          targetJs: { type: Type.STRING },
          hints: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["title", "description", "targetHtml", "targetCss", "targetJs", "hints"],
      },
    },
  });

  return JSON.parse(requireText(response.text)) as Exercise;
}

export async function teacherFeedback(
  exercise: Exercise,
  userCode: { html: string; css: string; js: string },
  isRealTime: boolean,
  aiLanguage: AiLanguage,
): Promise<{ feedback: string; isCorrect: boolean }> {
  const ai = getAI();
  const prompt = `You are an expert AI Web Development Teacher.
Exercise: ${exercise.title}
Description: ${exercise.description}
Target HTML: ${exercise.targetHtml}
Target CSS (visual example styles): ${exercise.targetCss}
Target JS: ${exercise.targetJs}
Student HTML: ${userCode.html}
Student CSS: ${userCode.css}
Student JS: ${userCode.js}
${
  isRealTime
    ? "The student is typing now. Give feedback under 20 words."
    : "The student asked for review. Provide concise but specific feedback."
}
If the code is still starter boilerplate/minimal unchanged template, do not praise it.
Treat starter boilerplate as not yet meaningful progress.
The Target HTML/CSS/JS describe the expected visual example shown in preview.
Always format lists and sequences with one item per line.
When you use numbered points, use Markdown and format labels like **1. HTML:**.
${getLanguageInstruction(aiLanguage)}
Return JSON with feedback and isCorrect.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          feedback: { type: Type.STRING },
          isCorrect: { type: Type.BOOLEAN },
        },
        required: ["feedback", "isCorrect"],
      },
    },
  });

  return JSON.parse(requireText(response.text)) as { feedback: string; isCorrect: boolean };
}

export async function chatResponse(
  exercise: Exercise,
  userCode: { html: string; css: string; js: string },
  userQuestion: string,
  chatHistory: { role: "user" | "model"; text: string }[],
  aiLanguage: AiLanguage,
): Promise<string> {
  const ai = getAI();
  const prompt = `You are an expert AI Web Development Teacher.
Exercise: ${exercise.title}
Description: ${exercise.description}
Target HTML: ${exercise.targetHtml}
Target CSS (visual example styles): ${exercise.targetCss}
Target JS: ${exercise.targetJs}
Student HTML: ${userCode.html}
Student CSS: ${userCode.css}
Student JS: ${userCode.js}
Question: ${userQuestion}
Guide the student, do not give the complete final solution.
If the code is still starter boilerplate/minimal unchanged template, do not praise it.
Treat starter boilerplate as not yet meaningful progress.
The Target HTML/CSS/JS describe the expected visual example shown in preview.
Always format lists and sequences with one item per line.
When you use numbered points, use Markdown and format labels like **1. HTML:**.
Return JSON with:
- short: short answer only, strict to the question, max 3 short sentences.
- details: extended explanation, examples, and next steps.
${getLanguageInstruction(aiLanguage)}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      ...chatHistory.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
      { role: "user", parts: [{ text: prompt }] },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          short: { type: Type.STRING },
          details: { type: Type.STRING },
        },
        required: ["short", "details"],
      },
    },
  });

  const raw = requireText(response.text);
  const parsed = JSON.parse(raw) as { short?: string; details?: string };
  const shortText = (parsed.short || "").trim();
  const detailsText = (parsed.details || "").trim();
  return `${shortText}\n\n[[MORE]]\n\n${detailsText}`;
}
