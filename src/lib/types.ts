export type Technology = "html" | "css" | "javascript" | "python" | "php" | "sql";
export type LessonProgress = "not_started" | "in_progress" | "completed";

export interface Exercise {
  title: string;
  description: string;
  targetHtml: string;
  targetCss: string;
  targetJs: string;
  hints: string[];
  technologies?: Technology[];
}
