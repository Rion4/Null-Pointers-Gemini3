"use client";

import { useState, useRef, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  ShieldAlert,
  Gavel,
  CircleDollarSign,
  ShieldCheck,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "warning" | "success" | "info";
  files?: Array<{ name: string; size: number }>;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm Guardian — your AI-powered risk interpretation engine. I can help you identify hidden risks in contracts, financial statements, and compliance documents. Upload a document or describe your situation to get started.",
      timestamp: new Date(),
      type: "info",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [activeDocumentContent, setActiveDocumentContent] = useState<string | null>(null);
  const [personaMode, setPersonaMode] = useState<string>("auto");
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if ((!input.trim() && uploadedFiles.length === 0) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input || "Uploaded files for analysis",
      timestamp: new Date(),
      files: uploadedFiles.map((f) => ({ name: f.name, size: f.size })),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    const currentFiles = [...uploadedFiles];
    setInput("");
    setUploadedFiles([]);
    setIsLoading(true);

    try {
      let documentContent = activeDocumentContent || "";
      let documentContext = currentInput || "General Document Analysis";

      // 1. If files are present, upload the first one to extract text
      if (currentFiles.length > 0) {
        const formData = new FormData();
        formData.append("file", currentFiles[0]);

        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) throw new Error("File upload failed");

        const uploadData = await uploadResponse.json();
        documentContent = uploadData.content;
        setActiveDocumentContent(uploadData.content);
      }

      // 2. Perform risk analysis
      const analyzeResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: documentContent,
          context: currentInput,
          persona_mode: personaMode
        }),
      });

      if (!analyzeResponse.ok) throw new Error("Analysis failed");

      const data = await analyzeResponse.json();

      let messageType: "success" | "warning" | "info" = "info";
      let displayContent = data.message || "";

      if (data.status === "RISK_ANALYSIS") {
        const verdict = data.risk_analysis?.verdict;
        if (verdict === "DO NOT SIGN" || verdict === "PROCEED WITH CAUTION") {
          messageType = "warning";
        } else {
          messageType = "success";
        }

        // Construct a summary if it's a risk result
        displayContent = `Assessment Status: ${verdict}\n\n${data.risk_analysis?.impact_summary || "Risk analysis complete."}`;
      } else if (data.status === "AWAITING_PERSONA_SELECTION") {
        messageType = "info";
        displayContent = `${data.message}\n\nPlease select an expert lens from the menu above to proceed with the analysis.`;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: displayContent,
        timestamp: new Date(),
        type: messageType,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error during analysis:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I encountered an error while analyzing your request. Please ensure the backend is running and try again.",
        timestamp: new Date(),
        type: "warning",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle gradient orbs only - no dots */}
      <div className="fixed inset-0" style={{ zIndex: 0 }}>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/3 rounded-full blur-3xl animate-float-slower" />
      </div>

      <div className="relative" style={{ zIndex: 10 }}>
        <Navigation currentSection="chat" setCurrentSection={() => { }} />

        <div className="mx-auto max-w-5xl px-4 py-4 h-[calc(100vh-4rem)] flex flex-col">
          {/* Chat header - Minimalist Badge Only */}
          <div className="mb-2 text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full border border-primary/20 bg-primary/5 opacity-90 scale-90">
              <Sparkles className="h-3 w-3 text-primary animate-pulse" />
              <span className="text-[10px] font-semibold text-primary/80 uppercase tracking-wider">
                Guardian AI Risk Analysis
              </span>
            </div>
          </div>

          {/* Messages container - hidden scrollbar */}
          <div className="flex-1 overflow-y-auto mb-6 space-y-4 scroll-smooth scrollbar-hide">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 animate-slide-in-up",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 glass-card",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card",
                  )}
                >
                  {message.type && message.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-2 text-sm">
                      {message.type === "warning" && (
                        <AlertCircle className="h-4 w-4 text-warning" />
                      )}
                      {message.type === "success" && (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      )}
                      {message.type === "info" && (
                        <FileText className="h-4 w-4 text-primary" />
                      )}
                      <span className="font-medium capitalize">
                        {message.type}
                      </span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                  {message.files && message.files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {message.files.map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-background/50"
                        >
                          <FileText className="h-3 w-3" />
                          <span>{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <span className="text-xs opacity-60 mt-2 block">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {message.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-sm">
                    U
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start animate-slide-in-up">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="max-w-[80%] rounded-2xl px-4 py-3 glass-card bg-card">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Analyzing...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="glass-card rounded-2xl p-4 border-2 border-border/50 focus-within:border-primary/50 transition-colors">
            {/* Persona Selection Trigger */}
            <div className="flex items-center gap-2 mb-3">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                  className="h-8 px-3 rounded-lg border border-border bg-background/50 hover:bg-primary/5 text-xs flex items-center gap-2"
                >
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="font-medium">Analyze using: <span className="text-primary capitalize">{personaMode === 'auto' ? 'Guardian (Auto)' : personaMode}</span></span>
                  <ChevronDown className={cn("h-3 w-3 transition-transform", showPersonaMenu && "rotate-180")} />
                </Button>

                {showPersonaMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-card/95 backdrop-blur-md rounded-xl border border-primary/20 p-1.5 shadow-2xl animate-in fade-in slide-in-from-bottom-2 z-50">
                    <div className="px-2 py-1.5 mb-1 border-b border-border/50">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Select Persona</span>
                    </div>
                    {[
                      { id: "auto", label: "Guardian (Auto)", icon: Sparkles },
                      { id: "legal", label: "Legal Expert", icon: Gavel },
                      { id: "financial", label: "Financial Expert", icon: CircleDollarSign },
                      { id: "compliance", label: "Compliance Expert", icon: ShieldCheck },
                      { id: "full", label: "Full Analysis", icon: Zap },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setPersonaMode(p.id);
                          setShowPersonaMenu(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-primary/10",
                          personaMode === p.id ? "text-primary bg-primary/5" : "text-muted-foreground"
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

            {/* Uploaded files preview */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg glass-card border border-primary/20 text-sm"
                  >
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="max-w-[150px] truncate">{file.name}</span>
                    <button
                      onClick={() => removeFile(index)}
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
                placeholder="Describe your situation or ask about rules and regulations..."
                className="min-h-[60px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={
                  (!input.trim() && uploadedFiles.length === 0) || isLoading
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
                Press Enter to send, Shift+Enter for new line • Upload PDFs,
                DOCs, TXT
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
