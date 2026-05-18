import React from "react";
import { Bot, Mic, Cpu } from "lucide-react";

type AIAvatarProps = {
  isSpeaking: boolean;
  isThinking: boolean;
  isListening: boolean;
};

export const AIAvatar: React.FC<AIAvatarProps> = ({ isSpeaking, isThinking, isListening }) => {
  // Determine state for styling
  const stateColor = isSpeaking
    ? "text-green-400"
    : isThinking
    ? "text-blue-400"
    : isListening
    ? "text-purple-400"
    : "text-slate-400";

  const glowColor = isSpeaking
    ? "shadow-green-500/40"
    : isThinking
    ? "shadow-blue-500/40"
    : isListening
    ? "shadow-purple-500/40"
    : "shadow-slate-500/20";

  const statusText = isSpeaking
    ? "Speaking..."
    : isThinking
    ? "Analyzing..."
    : isListening
    ? "Listening..."
    : "Idle";

  return (
    <div className="relative w-full h-full min-h-[300px] flex flex-col items-center justify-center p-8">
      {/* 3D Floating Panel Container */}
      <div 
        className="relative group perspective-[1000px]"
        style={{ perspective: "1000px" }}
      >
        <div 
          className={`relative w-48 h-48 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/10 flex items-center justify-center transition-all duration-700 shadow-2xl ${glowColor} ${isThinking ? 'animate-pulse' : ''} ${isSpeaking ? 'scale-105' : 'scale-100'}`}
          style={{
            transform: isSpeaking ? "rotateX(5deg) rotateY(-5deg)" : "rotateX(0deg) rotateY(0deg)",
            transformStyle: "preserve-3d"
          }}
        >
          {/* Inner Glow / Avatar */}
          <div 
            className={`absolute inset-0 rounded-3xl opacity-20 bg-gradient-to-tr from-transparent via-white to-transparent transition-opacity ${isSpeaking ? 'opacity-40' : ''}`} 
            style={{ transform: "translateZ(20px)" }}
          />
          
          <div className="flex flex-col items-center gap-4" style={{ transform: "translateZ(40px)" }}>
            <Bot className={`w-20 h-20 transition-colors duration-500 ${stateColor} ${isSpeaking ? 'animate-bounce' : ''}`} />
          </div>
        </div>

        {/* Status Indicator */}
        <div className="mt-8 flex items-center justify-center gap-2" style={{ transform: "translateZ(10px)" }}>
          {isSpeaking && <div className="flex gap-1">
            <span className="w-1.5 h-4 bg-green-400 rounded-full animate-ping" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-6 bg-green-400 rounded-full animate-ping" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-4 bg-green-400 rounded-full animate-ping" style={{ animationDelay: "300ms" }} />
          </div>}
          
          {isListening && <Mic className="w-5 h-5 text-purple-400 animate-pulse" />}
          {isThinking && <Cpu className="w-5 h-5 text-blue-400 animate-spin" />}
          
          <span className={`font-mono text-sm tracking-widest uppercase transition-colors ${stateColor}`}>
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
};
