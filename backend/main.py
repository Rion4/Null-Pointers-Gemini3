# backend/main.py
import os
import io
import sys
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader
from dotenv import load_dotenv

# Add the current directory (backend) to sys.path so we can import 'guardian'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from guardian.agent import run_clauseguard_consensus

# Load environment variables from the local .env (in backend/)
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

app = FastAPI()

# Enable CORS for your Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    content: str
    context: str = "general"
    persona_mode: Optional[str] = "auto"

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
    """Communicates with ClauseGuard consensus engine."""
    try:
        # Use the actual ADK-powered consensus engine
        result = run_clauseguard_consensus(
            user_query=data.context,
            file_context=data.content,
            persona_mode=data.persona_mode
        )
        
        # Return the raw result from agent.py, allowing frontend to handle different statuses
        return {
            **result,
            "status_code": "success" 
        }
    except Exception as e:
        print(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))