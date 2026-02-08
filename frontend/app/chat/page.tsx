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
        "Hello! I'm your Rule-to-Action Engine assistant. I can help you navigate complex rules, regulations, and procedures in real-time. Upload a document or describe your situation to get started.",
      timestamp: new Date(),
      type: "info",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
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
    setInput("");
    setUploadedFiles([]);
    setIsLoading(true);

    // Simulate AI response - replace with actual API call
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I'm analyzing your request and checking against relevant rules and regulations. This is a demo response - connect to your backend to get real-time guidance.",
        timestamp: new Date(),
        type: "success",
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
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
        <Navigation currentSection="chat" setCurrentSection={() => {}} />

        <div className="mx-auto max-w-5xl px-4 py-8 h-[calc(100vh-4rem)] flex flex-col">
          {/* Chat header */}
          <div className="mb-6 text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-4">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm font-medium">
                AI-Powered Rule Guidance
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Rule-to-Action Engine</h1>
            <p className="text-muted-foreground">
              Get real-time guidance for complex tasks
            </p>
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
