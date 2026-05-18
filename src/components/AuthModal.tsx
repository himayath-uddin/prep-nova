import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, Chrome, Loader2, AlertCircle } from "lucide-react";
import { loginWithEmail, loginWithGoogle, registerWithEmail } from "@/lib/localAuth";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ open, onClose, onSuccess }: Props) {
  const [mode, setMode]       = useState<"login" | "register">("login");
  const [email, setEmail]     = useState("");
  const [password, setPass]   = useState("");
  const [name, setName]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const clearError = () => setError("");

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    clearError();
    try {
      if (mode === "login") {
        loginWithEmail(email, password);
      } else {
        if (!name.trim()) { setError("Please enter your full name."); setLoading(false); return; }
        registerWithEmail(email, password, name);
      }
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    clearError();
    try {
      loginWithGoogle(name || "Google User");
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" />

          <motion.div key="modal" initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl pointer-events-auto" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>

              <button onClick={onClose}
                className="absolute top-5 right-5 h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                <X className="h-4 w-4" />
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900">
                  {mode === "login" ? "Welcome back" : "Create your account"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {mode === "login" ? "Sign in to continue your interview prep." : "Join Promptal AI to track your progress."}
                </p>
              </div>

              {/* Google Button */}
              <button onClick={handleGoogle} disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50">
                <Chrome className="h-4 w-4 text-[#4285F4]" />
                Continue with Google
              </button>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-xs font-medium text-slate-400">or continue with email</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              {error && (
                <div className="mb-5 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />{error}
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {mode === "register" && (
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all" />
                  </div>
                )}
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={e => setPass(e.target.value)}
                    required minLength={6}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all" />
                </div>
                <button type="submit" disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60 transition-all">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "login" ? "Sign in" : "Create account"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button onClick={() => { setMode(mode === "login" ? "register" : "login"); clearError(); }}
                  className="font-semibold text-slate-900 hover:underline">
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>

              <p className="mt-4 text-center text-xs text-slate-400">
                ✓ No Firebase required — your account is stored locally
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
