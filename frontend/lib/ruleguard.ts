// frontend/lib/ruleguard.ts

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

// ─── Event types emitted by /api/analyze/stream ───────────────────────────────

export interface ProgressEvent {
  type: "progress";
  stage: "tools" | "experts" | "critic" | "consensus" | "strategy";
  message: string;
}

export interface PartialResultEvent {
  type: "partial_result";
  stage: "tools" | "experts" | "critic" | "consensus" | "strategy";
  data: Record<string, unknown>;
}

export interface CompleteEvent {
  type: "complete";
  data: Record<string, unknown>;
}

export interface ErrorEvent {
  type: "error";
  message: string;
}

export type StreamEvent =
  | ProgressEvent
  | PartialResultEvent
  | CompleteEvent
  | ErrorEvent;

// ─── Request params ───────────────────────────────────────────────────────────

export interface AnalyzeParams {
  content: string;
  context: string;
  persona_mode?: string;
  user_id?: string;
  session_id?: string;
  document_name?: string;
  conversation_history?: Array<{ role: string; content: string }>;
}

export interface UploadResult {
  content: string;
  filename: string;
  char_count: number;
  page_count?: number | null;
}

// ─── Client ───────────────────────────────────────────────────────────────────

class RuleGuardClient {
  /**
   * Uploads a file to the backend for text extraction.
   * Returns { content, filename, char_count, page_count }.
   */
  async uploadAndParse(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("Upload failed");
    return response.json();
  }

  /**
   * Streams analysis results from /api/analyze/stream as an async generator.
   * Yields typed StreamEvent objects as each pipeline stage completes.
   *
   * Usage:
   *   for await (const event of client.analyzeStream(params)) {
   *     if (event.type === "complete") { ... }
   *   }
   */
  async *analyzeStream(params: AnalyzeParams): AsyncGenerator<StreamEvent> {
    const response = await fetch(`${BASE_URL}/api/analyze/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error("Analysis failed");

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) throw new Error("No response body");

    let buffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            yield JSON.parse(raw) as StreamEvent;
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

const client = new RuleGuardClient();
export default client;
