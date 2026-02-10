import json
from google.adk.agents import LlmAgent

# Import persona modules (config-only files)
from guardian.personas import legal, financial, insurance, compliance



AVAILABLE_PERSONAS = {
    "legal": legal,
    "financial": financial,
    "insurance": insurance,
    "compliance": compliance
}



persona_router = LlmAgent(
    name="Persona_Router",
    model="gemini-3-flash-preview",
    instruction="""
You are the routing system for ClauseGuard.

Your job is to decide which expert personas are REQUIRED
to safely answer the user's request.

Available personas:
- legal
- financial
- insurance
- compliance

Rules:
- Output ONLY a raw JSON list (no markdown).
- Example: ["legal", "financial"]
- Use the MINIMUM number of personas needed.
- If unsure, return ["legal"].
- Do NOT explain your reasoning.
"""
)


# Persona Decision Function
def determine_relevant_personas(user_input: str, file_context: str | None = None):
    """
    Uses an ADK LlmAgent to determine which personas are relevant.

    Returns:
        List[str]: persona keys (e.g. ["legal", "financial"])
    """

    prompt = f"""
User Input:
{user_input}

Document Context:
{file_context if file_context else "No document provided."}

Return the required personas as a JSON list.
"""

    response = persona_router.chat(prompt)

    try:
        raw_text = response.text.strip()
        selected = json.loads(raw_text)

        # Validate output
        valid_personas = [
            key for key in selected
            if key in AVAILABLE_PERSONAS
        ]

        return valid_personas if valid_personas else ["legal"]

    except Exception as e:
        print(f"[Persona Router Error] {e}")
        return ["legal"]  # Hard safety fallback


# Persona Loader Helper
def get_persona_modules(persona_keys: list[str]):
    """
    Maps persona keys to their modules.
    """
    return [AVAILABLE_PERSONAS[key] for key in persona_keys]
