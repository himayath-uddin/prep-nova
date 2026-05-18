import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Mic, Radio, RotateCcw, StopCircle, Video, Volume2, VolumeX } from "lucide-react";
import { BentoCard } from "@/components/BentoCard";
import { Header } from "./upload";
import { AIAvatar } from "@/components/AIAvatar";
import { useInterviewAI } from "@/hooks/useInterviewAI";

export const Route = createFileRoute("/interview")({
  component: Interview,
  head: () => ({ meta: [{ title: "Live Session - Promptal AI" }] }),
});

type InterviewContext = {
  role: string;
  jd: string;
  twin?: { name: string; role: string; difficulty: string; style: string; speciality: string };
};

const TOTAL_QUESTIONS = 6;

// ─── Real Biometrics Hook ─────────────────────────────────────────────────────
function useRealBiometrics(transcript: string, isListening: boolean, startedAt: number | null) {
  const [metrics, setMetrics] = useState({ voice: 0, pace: 0, clarity: 0 });
  const windowsRef = useRef<number[]>([]);
  const prevCountRef = useRef(0);
  const prevTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isListening || startedAt === null) {
      windowsRef.current = []; prevCountRef.current = 0; prevTimeRef.current = null; return;
    }
    const id = setInterval(() => {
      const now = Date.now();
      const words = transcript.trim().split(/\s+/).filter(Boolean);
      const total = words.length;
      const elapsed = Math.max(1, (now - startedAt) / 1000);
      const wpm = (total / elapsed) * 60;
      const pace = Math.min(100, Math.round((wpm / 160) * 100));

      if (!prevTimeRef.current) { prevTimeRef.current = now; prevCountRef.current = 0; }
      const winElapsed = (now - prevTimeRef.current) / 1000;
      if (winElapsed >= 5) {
        const winWpm = ((total - prevCountRef.current) / winElapsed) * 60;
        windowsRef.current = [...windowsRef.current.slice(-3), winWpm];
        prevTimeRef.current = now; prevCountRef.current = total;
      }
      let voice = 70;
      if (windowsRef.current.length >= 2) {
        const mean = windowsRef.current.reduce((a, b) => a + b, 0) / windowsRef.current.length;
        const std = Math.sqrt(windowsRef.current.reduce((s, w) => s + (w - mean) ** 2, 0) / windowsRef.current.length);
        voice = Math.max(0, Math.min(100, Math.round(100 - (std / 50) * 100)));
      }
      let clarity = 50;
      if (total > 2) {
        const avgLen = words.reduce((s, w) => s + w.replace(/[^a-zA-Z]/g, "").length, 0) / total;
        const lenScore = Math.max(0, 100 - Math.abs(avgLen - 5.5) * 18);
        const puncts = (transcript.match(/[.!?]/g) || []).length;
        const sents = transcript.split(/[.!?]+/).filter(s => s.trim().length > 2).length;
        clarity = Math.min(100, Math.round(lenScore * 0.65 + (sents > 0 ? Math.min(1, puncts / sents) : 0.5) * 100 * 0.35));
      }
      setMetrics({ voice, pace, clarity });
    }, 1000);
    return () => clearInterval(id);
  }, [transcript, isListening, startedAt]);
  return metrics;
}

// ─── Context ──────────────────────────────────────────────────────────────────
function getContext(): InterviewContext {
  try {
    const s = sessionStorage.getItem("ai_interview_context");
    if (s) return JSON.parse(s);
  } catch {}
  return {
    role: localStorage.getItem("jobRole") || "Software Engineer",
    jd: localStorage.getItem("jobDescription") || "Build scalable products with modern tech.",
    twin: { name: "David", role: "FAANG Engineer", difficulty: "Hard", style: "Surgical", speciality: "System Design" },
  };
}

// ─── Safe speak (fixes double-fire) ──────────────────────────────────────────
function safespeak(text: string, onStart?: () => void, onEnd?: () => void) {
  if (!("speechSynthesis" in window)) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  // Chrome bug workaround: delay after cancel
  setTimeout(() => {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.88; u.pitch = 1.0;
    u.onstart = () => onStart?.();
    u.onend = () => onEnd?.();
    u.onerror = () => onEnd?.();
    window.speechSynthesis.speak(u);
  }, 180);
}

// ─── Main Component ───────────────────────────────────────────────────────────
function Interview() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const recogRef = useRef<any>(null);
  const transcriptRef = useRef("");
  const isListeningRef = useRef(false);
  const hasStartedRef = useRef(false); // prevents double-fire in Strict Mode
  const submitRef = useRef<(a: string) => void>(() => {});
  const finalMetricsRef = useRef({ voice: 0, pace: 0, clarity: 0 });

  const [ctx] = useState<InterviewContext>(getContext);
  const [time, setTime] = useState(0);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [transcript, setTranscript] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [feedbackDisplay, setFeedbackDisplay] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);

  const { turns, currentQuestion, isEvaluating, isThinking, startInterview, submitAnswer } = useInterviewAI(ctx.role);
  const metrics = useRealBiometrics(transcript, isListening, startedAt);
  const complete = turns.length >= TOTAL_QUESTIONS;
  const twinName = ctx.twin?.name || "David";

  // ── Keep final metrics ref updated ─────────────────────────────────────────
  useEffect(() => { finalMetricsRef.current = metrics; }, [metrics]);

  // ── Save session to sessionStorage when complete ────────────────────────────
  useEffect(() => {
    if (!complete || turns.length === 0) return;
    const session = {
      context: { role: ctx.role, twin: ctx.twin },
      turns: turns.map(t => ({
        question: t.question, answer: t.answer, feedback: t.feedback,
        score: t.score, topic: t.topic, difficulty: t.difficulty,
        strengths: t.strengths || [], improvements: t.improvements || [],
        durationSeconds: t.durationSeconds || 60,
      })),
      metrics: finalMetricsRef.current,
      durationSeconds: time,
    };
    sessionStorage.setItem("ai_interview_session", JSON.stringify(session));
  }, [complete, turns, ctx, time]);

  // ── Start interview once on mount (Strict Mode safe) ─────────────────────
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    startInterview().then((firstQ) => {
      safespeak(firstQ, () => setIsAiSpeaking(true), () => setIsAiSpeaking(false));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Evaluate answer ─────────────────────────────────────────────────────────
  const evaluateAnswer = async (answer: string) => {
    if (!answer.trim() || complete) return;
    setStatusMsg("Analyzing your answer...");
    const result = await submitAnswer(answer);
    setTranscript(""); transcriptRef.current = "";
    if (result) {
      setQuestionIndex(q => q + 1);
      if (result.feedback) setFeedbackDisplay(result.feedback);
      const toSpeak = result.feedback
        ? `${result.feedback} Next question: ${result.nextQ}`
        : result.nextQ;
      setStatusMsg("Next question ready. Press mic when ready.");
      safespeak(toSpeak, () => setIsAiSpeaking(true), () => setIsAiSpeaking(false));
    }
  };

  useEffect(() => { submitRef.current = evaluateAnswer; });

  // ── Speech recognition setup ────────────────────────────────────────────────
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setStatusMsg("Speech recognition unavailable. Type your answer below."); return; }
    const r = new SR();
    r.continuous = true; r.interimResults = true; r.lang = "en-US";
    r.onresult = (e: any) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      transcriptRef.current = t.trim();
      setTranscript(t.trim());
      setStatusMsg("Listening… stop mic when done.");
    };
    r.onerror = () => { isListeningRef.current = false; setIsListening(false); setStartedAt(null); setStatusMsg("Mic error — try again or type below."); };
    r.onend = () => {
      isListeningRef.current = false; setIsListening(false); setStartedAt(null);
      const v = transcriptRef.current;
      if (v.trim().length > 5) { setStatusMsg("Auto-submitting…"); submitRef.current(v); }
      else setStatusMsg("No speech captured. Try again or type below.");
    };
    recogRef.current = r;
    return () => r.abort?.();
  }, []);

  // ── Camera setup ────────────────────────────────────────────────────────────
  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(s => {
      stream = s;
      if (videoRef.current) { videoRef.current.srcObject = s; setIsStreamActive(true); }
    }).catch(() => {});
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

  // ── Session timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Mic toggle ────────────────────────────────────────────────────────────
  const toggleMic = () => {
    window.speechSynthesis?.cancel();
    if (isListening) {
      recogRef.current?.stop();
      isListeningRef.current = false; setIsListening(false); setStartedAt(null);
      const v = transcriptRef.current;
      if (v.trim()) evaluateAnswer(v);
      return;
    }
    setTranscript(""); transcriptRef.current = "";
    setFeedbackDisplay(""); setStatusMsg("Listening…");
    try {
      recogRef.current?.start();
      isListeningRef.current = true; setIsListening(true); setStartedAt(Date.now());
    } catch { setStatusMsg("Could not start mic. Type your answer below."); }
  };

  const fmt = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-24">
      <Header title="Live Interview Session" sub="Your AI Twin asks structured professional questions and listens to your answers." />
      <div className="grid lg:grid-cols-[1fr_350px] gap-6 mt-8">

        {/* ── Main panel ── */}
        <BentoCard className="p-0 overflow-hidden flex flex-col bg-slate-50 border border-slate-200 shadow-xl">
          <div className="relative flex-1 min-h-[500px] bg-slate-950 overflow-hidden rounded-t-[23px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(108,99,255,0.22),transparent_34%),linear-gradient(135deg,#020617,#111827_55%,#0f172a)]" />
            <div className="absolute inset-0 grid place-items-center">
              <AIAvatar isListening={isListening} isThinking={isThinking || isEvaluating} isSpeaking={isAiSpeaking} />
            </div>
            <video ref={videoRef} autoPlay playsInline muted
              className={`absolute bottom-6 right-6 h-48 w-36 rounded-2xl object-cover shadow-2xl border-2 border-white/10 transition-opacity ${isStreamActive ? "opacity-100" : "opacity-0"}`} />
            <div className="absolute top-6 left-6 right-6 flex justify-between gap-3">
              <div className="flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-md px-4 py-2 text-xs font-semibold text-white border border-white/10">
                <span className="h-2 w-2 rounded-full bg-[#EF4444] animate-pulse" /> REC — TWIN: {twinName.toUpperCase()}
              </div>
              <div className="rounded-full bg-black/40 backdrop-blur-md px-4 py-2 text-xs font-semibold text-white border border-white/10">
                {fmt(Math.floor(time / 60))}:{fmt(time % 60)}
              </div>
            </div>
            <div className="absolute bottom-6 left-6 right-48 max-w-2xl rounded-2xl bg-black/45 backdrop-blur-md p-6 border border-white/10 shadow-lg">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#93C5FD] mb-3">
                <span>Question {Math.min(questionIndex + 1, TOTAL_QUESTIONS)} of {TOTAL_QUESTIONS}</span>
                <span className="rounded-full bg-white/10 px-2 py-1 text-white/80">{currentQuestion.topic}</span>
                <span className="rounded-full bg-white/10 px-2 py-1 text-white/80">{currentQuestion.difficulty}</span>
              </div>
              <div className="text-xl font-medium text-white leading-snug">
                {isThinking ? "Generating next question…" : currentQuestion.question}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="min-h-24 bg-white px-8 py-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 rounded-b-[23px]">
            <div className="flex items-center gap-4">
              <button onClick={toggleMic} disabled={isThinking || isEvaluating || complete}
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${isListening ? "bg-[#EF4444] text-white shadow-lg shadow-[#EF4444]/30" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {isListening ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              <button className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                <Video className="h-5 w-5" />
              </button>
              <button onClick={() => {
                if (isAiSpeaking) { window.speechSynthesis.cancel(); setIsAiSpeaking(false); }
                else safespeak(currentQuestion.question, () => setIsAiSpeaking(true), () => setIsAiSpeaking(false));
              }} className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${isAiSpeaking ? "bg-[#EF4444] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {isAiSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <span className="text-sm font-medium text-slate-500">
                {isListening ? "Listening…" : isAiSpeaking ? "AI speaking — 🔇 to stop" : isEvaluating ? "Analyzing…" : complete ? "Session complete!" : "Press mic to answer"}
              </span>
            </div>
            {complete
              ? <Link to="/report" className="flex items-center gap-2 rounded-full bg-[#10B981] px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#059669] transition-colors">View Coaching Report <ArrowRight className="h-4 w-4" /></Link>
              : <button disabled className="rounded-full bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-400">Auto Submit Active</button>}
          </div>
        </BentoCard>

        {/* ── Sidebar ── */}
        <div className="flex flex-col gap-6">
          <BentoCard className="bg-white/80">
            <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2"><Radio className="h-4 w-4 text-[#6C63FF]" /> Live Biometrics</h3>
            <div className="space-y-5">
              <MetricRow label="Voice Stability" value={metrics.voice} color="bg-[#6C63FF]" />
              <MetricRow label="Speaking Pace" value={metrics.pace} color="bg-[#3B82F6]" />
              <MetricRow label="Clarity Index" value={metrics.clarity} color="bg-[#10B981]" />
            </div>
          </BentoCard>

          <BentoCard className="bg-white/80 flex flex-col">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center justify-between">
              Live Transcript {isListening && <span className="h-2 w-2 rounded-full bg-[#EF4444] animate-pulse" />}
            </h3>
            <div className="min-h-[120px] rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm text-slate-600 leading-relaxed">
              {transcript || <span className="text-slate-400 italic">Click the microphone to start speaking…</span>}
            </div>
            <textarea value={transcript} onChange={e => { setTranscript(e.target.value); transcriptRef.current = e.target.value; }}
              placeholder="Or type your answer here…"
              className="mt-3 min-h-24 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#6C63FF] focus:outline-none focus:ring-1 focus:ring-[#6C63FF]" />
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{statusMsg || "Your spoken words appear here live."}</span>
              <button onClick={() => { setTranscript(""); transcriptRef.current = ""; }} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 hover:bg-slate-200">
                <RotateCcw className="h-3 w-3" /> Clear
              </button>
            </div>
            {feedbackDisplay && (
              <div className="mt-3 rounded-lg border border-[#10B981]/20 bg-[#10B981]/10 p-3 text-sm text-slate-700">
                <span className="font-bold text-[#047857]">AI Interviewer: </span>{feedbackDisplay}
              </div>
            )}
          </BentoCard>

          <BentoCard className="bg-white/80">
            <h3 className="font-semibold text-slate-900 mb-4">Session Tracker</h3>
            <div className="space-y-2">
              {Array.from({ length: TOTAL_QUESTIONS }, (_, i) => {
                const turn = turns[i];
                const isLive = i === turns.length && !complete;
                return (
                  <div key={i} className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">Q{i + 1} — {i === 0 ? "Aptitude" : i < 4 ? "Technical" : "Future/Behavioural"}</span>
                      <span className={`text-xs font-bold ${turn ? "text-[#10B981]" : isLive ? "text-[#6C63FF]" : "text-slate-400"}`}>
                        {turn ? `${turn.score}/10` : isLive ? "● Live" : "Pending"}
                      </span>
                    </div>
                    {turn?.feedback && <p className="mt-1 text-xs text-slate-500 italic border-t border-slate-100 pt-1">{turn.feedback}</p>}
                  </div>
                );
              })}
            </div>
          </BentoCard>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm font-semibold mb-1.5">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-900">{Math.round(value)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <motion.div animate={{ width: `${value}%` }} transition={{ duration: 0.5 }} className={`h-full rounded-full ${color}`} />
      </div>
    </div>
  );
}
