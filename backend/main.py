# backend/main.py
import os
import io
from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader
from google import genai # Use the new Google GenAI SDK

app = FastAPI()

# Enable CORS for your Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Secure API Client Initialization
# Ensure GEMINI_API_KEY is set in your server's .env file
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

class AnalysisRequest(BaseModel):
    content: str
    context: str = "general"

@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    """Extracts text from PDF or TXT files."""
    try:
        if file.content_type == "application/pdf":
            pdf_content = await file.read()
            reader = PdfReader(io.BytesIO(pdf_content))
            text = "".join([page.extract_text() for page in reader.pages])
        else:
            text = (await file.read()).decode("utf-8")
        
        return {"content": text, "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parsing error: {str(e)}")

@app.post("/api/analyze")
async def analyze_content(data: AnalysisRequest):
    """Communicates with Gemini 2.0 Flash."""
    try:
        # Construct the specialized system prompt for your 8 personas
        system_instruction = f"Context: {data.context}. Analyze as legal, tax, and compliance experts."
        
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=data.content,
            config={"system_instruction": system_instruction}
        )
        
        # In a real ADK setup, you would use root_agent.run() here
        return {
            "analysis": response.text,
            "detected_personas": ["lawyer", "compliance", "auditor"], # Mock logic
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))