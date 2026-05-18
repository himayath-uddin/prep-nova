import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, CheckCircle2, User, Building2, Brain, Zap, Target, Briefcase } from "lucide-react";
import { BentoCard } from "@/components/BentoCard";
import { Header } from "./upload";

export const Route = createFileRoute("/twin")({
  component: TwinPage,
  head: () => ({ meta: [{ title: "Choose Twin · Promptal AI" }] }),
});

const TWINS = [
  { name: "Alex", role: "HR Mentor", icon: User, diff: "Easy", style: "Warm & Supportive", spec: "Culture Fit", color: "bg-[#10B981]", light: "bg-[#10B981]/10 text-[#10B981]" },
  { name: "David", role: "FAANG Engineer", icon: Building2, diff: "Hard", style: "Surgical & Deep", spec: "System Design", color: "bg-[#6C63FF]", light: "bg-[#6C63FF]/10 text-[#6C63FF]" },
  { name: "Sam", role: "Startup Founder", icon: Zap, diff: "Medium", style: "Curious & Fast", spec: "Ownership", color: "bg-[#F59E0B]", light: "bg-[#F59E0B]/10 text-[#F59E0B]" },
  { name: "Sofia", role: "Stress Interviewer", icon: Target, diff: "Insane", style: "Relentless", spec: "Pressure Tests", color: "bg-[#EF4444]", light: "bg-[#EF4444]/10 text-[#EF4444]" },
  { name: "Rahul", role: "Rapid Fire Coach", icon: Zap, diff: "Hard", style: "Quickfire", spec: "1-Min Answers", color: "bg-[#A855F7]", light: "bg-[#A855F7]/10 text-[#A855F7]" },
  { name: "Khan", role: "Behavior Expert", icon: Brain, diff: "Medium", style: "Empathic", spec: "STAR Method", color: "bg-[#3B82F6]", light: "bg-[#3B82F6]/10 text-[#3B82F6]" },
];

function TwinPage() {
  const [sel, setSel] = useState<number | null>(null);

  const selectTwin = (index: number) => {
    setSel(index);
    const twin = TWINS[index];
    const savedContext = sessionStorage.getItem("ai_interview_context");
    const context = savedContext ? JSON.parse(savedContext) : {};

    sessionStorage.setItem(
      "ai_interview_context",
      JSON.stringify({
        ...context,
        twin: {
          name: twin.name,
          role: twin.role,
          difficulty: twin.diff,
          style: twin.style,
          speciality: twin.spec,
        },
      }),
    );
  };
  
  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-24">
      <Header title="Choose Your Interview Twin" sub="Select an AI interviewer tailored to your specific preparation needs." />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {TWINS.map((t, i) => {
          const active = sel === i;
          return (
            <motion.button
              key={t.name}
              onClick={() => selectTwin(i)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`text-left rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden group bg-white/80 backdrop-blur-2xl border ${
                active ? "border-[#6C63FF] shadow-lg shadow-[#6C63FF]/20 ring-1 ring-[#6C63FF]" : "border-slate-200 shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`grid h-14 w-14 place-items-center rounded-2xl ${t.light}`}>
                    <t.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-slate-900">{t.name}</h3>
                    <div className="text-sm font-medium text-slate-500">{t.role}</div>
                  </div>
                </div>
                {active && (
                  <CheckCircle2 className="h-6 w-6 text-[#6C63FF]" />
                )}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Stat label="Difficulty" value={t.diff} />
                <Stat label="Speciality" value={t.spec} />
                <div className="col-span-2">
                  <Stat label="Interview Style" value={t.style} />
                </div>
              </div>

              {active && (
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-sm font-semibold text-[#6C63FF]">
                  <Zap className="h-4 w-4" /> Selected
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-12 flex justify-end">
        <Link
          to="/interview"
          className={`inline-flex items-center gap-2 rounded-xl bg-[#6C63FF] px-8 py-4 font-semibold text-white shadow-lg shadow-[#6C63FF]/30 hover:-translate-y-0.5 hover:shadow-xl hover:bg-[#5a52d5] transition-all ${
            sel === null ? "opacity-50 pointer-events-none shadow-none" : ""
          }`}
        >
          Enter Live Session <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="text-sm font-medium text-slate-900 mt-0.5 truncate">{value}</div>
    </div>
  );
}
