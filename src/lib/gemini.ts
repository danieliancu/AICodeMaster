import { GoogleGenAI, Type } from "@google/genai";
import { getLanguageInstruction, getTargetPanelLabel, type AiLanguage } from "@/src/lib/languages";
import type { Exercise, Technology } from "@/src/lib/types";

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
Provide title, description, technologies, targetHtml, targetCss, targetJs and 3 hints.
Allowed technologies: html, css, javascript.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          technologies: { type: Type.ARRAY, items: { type: Type.STRING } },
          targetHtml: { type: Type.STRING },
          targetCss: { type: Type.STRING },
          targetJs: { type: Type.STRING },
          hints: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["title", "description", "technologies", "targetHtml", "targetCss", "targetJs", "hints"],
      },
    },
  });

  return JSON.parse(requireText(response.text)) as Exercise;
}

function getExerciseTechnologies(exercise: Exercise): Technology[] {
  const raw = exercise.technologies ?? ["html", "css", "javascript"];
  return raw.filter((tech): tech is Technology => tech === "html" || tech === "css" || tech === "javascript");
}

function buildTechnologyContext(
  exercise: Exercise,
  userCode: { html?: string; css?: string; js?: string },
  technologies: Technology[],
) {
  const rows: {
    technology: Technology;
    label: string;
    targetValue: string;
    studentValue: string | undefined;
    targetHint?: string;
  }[] = [
    {
      technology: "html",
      label: "HTML",
      targetValue: exercise.targetHtml,
      studentValue: userCode.html,
    },
    {
      technology: "css",
      label: "CSS",
      targetValue: exercise.targetCss,
      studentValue: userCode.css,
      targetHint: "(visual example styles)",
    },
    {
      technology: "javascript",
      label: "JS",
      targetValue: exercise.targetJs,
      studentValue: userCode.js,
    },
  ];

  return rows
    .map((row) => {
      const title = row.targetHint ? `${row.label} ${row.targetHint}` : row.label;
      if (technologies.includes(row.technology)) {
        return `Target ${title}: ${row.targetValue}\nStudent ${row.label}: ${row.studentValue ?? ""}`;
      }
      return `Target ${title}: Not part of this lesson.\nStudent ${row.label}: Ignore, ${row.label} is not part of this lesson.`;
    })
    .join("\n");
}

export async function teacherFeedback(
  exercise: Exercise,
  userCode: { html?: string; css?: string; js?: string },
  isRealTime: boolean,
  aiLanguage: AiLanguage,
): Promise<{ feedback: string; isCorrect: boolean }> {
  const ai = getAI();
  const targetPanelLabel = getTargetPanelLabel(aiLanguage);
  const technologies = getExerciseTechnologies(exercise);
  const technologyContext = buildTechnologyContext(exercise, userCode, technologies);
  const prompt = `You are an expert AI Web Development Teacher.
Exercise: ${exercise.title}
Description: ${exercise.description}
Technologies in this lesson: ${technologies.join(", ")}
${technologyContext}
${
  isRealTime
    ? "The student is typing now. Give feedback under 20 words."
    : "The student asked for review. Provide concise but specific feedback."
}
If the code is still starter boilerplate/minimal unchanged template, do not praise it.
Treat starter boilerplate as not yet meaningful progress.
The Target HTML/CSS/JS describe the expected visual example shown in preview.
When referencing the expected preview panel in your response, call it "${targetPanelLabel}".
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
  userCode: { html?: string; css?: string; js?: string },
  userQuestion: string,
  chatHistory: { role: "user" | "model"; text: string }[],
  aiLanguage: AiLanguage,
): Promise<string> {
  const ai = getAI();
  const targetPanelLabel = getTargetPanelLabel(aiLanguage);
  const technologies = getExerciseTechnologies(exercise);
  const technologyContext = buildTechnologyContext(exercise, userCode, technologies);
  const prompt = `You are an expert AI Web Development Teacher.
Exercise: ${exercise.title}
Description: ${exercise.description}
Technologies in this lesson: ${technologies.join(", ")}
${technologyContext}
Question: ${userQuestion}
Guide the student, do not give the complete final solution.
If the code is still starter boilerplate/minimal unchanged template, do not praise it.
Treat starter boilerplate as not yet meaningful progress.
The Target HTML/CSS/JS describe the expected visual example shown in preview.
When referencing the expected preview panel in your response, call it "${targetPanelLabel}".
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
