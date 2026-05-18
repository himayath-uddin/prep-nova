import { useEffect, useState } from "react";

export function Typewriter({
  text,
  speed = 28,
  className = "",
  onDone,
}: {
  text: string;
  speed?: number;
  className?: string;
  onDone?: () => void;
}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
  }, [text]);
  useEffect(() => {
    if (n >= text.length) {
      onDone?.();
      return;
    }
    const t = setTimeout(() => setN(n + 1), speed);
    return () => clearTimeout(t);
  }, [n, text, speed, onDone]);
  return (
    <span className={className}>
      {text.slice(0, n)}
      <span className="inline-block w-[2px] h-[1em] -mb-1 bg-cyan-glow animate-caret ml-0.5" />
    </span>
  );
}
