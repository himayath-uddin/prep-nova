import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Brain, CheckCircle2, Eye, Mic2, TrendingUp } from "lucide-react";
import { BentoCard } from "@/components/BentoCard";
import { Header } from "./upload";
import { CircleScore } from "@/components/CircleScore";

export const Route = createFileRoute("/report")({
  component: Report,
  head: () => ({ meta: [{ title: "Replay & Coaching - Promptal AI" }] }),
});

type InterviewTurn = {
  question: string;
  answer: string;
  feedback: string;
  score: number;
  topic: string;
  difficulty: string;
  strengths: string[];
  improvements: string[];
  durationSeconds: number;
};

type InterviewSession = {
  context?: {
    role?: string;
    twin?: { name: string; role: string };
  };
  turns: InterviewTurn[];
  metrics?: { voice: number; pace: number; clarity: number };
  durationSeconds?: number;
};

const DEMO_TURNS: InterviewTurn[] = [
  {
    question: "Why are you a strong fit for this role?",
    answer: "I mapped my projects to the role requirements and highlighted relevant technical ownership.",
    feedback: "Good role alignment. Add measurable outcomes and a sharper closing statement.",
    score: 7,
    topic: "Role Fit",
    difficulty: "Medium",
    strengths: ["Relevant experience", "Clear motivation"],
    improvements: ["Add metrics", "Tighten structure"],
    durationSeconds: 74,
  },
];

function Report() {
  const [session, setSession] = useState<InterviewSession>({ turns: DEMO_TURNS });

  useEffect(() => {
    const saved = sessionStorage.getItem("ai_interview_session");
    if (!saved) return;

    try {
      setSession(JSON.parse(saved));
    } catch (error) {
      console.error(error);
    }
  }, []);

  const turns = session.turns?.length ? session.turns : DEMO_TURNS;
  const averageScore = Math.round((turns.reduce((sum, turn) => sum + Number(turn.score || 0), 0) / turns.length) * 10);
  const clarity = Math.round(session.metrics?.clarity ?? Math.min(92, averageScore + 8));
  const confidence = Math.round(Math.min(95, averageScore + ((session.metrics?.voice ?? 72) - 70) / 2));
  const pace = Math.round(session.metrics?.pace ?? 68);
  const energy = Math.round(Math.min(95, (clarity + confidence + pace) / 3 + 8));
  const duration = session.durationSeconds || turns.reduce((sum, turn) => sum + (turn.durationSeconds || 0), 0);

  const strongAreas = useMemo(() => {
    const items = turns.flatMap((turn) => turn.strengths || []);
    return [...new Set(items)].slice(0, 4);
  }, [turns]);

  const improvements = useMemo(() => {
    const items = turns.flatMap((turn) => turn.improvements || []);
    return [...new Set(items)].slice(0, 4);
  }, [turns]);

  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-24 space-y-6">
      <Header
        title="Replay & AI Coaching"
        sub={`Session report for ${session.context?.role || "your target role"} with ${session.context?.twin?.name || "your AI Twin"}.`}
      />

      <div className="grid md:grid-cols-4 gap-6">
        {[
          { icon: Mic2, label: "Speech Clarity", v: clarity, c: "brand-primary" as const },
          { icon: Brain, label: "Confidence", v: confidence, c: "brand-secondary" as const },
          { icon: Eye, label: "Answer Quality", v: averageScore, c: "brand-accent" as const },
          { icon: TrendingUp, label: "Energy", v: energy, c: "success" as const },
        ].map((m) => (
          <BentoCard key={m.label} className="flex flex-col items-center text-center p-8 bg-white/80">
            <CircleScore value={m.v} label={m.label} color={m.c} size={130} />
            <div className="mt-6 flex flex-col items-center">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 text-slate-500 mb-3">
                <m.icon className="h-4 w-4" />
              </div>
              <div className="text-sm font-medium text-slate-500">
                {m.v > 75 ? "Strong baseline" : m.v > 60 ? "Room to grow" : "Needs practice"}
              </div>
            </div>
          </BentoCard>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <BentoCard className="bg-white/80 border-t-4 border-t-[#10B981]">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle2 className="h-6 w-6 text-[#10B981]" />
            <h3 className="font-display text-xl font-bold text-slate-900">Strong Areas</h3>
          </div>
          <CoachingList items={strongAreas.length ? strongAreas : ["Relevant examples", "Clear role intent"]} positive />
        </BentoCard>

        <BentoCard className="bg-white/80 border-t-4 border-t-[#EF4444]">
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle className="h-6 w-6 text-[#EF4444]" />
            <h3 className="font-display text-xl font-bold text-slate-900">Areas to Improve</h3>
          </div>
          <CoachingList items={improvements.length ? improvements : ["Add measurable impact", "Use tighter answer structure"]} />
        </BentoCard>
      </div>

      <BentoCard className="bg-white/80">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <h3 className="font-display text-2xl font-bold text-slate-900">Timeline Feedback</h3>
          <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {turns.length} questions - {String(Math.floor(duration / 60)).padStart(2, "0")}m {String(duration % 60).padStart(2, "0")}s
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-slate-100" />
          <div className="space-y-8">
            {turns.map((turn, i) => (
              <motion.div
                key={`${turn.question}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative pl-12"
              >
                <div className="absolute left-0 top-1.5 h-8 w-8 rounded-full border-[3px] border-white shadow-sm flex items-center justify-center bg-white text-xs font-bold text-slate-700 z-10">
                  {i + 1}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div className="font-semibold text-lg text-slate-900">{turn.question}</div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${scoreClass(turn.score)}`}>
                    {turn.score}/10 - {turn.topic}
                  </span>
                </div>
                <div className="mt-3 grid md:grid-cols-2 gap-3">
                  <div className="text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <span className="font-semibold text-slate-800">Answer: </span>{turn.answer}
                  </div>
                  <div className="text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <span className="font-semibold text-slate-800">Coach: </span>{turn.feedback}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </BentoCard>

      <div className="flex justify-end mt-12">
        <Link
          to="/timemachine"
          className="inline-flex items-center gap-2 rounded-xl bg-[#6C63FF] px-8 py-4 font-semibold text-white shadow-lg shadow-[#6C63FF]/30 hover:-translate-y-0.5 hover:shadow-xl hover:bg-[#5a52d5] transition-all"
        >
          View Career Roadmap <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}

function CoachingList({ items, positive = false }: { items: string[]; positive?: boolean }) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <div className={`mt-1 h-2 w-2 rounded-full ${positive ? "bg-[#10B981]" : "bg-[#EF4444]"}`} />
          <div className="font-semibold text-slate-900">{item}</div>
        </li>
      ))}
    </ul>
  );
}

function scoreClass(score: number) {
  if (score >= 8) return "bg-[#10B981]/10 text-[#10B981]";
  if (score >= 6) return "bg-[#3B82F6]/10 text-[#3B82F6]";
  return "bg-[#EF4444]/10 text-[#EF4444]";
}
