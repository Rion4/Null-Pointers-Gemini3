# backend/guardian/schemas.py
"""
Pydantic schemas — single source of truth for all data contracts.
Expanded with: Benefits, RankedFindings, ActionableGuidance,
adversarial detection, document type, and conversational mode.
"""

from pydantic import BaseModel, Field
from typing import List, Literal, Optional


# ══════════════════════════════════════════════════════════════════════════════
# ATOMIC UNITS
# ══════════════════════════════════════════════════════════════════════════════

class RiskItem(BaseModel):
    clause_text: str = Field(
        description="Exact quoted text from the document that creates this risk."
    )
    risk_type: str = Field(
        description="Category e.g. 'Indemnity', 'IP Assignment', 'Termination', 'Non-Compete'."
    )
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = Field(
        description="Severity level of this risk."
    )
    irreversible: bool = Field(
        description="True if this creates an obligation or waiver that cannot be undone after signing."
    )
    explanation: str = Field(
        description="Plain English explanation of why this clause is risky."
    )
    recommendation: str = Field(
        description="What the user should watch for, ask about, or negotiate."
    )
    persona: Optional[str] = Field(
        default=None,
        description="Which expert persona identified this risk."
    )
    weight: Optional[float] = Field(
        default=None,
        description="Relative weight 0.0–1.0 indicating how much this risk dominates the overall verdict."
    )


class BenefitItem(BaseModel):
    """A clause or provision that is favorable to the user."""
    clause_text: str = Field(
        description="Exact quoted text from the document that creates this benefit."
    )
    benefit_type: str = Field(
        description="Category e.g. 'Liability Protection', 'Clear Payment Terms', 'Termination Rights', 'IP Ownership'."
    )
    strength: Literal["WEAK", "MODERATE", "STRONG"] = Field(
        description="How meaningful this benefit is in practice."
    )
    explanation: str = Field(
        description="Plain English explanation of why this clause is favorable."
    )
    persona: Optional[str] = Field(
        default=None,
        description="Which expert persona identified this benefit."
    )


class RankedFinding(BaseModel):
    """A risk or benefit ranked by overall impact on the verdict."""
    rank: int = Field(description="1 = most impactful.")
    finding_type: Literal["RISK", "BENEFIT"] = Field(
        description="Whether this is a risk or a benefit."
    )
    title: str = Field(description="Short label e.g. 'Unlimited Indemnity'.")
    severity_or_strength: str = Field(
        description="CRITICAL/HIGH/MEDIUM/LOW for risks; STRONG/MODERATE/WEAK for benefits."
    )
    weight: float = Field(
        description="Relative weight 0.0–1.0. All weights should sum to ~1.0."
    )
    outweighs: List[str] = Field(
        default_factory=list,
        description="Titles of other findings this one outweighs."
    )
    reason: str = Field(
        description="One sentence explaining why this ranks here."
    )


class ActionableGuidance(BaseModel):
    """
    Structured guidance for adversarial documents (e.g. cease-and-desist,
    lawsuit, demand letter) or high-risk situations.
    Populated exclusively by StrategyAgent (Task 5) — not the ConsensusOrchestrator.
    """
    document_context: str = Field(
        description="Brief description of what this document is and what it means for the user."
    )
    immediate_actions: List[str] = Field(
        default_factory=list,
        description="Things to do right now (within 24-48 hours)."
    )
    options: List[str] = Field(
        default_factory=list,
        description="Possible paths forward — comply, negotiate, dispute, ignore, etc."
    )
    how_to_respond: List[str] = Field(
        default_factory=list,
        description="Specific steps for responding to or fighting this document."
    )
    deadlines: List[str] = Field(
        default_factory=list,
        description="Time-sensitive items and their deadlines if stated in the document."
    )
    evidence_to_gather: List[str] = Field(
        default_factory=list,
        description="Documents, records, or evidence the user should collect."
    )
    strengths_of_your_position: List[str] = Field(
        default_factory=list,
        description="Arguments or facts that favor the user's position."
    )
    weaknesses_of_your_position: List[str] = Field(
        default_factory=list,
        description="Arguments or facts that work against the user."
    )
    disclaimer: str = Field(
        default=(
            "This analysis is for informational purposes only and does not constitute legal advice. "
            "For matters involving legal action, please consult a qualified attorney."
        ),
        description="Legal disclaimer — always present."
    )

    # ── StrategyAgent fields (Task 5) ─────────────────────────────────────────
    attorney_type: Optional[str] = Field(
        default=None,
        description="Specific type of attorney to seek, e.g. 'Employment attorney specializing in wrongful termination'."
    )
    relevant_agencies: List[str] = Field(
        default_factory=list,
        description="Relevant government agencies or organizations specific to this jurisdiction and document type."
    )
    typical_cost_range: Optional[str] = Field(
        default=None,
        description="Estimated cost range for legal representation or filing, e.g. '$1,500–$5,000 for initial representation'."
    )
    urgency_window: Optional[str] = Field(
        default=None,
        description="The single most critical time constraint, e.g. '30 days to respond or default judgment risk'."
    )
    fight_cost_benefit: Optional[str] = Field(
        default=None,
        description="Plain-English assessment of whether fighting this document is worth the cost and effort, and what happens if you don't."
    )


class ClarifyingQuestion(BaseModel):
    """A question the agent needs answered to give better guidance."""
    question: str = Field(description="The question to ask the user.")
    why_needed: str = Field(description="Why this answer changes the analysis.")
    options: Optional[List[str]] = Field(
        default=None,
        description="If the question has specific answer options, list them here."
    )


# ══════════════════════════════════════════════════════════════════════════════
# PERSONA ANALYSIS — output of a single expert agent
# ══════════════════════════════════════════════════════════════════════════════

class PersonaAnalysis(BaseModel):
    persona: str = Field(description="Name of the expert persona.")
    risks: List[RiskItem] = Field(default_factory=list)
    benefits: List[BenefitItem] = Field(
        default_factory=list,
        description="Favorable clauses or provisions identified by this persona."
    )
    summary: str = Field(description="One-paragraph summary from this persona's perspective.")


# ══════════════════════════════════════════════════════════════════════════════
# CONSENSUS VERDICT — final output of the full pipeline
# ══════════════════════════════════════════════════════════════════════════════

class ConsensusVerdict(BaseModel):
    # ── Core verdict ──────────────────────────────────────────────────────
    verdict: Literal["SAFE TO PROCEED", "PROCEED WITH CAUTION", "DO NOT SIGN"] = Field(
        description="Final risk verdict."
    )
    total_risk_score: int = Field(description="Aggregate numeric risk score.")
    irreversibility_index: float = Field(description="Ratio of irreversible risks (0.0–1.0).")
    critical_risks: int = Field(description="Count of CRITICAL severity risks.")
    irreversible_risks: int = Field(description="Count of irreversible risks.")

    # ── Summaries ─────────────────────────────────────────────────────────
    impact_summary: str = Field(
        description="Plain English summary of the overall risk picture."
    )
    comparative_summary: str = Field(
        default="",
        description=(
            "Explains which risks outweigh which benefits and why. "
            "e.g. 'The unlimited indemnity clause (CRITICAL) outweighs the clear payment terms "
            "because it creates unlimited personal liability that cannot be undone.'"
        )
    )

    # ── Findings ──────────────────────────────────────────────────────────
    risks: List[RiskItem] = Field(default_factory=list)
    benefits: List[BenefitItem] = Field(
        default_factory=list,
        description="Favorable clauses identified across all personas."
    )
    ranked_findings: List[RankedFinding] = Field(
        default_factory=list,
        description="All risks and benefits ranked by impact, most impactful first."
    )

    # ── Document intelligence ─────────────────────────────────────────────
    document_type: str = Field(
        default="Unknown",
        description="Detected document type e.g. 'Employment Agreement', 'Cease and Desist', 'NDA'."
    )
    adversarial: bool = Field(
        default=False,
        description="True if this document is filed AGAINST the user (lawsuit, C&D, demand letter)."
    )

    # ── Guidance (adversarial docs only) ──────────────────────────────────
    guidance: Optional[ActionableGuidance] = Field(
        default=None,
        description="Actionable guidance — only present for adversarial documents."
    )

    # ── Clarifying questions (if more context needed) ─────────────────────
    clarifying_questions: List[ClarifyingQuestion] = Field(
        default_factory=list,
        description="Questions the agent needs answered to refine the analysis."
    )

    # ── Meta ──────────────────────────────────────────────────────────────
    personas_used: List[str] = Field(default_factory=list)


# ══════════════════════════════════════════════════════════════════════════════
# SCENARIO ANALYSIS — for hypothetical questions (no document)
# ══════════════════════════════════════════════════════════════════════════════

class ScenarioAnalysis(BaseModel):
    """Output when user asks a hypothetical or situational question."""
    scenario_type: str = Field(
        description="Type of scenario e.g. 'Employment Dispute', 'Contract Negotiation', 'IP Infringement'."
    )
    user_position_assessment: str = Field(
        description="Assessment of the user's position — are they in a strong or weak position and why."
    )
    key_legal_concepts: List[str] = Field(
        default_factory=list,
        description="Relevant legal concepts the user should understand."
    )
    options: List[str] = Field(
        default_factory=list,
        description="Possible courses of action available to the user."
    )
    risks_of_each_option: List[str] = Field(
        default_factory=list,
        description="Risks associated with each option (parallel to options list)."
    )
    recommended_next_steps: List[str] = Field(
        default_factory=list,
        description="Practical next steps, ordered by priority."
    )
    clarifying_questions: List[ClarifyingQuestion] = Field(
        default_factory=list,
        description="Questions that would sharpen the analysis."
    )
    disclaimer: str = Field(
        default=(
            "This is general information only, not legal advice. "
            "Please consult a qualified attorney for your specific situation."
        )
    )


# ══════════════════════════════════════════════════════════════════════════════
# COMPARISON SCHEMAS — Phase 7
# ══════════════════════════════════════════════════════════════════════════════

class ClauseChange(BaseModel):
    change_type: Literal["ADDED", "REMOVED", "MODIFIED"]
    old_text: Optional[str] = None
    new_text: Optional[str] = None
    section: Optional[str] = None


class ComparisonVerdict(BaseModel):
    net_risk_change: Literal["IMPROVED", "UNCHANGED", "WORSENED", "SIGNIFICANTLY_WORSENED"]
    new_risks_introduced: List[RiskItem] = Field(default_factory=list)
    risks_resolved: List[RiskItem] = Field(default_factory=list)
    risks_unchanged: List[RiskItem] = Field(default_factory=list)
    clause_changes: List[ClauseChange] = Field(default_factory=list)
    recommendation: str
    summary: str


# ══════════════════════════════════════════════════════════════════════════════
# API REQUEST / RESPONSE MODELS
# ══════════════════════════════════════════════════════════════════════════════

class AnalysisRequest(BaseModel):
    content: str = Field(description="Full text content of the document to analyze.")
    context: str = Field(default="general", description="User's query or context.")
    persona_mode: Optional[str] = Field(default="auto")
    user_id: Optional[str] = Field(default=None)
    session_id: Optional[str] = Field(
        default=None,
        description="Persistent session ID — stored in localStorage on the client."
    )
    document_name: Optional[str] = Field(
        default=None,
        description="Original filename — stored in session history."
    )
    # Conversational context — previous messages for multi-turn
    conversation_history: Optional[List[dict]] = Field(
        default=None,
        description="Previous messages [{role, content}] for multi-turn conversations."
    )


class AnalysisResponse(BaseModel):
    status: str
    status_code: str = "success"
    message: Optional[str] = None
    risk_analysis: Optional[ConsensusVerdict] = None
    scenario_analysis: Optional[ScenarioAnalysis] = None
    personas_used: Optional[List[str]] = None
    persona_options: Optional[List[str]] = None
    clarifying_questions: Optional[List[ClarifyingQuestion]] = None


class UploadResponse(BaseModel):
    content: str
    filename: str
    char_count: int
    page_count: Optional[int] = None


class CompareRequest(BaseModel):
    """Phase 7 — compare two versions of a contract."""
    content_v1: str = Field(description="Full text of the original (v1) document.")
    content_v2: str = Field(description="Full text of the revised (v2) document.")
    filename_v1: Optional[str] = Field(default="Version 1")
    filename_v2: Optional[str] = Field(default="Version 2")
    user_id: Optional[str] = Field(default=None)
    session_id: Optional[str] = Field(default=None)


class HistoryEntry(BaseModel):
    """A single past analysis stored in session history."""
    session_id: str
    timestamp: str
    document_name: str
    verdict: Optional[str] = None
    risk_count: int = 0
    benefit_count: int = 0
    char_count: int = 0
