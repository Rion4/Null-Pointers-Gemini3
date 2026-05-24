"use client";

import { useState, useRef, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  RiskAnalysisCard,
  type RiskAnalysis,
} from "@/components/risk-analysis-card";
import client, {
  type ProgressEvent,
  type PartialResultEvent,
} from "@/lib/ruleguard";
import {
  ScenarioAnalysisCard,
  type ScenarioAnalysis,
} from "@/components/scenario-analysis-card";
import { DocumentContextBar } from "@/components/document-context-bar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Sparkles,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Paperclip,
  X,
  ChevronDown,
  Gavel,
  CircleDollarSign,
  ShieldCheck,
  Zap,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "warning" | "success" | "info" | "risk" | "scenario";
  files?: Array<{ name: string; size: number }>;
  riskAnalysis?: RiskAnalysis;
  scenarioAnalysis?: ScenarioAnalysis;
  personasUsed?: string[];
}

interface ActiveDocument {
  content: string;
  filename: string;
  charCount: number;
  pageCount?: number | null;
  uploadedAt: Date;
}

const PERSONAS = [
  { id: "auto", label: "Guardian (Auto)", icon: Sparkles },
  { id: "legal", label: "Legal Expert", icon: Gavel },
  { id: "financial", label: "Financial Expert", icon: CircleDollarSign },
  { id: "compliance", label: "Compliance Expert", icon: ShieldCheck },
  { id: "full", label: "Full Analysis", icon: Zap },
];

// ─── Markdown renderer ────────────────────────────────────────────────────────

function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="text-sm space-y-1 my-2 ml-3 list-disc list-outside">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="text-sm space-y-1 my-2 ml-3 list-decimal list-outside">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        h1: ({ children }) => (
          <h1 className="text-base font-bold mb-2 mt-3 first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-sm font-bold mb-1.5 mt-3 first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0">
            {children}
          </h3>
        ),
        code: ({ children }) => (
          <code className="text-xs bg-muted/60 px-1.5 py-0.5 rounded font-mono">
            {children}
          </code>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-muted-foreground italic">
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ─── Live progress indicator ──────────────────────────────────────────────────

const STAGE_CONFIG = {
  tools: {
    label: "Document Analysis",
    color: "text-blue-400",
    dot: "bg-blue-400",
  },
  experts: { label: "Expert Panel", color: "text-primary", dot: "bg-primary" },
  critic: {
    label: "Critic Validation",
    color: "text-orange-400",
    dot: "bg-orange-400",
  },
  consensus: {
    label: "Consensus Verdict",
    color: "text-green-400",
    dot: "bg-green-400",
  },
  strategy: {
    label: "Legal Strategy",
    color: "text-purple-400",
    dot: "bg-purple-400",
  },
};

function LiveProgressIndicator({
  events,
}: {
  events: (ProgressEvent | PartialResultEvent)[];
}) {
  const latestByStage = events.reduce<
    Record<string, ProgressEvent | PartialResultEvent>
  >((acc, e) => {
    acc[e.stage] = e;
    return acc;
  }, {});

  const hasStrategyEvents = events.some((e) => e.stage === "strategy");
  const stageOrder: Array<
    "tools" | "experts" | "critic" | "consensus" | "strategy"
  > = [
    "tools",
    "experts",
    "critic",
    "consensus",
    ...(hasStrategyEvents ? (["strategy"] as const) : []),
  ];
  const activeStage =
    [...events].reverse().find((e) => e.type === "progress")?.stage ?? "tools";

  return (
    <div className="flex gap-3 justify-start animate-slide-in-up">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center self-start mt-1">
        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
      </div>
      <div className="max-w-[85%] rounded-2xl px-4 py-3 glass-card bg-card space-y-3 min-w-[320px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span className="text-xs font-semibold text-primary">
            Guardian is analyzing
          </span>
        </div>

        {/* Stage pipeline */}
        <div className="space-y-2">
          {stageOrder.map((stage, i) => {
            const cfg = STAGE_CONFIG[stage];
            const stageEvents = events.filter((e) => e.stage === stage);
            const isDone = stageEvents.some((e) => e.type === "partial_result");
            const isActive = activeStage === stage && !isDone;
            const isPending = !isDone && !isActive;
            const latestMsg = [...stageEvents]
              .reverse()
              .find((e) => e.type === "progress")?.message;
            const latest = latestByStage[stage];
            const partialData =
              latest?.type === "partial_result" ? latest.data : undefined;

            return (
              <div
                key={stage}
                className={cn(
                  "flex items-start gap-2.5 transition-all duration-300",
                  isPending && "opacity-30",
                )}
              >
                {/* Status dot */}
                <div className="flex-shrink-0 mt-0.5">
                  {isDone ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                  ) : isActive ? (
                    <div
                      className={cn(
                        "h-3.5 w-3.5 rounded-full animate-pulse",
                        cfg.dot,
                      )}
                    />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border border-border/50" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        isDone
                          ? "text-green-400"
                          : isActive
                            ? cfg.color
                            : "text-muted-foreground",
                      )}
                    >
                      {cfg.label}
                    </span>
                    {/* Inline stats for completed stages */}
                    {isDone && stage === "tools" && partialData && (
                      <span className="text-[10px] text-muted-foreground">
                        {String(partialData.clauses_found ?? 0)} clause types ·{" "}
                        {String(partialData.dangerous_patterns ?? 0)} patterns
                      </span>
                    )}
                    {isDone && stage === "experts" && partialData && (
                      <span className="text-[10px] text-muted-foreground">
                        {String(partialData.total_raw_risks ?? 0)} risks ·{" "}
                        {String(partialData.total_raw_benefits ?? 0)} benefits ·{" "}
                        {String(partialData.elapsed ?? 0)}s
                      </span>
                    )}
                    {isDone && stage === "critic" && partialData && (
                      <span className="text-[10px] text-muted-foreground">
                        {String(partialData.changes_count ?? 0)} corrections ·{" "}
                        {String(partialData.elapsed ?? 0)}s
                      </span>
                    )}
                    {isDone && stage === "strategy" && partialData && (
                      <span className="text-[10px] text-muted-foreground">
                        {partialData.urgency_window
                          ? String(partialData.urgency_window).slice(0, 40) +
                            "…"
                          : `${String(partialData.elapsed ?? 0)}s`}
                      </span>
                    )}
                  </div>
                  {isActive && latestMsg && (
                    <p
                      className="text-[10px] text-muted-foreground mt-0.5 animate-fade-in-up"
                      key={latestMsg}
                    >
                      {latestMsg}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      timestamp: new Date(),
      type: "info",
      content:
        "Hello! I'm **Guardian** — your AI-powered risk intelligence engine.\n\nI run **4 expert agents in parallel** (Legal, Financial, Compliance, Insurance) to analyze contracts and documents.\n\n**What I can do:**\n- Analyze any contract for risks AND benefits\n- Handle adversarial documents (lawsuits, cease-and-desist letters) with actionable guidance\n- Answer hypothetical legal scenarios\n- Rank findings by impact and explain what outweighs what\n\nUpload a document or describe your situation to get started.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [activeDocument, setActiveDocument] = useState<ActiveDocument | null>(
    null,
  );
  const [personaMode, setPersonaMode] = useState("full");
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [progressEvents, setProgressEvents] = useState<
    (ProgressEvent | PartialResultEvent)[]
  >([]);

  // ── Persistent identity (Phase 5) ─────────────────────────────────────────
  // user_id: stable across all sessions (stored in localStorage)
  // session_id: unique per conversation (regenerated on page load)
  const [userId] = useState<string>(() => {
    if (typeof window === "undefined") return "anonymous";
    let id = localStorage.getItem("guardian_user_id");
    if (!id) {
      id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem("guardian_user_id", id);
    }
    return id;
  });
  const [sessionId] = useState<string>(() => {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Build conversation history for multi-turn context
  const getConversationHistory = () =>
    messages.slice(-8).map((m) => ({
      role: m.role,
      content:
        m.type === "risk"
          ? `[Risk Analysis: ${m.riskAnalysis?.verdict ?? "completed"}]`
          : m.type === "scenario"
            ? `[Scenario Analysis: ${m.scenarioAnalysis?.scenario_type ?? "completed"}]`
            : m.content,
    }));

  const handleSend = async (overridePersona?: string) => {
    // Allow send if there's text input OR an active document (even without new text)
    if (
      (!input.trim() && uploadedFiles.length === 0 && !activeDocument) ||
      isLoading
    )
      return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      timestamp: new Date(),
      content:
        input ||
        (activeDocument
          ? `Analyze ${activeDocument.filename} for risks and benefits`
          : "Uploaded document for analysis"),
      files: uploadedFiles.map((f) => ({ name: f.name, size: f.size })),
    };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setUploadedFiles([]);
    setIsLoading(true);
    setProgressEvents([]);

    try {
      // File is already uploaded via handleFileUpload — use activeDocument content directly
      const documentContent = activeDocument?.content ?? "";

      // Stream analysis — yields typed events as each pipeline stage completes
      for await (const event of client.analyzeStream({
        content: documentContent,
        context: currentInput || "Analyze this document for risks and benefits",
        persona_mode: overridePersona ?? personaMode,
        user_id: userId,
        session_id: sessionId,
        document_name: activeDocument?.filename ?? "Unknown document",
        conversation_history: getConversationHistory(),
      })) {
        if (event.type === "progress" || event.type === "partial_result") {
          setProgressEvents((prev) => [
            ...prev,
            event as ProgressEvent | PartialResultEvent,
          ]);
        } else if (event.type === "complete") {
          const data = event.data;
          let assistantMsg: Message;

          if (data.status === "RISK_ANALYSIS") {
            assistantMsg = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: "",
              timestamp: new Date(),
              type: "risk",
              riskAnalysis: data.risk_analysis as RiskAnalysis,
              personasUsed: data.personas_used as string[],
            };
          } else if (data.status === "SCENARIO_ANALYSIS") {
            assistantMsg = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: "",
              timestamp: new Date(),
              type: "scenario",
              scenarioAnalysis:
                data.scenario_analysis as Message["scenarioAnalysis"],
            };
          } else if (data.status === "AWAITING_PERSONA_SELECTION") {
            assistantMsg = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: `${data.message}\n\nSelect an expert lens from the menu above to proceed.`,
              timestamp: new Date(),
              type: "info",
            };
          } else {
            assistantMsg = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: (data.message as string) ?? "",
              timestamp: new Date(),
              type: data.status === "PREVENTIVE_GUIDANCE" ? "warning" : "info",
            };
          }
          setMessages((prev) => [...prev, assistantMsg]);
          setProgressEvents([]);
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      }
    } catch (err) {
      console.error(err);
      setProgressEvents([]);
      const errMsg =
        err instanceof Error && err.message
          ? err.message
          : `Could not reach the backend at ${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}. Make sure it is running.`;
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: errMsg,
          timestamp: new Date(),
          type: "warning",
        },
      ]);
    } finally {
      setIsLoading(false);
      setProgressEvents([]);
    }
  };

  // When user answers a clarifying question, send it as a follow-up
  const handleAnswerQuestion = (question: string, answer: string) => {
    setInput(`Regarding your question "${question}" — my answer is: ${answer}`);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    // Upload immediately on selection — don't wait for Send
    const file = files[0];
    setUploadedFiles([file]); // show chip while uploading
    setIsLoading(true);
    try {
      const uploadData = await client.uploadAndParse(file);
      setActiveDocument({
        content: uploadData.content,
        filename: uploadData.filename,
        charCount: uploadData.char_count ?? uploadData.content.length,
        pageCount: uploadData.page_count ?? null,
        uploadedAt: new Date(),
      });
      setUploadedFiles([]); // clear chip — document context bar takes over
    } catch (err) {
      console.error(err);
      setUploadedFiles([]);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant" as const,
          content: `Failed to upload **${file.name}**. Make sure the backend is running at ${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}.`,
          timestamp: new Date(),
          type: "warning" as const,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReanalyze = () => {
    if (!activeDocument) return;
    setInput("Analyze this document for all risks and benefits");
    setTimeout(() => handleSend("full"), 50);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="relative">
        <Navigation currentSection="chat" setCurrentSection={() => {}} />

        <div className="mx-auto max-w-5xl px-4 py-4 h-[calc(100vh-4rem)] flex flex-col">
          {/* Badge */}
          <div className="mb-2 text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full border border-primary/20 bg-primary/5 opacity-90 scale-90">
              <Sparkles className="h-3 w-3 text-primary animate-pulse" />
              <span className="text-[10px] font-semibold text-primary/80 uppercase tracking-wider">
                Guardian AI · 4-Agent Parallel Risk Intelligence
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 scroll-smooth scrollbar-hide">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 animate-slide-in-up",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
                style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center self-start mt-1">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                )}

                {/* Risk analysis card */}
                {message.type === "risk" && message.riskAnalysis ? (
                  <RiskAnalysisCard
                    riskAnalysis={message.riskAnalysis}
                    personasUsed={message.personasUsed}
                    timestamp={message.timestamp}
                    onAnswerQuestion={handleAnswerQuestion}
                  />
                ) : message.type === "scenario" && message.scenarioAnalysis ? (
                  /* Scenario analysis card */
                  <ScenarioAnalysisCard
                    scenarioAnalysis={message.scenarioAnalysis}
                    timestamp={message.timestamp}
                    onAnswerQuestion={handleAnswerQuestion}
                  />
                ) : (
                  /* Text bubble */
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3 glass-card",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card",
                    )}
                  >
                    {message.type &&
                      message.role === "assistant" &&
                      message.type !== "risk" &&
                      message.type !== "scenario" && (
                        <div className="flex items-center gap-2 mb-2">
                          {message.type === "warning" && (
                            <AlertCircle className="h-4 w-4 text-warning flex-shrink-0" />
                          )}
                          {message.type === "success" && (
                            <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                          )}
                          {message.type === "info" && (
                            <Info className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                          <span className="font-medium capitalize text-xs text-muted-foreground">
                            {message.type === "warning"
                              ? "Guidance"
                              : "Guardian"}
                          </span>
                        </div>
                      )}
                    {message.role === "assistant" ? (
                      <MarkdownMessage content={message.content} />
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    )}
                    {message.files && message.files.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {message.files.map((f, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-background/50"
                          >
                            <FileText className="h-3 w-3" />
                            <span>{f.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <span className="text-xs opacity-50 mt-2 block">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}

                {message.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-sm self-start mt-1">
                    U
                  </div>
                )}
              </div>
            ))}

            {isLoading && <LiveProgressIndicator events={progressEvents} />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="glass-card rounded-2xl p-4 border-2 border-border/50 focus-within:border-primary/50 transition-colors">
            {activeDocument && (
              <DocumentContextBar
                filename={activeDocument.filename}
                charCount={activeDocument.charCount}
                pageCount={activeDocument.pageCount}
                uploadedAt={activeDocument.uploadedAt}
                onClear={() => setActiveDocument(null)}
                onReanalyze={handleReanalyze}
                isLoading={isLoading}
              />
            )}

            {/* Persona selector */}
            <div className="flex items-center gap-2 mb-3">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                  className="h-8 px-3 rounded-lg border border-border bg-background/50 hover:bg-primary/5 text-xs flex items-center gap-2"
                >
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="font-medium">
                    Analyze using:{" "}
                    <span className="text-primary capitalize">
                      {PERSONAS.find((p) => p.id === personaMode)?.label ??
                        personaMode}
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform",
                      showPersonaMenu && "rotate-180",
                    )}
                  />
                </Button>
                {showPersonaMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-52 bg-card/95 backdrop-blur-md rounded-xl border border-primary/20 p-1.5 shadow-2xl animate-in fade-in slide-in-from-bottom-2 z-50">
                    <div className="px-2 py-1.5 mb-1 border-b border-border/50">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                        Select Expert Lens
                      </span>
                    </div>
                    {PERSONAS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setPersonaMode(p.id);
                          setShowPersonaMenu(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-primary/10",
                          personaMode === p.id
                            ? "text-primary bg-primary/5"
                            : "text-muted-foreground",
                        )}
                      >
                        <p.icon className="h-4 w-4" />
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* File previews */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {uploadedFiles.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg glass-card border border-primary/20 text-sm"
                  >
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="max-w-[150px] truncate">{file.name}</span>
                    <button
                      onClick={() =>
                        setUploadedFiles((prev) =>
                          prev.filter((_, j) => j !== i),
                        )
                      }
                      className="hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 items-end">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="ghost"
                size="icon"
                className="flex-shrink-0 h-10 w-10 rounded-xl hover:bg-primary/10"
                disabled={isLoading}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  activeDocument
                    ? "Ask about the document, request analysis, or ask a follow-up..."
                    : "Describe your situation, ask a legal question, or upload a document..."
                }
                className="min-h-[60px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSend()}
                disabled={
                  (!input.trim() &&
                    uploadedFiles.length === 0 &&
                    !activeDocument) ||
                  isLoading
                }
                size="icon"
                className="flex-shrink-0 h-10 w-10 rounded-xl bg-primary hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>
                Enter to send · Shift+Enter for new line · Upload PDF, DOCX, TXT
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
