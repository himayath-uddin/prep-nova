// ─────────────────────────────────────────────────────────────────────────────
// src/services/analyzeProfile.ts
// Calls Featherless AI to analyze resume vs job description and return
// structured cognitive scores, skill lattice, resume-vs-JD breakdown, etc.
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = "https://api.featherless.ai/v1/chat/completions";
const MODEL = "NousResearch/Hermes-3-Llama-3.1-8B";

export interface ResumeVsJDItem {
  skill: string;
  score: number;
  status: "STRONG" | "PARTIAL" | "GAP";
}

export interface AnalysisResult {
  technical: number;
  communication: number;
  confidence: number;
  roleMatch: number;
  hiringProbability: number;
  skillLattice: {
    tech: number;
    comm: number;
    depth: number;
    speed: number;
    calm: number;
    fit: number;
  };
  resumeVsJD: ResumeVsJDItem[];
  strengths: string[];
  techStack: string[];
  watchOuts: string[];
  missingForRole: string[];
}

const SYSTEM_PROMPT = `You are an expert talent analytics AI that evaluates candidates for technical roles.
You MUST respond with ONLY a valid JSON object and absolutely nothing else — no markdown, no explanation, no preamble.
The JSON must conform exactly to this schema:
{
  "technical": <0-100>,
  "communication": <0-100>,
  "confidence": <0-100>,
  "roleMatch": <0-100>,
  "hiringProbability": <0-100>,
  "skillLattice": { "tech": <0-100>, "comm": <0-100>, "depth": <0-100>, "speed": <0-100>, "calm": <0-100>, "fit": <0-100> },
  "resumeVsJD": [{ "skill": "<string>", "score": <0-100>, "status": "STRONG" | "PARTIAL" | "GAP" }],
  "strengths": ["<string>", ...],
  "techStack": ["<string>", ...],
  "watchOuts": ["<string>", ...],
  "missingForRole": ["<string>", ...]
}
Provide exactly 6 items in resumeVsJD, 3 strengths, 4 techStack items, 3 watchOuts, and 3 missingForRole items.`;

function buildPrompt(resumeText: string, jobDescription: string, targetRole: string): string {
  return `Analyze this candidate for the role: "${targetRole}".

RESUME:
${resumeText.slice(0, 3000)}

JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}

Return the JSON analysis now.`;
}

function buildFallback(): AnalysisResult {
  return {
    technical: 70,
    communication: 65,
    confidence: 60,
    roleMatch: 72,
    hiringProbability: 67,
    skillLattice: { tech: 70, comm: 65, depth: 62, speed: 68, calm: 60, fit: 72 },
    resumeVsJD: [
      { skill: "Core Technical Skills", score: 75, status: "STRONG" },
      { skill: "Communication", score: 65, status: "PARTIAL" },
      { skill: "System Design", score: 50, status: "PARTIAL" },
      { skill: "Leadership", score: 40, status: "GAP" },
      { skill: "Domain Knowledge", score: 70, status: "STRONG" },
      { skill: "Cloud / DevOps", score: 35, status: "GAP" },
    ],
    strengths: ["Strong technical foundation", "Clear communication style", "Relevant project experience"],
    techStack: ["JavaScript", "React", "Node.js", "SQL"],
    watchOuts: ["Lacks system design depth", "Limited leadership experience", "Needs stronger DevOps knowledge"],
    missingForRole: ["Cloud architecture", "Team leadership", "CI/CD pipeline experience"],
  };
}

export async function analyzeProfile(
  resumeText: string,
  jobDescription: string,
  targetRole: string
): Promise<AnalysisResult> {
  const apiKey = import.meta.env.VITE_FEATHERLESS_KEY;

  if (!apiKey || apiKey.length < 10) {
    console.warn("VITE_FEATHERLESS_KEY not set — using fallback analysis.");
    return buildFallback();
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildPrompt(resumeText, jobDescription, targetRole) },
      ],
      temperature: 0.3,
      max_tokens: 1200,
    }),
  });

  if (!response.ok) {
    throw new Error(`Featherless API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const rawContent: string = data?.choices?.[0]?.message?.content ?? "";

  try {
    const match = rawContent.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON object found in response");
    const parsed = JSON.parse(match[0]) as AnalysisResult;

    // Clamp all numeric fields to 0-100 for safety
    const clamp = (v: unknown) => Math.max(0, Math.min(100, Number(v) || 0));
    parsed.technical = clamp(parsed.technical);
    parsed.communication = clamp(parsed.communication);
    parsed.confidence = clamp(parsed.confidence);
    parsed.roleMatch = clamp(parsed.roleMatch);
    parsed.hiringProbability = clamp(parsed.hiringProbability);
    if (parsed.skillLattice) {
      parsed.skillLattice.tech = clamp(parsed.skillLattice.tech);
      parsed.skillLattice.comm = clamp(parsed.skillLattice.comm);
      parsed.skillLattice.depth = clamp(parsed.skillLattice.depth);
      parsed.skillLattice.speed = clamp(parsed.skillLattice.speed);
      parsed.skillLattice.calm = clamp(parsed.skillLattice.calm);
      parsed.skillLattice.fit = clamp(parsed.skillLattice.fit);
    }

    return parsed;
  } catch (e) {
    console.error("Failed to parse AI response:", rawContent, e);
    throw new Error("AI returned an unparseable response. Please retry.");
  }
}
