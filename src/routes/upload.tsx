import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, Briefcase, Target,
  ArrowRight, CheckCircle2,
} from "lucide-react";
import { BentoCard } from "@/components/BentoCard";

export const Route = createFileRoute("/upload")({
  component: UploadPage,
  head: () => ({
    meta: [
      { title: "Upload · Promptal AI" },
      { name: "description", content: "Upload your resume and job description." },
    ],
  }),
});

// ─── PDF text extraction using FileReader ─────────────────────────────────────

async function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      // For PDF/DOCX we read as text — this captures embedded text
      // For a proper PDF parse we'd need pdf.js, but we stay dependency-free.
      const raw = reader.result as string;
      // Strip binary noise, keep printable ASCII
      const text = raw.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s{3,}/g, " ").trim();
      resolve(text.length > 20 ? text : `[Resume: ${file.name}]`);
    };
    reader.onerror = () => resolve(`[Resume: ${file.name}]`);
    reader.readAsText(file, "utf-8");
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

function UploadPage() {
  const navigate = useNavigate();

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [role, setRole] = useState("");

  // Restore from localStorage on mount
  useEffect(() => {
    console.log("Featherless Key Length:", import.meta.env.VITE_FEATHERLESS_KEY?.length || 0);
    const savedResume = localStorage.getItem("resumeText") ?? "";
    const savedJD = localStorage.getItem("jobDescription") ?? "";
    const savedRole = localStorage.getItem("jobRole") ?? "";
    if (savedResume) setResumeText(savedResume);
    if (savedJD) setJdText(savedJD);
    if (savedRole) setRole(savedRole);
  }, []);

  // Save JD to localStorage whenever it changes
  const handleJdChange = (value: string) => {
    setJdText(value);
    localStorage.setItem("jobDescription", value);
  };

  // Save role to localStorage whenever it changes
  const handleRoleChange = (value: string) => {
    setRole(value);
    localStorage.setItem("jobRole", value);
  };

  // Handle file upload and extract text
  const handleFileSelect = async (file: File) => {
    setResumeFile(file);
    const text = await extractTextFromFile(file);
    setResumeText(text);
    localStorage.setItem("resumeText", text);
  };

  const ready =
    resumeText.trim().length > 5 &&
    jdText.trim().length > 10 &&
    role.trim().length > 1;

  const handleAnalyze = () => {
    if (!ready) return;
    // All data already persisted in localStorage; just navigate
    navigate({ to: "/dashboard" });
  };

  const handleClear = () => {
    localStorage.removeItem("resumeText");
    localStorage.removeItem("jobDescription");
    localStorage.removeItem("jobRole");
    setResumeFile(null);
    setResumeText("");
    setJdText("");
    setRole("");
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-24">
      <div className="flex items-start justify-between mb-8">
        <Header title="Profile Setup" sub="Provide your resume and job details to personalize the AI Twin." />
        <button
          onClick={handleClear}
          className="px-4 py-2 text-sm font-semibold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 hover:text-slate-700 transition-colors"
        >
          Clear Data
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key="form"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="grid lg:grid-cols-4 gap-6"
        >
          {/* Card 1: Resume upload */}
          <DropTile
            icon={FileText}
            label="Resume"
            hint="PDF or DOCX (Max 5MB)"
            done={resumeText.trim().length > 5}
            fileName={resumeFile?.name}
            onFileSelect={handleFileSelect}
            accept=".pdf,.docx,.doc"
            className="lg:col-span-1"
          />

          {/* Card 2: Job Description */}
          <BentoCard className="lg:col-span-1 flex flex-col">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#3B82F6]/10 text-[#3B82F6]">
                <Briefcase className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-slate-900">Job Description</h3>
            </div>
            <textarea
              value={jdText}
              onChange={(e) => handleJdChange(e.target.value)}
              placeholder="Paste the job description here..."
              className="mt-4 w-full flex-1 resize-none rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF] transition-all min-h-[140px]"
            />
          </BentoCard>

          {/* Card 3: Target Role */}
          <BentoCard className="lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#A855F7]/10 text-[#A855F7]">
                <Target className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-slate-900">Target Role</h3>
            </div>
            <input
              value={role}
              onChange={(e) => handleRoleChange(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              className="mt-4 w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF] transition-all"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {["FAANG SWE", "Product Designer", "AI Engineer"].map((p) => (
                <button
                  key={p}
                  onClick={() => handleRoleChange(p)}
                  className="text-xs font-medium text-slate-500 hover:text-[#6C63FF] bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:border-[#6C63FF]/30 hover:bg-[#6C63FF]/5 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </BentoCard>

          {/* Card 4: AI Scan Status + CTA */}
          <BentoCard className="lg:col-span-1 flex flex-col justify-between bg-gradient-to-br from-[#6C63FF]/5 to-transparent border-none">
            <div>
              <h3 className="font-semibold text-slate-900">AI Scan Status</h3>
              <div className="mt-4 space-y-3">
                <StatusRow label="Resume Uploaded" active={resumeText.trim().length > 5} />
                <StatusRow label="Job Description" active={jdText.trim().length > 10} />
                <StatusRow label="Role Defined" active={role.trim().length > 1} />
              </div>
            </div>
            <button
              disabled={!ready}
              onClick={handleAnalyze}
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-[#6C63FF] px-6 py-3.5 text-sm font-semibold text-white shadow-md disabled:opacity-50 disabled:shadow-none hover:bg-[#5a52d5] transition-colors"
            >
              Analyze Profile
              <ArrowRight className="h-4 w-4" />
            </button>
          </BentoCard>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusRow({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`grid h-5 w-5 place-items-center rounded-full ${active ? "bg-[#10B981]" : "bg-slate-200"}`}>
        <CheckCircle2 className={`h-3 w-3 ${active ? "text-white" : "text-slate-400"}`} />
      </div>
      <span className={active ? "text-slate-900 font-medium" : "text-slate-500"}>{label}</span>
    </div>
  );
}

function DropTile({
  icon: Icon,
  label,
  hint,
  done,
  fileName,
  onFileSelect,
  accept,
  className = "",
}: {
  icon: typeof Upload;
  label: string;
  hint: string;
  done: boolean;
  fileName?: string;
  onFileSelect: (file: File) => void;
  accept?: string;
  className?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
  };

  return (
    <BentoCard glow={done} className={className}>
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#6C63FF]/10 text-[#6C63FF]">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="font-semibold text-slate-900">{label}</h3>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
        }}
        accept={accept}
        className="hidden"
      />
      <button
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`mt-4 w-full h-[120px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
          done
            ? "border-[#10B981]/40 bg-[#10B981]/5"
            : "border-slate-300 hover:border-[#6C63FF]/40 hover:bg-[#6C63FF]/5 bg-slate-50"
        }`}
      >
        {done ? (
          <div className="flex flex-col items-center gap-2 text-[#10B981]">
            <CheckCircle2 className="h-6 w-6" />
            <span className="text-sm font-semibold">Uploaded</span>
            {fileName && (
              <span className="text-[10px] text-[#10B981]/70 truncate max-w-[120px]">{fileName}</span>
            )}
          </div>
        ) : (
          <>
            <Upload className="h-5 w-5 text-slate-400 mb-2" />
            <div className="text-sm font-medium text-slate-700">Drag &amp; Drop</div>
            <div className="text-xs text-slate-500 mt-1">{hint}</div>
          </>
        )}
      </button>
    </BentoCard>
  );
}

export function Header({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
      <p className="mt-2 text-slate-600 text-lg">{sub}</p>
    </div>
  );
}
