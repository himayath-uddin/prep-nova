import { useState, useCallback, useRef } from "react";
import { generateInterviewQuestion, getAIFeedback } from "@/services/featherlessAPI";

export type QuestionState = {
  question: string;
  topic: string;
  difficulty: string;
};

export type InterviewTurn = QuestionState & {
  answer: string;
  feedback: string;
  score: number;
  strengths: string[];
  improvements: string[];
  durationSeconds: number;
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

  // Use refs so closures never go stale
  const askedQuestionsRef = useRef<string[]>([]);
  const currentQuestionRef = useRef<QuestionState>(currentQuestion);
  const questionStartTimeRef = useRef<number>(Date.now());

  const resumeText = () => localStorage.getItem("resumeText") ?? "";

  // ── Fetch next unique question with questionIndex ───────────────────────────
  const fetchQuestion = useCallback(async (questionIndex: number): Promise<QuestionState> => {
    setIsThinking(true);
    try {
      const result = await generateInterviewQuestion(
        resumeText(),
        contextRole,
        askedQuestionsRef.current,
        questionIndex
      );
      return {
        question: result.question,
        topic: result.topic ?? "Technical",
        difficulty: result.difficulty ?? "Medium",
      };
    } catch (err) {
      console.error("generateInterviewQuestion failed:", err);
      const fallbacks: QuestionState[] = [
        { question: "Walk me through how you approach learning something completely new under a tight deadline.", difficulty: "Easy", topic: "Aptitude" },
        { question: "Describe a specific technical challenge from your most recent project.", difficulty: "Medium", topic: "Technical" },
        { question: "Tell me about the most complex system you've designed or contributed to.", difficulty: "Hard", topic: "System Design" },
        { question: "How do you handle disagreements with senior teammates about technical decisions?", difficulty: "Medium", topic: "Collaboration" },
        { question: "Where do you see yourself growing in this role over the next two years?", difficulty: "Easy", topic: "Career" },
        { question: "Describe a time you had to deliver under pressure. What was the outcome?", difficulty: "Medium", topic: "Behavioural" },
      ];
      return fallbacks[Math.min(questionIndex, fallbacks.length - 1)];
    } finally {
      setIsThinking(false);
    }
  }, [contextRole]);

  // ── Start a fresh interview ─────────────────────────────────────────────────
  const startInterview = useCallback(async (): Promise<string> => {
    askedQuestionsRef.current = [];
    setTurns([]);
    setIsEvaluating(true);

    const q = await fetchQuestion(0);
    askedQuestionsRef.current = [q.question];

    currentQuestionRef.current = q;
    setCurrentQuestion(q);
    questionStartTimeRef.current = Date.now();
    setIsEvaluating(false);
    return q.question;
  }, [fetchQuestion]);

  // ── Submit answer → get feedback → fetch next question ────────────────────
  const submitAnswer = useCallback(async (answer: string): Promise<SubmitResult> => {
    if (!answer.trim()) return null;
    setIsEvaluating(true);

    const durationSeconds = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
    const question = currentQuestionRef.current;
    const nextIndex = askedQuestionsRef.current.length; // this is how many have been asked so far

    // Get AI feedback for this answer
    let feedbackText = "Thanks for sharing. Let's keep going.";
    let score = 5;
    let strengths: string[] = [];
    let improvements: string[] = [];

    try {
      const fb = await getAIFeedback(question.question, answer);
      feedbackText = fb.feedback;
      score = fb.score;
      strengths = fb.strengths ?? [];
      improvements = fb.improvements ?? [];
    } catch (err) {
      console.error("getAIFeedback failed:", err);
    }

    // Record this turn
    const newTurn: InterviewTurn = {
      ...question,
      answer,
      feedback: feedbackText,
      score,
      strengths,
      improvements,
      durationSeconds,
    };
    setTurns((prev) => [...prev, newTurn]);

    // Fetch next unique question (pass nextIndex which is now the new questionIndex)
    const nextQ = await fetchQuestion(nextIndex);
    askedQuestionsRef.current = [...askedQuestionsRef.current, nextQ.question];

    currentQuestionRef.current = nextQ;
    setCurrentQuestion(nextQ);
    questionStartTimeRef.current = Date.now();
    setIsEvaluating(false);

    return { nextQ: nextQ.question, feedback: feedbackText };
  }, [fetchQuestion]);

  return {
    turns,
    currentQuestion,
    isEvaluating,
    isThinking,
    startInterview,
    submitAnswer,
  };
}
