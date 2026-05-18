import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight, TrendingUp, Code2, MessageSquare, Sparkles,
  Target, Brain, Loader2, AlertCircle, RefreshCw,
} from "lucide-react";
import { BentoCard } from "@/components/BentoCard";
import { CircleScore } from "@/components/CircleScore";
import { Header } from "./upload";
import { analyzeProfile, type AnalysisResult } from "../services/analyzeProfile";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Analysis · Promptal AI" }] }),
});

const RADAR_AXES = ["Tech", "Comm", "Depth", "Speed", "Calm", "Fit"];

function Dashboard() {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);

    const resumeText = localStorage.getItem("resumeText") ?? "";
    const jobDescription = localStorage.getItem("jobDescription") ?? "";
    const jobRole = localStorage.getItem("jobRole") ?? "Software Engineer";

    try {
      const result = await analyzeProfile(resumeText, jobDescription, jobRole);
      setData(result);

      // Save weak topics to localStorage so the interview can target them
      const weakTopics = [...(result.missingForRole ?? []), ...(result.watchOuts ?? [])];
      localStorage.setItem("weakTopics", JSON.stringify(weakTopics));

      // Also persist for legacy sessionStorage compatibility
      sessionStorage.setItem(
        "ai_analysis_result",
        JSON.stringify({
          hiringProbability: result.hiringProbability,
          scores: [
            { l: "Technical", v: result.technical, c: "brand-primary" },
            { l: "Communication", v: result.communication, c: "brand-secondary" },
            { l: "Confidence", v: result.confidence, c: "brand-accent" },
            { l: "Role Match", v: result.roleMatch, c: "success" },
          ],
          radarData: [
            result.skillLattice.tech,
            result.skillLattice.comm,
            result.skillLattice.depth,
            result.skillLattice.speed,
            result.skillLattice.calm,
            result.skillLattice.fit,
          ],
          skills: result.resumeVsJD.map((item) => ({ name: item.skill, level: item.score })),
          strengths: result.strengths,
          techStack: result.techStack,
          watchOuts: result.watchOuts,
          missingForRole: result.missingForRole,
        })
      );
    } catch (err: any) {
      setError(err?.message ?? "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Loading screen ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-[#6C63FF]/10 grid place-items-center">
            <Loader2 className="h-10 w-10 text-[#6C63FF] animate-spin" />
          </div>
          <div className="absolute -inset-2 rounded-full border-2 border-[#6C63FF]/20 animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-slate-900">Analyzing your profile with AI...</p>
          <p className="mt-2 text-sm text-slate-500">This may take up to 30 seconds.</p>
        </div>
      </div>
    );
  }

  // ── Error screen ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="h-20 w-20 rounded-full bg-[#EF4444]/10 grid place-items-center">
          <AlertCircle className="h-10 w-10 text-[#EF4444]" />
        </div>
        <div className="text-center max-w-md">
          <p className="text-xl font-bold text-slate-900">Analysis Failed</p>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
        </div>
        <button
          onClick={runAnalysis}
          className="inline-flex items-center gap-2 rounded-xl bg-[#6C63FF] px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#5a52d5] transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Retry Analysis
        </button>
      </div>
    );
  }

  // ── Data-driven render ────────────────────────────────────────────────────
  const scores = [
    { v: data!.technical, l: "Technical", c: "brand-primary" },
    { v: data!.communication, l: "Communication", c: "brand-secondary" },
    { v: data!.confidence, l: "Confidence", c: "brand-accent" },
    { v: data!.roleMatch, l: "Role Match", c: "success" },
  ];

  const radarValues = [
    data!.skillLattice.tech,
    data!.skillLattice.comm,
    data!.skillLattice.depth,
    data!.skillLattice.speed,
    data!.skillLattice.calm,
    data!.skillLattice.fit,
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-24">
      <div className="flex items-end justify-between mb-8">
        <Header title="Candidate Insights Dashboard" sub="AI-powered analysis of your readiness for the target role." />
      </div>

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6">
        {/* Cognitive Diagnostics */}
        <BentoCard glow className="bg-white/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#6C63FF]/10 text-[#6C63FF]">
                <Brain className="h-4 w-4" />
              </div>
              <h3 className="font-display text-xl font-bold text-slate-900">Cognitive Diagnostics</h3>
            </div>
            <div className="text-right">
              <div className="font-display text-3xl font-bold text-[#6C63FF]">{data!.hiringProbability}%</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Hiring Probability
              </div>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 place-items-center">
            {scores.map((s) => (
              <CircleScore key={s.l} value={s.v} label={s.l} color={s.c} />
            ))}
          </div>
        </BentoCard>

        {/* Skill Lattice Radar */}
        <BentoCard className="bg-white/80">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#A855F7]/10 text-[#A855F7]">
              <Target className="h-4 w-4" />
            </div>
            <h3 className="font-display text-xl font-bold text-slate-900">Skill Lattice</h3>
          </div>
          <div className="mt-4 grid place-items-center">
            <Radar values={radarValues} axes={RADAR_AXES} />
          </div>
        </BentoCard>

        {/* Resume vs JD matrix */}
        <BentoCard className="lg:col-span-2 bg-white/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#3B82F6]/10 text-[#3B82F6]">
                <Code2 className="h-4 w-4" />
              </div>
              <h3 className="font-display text-xl font-bold text-slate-900">Resume vs Job Description</h3>
            </div>
            <div className="hidden md:flex gap-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#6C63FF]" /> Strong</span>
              <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#3B82F6]" /> Partial</span>
              <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" /> Gap</span>
            </div>
          </div>
          <div className="mt-8 space-y-4">
            {data!.resumeVsJD.map((s, i) => (
              <motion.div
                key={s.skill}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="grid grid-cols-[140px_1fr_80px] items-center gap-4"
              >
                <div className="text-sm font-medium text-slate-700">{s.skill}</div>
                <div className="relative h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${s.score}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      s.status === "STRONG"
                        ? "bg-[#6C63FF]"
                        : s.status === "PARTIAL"
                        ? "bg-[#3B82F6]"
                        : "bg-[#EF4444]"
                    }`}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-right text-xs font-semibold text-slate-500">{s.score}%</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                      s.status === "STRONG"
                        ? "bg-[#6C63FF]/10 text-[#6C63FF]"
                        : s.status === "PARTIAL"
                        ? "bg-[#3B82F6]/10 text-[#3B82F6]"
                        : "bg-[#EF4444]/10 text-[#EF4444]"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </BentoCard>

        {/* Mini cards */}
        <Mini icon={Sparkles} title="Strengths" items={data!.strengths} c="brand-primary" />
        <Mini icon={Code2} title="Tech Stack" items={data!.techStack} c="brand-secondary" />
        <Mini icon={MessageSquare} title="Watch-outs" items={data!.watchOuts} c="brand-accent" />
        <Mini icon={Target} title="Missing for Role" items={data!.missingForRole} c="danger" />
      </div>

      <div className="mt-10 flex justify-end">
        <Link
          to="/twin"
          className="inline-flex items-center gap-2 rounded-xl bg-[#6C63FF] px-8 py-4 font-semibold text-white shadow-lg shadow-[#6C63FF]/30 hover:-translate-y-0.5 hover:shadow-xl transition-all"
        >
          Choose Interview Twin <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const COLOR_TILE: Record<string, string> = {
  "brand-primary": "bg-[#6C63FF]/10 text-[#6C63FF]",
  "brand-secondary": "bg-[#A855F7]/10 text-[#A855F7]",
  "brand-accent": "bg-[#3B82F6]/10 text-[#3B82F6]",
  success: "bg-[#10B981]/10 text-[#10B981]",
  danger: "bg-[#EF4444]/10 text-[#EF4444]",
};

function Mini({
  icon: Icon,
  title,
  items,
  c,
}: {
  icon: typeof Sparkles;
  title: string;
  items: string[];
  c: "brand-primary" | "brand-secondary" | "brand-accent" | "success" | "danger";
}) {
  return (
    <BentoCard className="bg-white/80">
      <div className="flex items-center gap-2">
        <div className={`grid h-8 w-8 place-items-center rounded-lg ${COLOR_TILE[c]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="font-display text-lg font-bold text-slate-900">{title}</div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((i) => (
          <span
            key={i}
            className="rounded-full bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm"
          >
            {i}
          </span>
        ))}
      </div>
    </BentoCard>
  );
}

function Radar({ values, axes }: { values: number[]; axes: string[] }) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 28;
  const N = values.length;
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / N - Math.PI / 2;
    const r = (R * v) / 100;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
  };
  const poly = values.map((v, i) => pt(i, v).join(",")).join(" ");
  return (
    <svg width={size} height={size}>
      <defs>
        <linearGradient id="rg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#6C63FF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#A855F7" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon
          key={f}
          points={Array.from({ length: N }, (_, i) => pt(i, f * 100).join(",")).join(" ")}
          fill="none"
          stroke="#E2E8F0"
        />
      ))}
      {Array.from({ length: N }, (_, i) => {
        const [x, y] = pt(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#E2E8F0" />;
      })}
      <polygon points={poly} fill="url(#rg)" stroke="#6C63FF" strokeWidth={2} style={{ filter: "drop-shadow(0 4px 10px rgba(108,99,255,0.3))" }} />
      {values.map((_, i) => {
        const [x, y] = pt(i, 100);
        const a = (Math.PI * 2 * i) / N - Math.PI / 2;
        const lx = cx + Math.cos(a) * (R + 16);
        const ly = cy + Math.sin(a) * (R + 16);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={4} fill="#6C63FF" stroke="white" strokeWidth={1.5} />
            <text x={lx} y={ly} textAnchor="middle" dy="0.35em" className="fill-slate-600 font-medium" fontSize="11">
              {axes[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
