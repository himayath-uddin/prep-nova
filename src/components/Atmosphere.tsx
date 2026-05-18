import { useEffect, useRef } from "react";

/**
 * Premium Light-Theme Atmosphere:
 * Slowly animated soft gradient orbs behind a clean dot grid.
 * Industry-standard aesthetic used by Linear, Resend, Stripe.
 */
export function Atmosphere() {
  const blob1 = useRef<HTMLDivElement>(null);
  const blob2 = useRef<HTMLDivElement>(null);
  const blob3 = useRef<HTMLDivElement>(null);

  // Subtle parallax on mouse move
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      if (blob1.current) {
        blob1.current.style.transform = `translate(${x * 18}px, ${y * 12}px)`;
      }
      if (blob2.current) {
        blob2.current.style.transform = `translate(${-x * 14}px, ${-y * 10}px)`;
      }
      if (blob3.current) {
        blob3.current.style.transform = `translate(${x * 10}px, ${-y * 8}px)`;
      }
    };
    window.addEventListener("mousemove", handler, { passive: true });
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Base white background */}
      <div className="absolute inset-0 bg-white" />

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.20) 1.2px, transparent 1.2px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Animated gradient orb — top left (indigo/violet) */}
      <div
        ref={blob1}
        className="absolute -top-60 -left-60 h-[800px] w-[800px] rounded-full"
        style={{
          background: "radial-gradient(circle at center, rgba(99,102,241,0.25) 0%, rgba(168,85,247,0.15) 45%, transparent 70%)",
          filter: "blur(50px)",
          transition: "transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)",
          animation: "blobFloat1 12s ease-in-out infinite",
        }}
      />

      {/* Animated gradient orb — bottom right (sky/cyan) */}
      <div
        ref={blob2}
        className="absolute -bottom-60 -right-60 h-[900px] w-[900px] rounded-full"
        style={{
          background: "radial-gradient(circle at center, rgba(56,189,248,0.22) 0%, rgba(99,102,241,0.12) 45%, transparent 70%)",
          filter: "blur(60px)",
          transition: "transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)",
          animation: "blobFloat2 16s ease-in-out infinite",
        }}
      />

      {/* Animated gradient orb — center right (rose/pink) */}
      <div
        ref={blob3}
        className="absolute top-1/3 -right-60 h-[500px] w-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle at center, rgba(244,114,182,0.10) 0%, rgba(168,85,247,0.06) 50%, transparent 75%)",
          filter: "blur(60px)",
          transition: "transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)",
          animation: "blobFloat3 20s ease-in-out infinite",
        }}
      />

      {/* Soft top glow — elegant violet beam from top center */}
      <div
        className="absolute -top-px left-1/2 -translate-x-1/2 w-[800px] h-[300px]"
        style={{
          background: "radial-gradient(ellipse at top, rgba(99,102,241,0.12) 0%, transparent 65%)",
        }}
      />

      {/* Fade bottom so page content doesn't look cut off */}
      <div
        className="absolute bottom-0 inset-x-0 h-32"
        style={{
          background: "linear-gradient(to top, rgba(255,255,255,0.9), transparent)",
        }}
      />

      <style>{`
        @keyframes blobFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(40px, -30px) scale(1.05); }
          66%       { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes blobFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(-30px, 40px) scale(1.08); }
          66%       { transform: translate(30px, -20px) scale(0.96); }
        }
        @keyframes blobFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(-40px, -30px) scale(1.04); }
        }
      `}</style>
    </div>
  );
}
