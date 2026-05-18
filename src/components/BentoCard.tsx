import type { ReactNode } from "react";

export function BentoCard({
  children,
  className = "",
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`relative rounded-3xl bg-white premium-border bento-shadow transition-all duration-500 hover:-translate-y-1 hover:bento-shadow-hover p-8 ${
        glow ? "ring-1 ring-black/5" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
