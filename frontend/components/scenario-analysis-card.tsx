"use client";

import { useState } from "react";
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  HelpCircle,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClarifyingQuestion {
  question: string;
  why_needed: string;
  options?: string[] | null;
}

export interface ScenarioAnalysis {
  scenario_type: string;
  user_position_assessment: string;
  key_legal_concepts: string[];
  options: string[];
  risks_of_each_option: string[];
  recommended_next_steps: string[];
  clarifying_questions?: ClarifyingQuestion[];
  disclaimer: string;
}

interface ScenarioAnalysisCardProps {
  scenarioAnalysis: ScenarioAnalysis;
  timestamp: Date;
  onAnswerQuestion?: (question: string, answer: string) => void;
}

export function ScenarioAnalysisCard({
  scenarioAnalysis,
  timestamp,
  onAnswerQuestion,
}: ScenarioAnalysisCardProps) {
  const [showConcepts, setShowConcepts] = useState(false);
  const [answeredQ, setAnsweredQ] = useState<Record<number, string>>({});

  const handleAnswer = (i: number, question: string, answer: string) => {
    setAnsweredQ((prev) => ({ ...prev, [i]: answer }));
    onAnswerQuestion?.(question, answer);
  };

  // Detect position strength from assessment text
  const isStrong = scenarioAnalysis.user_position_assessment
    .toLowerCase()
    .includes("strong");
  const isWeak =
    scenarioAnalysis.user_position_assessment.toLowerCase().includes("weak") ||
    scenarioAnalysis.user_position_assessment
      .toLowerCase()
      .includes("difficult");

  const positionColor = isStrong
    ? "text-green-400 border-green-500/30 bg-green-500/10"
    : isWeak
      ? "text-red-400 border-red-500/30 bg-red-500/10"
      : "text-orange-400 border-orange-500/30 bg-orange-500/10";

  return (
    <div className="w-full max-w-[88%] space-y-3 animate-slide-in-up">
      {/* Header */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-6 w-6 text-primary flex-shrink-0" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Scenario Analysis
            </p>
            <p className="text-lg font-bold text-foreground">
              {scenarioAnalysis.scenario_type}
            </p>
          </div>
        </div>

        {/* Position assessment */}
        <div className={cn("rounded-xl border p-3", positionColor)}>
          <div className="flex items-center gap-2 mb-1">
            <Scale className="h-3.5 w-3.5 flex-shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-wider">
              Your Position
            </p>
          </div>
          <p className="text-xs leading-relaxed">
            {scenarioAnalysis.user_position_assessment}
          </p>
        </div>

        {/* Key legal concepts */}
        {scenarioAnalysis.key_legal_concepts.length > 0 && (
          <div>
            <button
              onClick={() => setShowConcepts(!showConcepts)}
              className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConcepts ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              Key Legal Concepts ({scenarioAnalysis.key_legal_concepts.length})
            </button>
            {showConcepts && (
              <div className="flex flex-wrap gap-2 mt-2">
                {scenarioAnalysis.key_legal_concepts.map((c, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs bg-primary/10 text-primary/80 border border-primary/20"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Options + risks */}
      {scenarioAnalysis.options.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card/30 p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Your Options
          </p>
          <div className="space-y-2">
            {scenarioAnalysis.options.map((opt, i) => (
              <div
                key={i}
                className="rounded-lg border border-border/40 bg-background/40 p-3 space-y-1.5"
              >
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs font-medium text-foreground leading-relaxed">
                    {opt}
                  </p>
                </div>
                {scenarioAnalysis.risks_of_each_option[i] && (
                  <div className="flex items-start gap-2 pl-7">
                    <AlertTriangle className="h-3 w-3 text-orange-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {scenarioAnalysis.risks_of_each_option[i]}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next steps */}
      {scenarioAnalysis.recommended_next_steps.length > 0 && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
            <p className="text-xs font-semibold text-green-400 uppercase tracking-wider">
              Recommended Next Steps
            </p>
          </div>
          <ol className="space-y-2">
            {scenarioAnalysis.recommended_next_steps.map((step, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-xs text-foreground/80 leading-relaxed"
              >
                <ArrowRight className="h-3.5 w-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Clarifying questions */}
      {scenarioAnalysis.clarifying_questions &&
        scenarioAnalysis.clarifying_questions.length > 0 && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                To sharpen this analysis:
              </p>
            </div>
            <div className="space-y-3">
              {scenarioAnalysis.clarifying_questions.map((q, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border/50 bg-background/40 p-3 space-y-2"
                >
                  <p className="text-xs font-medium text-foreground">
                    {q.question}
                  </p>
                  <p className="text-[10px] text-muted-foreground italic">
                    {q.why_needed}
                  </p>
                  {answeredQ[i] ? (
                    <div className="flex items-center gap-2 text-xs text-green-400">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Answered: {answeredQ[i]}</span>
                    </div>
                  ) : q.options && q.options.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {q.options.map((opt, j) => (
                        <button
                          key={j}
                          onClick={() => handleAnswer(i, q.question, opt)}
                          className="px-3 py-1 rounded-lg text-xs border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Type your answer..."
                      className="w-full text-xs bg-background/60 border border-border/50 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary/50"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          handleAnswer(
                            i,
                            q.question,
                            e.currentTarget.value.trim(),
                          );
                        }
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Disclaimer */}
      <div className="px-1">
        <p className="text-[10px] text-muted-foreground/60 italic">
          {scenarioAnalysis.disclaimer}
        </p>
      </div>

      <p className="text-xs text-muted-foreground/60 px-1">
        {timestamp.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
}
