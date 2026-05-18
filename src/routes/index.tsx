import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Play, CheckCircle2, Target, Briefcase, Brain, Activity } from "lucide-react";
import { BentoCard } from "@/components/BentoCard";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Promptal AI — Practice with your AI Interview Twin" },
      { name: "description", content: "Upload your resume and job role. Train with an AI interviewer." },
    ],
  }),
});

function Landing() {
  return (
    <div className="relative pb-24">
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center pt-8 text-center">
        <div className="mx-auto w-full max-w-[1000px] px-6">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-600 premium-border shadow-sm">
              <span className="h-2 w-2 rounded-full bg-slate-900 animate-pulse" /> AI-Powered Interview Simulation
            </div>

            <h1 className="mt-8 font-display text-[clamp(3rem,6vw,5.5rem)] font-extrabold leading-[1.05] tracking-tight text-slate-900">
              Perfect your interview <br />
              <span className="text-slate-400">before it happens.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-slate-500 leading-relaxed mx-auto">
              Upload your resume and job role. Train with an AI interviewer that adapts to your career goals, tests your technical depth, and analyzes your biometrics in real-time.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                to="/upload"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-sm font-semibold text-white shadow-lg hover:bg-slate-800 transition-all hover:-translate-y-0.5"
              >
                Start Simulation
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button 
                onClick={() => {
                  sessionStorage.setItem('demoMode', 'true');
                  window.location.reload();
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-slate-900 shadow-sm premium-border hover:bg-slate-50 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <Play className="h-4 w-4 text-slate-400" /> Watch Demo
              </button>
            </div>
          </motion.div>

          {/* Minimalist Dashboard Preview Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left"
          >
            {/* AI Readiness */}
            <BentoCard className="flex flex-col justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Target className="h-4 w-4" /> Readiness Score
              </div>
              <div className="mt-4 flex items-end gap-2">
                <div className="font-display text-5xl font-bold text-slate-900">92</div>
                <div className="mb-1 text-sm font-medium text-slate-400">/ 100</div>
              </div>
              <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full w-[92%] rounded-full bg-slate-900" />
              </div>
            </BentoCard>

            {/* Resume Analyzed */}
            <BentoCard className="flex flex-col justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 premium-border text-slate-900">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">Resume Synced</h3>
              <p className="mt-1 text-sm text-slate-500">Profile matches target role.</p>
            </BentoCard>

            {/* Hiring Probability */}
            <BentoCard className="flex flex-col justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Activity className="h-4 w-4" /> Hiring Probability
              </div>
              <div className="mt-4 font-display text-4xl font-bold text-slate-900">84%</div>
              <p className="mt-2 text-sm text-emerald-600 font-medium bg-emerald-50 w-fit px-2 py-0.5 rounded-full">+12% from last session</p>
            </BentoCard>
          </motion.div>

        </div>
      </section>
    </div>
  );
}
