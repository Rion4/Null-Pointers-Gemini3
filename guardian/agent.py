from google.adk.agents import LlmAgent
from google.adk.runners import Runner
from guardian.personas import legal, financial, insurance, compliance
from google.adk.sessions.in_memory_session_service import InMemorySessionService
from google.genai.types import Content, Part


# Personas
PERSONA_MAP = {
    "legal": legal,
    "financial": financial,
    "insurance": insurance,
    "compliance": compliance
}


# Main Agent
clause_guard = LlmAgent(
    name="ClauseGuard_Core",
    model="gemini-2.5-flash",
    instruction="""
You are ClauseGuard, a data-centric risk interpretation system.

Your primary function is to analyze risks, obligations, and hidden implications
in high-stakes documents such as contracts, financial disclosures, insurance
policies, and compliance agreements.

However, users may not always have a document immediately.

When NO document is provided:
- You MAY answer conceptual or preparatory questions
- You MUST frame answers in terms of risk awareness, compliance, or data correctness
- You MUST NOT provide personalized legal, financial, or tax advice
- You SHOULD explain what risks to watch for and what documents or clauses matter

When a document IS provided:
- Perform detailed semantic risk analysis
- Cite exact clauses
- Explain consequences of acceptance

You can temporarily adopt internal expert personas (legal, financial, insurance,
compliance) to reason correctly, but you are NOT a replacement for a licensed
professional.

Always guide the user toward safer decisions.
"""
)


# Runner 
session_service = InMemorySessionService()
runner = Runner(
    agent=clause_guard,
    app_name="guardian_cli",  # Required by ADK runner
    session_service=session_service
)



# Heuristic Persona Router 

def _heuristic_router(query, file_context=""):
    text = (query + " " + file_context).lower()

    if any(w in text for w in ["tax", "cost", "fee", "payment", "salary", "audit", "gst", "vat"]):
        return "financial"
    if any(w in text for w in ["insurance", "policy", "claim", "coverage", "deductible", "accident"]):
        return "insurance"
    if any(w in text for w in ["data", "privacy", "gdpr", "ai training", "consent", "cookie"]):
        return "compliance"

    return "legal"

def run_clauseguard(user_choice_key, user_query, file_context=None):
    selected_key = "legal"


    # Persona Selection
    if user_choice_key in ["5", "not sure"]:
        selected_key = _heuristic_router(user_query, file_context or "")
        print(f"⚡ [System] Auto-switched to: {selected_key.upper()}")

    elif user_choice_key in ["1", "2", "3", "4"]:
        selected_key = {
            "1": "legal",
            "2": "financial",
            "3": "insurance",
            "4": "compliance"
        }.get(user_choice_key, "legal")

    persona = PERSONA_MAP[selected_key]

    # Context Injection
    dynamic_prompt = f"""
    [SYSTEM MODE: ACTIVATE PERSONA '{persona.NAME}']
    {persona.SYSTEM_INSTRUCTION}

    [DOCUMENT CONTEXT]
    {file_context if file_context else "No document provided."}

    [USER QUESTION]
    {user_query}
    """


    try:
        # Try synchronous creation if available, or just standard creation
        if hasattr(session_service, "create_session_sync"):
            session_service.create_session_sync(session_id="test_session")
        else:
             # Fallback: simple create 
            session_service.create_session(session_id="test_session")
    except Exception:
        pass # Session might already exist

    # Runner.run() requires a Content object
    message_content = Content(
        role="user",
        parts=[Part(text=dynamic_prompt)]
    )
    
    events = list(runner.run(
        user_id="test_user",
        session_id="test_session",
        new_message=message_content
    ))

    final_text = ""
    for event in events:
        if event.type == "model_response":
            final_text += event.content or ""

    return {
        "persona_used": persona.NAME,
        "response": final_text.strip()
    }

root_agent = clause_guard
