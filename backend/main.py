# backend/main.py
import os
import io
import sys
import json
from typing import Optional, List, AsyncGenerator
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pypdf import PdfReader
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from guardian.agent import (
    run_clauseguard_consensus,
    run_clauseguard_streaming,
    run_comparative_analysis,
    get_user_history,
)
from guardian.schemas import AnalysisRequest, UploadResponse, CompareRequest

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))          # backend/.env (Docker)
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env'))    # root .env (local dev)

app = FastAPI(
    title="RuleGuard API",
    description="AI-powered risk intelligence engine — parallel multi-agent analysis.",
    version="4.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "RuleGuard Backend is running", "status": "healthy", "version": "4.0.0"}


@app.post("/api/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """
    Extracts text from PDF or TXT files.
    Returns content, filename, character count, and page count.
    """
    try:
        page_count = None
        if file.content_type == "application/pdf":
            pdf_content = await file.read()
            reader = PdfReader(io.BytesIO(pdf_content))
            page_count = len(reader.pages)
            text = "".join(page.extract_text() or "" for page in reader.pages)
        else:
            text = (await file.read()).decode("utf-8")

        return UploadResponse(
            content=text,
            filename=file.filename or "unknown",
            char_count=len(text),
            page_count=page_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parsing error: {str(e)}")


@app.post("/api/analyze")
async def analyze_content(data: AnalysisRequest):
    """
    Runs the RuleGuard consensus engine (non-streaming).
    """
    try:
        result = await run_clauseguard_consensus(
            user_query=data.context,
            file_context=data.content,
            persona_mode=data.persona_mode,
            user_id=data.user_id or "anonymous",
            session_id=data.session_id or "default_session",
            conversation_history=data.conversation_history,
            document_name=data.document_name or "Unknown document",
        )
        return {**result, "status_code": "success"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze/stream")
async def analyze_content_stream(data: AnalysisRequest):
    """
    Streaming version of /api/analyze using Server-Sent Events.

    Emits JSON events as each pipeline stage completes:
      {"type": "progress",       "stage": "tools",    "message": "Pre-analyzing document structure..."}
      {"type": "progress",       "stage": "experts",  "message": "4 expert agents analyzing in parallel..."}
      {"type": "partial_result", "stage": "experts",  "data": {...}}
      {"type": "progress",       "stage": "critic",   "message": "Critic validating findings..."}
      {"type": "partial_result", "stage": "critic",   "data": {"changes": [...]}}
      {"type": "progress",       "stage": "consensus","message": "Synthesizing final verdict..."}
      {"type": "complete",       "data": {...}}
      {"type": "error",          "message": "..."}
    """
    async def event_stream() -> AsyncGenerator[str, None]:
        def sse(event_data: dict) -> str:
            return f"data: {json.dumps(event_data)}\n\n"

        try:
            async for event in run_clauseguard_streaming(
                user_query=data.context,
                file_context=data.content,
                persona_mode=data.persona_mode,
                user_id=data.user_id or "anonymous",
                session_id=data.session_id or "default_session",
                conversation_history=data.conversation_history,
                document_name=data.document_name or "Unknown document",
            ):
                yield sse(event)
        except Exception as e:
            yield sse({"type": "error", "message": str(e)})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ──────────────────────────────────────────────────────────────────────────────
# Phase 5 — Session history
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/api/history")
async def get_history(user_id: str = Query(..., description="User ID from localStorage")):
    """
    Returns a list of past analysis sessions for a user.
    Each entry: session_id, timestamp, document_name, verdict, risk_count, benefit_count.
    """
    try:
        history = await get_user_history(user_id)
        return {"history": history, "count": len(history)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ──────────────────────────────────────────────────────────────────────────────
# Phase 7 — Comparative contract analysis
# ──────────────────────────────────────────────────────────────────────────────

@app.post("/api/compare")
async def compare_contracts(data: CompareRequest):
    """
    Compares two versions of a contract.
    Returns: net_risk_change, new_risks_introduced, risks_resolved, clause_changes.
    """
    try:
        result = await run_comparative_analysis(
            content_v1=data.content_v1,
            content_v2=data.content_v2,
            filename_v1=data.filename_v1 or "Version 1",
            filename_v2=data.filename_v2 or "Version 2",
            user_id=data.user_id or "anonymous",
            session_id=data.session_id or "compare_session",
        )
        return {**result, "status_code": "success"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
