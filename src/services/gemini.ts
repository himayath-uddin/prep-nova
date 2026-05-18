// ─────────────────────────────────────────────────────────────────────────────
// src/services/gemini.ts
//
// AI Interview Engine — uses Google Gemini if VITE_GEMINI_API_KEY is set,
// otherwise falls back to a built-in smart interviewer (works offline, no key needed).
// ─────────────────────────────────────────────────────────────────────────────

import { GoogleGenAI } from "@google/genai";

// ─── Built-in question banks by role ─────────────────────────────────────────

const QUESTION_BANK: Record<string, Array<{ q: string; topic: string; diff: string }>> = {
  frontend: [
    { q: "Can you walk me through your experience with React and how you've used it in real projects?", topic: "React", diff: "Easy" },
    { q: "Explain the difference between state and props in React. When would you lift state up?", topic: "React", diff: "Medium" },
    { q: "How do you handle performance optimization in a React app? Give a specific example.", topic: "Performance", diff: "Hard" },
    { q: "What's your understanding of the JavaScript event loop and asynchronous programming?", topic: "JavaScript", diff: "Medium" },
    { q: "How do you approach CSS layouts — when do you use Flexbox vs Grid?", topic: "CSS", diff: "Easy" },
    { q: "Describe how you would design a real-time feature like a live notifications feed.", topic: "System Design", diff: "Hard" },
  ],
  backend: [
    { q: "Walk me through how you design a REST API from scratch. What are your key considerations?", topic: "API Design", diff: "Medium" },
    { q: "How do you handle database transactions and ensure data consistency in your applications?", topic: "Databases", diff: "Hard" },
    { q: "Explain the difference between SQL and NoSQL databases and when you'd choose each.", topic: "Databases", diff: "Medium" },
    { q: "How do you approach authentication and authorization in a web application?", topic: "Security", diff: "Medium" },
    { q: "Describe how you would scale a backend service that's receiving heavy traffic.", topic: "Scaling", diff: "Hard" },
    { q: "What's your approach to error handling and logging in production systems?", topic: "Best Practices", diff: "Easy" },
  ],
  fullstack: [
    { q: "Tell me about a full-stack feature you built end-to-end. What were the challenges?", topic: "Experience", diff: "Easy" },
    { q: "How do you think about the boundary between frontend and backend responsibilities?", topic: "Architecture", diff: "Medium" },
    { q: "Explain how you would implement a real-time collaborative feature like Google Docs.", topic: "System Design", diff: "Hard" },
    { q: "How do you handle state management in a complex frontend application?", topic: "State Management", diff: "Medium" },
    { q: "What strategies do you use to secure a full-stack application?", topic: "Security", diff: "Medium" },
    { q: "Walk me through your deployment and CI/CD workflow for a full-stack app.", topic: "DevOps", diff: "Easy" },
  ],
  data: [
    { q: "How do you approach cleaning and preprocessing a messy dataset?", topic: "Data Wrangling", diff: "Easy" },
    { q: "Explain the bias-variance tradeoff and how it applies to model selection.", topic: "ML Theory", diff: "Hard" },
    { q: "When would you choose a Random Forest over a linear model, and why?", topic: "Algorithms", diff: "Medium" },
    { q: "How do you evaluate the performance of a classification model beyond accuracy?", topic: "Model Evaluation", diff: "Medium" },
    { q: "Describe how you would approach a churn prediction problem from scratch.", topic: "Case Study", diff: "Hard" },
    { q: "How do you communicate complex data findings to non-technical stakeholders?", topic: "Communication", diff: "Easy" },
  ],
  general: [
    { q: "Tell me about yourself and what draws you to this role.", topic: "Introduction", diff: "Easy" },
    { q: "Describe the most challenging technical problem you've solved. What was your approach?", topic: "Problem Solving", diff: "Medium" },
    { q: "How do you stay up-to-date with the latest trends and technologies in your field?", topic: "Growth Mindset", diff: "Easy" },
    { q: "Tell me about a time you disagreed with a teammate. How did you handle it?", topic: "Collaboration", diff: "Medium" },
    { q: "How do you prioritize tasks when working on multiple projects simultaneously?", topic: "Time Management", diff: "Easy" },
    { q: "Where do you see yourself in the next 2–3 years, and how does this role fit that vision?", topic: "Career Goals", diff: "Easy" },
  ],
};

const FEEDBACK_PHRASES = [
  "That's a solid answer. You clearly have hands-on experience with this.",
  "Good thinking. I appreciate how you structured your response.",
  "Interesting perspective. Let me dig a little deeper with you on this.",
  "Nice answer — you touched on the key points well.",
  "I like your practical approach to this. That's exactly the kind of thinking we value.",
  "Good response. You've demonstrated a strong conceptual understanding here.",
  "That shows solid reasoning. Let's keep going.",
  "Very clear explanation. I can tell you've worked through problems like this before.",
];

const WRAP_UP_PHRASES = [
  "That wraps up our session. You've shown great depth across all topics — well done.",
  "Excellent session. Your answers were thoughtful and well-structured throughout.",
  "We've covered a lot of ground today. I've been impressed with your technical clarity.",
  "That's our final question. You've demonstrated strong fundamentals — great work today.",
];

// ─── Role detection ───────────────────────────────────────────────────────────

function detectRoleCategory(role: string): string {
  const r = role.toLowerCase();
  if (r.includes("frontend") || r.includes("react") || r.includes("ui") || r.includes("vue") || r.includes("angular")) return "frontend";
  if (r.includes("backend") || r.includes("server") || r.includes("node") || r.includes("django") || r.includes("spring")) return "backend";
  if (r.includes("fullstack") || r.includes("full stack") || r.includes("full-stack")) return "fullstack";
  if (r.includes("data") || r.includes("ml") || r.includes("machine learning") || r.includes("analyst")) return "data";
  return "general";
}

// ─── Track state across calls ─────────────────────────────────────────────────

let _questionIndex = 0;
let _roleCategory = "general";
let _initialized = false;

export function resetInterviewer() {
  _questionIndex = 0;
  _initialized = false;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Score generator (heuristic) ─────────────────────────────────────────────

export function computeScore(answer: string): number {
  const words = answer.trim().split(/\s+/).length;
  // Base score from answer length
  let score = 5;
  if (words > 20)  score += 1;
  if (words > 50)  score += 1;
  if (words > 100) score += 1;
  // Bonus for technical keywords
  const keywords = ["because", "therefore", "example", "approach", "used", "implemented", "designed", "built", "created", "solved"];
  keywords.forEach(k => { if (answer.toLowerCase().includes(k)) score += 0.3; });
  return Math.min(10, Math.round(score));
}

// ─── Built-in offline interviewer ─────────────────────────────────────────────

function buildOfflineResponse(message: string, role: string): string {
  if (!_initialized) {
    _roleCategory = detectRoleCategory(role);
    _questionIndex = 0;
    _initialized = true;
  }

  const bank = QUESTION_BANK[_roleCategory] ?? QUESTION_BANK.general;
  const isFirstMessage = message.toLowerCase().includes("start the interview") || message.toLowerCase().includes("introducing yourself");

  // Opening message
  if (isFirstMessage || _questionIndex === 0) {
    _questionIndex = 0;
    const first = bank[0];
    _questionIndex = 1;
    return `Hi! I'm your AI interviewer today. We'll be going through a structured set of questions tailored to the ${role} role. Let's get started.\n\n${first.q}`;
  }

  // Between questions: give brief feedback, then ask next question
  const feedback = randomFrom(FEEDBACK_PHRASES);
  const next = bank[_questionIndex];

  if (!next || _questionIndex >= bank.length) {
    return randomFrom(WRAP_UP_PHRASES);
  }

  _questionIndex++;
  return `${feedback}\n\nNext question: ${next.q}`;
}

// ─── Gemini API call ──────────────────────────────────────────────────────────

async function callGemini(prompt: string, systemPrompt: string, apiKey: string): Promise<string> {
  const client = new GoogleGenAI({ apiKey });
  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
  const response = await client.models.generateContent({
    model: "gemini-2.0-flash",
    contents: fullPrompt,
  });
  const text = response.text ?? "";
  if (!text.trim()) throw new Error("Empty response");
  return text.trim();
}

// ─── Main exported function ───────────────────────────────────────────────────

/**
 * Drop-in replacement for the old Ollama askAI.
 * Uses Gemini if VITE_GEMINI_API_KEY is set, otherwise uses the built-in interviewer.
 */
export async function askAI(
  message: string,
  systemPrompt: string = "",
  role: string = "Software Engineer"
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const hasKey = apiKey && apiKey !== "PASTE_YOUR_GEMINI_API_KEY_HERE" && apiKey.length > 10;

  if (hasKey) {
    try {
      return await callGemini(message, systemPrompt, apiKey);
    } catch (err) {
      console.warn("Gemini failed, using built-in interviewer:", err);
    }
  }

  // Offline smart fallback
  return buildOfflineResponse(message, role);
}
