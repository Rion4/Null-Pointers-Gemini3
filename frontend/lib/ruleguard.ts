// frontend/lib/ruleguard.ts

class RuleGuardClient {
  private baseUrl = "http://localhost:8000";

  /**
   * Sends text to the FastAPI backend for Gemini 2.0 analysis.
   */
  async analyzeWithMultiTurn(content: string, context: string) {
    const response = await fetch(`${this.baseUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, context }),
    });

    if (!response.ok) throw new Error("Analysis failed");
    return response.json();
  }

  /**
   * Uploads a file to be parsed into text by the backend.
   */
  async uploadAndParse(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${this.baseUrl}/api/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Upload failed");
    return response.json(); // Returns { content: "...", filename: "..." }
  }
}

const client = new RuleGuardClient();
export default client;