import { useEffect, useState } from "react";

export function CircleScore({
  value,
  label,
  color = "brand-primary",
  size = 140,
}: {
  value: number;
  label: string;
  color?: string;
  size?: number;
}) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setV(value), 80);
    return () => clearTimeout(t);
  }, [value]);
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const dash = c * (v / 100);
  
  // Map color to tailwind colors or hex
  const colorMap: Record<string, string> = {
    "brand-primary": "#6C63FF",
    "brand-secondary": "#A855F7",
    "brand-accent": "#3B82F6",
    "success": "#10B981",
    "danger": "#EF4444",
  };
  const strokeColor = colorMap[color] || "#6C63FF";

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#E2E8F0"
          strokeWidth={8}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={strokeColor}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          fill="none"
          style={{
            transition: "stroke-dasharray 1.2s ease-out",
          }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display text-3xl font-bold text-slate-900">{Math.round(v)}%</div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}
