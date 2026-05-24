# backend/guardian/agent.py
"""
RuleGuard ADK Agent Pipeline — Single Runner Architecture (Phase 1-4)

Architecture (one Runner, one SequentialAgent):
    SequentialAgent: RuleGuard_Pipeline
      ├── ParallelAgent: ExpertPanel          ← 4 agents run concurrently
      │     ├── LlmAgent: LegalExpert         → output_key="legal_risks"
      │     ├── LlmAgent: FinancialExpert     → output_key="financial_risks"
      │     ├── LlmAgent: ComplianceExpert    → output_key="compliance_risks"
      │     └── LlmAgent: InsuranceExpert     → output_key="insurance_risks"
      ├── LlmAgent: CriticAgent               ← Phase 4: validates all findings
      │     reads {legal_risks} etc., removes hallucinations, corrects severity
      │     rewrites corrected versions back to state keys
      └── LlmAgent: ConsensusOrchestrator     → reads validated {legal_risks} etc.
                                                 output_key="final_verdict"
"""

import os
import json
import logging
import asyncio
from dotenv import load_dotenv
from typing import Optional

from google.adk.agents import LlmAgent, SequentialAgent, ParallelAgent
from google.adk.runners import Runner
from google.adk.sessions.in_memory_session_service import InMemorySessionService
from google.adk.sessions import DatabaseSessionService
from google.adk.tools import FunctionTool
from google.genai.types import Content, Part

from guardian.personas import legal, financial, insurance, compliance
from guardian.orchestrator import (
    SYSTEM_INSTRUCTION as ORCHESTRATOR_INSTRUCTION,
    OUTPUT_KEY as ORCHESTRATOR_OUTPUT_KEY,
    SCENARIO_INSTRUCTION,
    SCENARIO_OUTPUT_KEY,
    DIALOGUE_INSTRUCTION,
    STRATEGY_INSTRUCTION,
    STRATEGY_OUTPUT_KEY,
)
from guardian.schemas import ConsensusVerdict, ScenarioAnalysis, ComparisonVerdict, PersonaAnalysis, ActionableGuidance
from guardian.risk_scoring import score_risks
from guardian.tools import (
    extract_clauses,
    detect_jurisdiction,
    flag_dangerous_patterns,
    calculate_obligation_density,
)

# ──────────────────────────────────────────────────────────────────────────────
# Bootstrap
# ──────────────────────────────────────────────────────────────────────────────

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

_use_vertex = os.environ.get("GOOGLE_GENAI_USE_VERTEXAI", "0") == "1"
if _use_vertex:
    os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "1"
    os.environ["GOOGLE_CLOUD_PROJECT"] = os.environ.get("GOOGLE_CLOUD_PROJECT", "projects-cc-496606")
    os.environ["GOOGLE_CLOUD_LOCATION"] = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
else:
    os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "0"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("guardian.agent")

# Suppress noisy ADK internals — keep only guardian.agent logs
logging.getLogger("google_adk.google.adk.runners").setLevel(logging.ERROR)
logging.getLogger("google_adk.google.adk.sessions.in_memory_session_service").setLevel(logging.ERROR)
logging.getLogger("google_adk.google.adk.models.google_llm").setLevel(logging.WARNING)
logging.getLogger("google_genai.models").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)

# ──────────────────────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────────────────────

APP_NAME = "guardian_app"
USER_ID  = "guardian_user"
SESSION_ID = "guardian_session"

MODEL      = os.environ.get("GUARDIAN_MODEL",        "gemini-2.5-flash")   # orchestrator
MODEL_FAST = os.environ.get("GUARDIAN_MODEL_FAST",   "gemini-2.5-flash")   # persona agents

# Intent labels
INTENT_SUMMARY     = "DOCUMENT_SUMMARY"
INTENT_RISK        = "RISK_ASSESSMENT"
INTENT_FOLLOWUP    = "FOLLOW_UP"
INTENT_CHAT        = "GENERAL_CHAT"
INTENT_SCENARIO    = "SCENARIO_ANALYSIS"
INTENT_ADVERSARIAL = "ADVERSARIAL_DOC"
INTENT_REFINEMENT  = "VERDICT_REFINEMENT"

# Session state key for refined verdict
REFINER_OUTPUT_KEY = "refined_verdict"

# ──────────────────────────────────────────────────────────────────────────────
# FunctionTools (Phase 3)
# ──────────────────────────────────────────────────────────────────────────────

extract_clauses_tool           = FunctionTool(func=extract_clauses)
detect_jurisdiction_tool       = FunctionTool(func=detect_jurisdiction)
flag_dangerous_patterns_tool   = FunctionTool(func=flag_dangerous_patterns)
calculate_obligation_density_tool = FunctionTool(func=calculate_obligation_density)

# ──────────────────────────────────────────────────────────────────────────────
# Persona instruction builder
# ──────────────────────────────────────────────────────────────────────────────

def _build_persona_instruction(persona_module) -> str:
    """
    Persona instruction WITHOUT tool-call preamble.
    Tools are now pre-run in Python and injected into the user message,
    eliminating extra API round trips per agent.
    """
    return f"""
{persona_module.SYSTEM_INSTRUCTION}

You will receive the document text AND pre-extracted tool analysis results in the user message.
Use the tool results as evidence — they are already computed for you.

OUTPUT — respond with ONLY this JSON object, no markdown, no code fences:
{{
  "persona": "{persona_module.NAME}",
  "risks": [
    {{
      "clause_text": "<exact quoted text from the document>",
      "risk_type": "<Indemnity|Termination|IP Assignment|Non-Compete|Liability Cap|Data Privacy|Payment Terms|Governing Law|Dispute Resolution|Auto-Renewal|Amendment Rights|other>",
      "severity": "<LOW|MEDIUM|HIGH|CRITICAL>",
      "irreversible": <true|false>,
      "explanation": "<plain English — why this is risky>",
      "recommendation": "<what to watch for, negotiate, or do>",
      "persona": "{persona_module.NAME}",
      "weight": <float 0.0-1.0>
    }}
  ],
  "benefits": [
    {{
      "clause_text": "<exact quoted text from the document>",
      "benefit_type": "<Liability Protection|Clear Payment Terms|IP Ownership|Termination Rights|Dispute Rights|Data Rights|Compensation|other>",
      "strength": "<WEAK|MODERATE|STRONG>",
      "explanation": "<plain English — why this is favorable>",
      "persona": "{persona_module.NAME}"
    }}
  ],
  "summary": "<one paragraph covering key risks AND key benefits from your perspective>"
}}

RULES:
- clause_text MUST be a direct quote from the document.
- Dangerous patterns listed in the tool results MUST appear as risks.
- Be balanced: identify BOTH risks AND benefits.
- Empty arrays are fine if nothing found in your domain.
- Do NOT invent findings not in the document or tool results.
"""

# ──────────────────────────────────────────────────────────────────────────────
# Persona agents (ParallelAgent sub-agents)
# ──────────────────────────────────────────────────────────────────────────────

legal_agent = LlmAgent(
    name="LegalExpert",
    model=MODEL_FAST,
    description=legal.DESCRIPTION,
    instruction=_build_persona_instruction(legal),
    output_key=legal.OUTPUT_KEY,
)

financial_agent = LlmAgent(
    name="FinancialExpert",
    model=MODEL_FAST,
    description=financial.DESCRIPTION,
    instruction=_build_persona_instruction(financial),
    output_key=financial.OUTPUT_KEY,
)

compliance_agent = LlmAgent(
    name="ComplianceExpert",
    model=MODEL_FAST,
    description=compliance.DESCRIPTION,
    instruction=_build_persona_instruction(compliance),
    output_key=compliance.OUTPUT_KEY,
)

insurance_agent = LlmAgent(
    name="InsuranceExpert",
    model=MODEL_FAST,
    description=insurance.DESCRIPTION,
    instruction=_build_persona_instruction(insurance),
    output_key=insurance.OUTPUT_KEY,
)

# ──────────────────────────────────────────────────────────────────────────────
# Expert panel — runs all 4 in parallel
# ──────────────────────────────────────────────────────────────────────────────

expert_panel = ParallelAgent(
    name="ExpertPanel",
    description="Runs all four expert personas concurrently.",
    sub_agents=[legal_agent, financial_agent, compliance_agent, insurance_agent],
)

# ──────────────────────────────────────────────────────────────────────────────
# ConsensusOrchestrator
# Reads {legal_risks}, {financial_risks}, {compliance_risks}, {insurance_risks}
# from session state — now these are the CRITIC-VALIDATED versions.
# ──────────────────────────────────────────────────────────────────────────────

consensus_orchestrator = LlmAgent(
    name="ConsensusOrchestrator",
    model=MODEL,
    description="Synthesizes all expert findings into a unified verdict with ranking and guidance.",
    instruction=ORCHESTRATOR_INSTRUCTION,  # uses {legal_risks} etc. templates
    output_key=ORCHESTRATOR_OUTPUT_KEY,    # → session.state["final_verdict"]
)

# ──────────────────────────────────────────────────────────────────────────────
# Full risk pipeline — ONE SequentialAgent, ONE Runner
#
# Flow:
#   1. ExpertPanel (ParallelAgent) — 4 agents run concurrently, write to state
#   2. CriticAgent — validates all findings, corrects state keys in-place
#   3. ConsensusOrchestrator — reads validated state, produces final verdict
# ──────────────────────────────────────────────────────────────────────────────

ruleguard_pipeline = SequentialAgent(
    name="RuleGuard_Pipeline",
    description="Parallel expert analysis → Python grounding check → consensus synthesis.",
    sub_agents=[expert_panel, consensus_orchestrator],
)

# ──────────────────────────────────────────────────────────────────────────────
# Scenario advisor — for hypothetical / situational questions
# ──────────────────────────────────────────────────────────────────────────────

scenario_agent = LlmAgent(
    name="ScenarioAdvisor",
    model=MODEL,
    description="Analyzes hypothetical legal and contractual scenarios without a document.",
    instruction=SCENARIO_INSTRUCTION,
    output_key=SCENARIO_OUTPUT_KEY,       # → session.state["scenario_analysis"]
)

# ──────────────────────────────────────────────────────────────────────────────
# Dialogue advisor — for multi-turn conversations and follow-ups
# ──────────────────────────────────────────────────────────────────────────────

dialogue_agent = LlmAgent(
    name="DialogueAdvisor",
    model=MODEL,
    description="Handles multi-turn conversations, follow-up questions, and clarification responses.",
    instruction=DIALOGUE_INSTRUCTION,
)

# ──────────────────────────────────────────────────────────────────────────────
# Utility agent — chat, summaries, preventive guidance
# ──────────────────────────────────────────────────────────────────────────────

utility_agent = LlmAgent(
    name="GuardianUtility",
    model=MODEL,
    description="Handles general chat, document summaries, and preventive guidance.",
    instruction="""
You are Guardian — an advanced risk intelligence assistant.

You help users understand documents, answer follow-up questions, provide
preventive guidance about common risks, and handle general questions.

Be direct, honest, and comprehensive. If the user describes a legal situation,
give them real information — not vague disclaimers. Always end legal guidance
with: "This is general information only. Please consult a qualified attorney
for advice specific to your situation."

You do NOT give specific legal or financial advice.
You DO give structured risk awareness, clear explanations, and practical guidance.
""",
)

# ──────────────────────────────────────────────────────────────────────────────
# VerdictRefiner — interactive refinement loop (Task 4)
#
# NOT an ADK LoopAgent. The "loop" is stateful multi-turn across API calls:
#   Call 1: full pipeline → ConsensusVerdict with clarifying_questions
#   Call N: user answers a question → VerdictRefiner → refined ConsensusVerdict
#           (fewer questions, updated adversarial/guidance/verdict)
#   Done when clarifying_questions == [] or user says "decide now"
#
# ADK LoopAgent iterates autonomously — it can't pause for human input. This
# pattern (one agent that refines in response to each user turn) achieves the
# same end-goal through the existing multi-turn conversation infrastructure.
# ──────────────────────────────────────────────────────────────────────────────

_REFINER_INSTRUCTION = """
You are the VerdictRefiner for Guardian — an advanced risk intelligence system.

You will receive a prior risk analysis verdict and the user's answers to clarifying questions.
Your job is to refine the verdict based on those answers.

REFINEMENT RULES:

1. ADVERSARIAL UPDATE: If the user says they RECEIVED, were SERVED, or the document was
   filed/sent AGAINST them — set adversarial=true and populate the guidance object with:
   document_context, immediate_actions, options, how_to_respond, deadlines,
   evidence_to_gather, strengths_of_your_position, weaknesses_of_your_position, disclaimer.

2. VERDICT RECALIBRATION: If the user's answers change the risk picture
   (e.g., "I already have written evidence contradicting this", "I have a lawyer",
   "this is a template they send everyone") — adjust:
   - verdict (SAFE TO PROCEED / PROCEED WITH CAUTION / DO NOT SIGN)
   - impact_summary and comparative_summary to reflect the new context

3. CLARIFYING QUESTIONS: Remove questions that were answered. Add new ones only if the
   answers raised new ambiguities. If analysis is now complete, return empty list.

4. PRESERVE: Keep risks[], benefits[], ranked_findings[], total_risk_score, critical_risks,
   irreversible_risks, irreversibility_index, document_type, personas_used unless the
   answers directly require changing them.

5. CLOSING THE LOOP: Start impact_summary with "Based on your answers: ..." so the user
   knows this is a refined analysis.

OUTPUT — respond with ONLY a valid JSON object matching the ConsensusVerdict schema.
No markdown, no code fences.
"""

verdict_refiner = LlmAgent(
    name="VerdictRefiner",
    model=MODEL,
    description="Refines a prior risk verdict based on user answers to clarifying questions.",
    instruction=_REFINER_INSTRUCTION,
    output_key=REFINER_OUTPUT_KEY,
    output_schema=ConsensusVerdict,
)

# ──────────────────────────────────────────────────────────────────────────────
# StrategyAgent — jurisdiction-aware playbooks for adversarial documents (Task 5)
#
# Runs AFTER ConsensusOrchestrator when adversarial=true.
# Owns the guidance field entirely — orchestrator always emits guidance=null.
# ──────────────────────────────────────────────────────────────────────────────

strategy_agent = LlmAgent(
    name="StrategyAgent",
    model=MODEL,
    description="Produces jurisdiction-aware, document-type-specific guidance for adversarial documents.",
    instruction=STRATEGY_INSTRUCTION,
    output_key=STRATEGY_OUTPUT_KEY,
    output_schema=ActionableGuidance,
)

# ──────────────────────────────────────────────────────────────────────────────
# Session service — fully async, no thread wrapper needed.
# Falls back to InMemorySessionService if DB init fails.
# ──────────────────────────────────────────────────────────────────────────────

_DB_URL = os.environ.get("GUARDIAN_DB_URL", "sqlite+aiosqlite:///./guardian_sessions.db")

try:
    session_service = DatabaseSessionService(db_url=_DB_URL)
    logger.info(f"Session service: DatabaseSessionService ({_DB_URL})")
except Exception as _db_err:
    logger.warning(f"DatabaseSessionService failed ({_db_err}) — falling back to InMemorySessionService")
    session_service = InMemorySessionService()

# ──────────────────────────────────────────────────────────────────────────────
# Runners — one per agent/pipeline
# ──────────────────────────────────────────────────────────────────────────────

pipeline_runner = Runner(
    agent=ruleguard_pipeline,
    app_name=APP_NAME,
    session_service=session_service,
)

scenario_runner = Runner(
    agent=scenario_agent,
    app_name=APP_NAME,
    session_service=session_service,
)

dialogue_runner = Runner(
    agent=dialogue_agent,
    app_name=APP_NAME,
    session_service=session_service,
)

utility_runner = Runner(
    agent=utility_agent,
    app_name=APP_NAME,
    session_service=session_service,
)

refiner_runner = Runner(
    agent=verdict_refiner,
    app_name=APP_NAME,
    session_service=session_service,
)

strategy_runner = Runner(
    agent=strategy_agent,
    app_name=APP_NAME,
    session_service=session_service,
)

# Step-by-step runners — shared by both the streaming path and
# _run_single_chunk_pipeline so the Python critic runs between stages.
_stream_panel_runner = Runner(
    agent=expert_panel,
    app_name=APP_NAME,
    session_service=session_service,
)
_stream_orch_runner = Runner(
    agent=consensus_orchestrator,
    app_name=APP_NAME,
    session_service=session_service,
)

# ──────────────────────────────────────────────────────────────────────────────
# Async session helpers
# ──────────────────────────────────────────────────────────────────────────────

async def _ensure_session(user_id: str = USER_ID, session_id: str = SESSION_ID) -> None:
    try:
        await session_service.create_session(
            app_name=APP_NAME, user_id=user_id, session_id=session_id,
        )
    except Exception as e:
        if "already exists" not in str(e).lower() and "already_exists" not in str(e).lower():
            logger.debug(f"Session note: {e}")


async def _get_session_state(user_id: str, session_id: str) -> dict:
    try:
        session = await session_service.get_session(
            app_name=APP_NAME, user_id=user_id, session_id=session_id,
        )
        return dict(session.state) if session else {}
    except Exception as e:
        logger.warning(f"Could not read session state: {e}")
        return {}


async def _clear_state_keys(user_id: str, session_id: str, keys: list) -> None:
    try:
        session = await session_service.get_session(
            app_name=APP_NAME, user_id=user_id, session_id=session_id,
        )
        if session:
            for k in keys:
                session.state.pop(k, None)
    except Exception as e:
        logger.warning(f"Could not clear state: {e}")


async def _apply_critic_corrections(user_id: str, session_id: str, corrected: dict) -> None:
    """Writes Python-critic corrected persona outputs back to session state."""
    for key, corrected_json in corrected.items():
        try:
            session = await session_service.get_session(
                app_name=APP_NAME, user_id=user_id, session_id=session_id,
            )
            if session:
                session.state[key] = corrected_json
        except Exception as e:
            logger.warning(f"Could not apply critic correction for {key}: {e}")


async def _store_analysis_metadata(
    user_id: str,
    session_id: str,
    document_name: str,
    verdict: str,
    risk_count: int,
    benefit_count: int,
    char_count: int,
) -> None:
    """Stores lightweight metadata about a completed analysis in session state."""
    import datetime
    try:
        session = await session_service.get_session(
            app_name=APP_NAME, user_id=user_id, session_id=session_id,
        )
        if session:
            session.state["_meta_document_name"] = document_name
            session.state["_meta_verdict"] = verdict
            session.state["_meta_risk_count"] = risk_count
            session.state["_meta_benefit_count"] = benefit_count
            session.state["_meta_char_count"] = char_count
            session.state["_meta_timestamp"] = datetime.datetime.utcnow().isoformat()
    except Exception as e:
        logger.warning(f"Could not store analysis metadata: {e}")


async def get_user_history(user_id: str) -> list[dict]:
    """
    Returns a list of past analysis sessions for a user.
    Each entry has: session_id, timestamp, document_name, verdict, risk_count, benefit_count.
    """
    try:
        response = await session_service.list_sessions(
            app_name=APP_NAME, user_id=user_id,
        )
        sessions = response.sessions if response else []

        history = []
        for session in sessions:
            state = dict(session.state) if session.state else {}
            if not state.get("_meta_timestamp"):
                continue
            history.append({
                "session_id": session.id,
                "timestamp": state.get("_meta_timestamp", ""),
                "document_name": state.get("_meta_document_name", "Unknown document"),
                "verdict": state.get("_meta_verdict"),
                "risk_count": state.get("_meta_risk_count", 0),
                "benefit_count": state.get("_meta_benefit_count", 0),
                "char_count": state.get("_meta_char_count", 0),
            })
        history.sort(key=lambda x: x["timestamp"], reverse=True)
        return history
    except Exception as e:
        logger.warning(f"Could not retrieve user history: {e}")
        return []


# ──────────────────────────────────────────────────────────────────────────────
# Async runner helpers
# ──────────────────────────────────────────────────────────────────────────────

async def _collect_text_async(events) -> str:
    """Drains an async event generator and returns concatenated text content."""
    parts = []
    async for event in events:
        if event.content:
            for part in event.content.parts:
                if hasattr(part, "text") and part.text:
                    parts.append(part.text)
    return "".join(parts).strip()


async def _run_agent(runner: Runner, prompt: str, user_id: str, session_id: str) -> str:
    await _ensure_session(user_id, session_id)
    message = Content(role="user", parts=[Part(text=prompt)])
    return await _collect_text_async(
        runner.run_async(user_id=user_id, session_id=session_id, new_message=message)
    )


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def _parse_json_from_state(state: dict, key: str, model_class):
    """Reads a JSON string (or dict) from session state and parses it into a Pydantic model."""
    raw = state.get(key, "")
    if not raw:
        return None
    if isinstance(raw, dict):
        try:
            return model_class(**raw)
        except Exception as e:
            logger.error(f"Failed to parse {key} from dict: {e}\nRaw: {str(raw)[:300]}")
            return None
    clean = raw.strip()
    for prefix in ("```json", "```"):
        if clean.startswith(prefix):
            clean = clean[len(prefix):]
    if clean.endswith("```"):
        clean = clean[:-3]
    clean = clean.strip()
    try:
        return model_class(**json.loads(clean))
    except Exception as e:
        logger.error(f"Failed to parse {key}: {e}\nRaw: {raw[:300]}")
        return None


# ──────────────────────────────────────────────────────────────────────────────
# Large document handling — chunking for 500+ page / very long documents
# Gemini 2.5 Flash has a 1M token context (~750k words) but very large docs
# benefit from section-by-section processing to guarantee every clause is seen.
# ──────────────────────────────────────────────────────────────────────────────

# ~600k chars ≈ ~150k tokens — safe single-pass limit for Gemini 2.5 Flash
_CHUNK_CHAR_LIMIT = 600_000
# Overlap between chunks so clauses spanning a boundary aren't missed
_CHUNK_OVERLAP    = 2_000


def _chunk_document(text: str) -> list[str]:
    """
    Splits a document into overlapping chunks if it exceeds _CHUNK_CHAR_LIMIT.
    Returns a list of chunk strings (single-element list for normal docs).
    """
    if len(text) <= _CHUNK_CHAR_LIMIT:
        return [text]

    chunks = []
    start = 0
    total = len(text)
    while start < total:
        end = min(start + _CHUNK_CHAR_LIMIT, total)
        # Try to break at a paragraph boundary to avoid mid-sentence splits
        if end < total:
            boundary = text.rfind("\n\n", start, end)
            if boundary > start + _CHUNK_CHAR_LIMIT // 2:
                end = boundary
        chunks.append(text[start:end])
        start = end - _CHUNK_OVERLAP  # overlap
    logger.info(f"Document chunked into {len(chunks)} parts (total {total:,} chars)")
    return chunks


def _merge_chunked_results(chunk_results: list[dict]) -> dict:
    """
    Merges risk/benefit results from multiple chunks into a single result dict.
    Deduplicates by clause_text similarity (exact match).
    """
    if len(chunk_results) == 1:
        return chunk_results[0]

    merged_risks: list = []
    merged_benefits: list = []
    seen_clauses: set = set()

    for result in chunk_results:
        ra = result.get("risk_analysis", {})
        for risk in ra.get("risks", []):
            key = risk.get("clause_text", "")[:120]
            if key not in seen_clauses:
                seen_clauses.add(key)
                merged_risks.append(risk)
        for benefit in ra.get("benefits", []):
            key = benefit.get("clause_text", "")[:120]
            if key not in seen_clauses:
                seen_clauses.add(key)
                merged_benefits.append(benefit)

    # Use the highest-severity verdict from all chunks
    verdict_order = ["DO NOT SIGN", "PROCEED WITH CAUTION", "SAFE TO PROCEED"]
    best_verdict = "SAFE TO PROCEED"
    for result in chunk_results:
        v = result.get("risk_analysis", {}).get("verdict", "SAFE TO PROCEED")
        if verdict_order.index(v) < verdict_order.index(best_verdict):
            best_verdict = v

    # Take the first chunk's full risk_analysis as base, then overwrite
    base = chunk_results[0].get("risk_analysis", {}).copy()
    base["risks"] = merged_risks
    base["benefits"] = merged_benefits
    base["verdict"] = best_verdict
    base["impact_summary"] = (
        f"[Multi-chunk analysis across {len(chunk_results)} document sections] "
        + base.get("impact_summary", "")
    )
    base["total_risk_score"] = sum(
        r.get("risk_analysis", {}).get("total_risk_score", 0) for r in chunk_results
    )
    base["critical_risks"] = sum(
        1 for r in merged_risks if r.get("severity") == "CRITICAL"
    )
    base["irreversible_risks"] = sum(
        1 for r in merged_risks if r.get("irreversible")
    )

    return {
        "status": "RISK_ANALYSIS",
        "personas_used": chunk_results[0].get("personas_used", []),
        "risk_analysis": base,
        "chunks_analyzed": len(chunk_results),
    }


# ──────────────────────────────────────────────────────────────────────────────
# Intent detection helpers (pure Python — no async needed)
# ──────────────────────────────────────────────────────────────────────────────

def is_document_sufficient(text: str) -> bool:
    if not text or len(text.strip()) < 50:
        return False
    keywords = [
        "agreement", "offer", "shall", "may", "terms", "conditions",
        "liability", "employment", "internship", "payment", "termination",
        "contract", "policy", "confidentiality", "clause", "party",
        "parties", "obligations", "rights", "hereby", "whereas",
    ]
    return any(k in text.lower() for k in keywords) or len(text.strip()) > 150


def _is_adversarial_query(query: str) -> bool:
    """Detects if the user is describing a document filed against them."""
    triggers = [
        "filed against me", "sent to me", "received a", "got a letter",
        "cease and desist", "lawsuit", "sued", "being sued", "demand letter",
        "legal notice", "court order", "subpoena", "debt collection",
        "they are claiming", "they claim", "accused of", "alleged",
    ]
    return any(t in query.lower() for t in triggers)


def _is_scenario_query(query: str) -> bool:
    """Detects hypothetical / situational questions without a document."""
    triggers = [
        "what if", "hypothetically", "scenario", "suppose", "let's say",
        "if i were to", "can they", "can i", "is it legal", "do i have a case",
        "what are my rights", "what should i do if", "what happens if",
        "am i liable", "can i sue", "should i sign",
    ]
    return any(t in query.lower() for t in triggers)


def _is_followup_query(query: str) -> bool:
    triggers = [
        "explain", "clarify", "what does this mean", "why", "elaborate",
        "who are the parties", "when does it end", "tell me more",
        "what is in", "show me", "can you expand",
    ]
    return any(t in query.lower() for t in triggers)


def _is_situation_description(query: str) -> bool:
    triggers = [
        "i want to", "i plan to", "i am planning", "i'm planning",
        "before i sign", "thinking of signing", "considering",
        "what should i know", "what documents", "requirements",
    ]
    return any(t in query.lower() for t in triggers)


def _classify_intent(query: str, has_doc: bool) -> str:
    q = query.lower().strip()

    # Adversarial always takes priority when there's a doc
    if has_doc and _is_adversarial_query(query):
        return INTENT_ADVERSARIAL

    if not has_doc:
        if _is_scenario_query(query):
            return INTENT_SCENARIO
        return INTENT_CHAT

    if _is_followup_query(query):
        return INTENT_FOLLOWUP

    summary_triggers = ["what is", "about", "describe", "overview", "summary", "purpose", "explain this"]
    risk_triggers    = ["risk", "safe", "sign", "accept", "danger", "legal", "fair",
                        "analyze", "analyse", "review", "check", "assess", "evaluate"]

    is_summary = any(t in q for t in summary_triggers)
    is_risk    = any(t in q for t in risk_triggers)

    if is_summary and not is_risk:
        return INTENT_SUMMARY
    return INTENT_RISK  # default for documents


# ──────────────────────────────────────────────────────────────────────────────
# Python-based critic (replaces the former CriticAgent LLM call)
#
# Grounding strategy:
#   1. Exact substring match (fast, handles most real quotes)
#   2. Bigram overlap — adjacent word-pair overlap is far harder to fake
#      than single-word overlap on boilerplate-heavy legal text.
# ──────────────────────────────────────────────────────────────────────────────

def _clause_in_document(clause: str, document: str) -> bool:
    """True if clause_text is sufficiently grounded in the document."""
    if not clause or len(clause.strip()) < 10:
        return True  # too short to validate reliably

    clause_norm = " ".join(clause.lower().split())
    doc_norm    = " ".join(document.lower().split())

    # Fast path: exact substring match
    if clause_norm in doc_norm:
        return True

    clause_words = clause_norm.split()

    # Very short clauses: content-word unigram overlap
    if len(clause_words) < 4:
        content = [w for w in clause_words if len(w) > 4]
        if not content:
            return True
        doc_words = set(doc_norm.split())
        ratio = sum(1 for w in content if w in doc_words) / len(content)
        logger.debug(f"Critic grounding (unigram) ratio={ratio:.2f} clause={clause_norm[:60]!r}")
        return ratio >= 0.75

    # Bigram overlap — harder to fake with shared boilerplate
    clause_bigrams = set(zip(clause_words, clause_words[1:]))
    doc_words_list = doc_norm.split()
    doc_bigrams    = set(zip(doc_words_list, doc_words_list[1:]))
    overlap = len(clause_bigrams & doc_bigrams) / len(clause_bigrams)
    grounded = overlap >= 0.40
    logger.debug(f"Critic grounding (bigram) overlap={overlap:.2f} ({'pass' if grounded else 'FAIL'}) clause={clause_norm[:60]!r}")
    return grounded


def _python_critic(
    persona_outputs: dict,
    document: str,
) -> tuple:
    """
    Grounding check: removes findings whose clause_text cannot be found in
    the document. Replaces the former CriticAgent LLM call — runs in
    milliseconds vs 5-10 s for the LLM stage.
    Returns (corrected_outputs: dict[str,str], changes_made: list[str]).
    """
    changes_made: list = []
    corrected:    dict = {}

    for key, raw in persona_outputs.items():
        if not raw:
            corrected[key] = raw
            continue
        try:
            # Normalise to string — output_schema may store dicts
            if isinstance(raw, dict):
                raw_str = json.dumps(raw)
            else:
                raw_str = raw
            clean  = raw_str.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            parsed = json.loads(clean)
        except Exception:
            corrected[key] = raw if isinstance(raw, str) else json.dumps(raw) if isinstance(raw, dict) else str(raw)
            continue

        grounded_risks: list = []
        for risk in parsed.get("risks", []):
            if _clause_in_document(risk.get("clause_text", ""), document):
                grounded_risks.append(risk)
            else:
                changes_made.append(
                    f"Removed ungrounded risk [{key}]: {risk.get('clause_text','')[:60]!r}"
                )

        grounded_benefits: list = []
        for benefit in parsed.get("benefits", []):
            if _clause_in_document(benefit.get("clause_text", ""), document):
                grounded_benefits.append(benefit)
            else:
                changes_made.append(
                    f"Removed ungrounded benefit [{key}]: {benefit.get('clause_text','')[:60]!r}"
                )

        parsed["risks"]    = grounded_risks
        parsed["benefits"] = grounded_benefits
        corrected[key]     = json.dumps(parsed)

    return corrected, changes_made


# ──────────────────────────────────────────────────────────────────────────────
# Risk pipeline — single runner (async)
# ──────────────────────────────────────────────────────────────────────────────

async def _run_risk_pipeline(
    document: str,
    persona_mode: str,
    user_id: str,
    session_id: str,
    document_name: str = "Unknown document",
) -> dict:
    """
    Runs the full pipeline with a SINGLE Runner on the SequentialAgent.
    Handles large documents by chunking and merging results.
    """
    chunks = _chunk_document(document)
    if len(chunks) > 1:
        logger.info(f"Large document: running pipeline on {len(chunks)} chunks")
        chunk_results = []
        for i, chunk in enumerate(chunks):
            logger.info(f"Processing chunk {i+1}/{len(chunks)} ({len(chunk):,} chars)")
            result = await _run_single_chunk_pipeline(
                document=chunk,
                persona_mode=persona_mode,
                user_id=user_id,
                session_id=f"{session_id}_chunk_{i}",
            )
            chunk_results.append(result)
        merged = _merge_chunked_results(chunk_results)
        ra = merged.get("risk_analysis", {})
        await _store_analysis_metadata(
            user_id=user_id, session_id=session_id,
            document_name=document_name,
            verdict=ra.get("verdict", ""),
            risk_count=len(ra.get("risks", [])),
            benefit_count=len(ra.get("benefits", [])),
            char_count=len(document),
        )
        return merged

    return await _run_single_chunk_pipeline(
        document=document,
        persona_mode=persona_mode,
        user_id=user_id,
        session_id=session_id,
        document_name=document_name,
    )


async def _run_single_chunk_pipeline(
    document: str,
    persona_mode: str,
    user_id: str,
    session_id: str,
    document_name: str = "Unknown document",
) -> dict:
    """
    Runs the full pipeline on a single document (or chunk).

    Step-by-step flow (mirrors the streaming path so Python critic runs
    before the orchestrator reads state):
    1. Pre-compute tools in Python (no extra LLM calls)
    2. ExpertPanel (ParallelAgent) — 4 agents concurrently
    3. Python critic (_python_critic) — grounding check in milliseconds
    4. Apply corrections to session state
    5. ConsensusOrchestrator — reads corrected state, produces final verdict
    """
    await _ensure_session(user_id, session_id)

    # Clear stale outputs from any previous run
    await _clear_state_keys(user_id, session_id, [
        "legal_risks", "financial_risks", "compliance_risks",
        "insurance_risks", "final_verdict",
    ])

    logger.info(f"Starting pipeline | mode={persona_mode} | doc_len={len(document)}")

    # ── Step 1: Pre-run all tools in Python (no API calls) ───────────────────
    import time
    t_tools = time.time()
    try:
        clauses      = extract_clauses(document)
        jurisdiction = detect_jurisdiction(document)
        patterns     = flag_dangerous_patterns(document)
        density      = calculate_obligation_density(document)
        logger.info(f"Tools pre-computed in {time.time()-t_tools:.1f}s | "
                    f"clauses={clauses.get('_summary',{}).get('total_clause_types_found',0)} | "
                    f"patterns={patterns.get('patterns_triggered',0)} | "
                    f"density={density.get('balance_verdict','?')}")
    except Exception as e:
        logger.warning(f"Tool pre-computation failed: {e} — agents will proceed without tool data")
        clauses = jurisdiction = patterns = density = {}

    tool_summary = f"""
PRE-COMPUTED TOOL ANALYSIS (use this as evidence):

CLAUSE EXTRACTION:
{json.dumps(clauses.get('_summary', {}), indent=2)}
High-risk clause types found: {clauses.get('_summary', {}).get('high_risk_categories_present', [])}

DANGEROUS PATTERNS DETECTED ({patterns.get('patterns_triggered', 0)} of {patterns.get('patterns_checked', 0)} checked):
{json.dumps([{'name': m['pattern_name'], 'danger': m['danger_level'], 'irreversible': m['irreversible'], 'text': m['matched_sentences'][:1]} for m in patterns.get('matches', [])], indent=2)}

JURISDICTION:
{json.dumps({'detected': jurisdiction.get('jurisdiction_detected'), 'legal_system': jurisdiction.get('legal_system'), 'risk_flags': jurisdiction.get('risk_flags', [])}, indent=2)}

OBLIGATION DENSITY:
{json.dumps({'balance': density.get('balance_verdict'), 'party_balance': density.get('party_balance_verdict'), 'obligation_ratio': density.get('obligation_ratio'), 'employee_obligations': density.get('employee_obligations'), 'company_obligations': density.get('company_obligations')}, indent=2)}
"""

    # ── Step 2: Expert panel ──────────────────────────────────────────────────
    panel_msg = Content(
        role="user",
        parts=[Part(text=f"Analyze the following document for risks and benefits.\n\n{tool_summary}\n\nDOCUMENT:\n{document}")]
    )
    try:
        await _collect_text_async(
            _stream_panel_runner.run_async(user_id=user_id, session_id=session_id, new_message=panel_msg)
        )
    except SystemExit as e:
        logger.error(f"Expert panel raised SystemExit: {e}")
        raise RuntimeError("Expert panel failed (SystemExit — check API quota/credentials)") from e
    except Exception as e:
        logger.error(f"Expert panel failed: {e}", exc_info=True)
        raise

    # ── Step 3: Python critic — grounding check ───────────────────────────────
    state = await _get_session_state(user_id, session_id)
    persona_keys = ["legal_risks", "financial_risks", "compliance_risks", "insurance_risks"]
    persona_outputs = {k: state.get(k, "") for k in persona_keys}

    t_critic = time.time()
    corrected, changes_made = _python_critic(persona_outputs, document)
    logger.info(f"Python critic: {len(changes_made)} removal(s) in {time.time()-t_critic:.3f}s")
    for c in changes_made:
        logger.info(f"  → {c}")

    # ── Step 4: Write corrections back to session state ───────────────────────
    await _apply_critic_corrections(user_id, session_id, corrected)

    # ── Step 5: Consensus orchestrator reads corrected state ──────────────────
    state = await _get_session_state(user_id, session_id)

    def _to_str(v):
        if isinstance(v, str):
            return v
        try:
            return json.dumps(v)
        except Exception:
            return str(v)

    legal_out      = _to_str(state.get("legal_risks",      "No legal findings."))
    financial_out  = _to_str(state.get("financial_risks",  "No financial findings."))
    compliance_out = _to_str(state.get("compliance_risks", "No compliance findings."))
    insurance_out  = _to_str(state.get("insurance_risks",  "No insurance findings."))

    consensus_text = f"""Here are the validated risk analyses from four expert personas.
Synthesize them into a single unified verdict.

LEGAL EXPERT FINDINGS:
{legal_out}

FINANCIAL EXPERT FINDINGS:
{financial_out}

COMPLIANCE EXPERT FINDINGS:
{compliance_out}

INSURANCE EXPERT FINDINGS:
{insurance_out}
"""
    try:
        await _collect_text_async(
            _stream_orch_runner.run_async(
                user_id=user_id, session_id=session_id,
                new_message=Content(role="user", parts=[Part(text=consensus_text)]),
            )
        )
    except SystemExit as e:
        logger.error(f"Consensus orchestrator raised SystemExit: {e}")
        raise RuntimeError("Consensus stage failed (SystemExit — check API quota/credentials)") from e
    except Exception as e:
        logger.error(f"Consensus orchestrator failed: {e}", exc_info=True)
        raise

    state  = await _get_session_state(user_id, session_id)
    verdict = _parse_json_from_state(state, ORCHESTRATOR_OUTPUT_KEY, ConsensusVerdict)

    if verdict is None:
        logger.warning("ConsensusOrchestrator produced no valid output — falling back")
        return _fallback_scoring(state)

    # ── Strategy agent (adversarial only) ────────────────────────────────────
    if verdict.adversarial:
        logger.info("Adversarial document detected — running StrategyAgent")
        guidance = await _run_strategy_agent(verdict, document, user_id, session_id)
        if guidance:
            verdict.guidance = guidance

    logger.info(f"Pipeline complete | verdict={verdict.verdict} | risks={len(verdict.risks)} | benefits={len(verdict.benefits)}")

    result = {
        "status": "RISK_ANALYSIS",
        "personas_used": verdict.personas_used,
        "risk_analysis": verdict.model_dump(),
    }

    await _store_analysis_metadata(
        user_id=user_id, session_id=session_id,
        document_name=document_name,
        verdict=verdict.verdict,
        risk_count=len(verdict.risks),
        benefit_count=len(verdict.benefits),
        char_count=len(document),
    )

    return result


def _fallback_scoring(state: dict) -> dict:
    """Fallback if ConsensusOrchestrator fails — collect raw persona outputs."""
    all_risks = []
    for key in ["legal_risks", "financial_risks", "compliance_risks", "insurance_risks"]:
        raw = state.get(key, "")
        if not raw:
            continue
        try:
            raw_s = json.dumps(raw) if isinstance(raw, dict) else str(raw)
            clean = raw_s.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            parsed = json.loads(clean)
            risks = parsed.get("risks", []) if isinstance(parsed, dict) else parsed
            if isinstance(risks, list):
                all_risks.extend(risks)
        except Exception as e:
            logger.warning(f"Fallback parse failed for {key}: {e}")

    if not all_risks:
        return {
            "status": "INFO",
            "message": (
                "No clear risk clauses were detected. "
                "This does NOT guarantee safety — it may indicate limited or informal document content."
            ),
        }

    scoring = score_risks(all_risks)
    return {
        "status": "RISK_ANALYSIS",
        "personas_used": ["legal", "financial", "compliance", "insurance"],
        "risk_analysis": scoring,
    }


# ──────────────────────────────────────────────────────────────────────────────
# Scenario analysis (async)
# ──────────────────────────────────────────────────────────────────────────────

async def _run_scenario_analysis(query: str, user_id: str, session_id: str) -> dict:
    """Handles hypothetical / situational questions."""
    await _ensure_session(user_id, session_id)
    await _clear_state_keys(user_id, session_id, [SCENARIO_OUTPUT_KEY])

    prompt = f"""
The user has described this situation or asked this question:

"{query}"

Analyze this scenario thoroughly. Give them structured, actionable intelligence.
"""
    await _run_agent(scenario_runner, prompt, user_id, session_id)

    state = await _get_session_state(user_id, session_id)
    scenario = _parse_json_from_state(state, SCENARIO_OUTPUT_KEY, ScenarioAnalysis)

    if scenario:
        return {
            "status": "SCENARIO_ANALYSIS",
            "scenario_analysis": scenario.model_dump(),
        }

    # Fallback to plain text
    reply = await _run_agent(utility_runner, f"""
You are Guardian. The user asked: "{query}"

Give them a thorough, structured analysis of their situation.
Cover: their position, options available, risks of each option, recommended next steps.
End with: "This is general information only. Please consult a qualified attorney."
""", user_id, session_id)

    return {"status": "INFO", "message": reply}


# ──────────────────────────────────────────────────────────────────────────────
# Strategy agent — adversarial guidance (Task 5, async)
# ──────────────────────────────────────────────────────────────────────────────

async def _run_strategy_agent(
    verdict: ConsensusVerdict,
    document: str,
    user_id: str,
    session_id: str,
) -> Optional[ActionableGuidance]:
    """
    Runs StrategyAgent against a completed adversarial verdict.
    Returns an ActionableGuidance object, or None on failure.
    Called only when verdict.adversarial is True.
    """
    strategy_session_id = f"{session_id}_strategy"
    await _ensure_session(user_id, strategy_session_id)
    await _clear_state_keys(user_id, strategy_session_id, [STRATEGY_OUTPUT_KEY])

    doc_excerpt = document[:10_000] if len(document) > 10_000 else document

    strategy_prompt = f"""RISK VERDICT (JSON):
{verdict.model_dump_json()}

DOCUMENT (excerpt for reference):
{doc_excerpt}

Produce jurisdiction-aware, document-type-specific actionable guidance for this adversarial document.
"""
    await _collect_text_async(
        strategy_runner.run_async(
            user_id=user_id,
            session_id=strategy_session_id,
            new_message=Content(role="user", parts=[Part(text=strategy_prompt)]),
        )
    )

    state = await _get_session_state(user_id, strategy_session_id)
    guidance = _parse_json_from_state(state, STRATEGY_OUTPUT_KEY, ActionableGuidance)
    if guidance is None:
        logger.warning("StrategyAgent produced no valid output — guidance will be null")
    else:
        logger.info(
            f"StrategyAgent complete | attorney_type={guidance.attorney_type!r} | "
            f"urgency_window={guidance.urgency_window!r}"
        )
    return guidance


# ──────────────────────────────────────────────────────────────────────────────
# Refinement loop helpers (Task 4, async)
# ──────────────────────────────────────────────────────────────────────────────

def _extract_qa_pairs(conversation_history: list) -> str:
    """Pulls user answers to clarifying questions out of conversation_history."""
    qa_lines = [
        msg.get("content", "")
        for msg in (conversation_history or [])
        if msg.get("role") == "user"
        and msg.get("content", "").startswith("Regarding your question")
    ]
    return "\n".join(qa_lines) if qa_lines else "No specific answers recorded."


async def _is_refinement_answer(
    query: str,
    conversation_history: list,
    user_id: str,
    session_id: str,
) -> bool:
    """
    True when the user is answering a clarifying question from a prior verdict.
    Detection: frontend always prefixes answers with 'Regarding your question'.
    Guard: session must already have a final_verdict to refine.
    """
    if not query.strip().startswith("Regarding your question"):
        return False
    state = await _get_session_state(user_id, session_id)
    return bool(state.get(ORCHESTRATOR_OUTPUT_KEY))


async def _run_refinement(
    user_query: str,
    conversation_history: Optional[list],
    file_context: str,
    user_id: str,
    session_id: str,
) -> dict:
    """
    Refines an existing ConsensusVerdict based on user answers to clarifying questions.

    Reads prior verdict from session state, extracts Q&A pairs from conversation_history,
    runs VerdictRefiner, writes updated verdict back to session, returns RISK_ANALYSIS dict.
    """
    state = await _get_session_state(user_id, session_id)
    prior_verdict_raw = state.get(ORCHESTRATOR_OUTPUT_KEY, "")
    if not prior_verdict_raw:
        return {
            "status": "INFO",
            "message": "No prior analysis found in this session. Please upload a document and run an analysis first.",
        }

    qa_pairs = _extract_qa_pairs(conversation_history)
    doc_excerpt = file_context[:8_000] if len(file_context) > 8_000 else file_context

    refiner_prompt = f"""PRIOR VERDICT (JSON):
{prior_verdict_raw}

USER'S ANSWERS TO CLARIFYING QUESTIONS:
{qa_pairs}

Current message from user: {user_query}

DOCUMENT (excerpt for reference):
{doc_excerpt}

Refine the verdict based on the user's answers. Return the updated ConsensusVerdict JSON.
"""

    await _clear_state_keys(user_id, session_id, [REFINER_OUTPUT_KEY])
    await _collect_text_async(
        refiner_runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=Content(role="user", parts=[Part(text=refiner_prompt)]),
        )
    )

    state = await _get_session_state(user_id, session_id)
    refined = _parse_json_from_state(state, REFINER_OUTPUT_KEY, ConsensusVerdict)

    if refined is None:
        # Refiner produced no valid JSON — fall back to dialogue
        logger.warning("VerdictRefiner produced no valid output — falling back to dialogue")
        reply = await _run_agent(dialogue_runner, f"""
The user answered a clarifying question about their document analysis.
User's message: "{user_query}"
Prior analysis summary (truncated): {prior_verdict_raw[:800]}
Incorporate their answer and give updated guidance.
""", user_id, session_id)
        return {"status": "INFO", "message": reply}

    # ── Strategy agent (adversarial only) ────────────────────────────────────
    if refined.adversarial:
        logger.info("Refined verdict is adversarial — running StrategyAgent")
        guidance = await _run_strategy_agent(refined, file_context, user_id, session_id)
        if guidance:
            refined.guidance = guidance

    # Write refined verdict back to final_verdict so future refinements chain correctly
    try:
        session = await session_service.get_session(
            app_name=APP_NAME, user_id=user_id, session_id=session_id,
        )
        if session:
            session.state[ORCHESTRATOR_OUTPUT_KEY] = refined.model_dump_json()
    except Exception as e:
        logger.warning(f"Could not update final_verdict after refinement: {e}")

    logger.info(
        f"Refinement complete | verdict={refined.verdict} | "
        f"remaining_questions={len(refined.clarifying_questions)}"
    )

    return {
        "status": "RISK_ANALYSIS",
        "personas_used": refined.personas_used,
        "risk_analysis": refined.model_dump(),
    }


# ──────────────────────────────────────────────────────────────────────────────
# Main entry point (async)
# ──────────────────────────────────────────────────────────────────────────────

async def run_clauseguard_consensus(
    user_query: str,
    file_context: str,
    persona_mode: Optional[str] = "auto",
    user_id: str = USER_ID,
    session_id: str = SESSION_ID,
    conversation_history: Optional[list] = None,
    document_name: str = "Unknown document",
) -> dict:
    """
    Main entry point called by FastAPI.
    Routes to the appropriate handler based on intent.
    """
    await _ensure_session(user_id, session_id)

    # ── VERDICT REFINEMENT (answering clarifying questions from prior analysis) ─
    if await _is_refinement_answer(user_query, conversation_history, user_id, session_id):
        logger.info(f"Intent=VERDICT_REFINEMENT | query_len={len(user_query)}")
        return await _run_refinement(user_query, conversation_history, file_context, user_id, session_id)

    has_doc = is_document_sufficient(file_context)
    intent  = _classify_intent(user_query, has_doc)

    logger.info(f"Intent={intent} | has_doc={has_doc} | query_len={len(user_query)}")

    # ── ADVERSARIAL DOCUMENT ──────────────────────────────────────────────────
    if intent == INTENT_ADVERSARIAL:
        return await _run_risk_pipeline(
            document=file_context,
            persona_mode="full",
            user_id=user_id,
            session_id=session_id,
            document_name=document_name,
        )

    # ── SCENARIO / HYPOTHETICAL ───────────────────────────────────────────────
    if intent == INTENT_SCENARIO:
        return await _run_scenario_analysis(user_query, user_id, session_id)

    # ── GENERAL CHAT ──────────────────────────────────────────────────────────
    if intent == INTENT_CHAT:
        if _is_situation_description(user_query):
            prompt = f"""
You are Guardian in PREVENTIVE MODE. The user described this situation:
"{user_query}"

Explain:
1. What documents are typically involved
2. Common risks BEFORE commitment
3. Irreversible or costly mistakes people make
4. What to watch out for

Be structured and specific. End with: "This is general information only. Please consult a qualified attorney."
"""
            reply = await _run_agent(utility_runner, prompt, user_id, session_id)
            return {"status": "PREVENTIVE_GUIDANCE", "message": reply}

        prompt = f"""
You are Guardian, a risk intelligence assistant.
The user sent: "{user_query}"

Respond helpfully. If they ask what you can do, explain that you:
- Analyze contracts and documents for risks AND benefits
- Handle adversarial documents (lawsuits, C&D letters) with actionable guidance
- Answer hypothetical legal scenarios
- Provide preventive guidance before signing anything

Keep it concise and professional.
"""
        reply = await _run_agent(utility_runner, prompt, user_id, session_id)
        return {"status": "INFO", "message": reply}

    # ── DOCUMENT SUMMARY ──────────────────────────────────────────────────────
    if intent == INTENT_SUMMARY:
        prompt = f"""
Provide a neutral, structured explanation of this document.
Cover: purpose, parties, scope, duration (if stated), key obligations on each party.
Do NOT assess risk. Do NOT give advice.

DOCUMENT:
{file_context}
"""
        summary = await _run_agent(utility_runner, prompt, user_id, session_id)
        return {"status": "INFO", "message": summary}

    # ── FOLLOW-UP / DIALOGUE ──────────────────────────────────────────────────
    if intent == INTENT_FOLLOWUP:
        history_context = ""
        if conversation_history:
            history_context = "\n\nCONVERSATION HISTORY:\n" + "\n".join(
                f"{m['role'].upper()}: {m['content']}" for m in conversation_history[-6:]
            )

        prompt = f"""
The user has a follow-up question about their document.

User Question: "{user_query}"
{history_context}

Document:
{file_context}

Answer based on the document and conversation history.
If the answer is not in the document, say so clearly.
Be helpful, specific, and plain-English.
"""
        reply = await _run_agent(dialogue_runner, prompt, user_id, session_id)
        return {"status": "INFO", "message": reply}

    # ── PERSONA SELECTION (auto mode, no persona chosen yet) ──────────────────
    if intent == INTENT_RISK and persona_mode == "auto":
        return {
            "status": "AWAITING_PERSONA_SELECTION",
            "message": "How would you like this document analyzed?",
            "persona_options": ["Legal", "Financial", "Compliance", "Full Analysis"],
        }

    # ── FULL RISK ANALYSIS ────────────────────────────────────────────────────
    return await _run_risk_pipeline(
        document=file_context,
        persona_mode=persona_mode or "full",
        user_id=user_id,
        session_id=session_id,
        document_name=document_name,
    )


# ──────────────────────────────────────────────────────────────────────────────
# Streaming pipeline — async generator, yields progress events stage by stage
# ──────────────────────────────────────────────────────────────────────────────

async def run_clauseguard_streaming(
    user_query: str,
    file_context: str,
    persona_mode: Optional[str] = "auto",
    user_id: str = USER_ID,
    session_id: str = SESSION_ID,
    conversation_history: Optional[list] = None,
    document_name: str = "Unknown document",
):
    """
    Async generator version of run_clauseguard_consensus.
    Yields SSE-compatible dicts as each pipeline stage completes.

    For non-risk intents (chat, summary, scenario) it yields a single
    'complete' event immediately — streaming only adds value for the
    multi-stage risk pipeline.

    Yields dicts:
      {"type": "progress",       "stage": str, "message": str}
      {"type": "partial_result", "stage": str, "data": dict}
      {"type": "complete",       "data": dict}
      {"type": "error",          "message": str}
    """
    import time

    await _ensure_session(user_id, session_id)

    # ── Refinement check (must happen before intent classification) ───────────
    if await _is_refinement_answer(user_query, conversation_history or [], user_id, session_id):
        logger.info(f"[stream] Intent=VERDICT_REFINEMENT | query_len={len(user_query)}")
        yield {"type": "progress", "stage": "consensus", "message": "Refining verdict based on your answers..."}
        try:
            result = await _run_refinement(user_query, conversation_history, file_context, user_id, session_id)
            yield {"type": "complete", "data": {**result, "status_code": "success"}}
        except Exception as e:
            yield {"type": "error", "message": str(e)}
        return

    has_doc = is_document_sufficient(file_context)
    intent  = _classify_intent(user_query, has_doc)

    logger.info(f"[stream] Intent={intent} | has_doc={has_doc}")

    # ── Non-risk intents: run normally, yield single complete event ───────────
    if intent not in (INTENT_RISK, INTENT_ADVERSARIAL):
        try:
            result = await run_clauseguard_consensus(
                user_query=user_query,
                file_context=file_context,
                persona_mode=persona_mode,
                user_id=user_id,
                session_id=session_id,
                conversation_history=conversation_history,
                document_name=document_name,
            )
            yield {"type": "complete", "data": {**result, "status_code": "success"}}
        except Exception as e:
            yield {"type": "error", "message": str(e)}
        return

    # ── Persona selection prompt ──────────────────────────────────────────────
    if intent == INTENT_RISK and persona_mode == "auto":
        yield {"type": "complete", "data": {
            "status": "AWAITING_PERSONA_SELECTION",
            "message": "How would you like this document analyzed?",
            "persona_options": ["Legal", "Financial", "Compliance", "Full Analysis"],
            "status_code": "success",
        }}
        return

    # ── Full streaming risk pipeline ──────────────────────────────────────────
    effective_mode = "full" if intent == INTENT_ADVERSARIAL else (persona_mode or "full")

    await _ensure_session(user_id, session_id)
    await _clear_state_keys(user_id, session_id, [
        "legal_risks", "financial_risks", "compliance_risks",
        "insurance_risks", "final_verdict",
    ])

    # Stage 1: Tools (instant — pure Python)
    yield {"type": "progress", "stage": "tools", "message": "Pre-analyzing document structure..."}
    t0 = time.time()
    try:
        clauses      = extract_clauses(file_context)
        jurisdiction = detect_jurisdiction(file_context)
        patterns     = flag_dangerous_patterns(file_context)
        density      = calculate_obligation_density(file_context)
        n_patterns   = patterns.get("patterns_triggered", 0)
        n_clauses    = clauses.get("_summary", {}).get("total_clause_types_found", 0)
        yield {
            "type": "partial_result",
            "stage": "tools",
            "data": {
                "clauses_found": n_clauses,
                "dangerous_patterns": n_patterns,
                "jurisdiction": jurisdiction.get("jurisdiction_detected"),
                "obligation_balance": density.get("balance_verdict"),
            }
        }
        yield {
            "type": "progress",
            "stage": "tools",
            "message": f"Found {n_clauses} clause types, {n_patterns} dangerous patterns in {time.time()-t0:.1f}s"
        }
    except Exception as e:
        logger.warning(f"Tool pre-computation failed: {e}")
        clauses = jurisdiction = patterns = density = {}
        yield {"type": "progress", "stage": "tools", "message": "Document structure analysis complete"}

    # Build tool summary for injection into agent messages
    tool_summary = f"""
PRE-COMPUTED TOOL ANALYSIS (use this as evidence):

CLAUSE EXTRACTION:
{json.dumps(clauses.get('_summary', {}), indent=2)}
High-risk clause types found: {clauses.get('_summary', {}).get('high_risk_categories_present', [])}

DANGEROUS PATTERNS DETECTED ({patterns.get('patterns_triggered', 0)} of {patterns.get('patterns_checked', 0)} checked):
{json.dumps([{'name': m['pattern_name'], 'danger': m['danger_level'], 'irreversible': m['irreversible'], 'text': m['matched_sentences'][:1]} for m in patterns.get('matches', [])], indent=2)}

JURISDICTION:
{json.dumps({'detected': jurisdiction.get('jurisdiction_detected'), 'legal_system': jurisdiction.get('legal_system'), 'risk_flags': jurisdiction.get('risk_flags', [])}, indent=2)}

OBLIGATION DENSITY:
{json.dumps({'balance': density.get('balance_verdict'), 'party_balance': density.get('party_balance_verdict'), 'obligation_ratio': density.get('obligation_ratio')}, indent=2)}
"""

    # Stage 2: Expert panel (parallel — the longest stage)
    yield {
        "type": "progress",
        "stage": "experts",
        "message": "4 expert agents analyzing in parallel (Legal, Financial, Compliance, Insurance)..."
    }
    t_experts = time.time()

    message = Content(
        role="user",
        parts=[Part(text=f"Analyze the following document for risks and benefits.\n\n{tool_summary}\n\nDOCUMENT:\n{file_context}")]
    )

    try:
        await _collect_text_async(
            _stream_panel_runner.run_async(user_id=user_id, session_id=session_id, new_message=message)
        )
    except SystemExit as e:
        logger.error(f"[stream] Expert panel raised SystemExit: {e}")
        yield {"type": "error", "message": "Expert panel failed (SystemExit — check API quota/credentials)"}
        return
    except Exception as e:
        logger.error(f"[stream] Expert panel failed: {e}", exc_info=True)
        yield {"type": "error", "message": f"Expert panel failed: {str(e)}"}
        return

    # Read expert outputs
    state = await _get_session_state(user_id, session_id)
    legal_out      = state.get("legal_risks", "")
    financial_out  = state.get("financial_risks", "")
    compliance_out = state.get("compliance_risks", "")
    insurance_out  = state.get("insurance_risks", "")

    # Parse expert outputs to count findings for the progress update
    expert_summary = {}
    for key, raw in [("legal", legal_out), ("financial", financial_out),
                     ("compliance", compliance_out), ("insurance", insurance_out)]:
        try:
            raw_s = json.dumps(raw) if isinstance(raw, dict) else str(raw)
            clean = raw_s.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            parsed = json.loads(clean)
            expert_summary[key] = {
                "risks": len(parsed.get("risks", [])),
                "benefits": len(parsed.get("benefits", [])),
            }
        except Exception:
            expert_summary[key] = {"risks": 0, "benefits": 0}

    total_raw_risks = sum(v["risks"] for v in expert_summary.values())
    total_raw_benefits = sum(v["benefits"] for v in expert_summary.values())

    yield {
        "type": "partial_result",
        "stage": "experts",
        "data": {
            "expert_summary": expert_summary,
            "total_raw_risks": total_raw_risks,
            "total_raw_benefits": total_raw_benefits,
            "elapsed": round(time.time() - t_experts, 1),
        }
    }
    yield {
        "type": "progress",
        "stage": "experts",
        "message": f"Experts found {total_raw_risks} risks and {total_raw_benefits} benefits in {time.time()-t_experts:.1f}s — validating..."
    }

    # Stage 3: Python critic — grounding check (replaces CriticAgent LLM call)
    yield {"type": "progress", "stage": "critic", "message": "Grounding check: verifying all findings against document..."}
    t_critic = time.time()

    state = await _get_session_state(user_id, session_id)
    persona_keys = ["legal_risks", "financial_risks", "compliance_risks", "insurance_risks"]
    persona_outputs = {k: state.get(k, "") for k in persona_keys}

    corrected, changes_made = _python_critic(persona_outputs, file_context)
    logger.info(f"[stream] Python critic: {len(changes_made)} removal(s) in {time.time()-t_critic:.3f}s")
    for c in changes_made:
        logger.info(f"  → {c}")

    logger.info("[stream] Applying critic corrections to session state...")
    await _apply_critic_corrections(user_id, session_id, corrected)
    logger.info("[stream] Critic corrections applied.")

    yield {
        "type": "partial_result",
        "stage": "critic",
        "data": {
            "changes_count": len(changes_made),
            "changes": changes_made[:5],
            "elapsed": round(time.time() - t_critic, 3),
        }
    }
    yield {
        "type": "progress",
        "stage": "critic",
        "message": f"Grounding check: {len(changes_made)} ungrounded finding(s) removed in {time.time()-t_critic:.3f}s — synthesizing verdict..."
    }

    # Stage 4: Consensus orchestrator
    yield {"type": "progress", "stage": "consensus", "message": "Synthesizing final verdict..."}
    t_consensus = time.time()

    # Re-read corrected state for orchestrator
    state = await _get_session_state(user_id, session_id)
    legal_out      = state.get("legal_risks", "No legal findings.")
    financial_out  = state.get("financial_risks", "No financial findings.")
    compliance_out = state.get("compliance_risks", "No compliance findings.")
    insurance_out  = state.get("insurance_risks", "No insurance findings.")

    # Ensure state values are strings (guard against dict values from output_schema)
    def _to_str(v):
        if isinstance(v, str):
            return v
        try:
            return json.dumps(v)
        except Exception:
            return str(v)

    legal_out      = _to_str(legal_out)
    financial_out  = _to_str(financial_out)
    compliance_out = _to_str(compliance_out)
    insurance_out  = _to_str(insurance_out)

    consensus_prompt_text = f"""Here are the validated risk analyses from four expert personas.
Synthesize them into a single unified verdict.

LEGAL EXPERT FINDINGS:
{legal_out}

FINANCIAL EXPERT FINDINGS:
{financial_out}

COMPLIANCE EXPERT FINDINGS:
{compliance_out}

INSURANCE EXPERT FINDINGS:
{insurance_out}
"""
    logger.info(f"[stream] Starting consensus orchestrator (prompt_len={len(consensus_prompt_text)})...")
    consensus_msg = Content(role="user", parts=[Part(text=consensus_prompt_text)])
    try:
        await _collect_text_async(
            _stream_orch_runner.run_async(user_id=user_id, session_id=session_id, new_message=consensus_msg)
        )
    except SystemExit as e:
        logger.error(f"[stream] Consensus orchestrator raised SystemExit: {e}")
        yield {"type": "error", "message": "Consensus stage failed (SystemExit — check API quota/credentials)"}
        return
    except Exception as e:
        logger.error(f"[stream] Consensus orchestrator failed: {e}", exc_info=True)
        yield {"type": "error", "message": f"Consensus stage failed: {str(e)}"}
        return
    logger.info(f"[stream] Consensus orchestrator complete in {time.time()-t_consensus:.1f}s")

    # Parse final verdict
    state = await _get_session_state(user_id, session_id)
    verdict = _parse_json_from_state(state, ORCHESTRATOR_OUTPUT_KEY, ConsensusVerdict)

    if verdict is None:
        logger.warning("[stream] Falling back to manual scoring")
        result = _fallback_scoring(state)
        yield {"type": "complete", "data": {**result, "status_code": "success"}}
        return

    # Stage 5 (adversarial only): StrategyAgent
    if verdict.adversarial:
        yield {
            "type": "progress",
            "stage": "strategy",
            "message": "Generating jurisdiction-aware legal strategy playbook...",
        }
        t_strategy = time.time()
        guidance = await _run_strategy_agent(verdict, file_context, user_id, session_id)
        if guidance:
            verdict.guidance = guidance
            yield {
                "type": "partial_result",
                "stage": "strategy",
                "data": {
                    "attorney_type": guidance.attorney_type,
                    "urgency_window": guidance.urgency_window,
                    "elapsed": round(time.time() - t_strategy, 1),
                },
            }
        yield {
            "type": "progress",
            "stage": "strategy",
            "message": f"Legal strategy ready in {time.time()-t_strategy:.1f}s",
        }

    logger.info(f"[stream] Complete | verdict={verdict.verdict} | risks={len(verdict.risks)} | elapsed={time.time()-t0:.1f}s")
    result = {
        "status": "RISK_ANALYSIS",
        "personas_used": verdict.personas_used,
        "risk_analysis": verdict.model_dump(),
    }
    await _store_analysis_metadata(
        user_id=user_id, session_id=session_id,
        document_name=document_name,
        verdict=verdict.verdict,
        risk_count=len(verdict.risks),
        benefit_count=len(verdict.benefits),
        char_count=len(file_context),
    )
    yield {
        "type": "complete",
        "data": {**result, "status_code": "success"}
    }


# ──────────────────────────────────────────────────────────────────────────────
# Phase 7 — Comparative Contract Analysis (async)
# ──────────────────────────────────────────────────────────────────────────────

COMPARE_OUTPUT_KEY = "comparison_verdict"

_COMPARE_INSTRUCTION = """
You are a contract comparison expert. You have been given two versions of a contract.

Your job is to produce a structured comparison showing:
1. What clauses changed between v1 and v2
2. Whether the contract got riskier or safer overall
3. New risks introduced in v2 that were not in v1
4. Risks from v1 that were resolved or removed in v2
5. Risks that remain unchanged

OUTPUT — respond with ONLY this JSON object, no markdown, no code fences:
{
  "net_risk_change": "<IMPROVED|UNCHANGED|WORSENED|SIGNIFICANTLY_WORSENED>",
  "new_risks_introduced": [
    {
      "clause_text": "<exact text from v2>",
      "risk_type": "<type>",
      "severity": "<LOW|MEDIUM|HIGH|CRITICAL>",
      "irreversible": <true|false>,
      "explanation": "<why this is a new risk>",
      "recommendation": "<what to do>",
      "persona": "comparative",
      "weight": <0.0-1.0>
    }
  ],
  "risks_resolved": [
    {
      "clause_text": "<exact text from v1 that was removed/improved>",
      "risk_type": "<type>",
      "severity": "<original severity>",
      "irreversible": false,
      "explanation": "<what was resolved>",
      "recommendation": "No action needed — this risk was resolved.",
      "persona": "comparative",
      "weight": 0.0
    }
  ],
  "risks_unchanged": [
    {
      "clause_text": "<exact text>",
      "risk_type": "<type>",
      "severity": "<severity>",
      "irreversible": <true|false>,
      "explanation": "<still present>",
      "recommendation": "<what to do>",
      "persona": "comparative",
      "weight": <0.0-1.0>
    }
  ],
  "clause_changes": [
    {
      "change_type": "<ADDED|REMOVED|MODIFIED>",
      "old_text": "<text from v1 or null>",
      "new_text": "<text from v2 or null>",
      "section": "<section name if identifiable>"
    }
  ],
  "recommendation": "<overall recommendation — should they sign v2?>",
  "summary": "<2-3 sentence plain English summary of what changed and whether it's better or worse>"
}

RULES:
- Focus on MATERIAL changes — ignore formatting, numbering, or trivial wording.
- new_risks_introduced: only risks that are genuinely NEW in v2.
- risks_resolved: only risks from v1 that are genuinely gone or significantly improved in v2.
- Be precise about clause_text — quote directly from the document.
"""

compare_agent = LlmAgent(
    name="CompareAgent",
    model=MODEL,
    description="Compares two contract versions and identifies risk changes.",
    instruction=_COMPARE_INSTRUCTION,
    output_key=COMPARE_OUTPUT_KEY,
)

compare_runner = Runner(
    agent=compare_agent,
    app_name=APP_NAME,
    session_service=session_service,
)


async def run_comparative_analysis(
    content_v1: str,
    content_v2: str,
    filename_v1: str = "Version 1",
    filename_v2: str = "Version 2",
    user_id: str = USER_ID,
    session_id: str = SESSION_ID,
) -> dict:
    """
    Phase 7 — Compares two contract versions.
    Returns a ComparisonVerdict with new risks, resolved risks, and net change.
    """
    compare_session_id = f"{session_id}_compare"
    await _ensure_session(user_id, compare_session_id)
    await _clear_state_keys(user_id, compare_session_id, [COMPARE_OUTPUT_KEY])

    # Also run the full risk pipeline on v2 so we have a complete risk picture
    v2_risks_result = await _run_risk_pipeline(
        document=content_v2,
        persona_mode="full",
        user_id=user_id,
        session_id=f"{session_id}_v2",
        document_name=f"{filename_v2} (comparison)",
    )

    prompt = f"""Compare these two contract versions and identify all material changes.

=== VERSION 1: {filename_v1} ===
{content_v1}

=== VERSION 2: {filename_v2} ===
{content_v2}

Produce the structured comparison JSON as instructed.
"""
    message = Content(role="user", parts=[Part(text=prompt)])
    await _collect_text_async(
        compare_runner.run_async(
            user_id=user_id,
            session_id=compare_session_id,
            new_message=message,
        )
    )

    state = await _get_session_state(user_id, compare_session_id)
    comparison = _parse_json_from_state(state, COMPARE_OUTPUT_KEY, ComparisonVerdict)

    if comparison is None:
        return {
            "status": "ERROR",
            "message": "Comparison analysis failed to produce a structured result.",
        }

    return {
        "status": "COMPARISON",
        "comparison": comparison.model_dump(),
        "v2_full_analysis": v2_risks_result.get("risk_analysis"),
        "filenames": {"v1": filename_v1, "v2": filename_v2},
    }


# ──────────────────────────────────────────────────────────────────────────────
# ADK entry point (used by `adk run` / `adk web`)
# ──────────────────────────────────────────────────────────────────────────────
root_agent = ruleguard_pipeline
