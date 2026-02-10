import os
import json
from dotenv import load_dotenv
from typing import List, Optional

from google.adk.agents import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions.in_memory_session_service import InMemorySessionService
from google.genai.types import Content, Part

from guardian.personas import legal, financial, insurance, compliance
from guardian.risk_scoring import score_risks

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

# ==================================================
# CONSTANTS
# ==================================================

USER_ID = "clauseguard_user"
SESSION_ID = "clauseguard_session"

INTENT_SUMMARY = "DOCUMENT_SUMMARY"
INTENT_RISK = "RISK_ASSESSMENT"
INTENT_FOLLOWUP = "FOLLOW_UP"
INTENT_CHAT = "GENERAL_CHAT"

ALLOWED_PERSONAS = {"legal", "financial", "insurance", "compliance", "full", "auto"}

# ==================================================
# PERSONA REGISTRY
# ==================================================

PERSONA_MAP = {
    "legal": legal,
    "financial": financial,
    "insurance": insurance,
    "compliance": compliance,
}

# ==================================================
# CORE AGENT
# ==================================================

clause_guard = LlmAgent(
    name="ClauseGuard_Core",
    model="gemini-3-flash-preview",
    instruction="""
You are ClauseGuard — a data-centric risk intelligence system for high-stakes documents.

You help users understand:
• What a document is about
• What benefits it provides
• What risks it introduces
• Which risks are irreversible or dangerous

You do NOT give advice.
You do NOT recommend actions.
You provide structured risk awareness only.

You must respect user intent.
If the user asks for a summary, do NOT provide risk verdicts.
If the user asks about risk, explain risk clearly.
If the input is not a document, do NOT analyze it.
"""
)

# ==================================================
# RUNNER SETUP
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
# GUARDS & INTENT DETECTION
# ==================================================

def is_document_sufficient(text: str) -> bool:
    if not text or len(text.strip()) < 50:
        return False

    keywords = [
        "agreement", "offer", "shall", "may", "terms", "conditions",
        "liability", "employment", "internship", "payment",
        "termination", "contract", "policy", "confidentiality"
    ]
    return any(k in text.lower() for k in keywords) or len(text.strip()) > 150


def is_followup_query(query: str) -> bool:
    triggers = [
        "explain", "clarify", "what does this mean", "why",
        "who are the parties", "when does it end", "benefits", "risks"
    ]
    return any(t in query.lower() for t in triggers)

def is_situation_description(query: str) -> bool:
    """Detects if user is describing a real-world context without a document."""
    triggers = [
        "i want to", "i plan to", "i am planning",
        "i don't have a document", "before i",
        "what should i know", "what documents",
        "requirements", "process"
    ]
    q = query.lower()
    return any(t in q for t in triggers)


def classify_intent(query: str, has_doc: bool) -> str:
    q = query.lower().strip()

    if not has_doc:
        return INTENT_CHAT

    if is_followup_query(query):
        return INTENT_FOLLOWUP

    summary_triggers = ["what is", "about", "describe", "overview", "summary", "purpose"]
    risk_triggers = ["risk", "safe", "sign", "accept", "danger", "legal", "fair"]

    is_summary = any(t in q for t in summary_triggers)
    is_risk = any(t in q for t in risk_triggers)

    if is_summary and not is_risk:
        return INTENT_SUMMARY

    if is_risk:
        return INTENT_RISK

    return INTENT_RISK  # safe default

# ==================================================
# PERSONA RESOLUTION (LEGAL ALWAYS INCLUDED)
# ==================================================

def resolve_personas(mode: str, document: str) -> List[str]:
    if mode == "full":
        return ["legal", "financial", "insurance", "compliance"]

    if mode in ["financial", "insurance", "compliance"]:
        return ["legal", mode]

    if mode == "legal":
        return ["legal"]

    # auto
    personas = {"legal"}
    text = document.lower()

    if "payment" in text or "fee" in text:
        personas.add("financial")
    if "insurance" in text:
        personas.add("insurance")
    if "data" in text or "privacy" in text:
        personas.add("compliance")

    return list(personas)

# ==================================================
# PERSONA PASS
# ==================================================

def _run_persona_pass(persona, document: str) -> List[dict]:
    prompt = f"""
[SYSTEM MODE: ACTIVATE PERSONA '{persona.NAME}']
{persona.SYSTEM_INSTRUCTION}

Extract risks as JSON only.
No explanations.

[DOCUMENT]
{document}
"""
    message = Content(role="user", parts=[Part(text=prompt)])
    events = runner.run(user_id=USER_ID, session_id=SESSION_ID, new_message=message)

    raw = "".join(p.text for e in events if e.content for p in e.content.parts if p.text)
    try:
        return json.loads(raw)
    except Exception:
        return []

# ==================================================
# SUMMARY GENERATOR
# ==================================================

def generate_document_summary(document: str) -> str:
    prompt = f"""
Provide a neutral explanation of what this document is about.
Describe purpose, parties, and scope.
Do NOT assess risk.

[DOCUMENT]
{document}
"""
    message = Content(role="user", parts=[Part(text=prompt)])
    events = runner.run(user_id=USER_ID, session_id=SESSION_ID, new_message=message)
    return "".join(p.text for e in events if e.content for p in e.content.parts if p.text).strip()

# ==================================================
# MAIN ENTRY
# ==================================================

def run_clauseguard_consensus(
    user_query: str,
    file_context: str,
    persona_mode: Optional[str] = "auto"
):
    has_doc = is_document_sufficient(file_context)
    intent = classify_intent(user_query, has_doc)

    # ---------- CHAT / PREVENTIVE ----------
    if intent == INTENT_CHAT:
        if is_situation_description(user_query):
            preventive_prompt = f"""
You are ClauseGuard operating in PREVENTIVE MODE.

The user does not have a document yet.
They have described a real-world situation:

"{user_query}"

TASK:
• Explain what documents are typically involved
• Highlight common risks BEFORE commitment
• Focus on irreversible or costly mistakes
• Do NOT give advice
• Do NOT ask for a document immediately
• Be structured and calm
"""
            message = Content(role="user", parts=[Part(text=preventive_prompt)])
            events = runner.run(user_id=USER_ID, session_id=SESSION_ID, new_message=message)
            reply = "".join(
                p.text for e in events if e.content for p in e.content.parts if p.text
            )
            return {
                "status": "PREVENTIVE_GUIDANCE",
                "message": reply.strip()
            }

        # General chat
        chat_prompt = f"""
You are ClauseGuard, a helpful risk intelligence assistant.
The user has sent a general message: "{user_query}"

Task:
- Answer the user's question or respond to their greeting helpfully.
- If they ask what you can do, explain your role in analyzing documents for risk.
- Keep responses concise and professional.
- Do NOT give specific legal or financial advice.
"""
        message = Content(role="user", parts=[Part(text=chat_prompt)])
        events = runner.run(user_id=USER_ID, session_id=SESSION_ID, new_message=message)
        reply = "".join(
            p.text for e in events if e.content for p in e.content.parts if p.text
        )
        return {
            "status": "INFO",
            "message": reply.strip()
        }

    # ---------- SUMMARY ----------
    if intent == INTENT_SUMMARY:
        return {
            "status": "INFO",
            "message": generate_document_summary(file_context)
        }

    # ---------- PERSONA SELECTION ----------
    if intent == INTENT_RISK and persona_mode == "auto":
        return {
            "status": "AWAITING_PERSONA_SELECTION",
            "message": "How would you like this analyzed?",
            "persona_options": ["Legal", "Financial", "Compliance", "Full Analysis"]
        }

    # ---------- RISK ANALYSIS ----------
    personas = resolve_personas(persona_mode, file_context)
    risks = []

    for p in personas:
        risks.extend(_run_persona_pass(PERSONA_MAP[p], file_context))

    if not risks:
        return {
            "status": "INFO",
            "message": (
                "No clear risk clauses were detected. "
                "This does NOT guarantee safety and may indicate limited or informal content."
            )
        }

    scoring = score_risks(risks)

    return {
        "status": "RISK_ANALYSIS",
        "personas_used": personas,
        "risk_analysis": scoring
    }

# ==================================================
# ENTRY POINT
# ==================================================

root_agent = clause_guard