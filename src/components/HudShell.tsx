import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, Cpu, ChevronDown, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/firebase";
import { AuthModal } from "./AuthModal";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/upload", label: "Upload" },
  { to: "/dashboard", label: "Analysis" },
  { to: "/twin", label: "Interview Twin" },
  { to: "/interview", label: "Live Session" },
  { to: "/report", label: "Replay" },
  { to: "/timemachine", label: "Career Roadmap" },
] as const;

export function HudShell({ children }: { children: React.ReactNode }) {
  const path       = useRouterState({ select: (s) => s.location.pathname });
  const { user }   = useAuth();
  const [authOpen, setAuthOpen]   = useState(false);
  const [dropOpen, setDropOpen]   = useState(false);

  const firstName = user?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "";

  return (
    <div className="relative min-h-screen">
      {/* Floating Pill Navbar */}
      <header className="fixed top-6 left-0 right-0 z-50 px-6 pointer-events-none">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between rounded-full bg-white/80 backdrop-blur-2xl px-4 pointer-events-auto transition-all" style={{ border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 px-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-slate-900 text-white">
              <Cpu className="h-4 w-4" />
            </div>
            <span className="font-display text-sm font-bold text-slate-900 tracking-tight">
              Promptal AI
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {NAV.map((n) => {
              const active = path === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            <button className="relative flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              <Bell className="h-4 w-4" />
            </button>

            {user ? (
              /* Logged-in avatar dropdown */
              <div className="relative">
                <button
                  onClick={() => setDropOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full bg-slate-100 pl-2 pr-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-200 transition-colors"
                >
                  <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                    {firstName[0]?.toUpperCase() ?? "U"}
                  </div>
                  {firstName}
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>

                {dropOpen && (
                  <div className="absolute right-0 top-12 w-52 rounded-2xl bg-white p-1.5 shadow-xl" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                    <div className="px-3 py-2 text-xs text-slate-400 font-medium truncate">{user.email}</div>
                    <div className="h-px bg-slate-100 my-1" />
                    <Link
                      to="/upload"
                      onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2 w-full rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <UserIcon className="h-4 w-4 text-slate-400" /> My Profile
                    </Link>
                    <button
                      onClick={() => { logout(); setDropOpen(false); }}
                      className="flex items-center gap-2 w-full rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Sign-in button */
              <button
                id="auth-open-btn"
                onClick={() => setAuthOpen(true)}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 transition-all"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="pb-24 pt-32">{children}</main>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => setAuthOpen(false)}
      />
    </div>
  );
}
