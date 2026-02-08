import os
import json
from dotenv import load_dotenv

from google.adk.agents import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions.in_memory_session_service import InMemorySessionService
from google.genai.types import Content, Part

from guardian.personas import legal, financial, insurance, compliance
from guardian.risk_scoring import score_risks   # 🔥 A4 IMPORT

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# ==================================================
# CONSTANTS (IMPORTANT FOR ADK SESSION STABILITY)
# ==================================================

USER_ID = "clauseguard_user"
SESSION_ID = "clauseguard_session"

# ==================================================
# PERSONA REGISTRY (CONFIG ONLY)
# ==================================================

PERSONA_MAP = {
    "legal": legal,
    "financial": financial,
    "insurance": insurance,
    "compliance": compliance,
}

# ==================================================
# SINGLE CORE AGENT (ONLY ONE LLM AGENT)
# ==================================================

clause_guard = LlmAgent(
    name="ClauseGuard_Core",
    model="gemini-2.0-flash",
    instruction="""
You are ClauseGuard — a data-centric risk interpretation system.

Your mission is to prevent users from unknowingly committing
incorrect, dangerous, or irreversible data in high-stakes workflows.

You operate in TWO MODES:

PREVENTIVE MODE (no document provided):
- Educate users about risks before commitment
- Explain what clauses, data fields, or assumptions matter
- NEVER refuse to help

ANALYSIS MODE (document provided):
- Perform semantic risk analysis
- Identify hidden obligations and fine print
- Quote exact clauses
- Explain consequences clearly

You may internally adopt expert personas:
- Legal
- Financial
- Insurance
- Compliance

You are NOT a licensed professional.
Your role is risk awareness, not advice.
"""
)

# ==================================================
# RUNNER (REQUIRED FOR PROGRAMMATIC EXECUTION)
# ==================================================

session_service = InMemorySessionService()
session_service.create_session_sync(
    app_name="guardian_app",
    user_id=USER_ID,
    session_id=SESSION_ID,
)

runner = Runner(
    agent=clause_guard,
    app_name="guardian_app",
    session_service=session_service,
)

# ==================================================
# PERSONA SELECTION FOR CONSENSUS
# ==================================================

def determine_required_personas(document: str) -> list[str]:
    """
    Decide which personas must review this document.
    Legal is always included.
    """
    text = document.lower()
    personas = {"legal"}

    if any(w in text for w in ["tax", "fee", "payment", "penalty", "gst", "vat"]):
        personas.add("financial")
    if any(w in text for w in ["insurance", "policy", "claim", "coverage"]):
        personas.add("insurance")
    if any(w in text for w in ["data", "privacy", "ai training", "gdpr"]):
        personas.add("compliance")

    return list(personas)

# ==================================================
# INTERNAL PERSONA PASS (A3 STRUCTURED OUTPUT)
# ==================================================

def _run_persona_pass(persona, document: str) -> list[dict]:
    """
    Runs one expert reasoning pass and returns STRUCTURED RISK OBJECTS.
    SAME agent, SAME session (ADK-correct).
    """

    prompt = f"""
[SYSTEM MODE: ACTIVATE PERSONA '{persona.NAME}']
{persona.SYSTEM_INSTRUCTION}

[DOCUMENT UNDER REVIEW]
{document}

TASK:
Extract ONLY risks from your domain.

Return ONLY a valid JSON array.
NO markdown. NO explanations.

Each object MUST follow this schema exactly:

{{
  "risk_id": "{persona.NAME.upper()}-###",
  "persona": "{persona.NAME}",
  "clause_text": "",
  "risk_summary": "",
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "irreversible": true | false,
  "risk_category": "",
  "why_it_matters": "",
  "user_impact": "",
  "confidence": 0.0
}}
"""

    message = Content(
        role="user",
        parts=[Part(text=prompt)],
    )

    events = runner.run(
        user_id=USER_ID,
        session_id=SESSION_ID,
        new_message=message,
    )

    raw_output = ""
    for event in events:
        if event.content and event.content.parts:
            for part in event.content.parts:
                if part.text:
                    raw_output += part.text

    try:
        # Better JSON extraction in case of markdown wrapping
        clean_output = raw_output.strip()
        if clean_output.startswith("```json"):
            clean_output = clean_output.split("```json")[1].split("```")[0].strip()
        elif clean_output.startswith("```"):
            clean_output = clean_output.split("```")[1].split("```")[0].strip()
            
        return json.loads(clean_output)
    except (json.JSONDecodeError, IndexError, ValueError):
        # Hard guardrail: never crash the pipeline
        return []

# ==================================================
# 🔥 MULTI-PERSONA CONSENSUS + A4 SCORING
# ==================================================

def run_clauseguard_consensus(user_query: str, file_context: str):
    """
    Full ClauseGuard pipeline:
    - Multi-persona risk extraction (A2)
    - Structured risk objects (A3)
    - Risk scoring & verdict (A4)
    """

    persona_keys = determine_required_personas(file_context)
    persona_modules = [PERSONA_MAP[k] for k in persona_keys]

    print(f"🧠 [System] Personas engaged: {', '.join(persona_keys)}")

    all_risks = []

    # --- Persona Passes ---
    for persona in persona_modules:
        risks = _run_persona_pass(
            persona=persona,
            document=file_context
        )
        all_risks.extend(risks)

    # --- A4: Risk Scoring & Verdict ---
    scoring = score_risks(all_risks)

    # --- Human-Readable Synthesis ---
    synthesis_prompt = f"""
You are ClauseGuard.

Below is a list of structured risk objects and their scores:

{scoring}

TASK:
1. Explain the most dangerous risks in plain language
2. Clearly justify the final verdict
3. Highlight irreversible consequences
4. Keep it concise and non-technical

Produce a short user-facing explanation.
"""

    message = Content(
        role="user",
        parts=[Part(text=synthesis_prompt)],
    )

    events = runner.run(
        user_id=USER_ID,
        session_id=SESSION_ID,
        new_message=message,
    )

    summary = ""
    for event in events:
        if event.content and event.content.parts:
            for part in event.content.parts:
                if part.text:
                    summary += part.text

    return {
        "document_type": "unknown",
        "personas_used": persona_keys,
        "risk_count": len(all_risks),
        "risk_analysis": scoring,
        "summary": summary.strip(),
    }

# ==================================================
# ADK ENTRY POINT
# ==================================================

root_agent = clause_guard