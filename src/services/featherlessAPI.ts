// ─────────────────────────────────────────────────────────────────────────────
// src/services/featherlessAPI.ts
// Featherless AI chat completions for interview questions and feedback.
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = "https://api.featherless.ai/v1/chat/completions";
const MODEL = "NousResearch/Hermes-3-Llama-3.1-8B";
const API_KEY = import.meta.env.VITE_FEATHERLESS_KEY;

// ─── Helper ───────────────────────────────────────────────────────────────────

function getWeakTopics(): string[] {
  try {
    const raw = localStorage.getItem("weakTopics");
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

async function callFeatherless(systemContent: string, userContent: string): Promise<string> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ],
      temperature: 0.7,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    throw new Error(`Featherless API error: ${response.status}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

// ─── Generate Interview Question ──────────────────────────────────────────────

export async function generateInterviewQuestion(
  resumeText: string,
  jobRole: string,
  askedQuestions: string[] = []
): Promise<{ question: string; difficulty: string; topic: string }> {
  const weakTopics = getWeakTopics();

  const weakSection =
    weakTopics.length > 0
      ? `\nFocus questions especially on these weak areas identified in the candidate's profile: ${weakTopics.join(", ")}.`
      : "";

  const alreadyAskedSection =
    askedQuestions.length > 0
      ? `\nYou MUST NOT repeat or closely paraphrase any of these already-asked questions:\n${askedQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
      : "";

  const systemContent = `You are a senior technical interviewer at a top tech company.
Resume context: ${resumeText.slice(0, 1500)}
Target role: ${jobRole}${weakSection}${alreadyAskedSection}

Generate ONE unique interview question that has NOT been asked before.
RESPOND ONLY with this exact JSON (no markdown, no extra text):
{"question": "...", "difficulty": "Easy|Medium|Hard", "topic": "..."}`;

  try {
    const content = await callFeatherless(systemContent, "Generate the next unique interview question.");
    const match = content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : content);
    return {
      question: String(parsed.question ?? "Tell me about your most challenging project."),
      difficulty: String(parsed.difficulty ?? "Medium"),
      topic: String(parsed.topic ?? "General"),
    };
  } catch (err) {
    console.error("generateInterviewQuestion failed:", err);
    return {
      question: "Can you describe a challenging technical problem you solved recently and what your approach was?",
      difficulty: "Medium",
      topic: "Problem Solving",
    };
  }
}

// ─── Get AI Feedback (1-2 sentence interviewer reply) ─────────────────────────

export async function getAIFeedback(
  question: string,
  answer: string
): Promise<{ feedback: string; score: number }> {
  const systemContent = `You are an expert interviewer evaluating a candidate's verbal answer.
Question asked: ${question}
Candidate's answer: ${answer}

Give a brief 1-2 sentence conversational interviewer response — acknowledge the answer warmly, then add one constructive observation.
Also rate the answer out of 10.
RESPOND ONLY with this exact JSON (no markdown, no extra text):
{"feedback": "...", "score": <0-10>}`;

  try {
    const content = await callFeatherless(systemContent, "Evaluate the answer.");
    const match = content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : content);
    return {
      feedback: String(parsed.feedback ?? "Good answer. Let's keep going."),
      score: Math.max(0, Math.min(10, Number(parsed.score) || 6)),
    };
  } catch (err) {
    console.error("getAIFeedback failed:", err);
    return { feedback: "Thanks for sharing that. Let's move on to the next question.", score: 6 };
  }
}