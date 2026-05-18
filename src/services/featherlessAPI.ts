// ─────────────────────────────────────────────────────────────────────────────
// src/services/featherlessAPI.ts
// Featherless AI chat completions for interview questions and feedback.
// Enforces 3-stage professional interview flow:
//   Stage 1 (Q1)     → Aptitude / General Fit
//   Stage 2 (Q2-Q4)  → Technical (strictly from resume + JD)
//   Stage 3 (Q5-Q6)  → Future aspects, behavioural, career trajectory
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = "https://api.featherless.ai/v1/chat/completions";
const MODEL = "NousResearch/Hermes-3-Llama-3.1-8B";

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

function getApiKey(): string {
  return (import.meta.env.VITE_FEATHERLESS_KEY as string) ?? "";
}

async function callFeatherless(systemContent: string, userContent: string): Promise<string> {
  const apiKey = getApiKey();
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ],
      temperature: 0.65,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Featherless API error: ${response.status} — ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

// ─── Stage selector ───────────────────────────────────────────────────────────

function getStageDirective(questionIndex: number, weakTopics: string[]): string {
  const weakSection =
    weakTopics.length > 0
      ? `\nThe candidate has these identified weak areas — prioritise questions about them: ${weakTopics.join(", ")}.`
      : "";

  if (questionIndex === 0) {
    return `
INTERVIEW STAGE: Aptitude & General Fit (Question 1 of 6).
Ask ONE warm-up aptitude question. It should assess general reasoning, problem solving mindset, 
or professional attitude — NOT a technical deep-dive. 
Examples: situational judgment, learning agility, adaptability, or motivation.${weakSection}`;
  }

  if (questionIndex < 4) {
    return `
INTERVIEW STAGE: Technical Deep-Dive (Question ${questionIndex + 1} of 6).
Ask ONE highly specific technical question based ONLY on the candidate's resume and the job description provided.
Do NOT ask general knowledge questions. Focus strictly on technologies, frameworks, or experiences mentioned 
in the resume or required by the job description.${weakSection}
Vary difficulty: question 2 = Medium, question 3 = Hard, question 4 = Hard.`;
  }

  return `
INTERVIEW STAGE: Future Aspects & Behavioural (Question ${questionIndex + 1} of 6).
Ask ONE forward-looking or behavioural question. Options:
- Career trajectory: Where do you see yourself in 3-5 years in this role?
- Scenario-based: How would you handle [a realistic scenario relevant to the job]?
- Team / leadership: Describe a time you led or collaborated under pressure.
- Industry trend: How do you stay updated with changes in ${weakTopics[0] ?? "your field"}?${weakSection}`;
}

// ─── Generate Interview Question ──────────────────────────────────────────────

export async function generateInterviewQuestion(
  resumeText: string,
  jobRole: string,
  askedQuestions: string[] = [],
  questionIndex: number = 0
): Promise<{ question: string; difficulty: string; topic: string }> {
  const weakTopics = getWeakTopics();
  const stageDirective = getStageDirective(questionIndex, weakTopics);

  const alreadyAskedSection =
    askedQuestions.length > 0
      ? `\nYou MUST NOT repeat or closely paraphrase any of these already-asked questions:\n${askedQuestions
          .map((q, i) => `${i + 1}. ${q}`)
          .join("\n")}`
      : "";

  const systemContent = `You are a senior technical interviewer at a top tech company conducting a structured professional interview.

CANDIDATE RESUME:
${resumeText.slice(0, 2000)}

TARGET ROLE: ${jobRole}
${stageDirective}
${alreadyAskedSection}

Rules:
- Ask exactly ONE unique question.
- Never repeat a previously asked question.
- The question must be directly relevant to the stage and the candidate's background.
- RESPOND ONLY with this exact JSON object (no markdown, no explanation, no preamble):
{"question": "...", "difficulty": "Easy|Medium|Hard", "topic": "..."}`;

  try {
    const content = await callFeatherless(systemContent, "Generate the next unique interview question for this stage.");
    const match = content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : content);
    return {
      question: String(parsed.question ?? "Tell me about your most challenging project."),
      difficulty: String(parsed.difficulty ?? "Medium"),
      topic: String(parsed.topic ?? "General"),
    };
  } catch (err) {
    console.error("generateInterviewQuestion failed:", err);
    // Stage-appropriate fallbacks
    const fallbacks = [
      { question: "Walk me through how you approach learning something completely new under a tight deadline.", difficulty: "Easy", topic: "Aptitude" },
      { question: "Can you describe a specific technical problem you solved recently and what your approach was?", difficulty: "Medium", topic: "Technical" },
      { question: "Tell me about the most complex system you've designed or contributed to.", difficulty: "Hard", topic: "System Design" },
      { question: "How do you handle disagreements with senior teammates about technical decisions?", difficulty: "Medium", topic: "Collaboration" },
      { question: "Where do you see yourself growing in this role over the next two years?", difficulty: "Easy", topic: "Career" },
      { question: "Describe a time you had to deliver under pressure. What was the outcome?", difficulty: "Medium", topic: "Behavioural" },
    ];
    return fallbacks[Math.min(questionIndex, fallbacks.length - 1)];
  }
}

// ─── Get AI Feedback (1-2 sentence interviewer reply + score) ─────────────────

export async function getAIFeedback(
  question: string,
  answer: string
): Promise<{ feedback: string; score: number; strengths: string[]; improvements: string[] }> {
  const systemContent = `You are an expert professional interviewer evaluating a candidate's verbal answer.

Question asked: "${question}"
Candidate's answer: "${answer}"

Evaluate the answer. Provide:
1. A warm but honest 1-2 sentence conversational interviewer response — acknowledge what was good, then give one constructive observation.
2. A score out of 10.
3. Up to 2 strengths shown in the answer.
4. Up to 2 areas for improvement.

RESPOND ONLY with this exact JSON (no markdown, no extra text):
{"feedback": "...", "score": <0-10>, "strengths": ["...", "..."], "improvements": ["...", "..."]}`;

  try {
    const content = await callFeatherless(systemContent, "Evaluate the answer.");
    const match = content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : content);
    return {
      feedback: String(parsed.feedback ?? "Good effort. Let's keep going."),
      score: Math.max(0, Math.min(10, Number(parsed.score) || 6)),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 2) : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 2) : [],
    };
  } catch (err) {
    console.error("getAIFeedback failed:", err);
    return {
      feedback: "Thanks for sharing that. Let's move on to the next question.",
      score: 6,
      strengths: [],
      improvements: [],
    };
  }
}