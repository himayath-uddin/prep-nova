import { useState, useCallback, useRef } from "react";
import { computeScore } from "@/services/gemini";
import { generateInterviewQuestion, getAIFeedback } from "@/services/featherlessAPI";

export type QuestionState = {
  question: string;
  topic?: string;
  difficulty?: string;
};

export type InterviewTurn = QuestionState & {
  answer: string;
  feedback?: string;
  score: number;
};

export type SubmitResult = {
  nextQ: string;
  feedback: string;
} | null;

export function useInterviewAI(contextRole: string) {
  const [turns, setTurns] = useState<InterviewTurn[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionState>({
    question: "Calibrating your personalized interview...",
    topic: "Introduction",
    difficulty: "Easy",
  });
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [aiFeedback, setAiFeedback] = useState("");

  // Use a ref so we never have stale closures on askedQuestions
  const askedQuestionsRef = useRef<string[]>([]);

  const resumeText = () => localStorage.getItem("resumeText") ?? "";

  // ── Fetch next unique question ──────────────────────────────────────────────
  const fetchQuestion = useCallback(async (): Promise<QuestionState> => {
    setIsThinking(true);
    try {
      const result = await generateInterviewQuestion(
        resumeText(),
        contextRole,
        askedQuestionsRef.current
      );
      return {
        question: result.question,
        topic: result.topic ?? "Technical",
        difficulty: result.difficulty ?? "Medium",
      };
    } catch (err) {
      console.error("generateInterviewQuestion failed:", err);
      return {
        question: "Describe a challenging project you worked on and what you learned.",
        difficulty: "Medium",
        topic: "General",
      };
    } finally {
      setIsThinking(false);
    }
  }, [contextRole]);

  // ── Start a fresh interview ─────────────────────────────────────────────────
  const startInterview = useCallback(async (): Promise<string> => {
    askedQuestionsRef.current = [];
    setTurns([]);
    setAiFeedback("");
    setIsEvaluating(true);

    const q = await fetchQuestion();
    askedQuestionsRef.current = [q.question];

    setCurrentQuestion(q);
    setIsEvaluating(false);
    return q.question;
  }, [fetchQuestion]);

  // ── Submit answer, get feedback, fetch next question ───────────────────────
  const submitAnswer = useCallback(async (answer: string): Promise<SubmitResult> => {
    if (!answer.trim()) return null;
    setIsEvaluating(true);

    // Get AI feedback for this answer
    let feedbackText = "Thanks for sharing. Let's keep going.";
    let score = computeScore(answer);
    try {
      const fb = await getAIFeedback(currentQuestion.question, answer);
      feedbackText = fb.feedback;
      score = fb.score;
    } catch (err) {
      console.error("getAIFeedback failed:", err);
    }

    setAiFeedback(feedbackText);

    // Record this turn
    const newTurn: InterviewTurn = {
      ...currentQuestion,
      answer,
      feedback: feedbackText,
      score,
    };
    setTurns((prev) => [...prev, newTurn]);

    // Fetch next unique question
    const nextQ = await fetchQuestion();
    askedQuestionsRef.current = [...askedQuestionsRef.current, nextQ.question];
    setCurrentQuestion(nextQ);

    setIsEvaluating(false);
    return { nextQ: nextQ.question, feedback: feedbackText };
  }, [currentQuestion, fetchQuestion]);

  return {
    turns,
    currentQuestion,
    isEvaluating,
    isThinking,
    aiFeedback,
    startInterview,
    submitAnswer,
  };
}
