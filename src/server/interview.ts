import { createServerFn } from "@tanstack/react-start";
import { GoogleGenAI } from "@google/genai";

type InterviewTwin = {
  name: string;
  role: string;
  difficulty: string;
  style: string;
  speciality: string;
};

type InterviewContext = {
  role: string;
  jd: string;
  resumeName?: string;
  analysis?: unknown;
  twin?: InterviewTwin;
};

type AnswerEvaluation = {
  feedback: string;
  score: number;
  scoreCriteria: string;
  strengths: string[];
  improvements: string[];
  nextQuestion?: {
    question: string;
    difficulty: string;
    topic: string;
    intent: string;
  };
};

function getGemini() {
  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error("Gemini API key is missing. Add VITE_GEMINI_API_KEY or GEMINI_API_KEY to your .env file.");
  }

  return new GoogleGenAI({ apiKey });
}

function fallbackQuestion(context: InterviewContext, askedQuestions: string[]) {
  const role = context.role || "the target role";
  const defaults = [
    `Walk me through a recent project that proves you are ready for ${role}. What trade-offs did you make?`,
    `Based on this job description, which requirement is your strongest match and where do you still need to grow?`,
    `Describe a difficult technical decision you made. How did you evaluate alternatives and measure success?`,
    `How would you design a reliable feature for users at scale, and what would you monitor after launch?`,
    `Tell me about a time you received critical feedback. What changed in your work afterward?`,
  ];
  const next = defaults.find((q) => !askedQuestions.includes(q)) || defaults[askedQuestions.length % defaults.length];

  return {
    question: next,
    difficulty: askedQuestions.length > 2 ? "Hard" : "Medium",
    topic: askedQuestions.length % 2 === 0 ? "Role Fit" : "Technical Depth",
    intent: "Fallback question generated locally because the AI service is not configured.",
  };
}

export const generateLiveQuestion = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { context: InterviewContext; askedQuestions: string[]; lastAnswer?: string } }) => {
    const context = data.context || { role: "Candidate", jd: "" };
    const askedQuestions = data.askedQuestions || [];

    try {
      const ai = getGemini();
      const twin = context.twin;
      const prompt = `
You are acting as a highly critical and professional Hackathon Jury Member (${twin?.name || "AI Jury"}).
Interview style: ${twin?.style || "strict, highly logical, and technical"}.
Difficulty: ${twin?.difficulty || "Hard"}.
Speciality: ${twin?.speciality || "assessing real-world viability and technical depth"}.

Target role / Hackathon Category: ${context.role}
Job description / Hackathon Criteria:
${context.jd}

Candidate Profile / Resume Analysis:
${JSON.stringify(context.analysis || {}, null, 2)}

Previously asked questions (DO NOT REPEAT THESE):
${askedQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n") || "None"}

Last answer from candidate, if any:
${data.lastAnswer || "None"}

You are testing this candidate for a hackathon/job. The jury checks them repeatedly, so YOUR QUESTIONS MUST BE HIGHLY SHUFFLED, RANDOMIZED, AND UNIQUE every single time.
Generate exactly one new, highly logical, professional interview question specific to their field/skills.
Do not ask generic questions. Ask specific technical or situational questions based on the criteria.
Return raw JSON only:
{
  "question": "string",
  "difficulty": "Easy | Medium | Hard",
  "topic": "string",
  "intent": "what this question is testing"
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });

      if (!response.text) throw new Error("No question returned from Gemini.");
      return JSON.parse(response.text.replace(/```json/g, "").replace(/```/g, "").trim());
    } catch (error) {
      console.error("Question generation failed:", error);
      return fallbackQuestion(context, askedQuestions);
    }
  },
);

export const evaluateLiveAnswer = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: {
      context: InterviewContext;
      question: string;
      answer: string;
      topic?: string;
      difficulty?: string;
      metrics?: { voice: number; pace: number; clarity: number };
      isLastQuestion?: boolean;
      previousTurns?: { q: string; a: string }[];
    };
  }): Promise<AnswerEvaluation> => {
    const answer = data.answer?.trim() || "";
    if (answer.length < 8) {
      const shortFeedbacks = [
        "I didn't quite catch all of that. Could you elaborate a bit more?",
        "That was a bit too brief. Do you have a specific example you could share to help me understand?",
        "I'm not sure I fully got that. Would you mind expanding on your thought process?",
        "Could you explain that in a bit more detail? I'd love to hear more about your specific role in it."
      ];
      const randomFeedback = shortFeedbacks[Math.floor(Math.random() * shortFeedbacks.length)];
      return {
        feedback: randomFeedback,
        score: 3,
        scoreCriteria: "The answer was too short to contain any meaningful technical logic.",
        strengths: ["Clear start"],
        improvements: ["Add concrete details", "Explain impact", "Use a clearer structure"],
      };
    }

    try {
      const ai = getGemini();
      const prompt = `
You are a highly critical, realistic Hackathon Jury Member and expert technical interviewer.
Target role / Category: ${data.context.role}

Hackathon Criteria / Job Description:
${data.context.jd || "Not provided"}

Candidate Resume Analysis:
${JSON.stringify(data.context.analysis || {}, null, 2)}

Interview History (Previous Questions & Answers):
${data.previousTurns && data.previousTurns.length > 0 ? data.previousTurns.map((t, i) => `Q${i+1}: ${t.q}\nA${i+1}: ${t.a}`).join("\n\n") : "This is the first question."}

Current Question being asked: ${data.question}
Candidate's Answer to evaluate:
${answer}

Live delivery signals:
${JSON.stringify(data.metrics || {}, null, 2)}

Evaluate this answer EXTREMELY LOGICALLY. NEVER use generic praises like "Great" or "Awesome". Be brutally honest. If it lacks technical depth, say so. If the logic is flawed, point it out.
IMPORTANT: If the 'Current Question being asked' is an Introduction (e.g., asking them to introduce themselves), warmly welcome the candidate, briefly acknowledge their intro, and then immediately ask the first technical question based on their resume. Do not be critical of a simple intro. For all other technical questions, be brutally honest and highly critical of technical logic.
Provide a seamless, professional conversational feedback.
Return raw JSON only:
{
  "feedback": "2-3 sentences evaluating the logic, spoken directly to the candidate like a real conversation. Do NOT use fake enthusiasm.",
  "score": number (1-10),
  "scoreCriteria": "Strict, detailed explanation of exactly why this score was given, focusing on technical logic and role requirements.",
  "strengths": ["string", "string"],
  "improvements": ["string", "string"]${data.isLastQuestion ? "" : `,
  "nextQuestion": {
    "question": "Your next distinct, randomized, and highly logical question, smoothly continuing the interview.",
    "difficulty": "Easy | Medium | Hard",
    "topic": "string",
    "intent": "string"
  }`}
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });

      if (!response.text) throw new Error("No feedback returned from Gemini.");
      return JSON.parse(response.text.replace(/```json/g, "").replace(/```/g, "").trim());
    } catch (error) {
      console.error("Answer evaluation failed:", error);
      const defaults = [
        "What is the most challenging technical problem you have solved recently?",
        "How do you ensure the quality and reliability of your code?",
        "Tell me about a time you had to learn a new technology quickly.",
        "How do you handle disagreements with team members on technical decisions?",
        "What are your long-term career goals in this field?"
      ];
      const fallbackQ = defaults[Math.floor(Math.random() * defaults.length)];
      const errMsg = error instanceof Error ? error.message : "Unknown error";

      const badFeedbacks = [
        "I see. To be completely honest, I was hoping for a bit more detail on the specific steps you took.",
        "Got it. Just a quick tip: providing a real-world example usually makes these answers much stronger.",
        "Alright. I think the logic was a bit hard to follow there, but I understand the general idea.",
        "Okay, let's move on. In the future, try to focus more on the exact impact of your work.",
      ];
      const fb = badFeedbacks[Math.floor(Math.random() * badFeedbacks.length)];

      return {
        feedback: fb,
        score: Math.min(8, Math.max(5, Math.round(answer.split(/\s+/).length / 12))),
        scoreCriteria: `API Error: ${errMsg}. Generated locally due to API failure.`,
        strengths: ["Clear attempt", "Relevant to the question"],
        improvements: ["Add measurable impact", "Make trade-offs explicit"],
        nextQuestion: {
          question: fallbackQ,
          difficulty: "Medium",
          topic: "General",
          intent: "Fallback",
        }
      };
    }
  },
);
