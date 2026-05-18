import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle, ArrowRight, Brain, CheckCircle2, Clock,
  Eye, Mic2, RefreshCw, TrendingUp,
} from "lucide-react";
import { BentoCard } from "@/components/BentoCard";
import { Header } from "./upload";
import { CircleScore } from "@/components/CircleScore";

export const Route = createFileRoute("/report")({
  component: Report,
  head: () => ({ meta: [{ title: "Replay & Coaching - Promptal AI" }] }),
});

type InterviewTurn = {
  question: string; answer: string; feedback: string; score: number;
  topic: string; difficulty: string;
  strengths: string[]; improvements: string[]; durationSeconds: number;
};

type InterviewSession = {
  context?: { role?: string; twin?: { name: string; role: string } };
  turns: InterviewTurn[];
  metrics?: { voice: number; pace: number; clarity: number };
  durationSeconds?: number;
};

function Report() {
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [hasRealData, setHasRealData] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("ai_interview_session");
    if (saved) {
      try {
        const parsed: InterviewSession = JSON.parse(saved);
        if (parsed.turns && parsed.turns.length > 0) {
          setSession(parsed);
          setHasRealData(true);
          return;
        }
      } catch {}
    }
    // No real data — show an empty state
    setSession(null);
    setHasRealData(false);
  }, []);

  if (!hasRealData || !session) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 pb-24">
        <Header title="Replay & AI Coaching" sub="Complete a Live Interview Session to see your personalized report here." />
        <div className="mt-20 flex flex-col items-center gap-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
            <Mic2 className="h-10 w-10 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">No Session Recorded Yet</h2>
          <p className="max-w-md text-slate-500">
            Go to <strong>Live Session</strong>, complete all 6 interview questions, and your full AI coaching report will appear here automatically.
          </p>
          <Link to="/interview"
            className="inline-flex items-center gap-2 rounded-xl bg-[#6C63FF] px-8 py-4 font-semibold text-white shadow-lg hover:-translate-y-0.5 transition-all hover:bg-[#5a52d5]">
            Start Live Session <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  const turns = session.turns;
  const role = session.context?.role || "your target role";
  const twinName = session.context?.twin?.name || "your AI Twin";
  const totalDuration = session.durationSeconds || turns.reduce((s, t) => s + (t.durationSeconds || 0), 0);
  const avgScore10 = turns.reduce((s, t) => s + Number(t.score || 0), 0) / turns.length;
  const avgScore = Math.round(avgScore10 * 10); // convert to 0-100

  const clarity  = Math.round(session.metrics?.clarity ?? Math.min(95, avgScore + 5));
  const voice    = Math.round(session.metrics?.voice ?? Math.min(95, avgScore + 3));
  const pace     = Math.round(session.metrics?.pace ?? 70);
  const confidence = Math.round(Math.min(95, (avgScore + voice) / 2));

  const strongAreas = useMemo(() => {
    const items = turns.flatMap(t => t.strengths || []);
    return [...new Set(items)].slice(0, 5);
  }, [turns]);

  const improvements = useMemo(() => {
    const items = turns.flatMap(t => t.improvements || []);
    return [...new Set(items)].slice(0, 5);
  }, [turns]);

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}m ${String(s % 60).padStart(2, "0")}s`;

  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-24 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Header
          title="Replay & AI Coaching"
          sub={`Session report for "${role}" with ${twinName} — ${turns.length} questions answered.`}
        />
        <div className="flex items-center gap-3 mt-4">
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
            <Clock className="h-4 w-4" /> {fmtTime(totalDuration)}
          </div>
          <Link to="/interview"
            className="inline-flex items-center gap-2 rounded-full bg-[#6C63FF] px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-[#5a52d5] transition-colors">
            <RefreshCw className="h-4 w-4" /> Retry Interview
          </Link>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        {[
          { icon: Mic2, label: "Speech Clarity", v: clarity, c: "brand-primary" as const },
          { icon: Brain, label: "Confidence", v: confidence, c: "brand-secondary" as const },
          { icon: Eye, label: "Answer Quality", v: avgScore, c: "brand-accent" as const },
          { icon: TrendingUp, label: "Voice Stability", v: voice, c: "success" as const },
        ].map((m) => (
          <BentoCard key={m.label} className="flex flex-col items-center text-center p-8 bg-white/80">
            <CircleScore value={m.v} label={m.label} color={m.c} size={130} />
            <div className="mt-5 flex flex-col items-center">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 text-slate-500 mb-2">
                <m.icon className="h-4 w-4" />
              </div>
              <div className="text-sm font-medium text-slate-500">
                {m.v > 75 ? "Strong baseline" : m.v > 55 ? "Room to grow" : "Needs practice"}
              </div>
            </div>
          </BentoCard>
        ))}
      </div>

      {/* Biometric Bar */}
      <BentoCard className="bg-white/80">
        <h3 className="font-bold text-slate-900 mb-6">Live Biometric Summary</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { label: "Voice Stability", value: session.metrics?.voice ?? voice, color: "bg-[#6C63FF]" },
            { label: "Speaking Pace", value: pace, color: "bg-[#3B82F6]" },
            { label: "Clarity Index", value: clarity, color: "bg-[#10B981]" },
          ].map(m => (
            <div key={m.label}>
              <div className="flex justify-between text-sm font-semibold mb-2">
                <span className="text-slate-600">{m.label}</span>
                <span className="text-slate-900">{m.value}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${m.value}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full ${m.color}`} />
              </div>
            </div>
          ))}
        </div>
      </BentoCard>

      {/* Strengths & Improvements */}
      <div className="grid md:grid-cols-2 gap-6">
        <BentoCard className="bg-white/80 border-t-4 border-t-[#10B981]">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle2 className="h-6 w-6 text-[#10B981]" />
            <h3 className="font-display text-xl font-bold text-slate-900">Strong Areas</h3>
          </div>
          {strongAreas.length > 0
            ? <CoachingList items={strongAreas} positive />
            : <p className="text-slate-400 italic">Complete the interview to see your strengths.</p>}
        </BentoCard>
        <BentoCard className="bg-white/80 border-t-4 border-t-[#EF4444]">
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle className="h-6 w-6 text-[#EF4444]" />
            <h3 className="font-display text-xl font-bold text-slate-900">Areas to Improve</h3>
          </div>
          {improvements.length > 0
            ? <CoachingList items={improvements} />
            : <p className="text-slate-400 italic">Complete the interview to see improvement areas.</p>}
        </BentoCard>
      </div>

      {/* Full Q&A Timeline */}
      <BentoCard className="bg-white/80">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <h3 className="font-display text-2xl font-bold text-slate-900">Full Interview Timeline</h3>
          <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {turns.length} questions · Avg score: {avgScore10.toFixed(1)}/10
          </div>
        </div>
        <div className="relative">
          <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-slate-100" />
          <div className="space-y-8">
            {turns.map((turn, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="relative pl-12">
                <div className="absolute left-0 top-1.5 h-8 w-8 rounded-full border-[3px] border-white shadow-sm flex items-center justify-center bg-white text-xs font-bold text-slate-700 z-10">
                  {i + 1}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-3">
                  <div className="font-semibold text-lg text-slate-900">{turn.question}</div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${scoreClass(turn.score)}`}>
                      {turn.score}/10
                    </span>
                    <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{turn.topic}</span>
                    <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{turn.difficulty}</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />{turn.durationSeconds}s
                    </span>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <span className="font-semibold text-slate-800">Your Answer: </span>{turn.answer}
                  </div>
                  <div className="text-slate-600 bg-[#10B981]/5 rounded-lg p-3 border border-[#10B981]/20">
                    <span className="font-semibold text-[#047857]">AI Coach: </span>{turn.feedback}
                  </div>
                </div>
                {(turn.strengths?.length > 0 || turn.improvements?.length > 0) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {turn.strengths?.map(s => (
                      <span key={s} className="text-xs bg-[#10B981]/10 text-[#047857] border border-[#10B981]/20 rounded-full px-2.5 py-1">✓ {s}</span>
                    ))}
                    {turn.improvements?.map(s => (
                      <span key={s} className="text-xs bg-[#EF4444]/10 text-[#DC2626] border border-[#EF4444]/20 rounded-full px-2.5 py-1">↑ {s}</span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </BentoCard>

      <div className="flex justify-end mt-12">
        <Link to="/timemachine"
          className="inline-flex items-center gap-2 rounded-xl bg-[#6C63FF] px-8 py-4 font-semibold text-white shadow-lg shadow-[#6C63FF]/30 hover:-translate-y-0.5 hover:shadow-xl hover:bg-[#5a52d5] transition-all">
          View Career Roadmap <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}

function CoachingList({ items, positive = false }: { items: string[]; positive?: boolean }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${positive ? "bg-[#10B981]" : "bg-[#EF4444]"}`} />
          <div className="font-medium text-slate-800">{item}</div>
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
