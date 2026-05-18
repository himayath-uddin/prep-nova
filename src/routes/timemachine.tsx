import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Sparkles, TrendingUp, CheckCircle2, Target, Briefcase } from "lucide-react";
import { BentoCard } from "@/components/BentoCard";
import { Header } from "./upload";

export const Route = createFileRoute("/timemachine")({
  component: TimeMachine,
  head: () => ({
    meta: [
      { title: "Career Growth · Promptal AI" },
      { name: "description", content: "See your career roadmap and future profile." },
    ],
  }),
});

const CURRENT = {
  role: "Frontend Engineer",
  exp: "3.5 yrs",
  skills: ["React", "TypeScript", "Node basics", "REST APIs"],
  wins: ["Shipped dashboard MVP", "Refactored auth flow", "Mentored 1 intern"],
  score: 68,
};

const FUTURE = {
  role: "Senior Full-Stack Engineer",
  exp: "4.0 yrs",
  skills: ["System Design", "Docker · K8s", "SQL Optimization", "Cloud (AWS)", "Leadership"],
  wins: ["Architected real-time service for 1M users", "Led 4-eng squad", "Cut p95 latency 60%", "Open-source library w/ 2k stars"],
  score: 89,
};

function TimeMachine() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-24 space-y-6">
      <Header title="Career Growth Simulator" sub="Project your career trajectory. See the skills required to reach your next milestone." />

      <BentoCard className="bg-white/80 p-8">
        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-8 items-center">
          
          <ResumePanel
            label="Current Profile"
            data={CURRENT}
            tone="muted"
          />

          {/* Time vector */}
          <div className="relative flex md:flex-col items-center justify-center gap-4 px-4 py-8">
            <div className="relative h-20 w-20 grid place-items-center rounded-full bg-slate-50 border border-slate-200 shadow-sm z-10">
              <Clock className="h-8 w-8 text-[#6C63FF]" />
            </div>
            <div className="text-center z-10">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Projection</div>
              <div className="font-display text-2xl font-bold text-[#6C63FF]">+6 months</div>
            </div>
            
            {/* Arrow connecting */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#6C63FF]/20 to-transparent -translate-x-1/2" />
            <ArrowRight className="h-6 w-6 text-[#6C63FF] hidden md:block z-10 bg-white rounded-full" />
          </div>

          <ResumePanel
            label="Future Profile"
            data={FUTURE}
            tone="bright"
          />
        </div>
      </BentoCard>

      {/* Growth chart */}
      <BentoCard className="bg-white/80">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-2xl font-bold text-slate-900">Projected Readiness</h3>
            <p className="text-slate-500 mt-1">Expected hiring probability based on your learning velocity.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#10B981]/10 rounded-full text-sm font-semibold text-[#10B981]">
            <TrendingUp className="h-4 w-4" /> +21% in 6 months
          </div>
        </div>
        <GrowthChart />
      </BentoCard>

      <div className="grid md:grid-cols-3 gap-6">
        {[
          { t: "Predicted Role", v: "Senior Full-Stack", icon: Target, c: "text-[#6C63FF]" },
          { t: "Career Growth", v: "+1 level", icon: TrendingUp, c: "text-[#10B981]" },
          { t: "Hiring Probability", v: "89%", icon: Sparkles, c: "text-[#A855F7]" },
        ].map((c) => (
          <BentoCard key={c.t} className="bg-white/80">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-2">
              <c.icon className={`h-4 w-4 ${c.c}`} /> {c.t}
            </div>
            <div className="font-display text-3xl font-bold text-slate-900">{c.v}</div>
          </BentoCard>
        ))}
      </div>

      <div className="flex justify-end mt-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-[#6C63FF] px-8 py-4 font-semibold text-white shadow-lg shadow-[#6C63FF]/30 hover:-translate-y-0.5 hover:shadow-xl hover:bg-[#5a52d5] transition-all"
        >
          Return to Dashboard <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}

function ResumePanel({
  label,
  data,
  tone,
}: {
  label: string;
  data: typeof CURRENT;
  tone: "muted" | "bright";
}) {
  const bright = tone === "bright";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`relative rounded-3xl p-8 transition-all ${
        bright
          ? "bg-white border-2 border-[#6C63FF] shadow-xl shadow-[#6C63FF]/10"
          : "bg-slate-50 border border-slate-200 shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className={`font-display text-2xl font-bold ${bright ? "text-[#6C63FF]" : "text-slate-900"}`}>{label}</h3>
          <div className="flex items-center gap-2 mt-2 text-sm font-medium text-slate-500">
            <Briefcase className="h-4 w-4" /> {data.role} · {data.exp}
          </div>
        </div>
        <div className={`flex items-center justify-center h-16 w-16 rounded-full font-display text-2xl font-bold ${
          bright ? "bg-[#6C63FF] text-white shadow-md shadow-[#6C63FF]/30" : "bg-slate-200 text-slate-600"
        }`}>
          {data.score}
        </div>
      </div>

      <div className="mt-8">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Key Skills</div>
        <div className="flex flex-wrap gap-2">
          {data.skills.map((s) => (
            <span
              key={s}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                bright
                  ? "bg-[#6C63FF]/10 text-[#6C63FF] border border-[#6C63FF]/20"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Major Wins</div>
        <ul className="space-y-3">
          {data.wins.map((w) => (
            <li key={w} className="flex items-start gap-3 text-sm font-medium">
              <CheckCircle2 className={`h-5 w-5 shrink-0 ${bright ? "text-[#10B981]" : "text-slate-400"}`} />
              <span className={bright ? "text-slate-900" : "text-slate-600"}>{w}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

function GrowthChart() {
  const pts = [68, 70, 73, 75, 78, 80, 82, 84, 86, 87, 88, 88.5, 89];
  const W = 800, H = 240, P = 30;
  const x = (i: number) => P + (i * (W - P * 2)) / (pts.length - 1);
  const y = (v: number) => H - P - ((v - 60) / 40) * (H - P * 2);
  const path = pts.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");
  const area = `${path} L ${x(pts.length - 1)} ${H - P} L ${x(0)} ${H - P} Z`;
  return (
    <div className="mt-6 -mx-2 overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[240px] min-w-[600px]">
        <defs>
          <linearGradient id="ga" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#6C63FF" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#6C63FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1={P} x2={W - P} y1={P + i * ((H - P * 2) / 3)} y2={P + i * ((H - P * 2) / 3)} stroke="#E2E8F0" strokeDasharray="4 4" />
        ))}
        <path d={area} fill="url(#ga)" />
        <path d={path} fill="none" stroke="#6C63FF" strokeWidth={3} style={{ filter: "drop-shadow(0 4px 6px rgba(108,99,255,0.2))" }} />
        {pts.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r={i === pts.length - 1 ? 6 : 4} fill={i === pts.length - 1 ? "#10B981" : "#6C63FF"} stroke="white" strokeWidth={2} />
        ))}
        <text x={x(0)} y={H - 4} className="fill-slate-400 font-semibold text-xs text-center" textAnchor="middle">Today</text>
        <text x={x(pts.length - 1)} y={H - 4} className="fill-slate-400 font-semibold text-xs text-center" textAnchor="middle">+6 Months</text>
        <text x={x(pts.length - 1)} y={y(pts[pts.length - 1]) - 15} className="fill-[#10B981] font-bold text-sm text-center" textAnchor="middle">89%</text>
      </svg>
    </div>
  );
}
