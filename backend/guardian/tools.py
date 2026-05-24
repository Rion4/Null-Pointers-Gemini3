# backend/guardian/tools.py
"""
Phase 3 — ADK FunctionTools: Clause Intelligence

These are deterministic Python functions that run BEFORE the LLM.
They give persona agents pre-extracted, structured data to reason on top of,
instead of forcing the LLM to do everything from raw text.

Tools:
  1. extract_clauses          — categorizes clause types from the document
  2. detect_jurisdiction      — finds governing law and jurisdiction-specific flags
  3. flag_dangerous_patterns  — matches against a library of known dangerous clause patterns
  4. calculate_obligation_density — measures obligation vs permission language balance
"""

import re
from typing import Any


# ──────────────────────────────────────────────────────────────────────────────
# Tool 1: extract_clauses
# ──────────────────────────────────────────────────────────────────────────────

# Keyword patterns per clause category
_CLAUSE_PATTERNS: dict[str, list[str]] = {
    "indemnity": [
        "indemnif", "hold harmless", "defend.*against", "indemnity",
    ],
    "termination": [
        "terminat", "at will", "without cause", "without notice",
        "sole discretion.*terminat", "terminat.*sole discretion",
    ],
    "ip_assignment": [
        "intellectual property", "work product", "work-for-hire", "work for hire",
        "assign.*invention", "invention.*assign", "all rights.*vest",
        "irrevocably.*assign", "perpetual.*license",
    ],
    "non_compete": [
        "non.compete", "non compete", "noncompete",
        "not.*work.*competitor", "not.*engage.*competing",
        "restrictive covenant",
    ],
    "non_solicitation": [
        "non.solicit", "non solicit", "not.*solicit",
        "not.*recruit", "not.*hire.*employee",
    ],
    "liability_cap": [
        "limitation of liability", "limit.*liability", "liability.*limit",
        "in no event.*liable", "not.*liable.*exceed",
        "aggregate liability", "maximum liability",
    ],
    "governing_law": [
        "governed by", "governing law", "laws of the state",
        "laws of.*shall govern", "subject to.*jurisdiction",
    ],
    "dispute_resolution": [
        "arbitration", "binding arbitration", "dispute.*resolution",
        "waiv.*jury", "jury.*waiv", "mediation.*binding",
        "class action.*waiv", "waiv.*class action",
    ],
    "data_privacy": [
        "personal data", "personal information", "data.*collect",
        "privacy policy", "gdpr", "ccpa", "data.*process",
        "data.*shar", "data.*transfer", "ai training",
    ],
    "payment_terms": [
        "payment", "invoice", "fee", "salary", "compensation",
        "penalty", "late.*fee", "interest.*overdue",
        "subject to change", "at.*discretion.*salary",
    ],
    "confidentiality": [
        "confidential", "non.disclosure", "nda", "proprietary information",
        "trade secret", "not.*disclose",
    ],
    "auto_renewal": [
        "auto.*renew", "automatically renew", "renew.*unless.*cancel",
        "evergreen", "rolling.*term",
    ],
    "unilateral_amendment": [
        "may.*amend.*at any time", "right to.*modify.*without notice",
        "sole discretion.*amend", "change.*terms.*without",
        "update.*policy.*without.*notice",
    ],
}


def extract_clauses(document_text: str) -> dict[str, Any]:
    """
    Extracts and categorizes specific clause types from a document using
    keyword and regex pattern matching.

    Returns a structured dict of clause categories, each containing
    the matched sentence(s) from the document.

    Args:
        document_text: Full text of the document to analyze.

    Returns:
        Dict with keys per clause category, each containing:
          - found (bool): whether this clause type was detected
          - matches (list[str]): sentences containing the pattern
          - count (int): number of matches
    """
    if not document_text:
        return {"error": "No document text provided."}

    # Split into sentences for context-aware extraction
    sentences = re.split(r'(?<=[.!?])\s+|\n+', document_text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 20]

    results: dict[str, Any] = {}

    for category, patterns in _CLAUSE_PATTERNS.items():
        matches = []
        for sentence in sentences:
            sentence_lower = sentence.lower()
            for pattern in patterns:
                if re.search(pattern, sentence_lower):
                    if sentence not in matches:
                        matches.append(sentence)
                    break  # one match per sentence is enough

        results[category] = {
            "found": len(matches) > 0,
            "matches": matches[:5],  # cap at 5 per category to keep output manageable
            "count": len(matches),
        }

    # Summary stats
    found_categories = [k for k, v in results.items() if v["found"]]
    results["_summary"] = {
        "total_clause_types_found": len(found_categories),
        "categories_found": found_categories,
        "high_risk_categories_present": [
            c for c in found_categories
            if c in {"indemnity", "ip_assignment", "non_compete", "unilateral_amendment", "auto_renewal"}
        ],
    }

    return results


# ──────────────────────────────────────────────────────────────────────────────
# Tool 2: detect_jurisdiction
# ──────────────────────────────────────────────────────────────────────────────

# Known jurisdiction risk profiles
_JURISDICTION_PROFILES: dict[str, dict] = {
    "delaware": {
        "legal_system": "common_law",
        "country": "USA",
        "risk_flags": [
            "Delaware courts strongly favor freedom of contract — unusual clauses are often enforced as written.",
            "Arbitration clauses in Delaware are broadly enforceable.",
            "Non-compete enforceability varies; Delaware courts apply reasonableness test.",
        ],
    },
    "california": {
        "legal_system": "common_law",
        "country": "USA",
        "risk_flags": [
            "California generally does NOT enforce non-compete clauses (Business & Professions Code §16600).",
            "Strong employee protections — at-will termination still applies but with limitations.",
            "CCPA applies to data privacy obligations if company handles CA resident data.",
        ],
    },
    "new york": {
        "legal_system": "common_law",
        "country": "USA",
        "risk_flags": [
            "New York enforces non-competes if reasonable in scope, duration, and geography.",
            "Strong commercial arbitration tradition — arbitration clauses broadly enforced.",
            "NY SHIELD Act imposes data security obligations.",
        ],
    },
    "england": {
        "legal_system": "common_law",
        "country": "UK",
        "risk_flags": [
            "UK courts apply 'blue pencil' doctrine — may sever unreasonable clauses rather than void entire contract.",
            "Post-termination restrictions must be reasonable to be enforceable.",
            "UK GDPR applies to data processing obligations.",
        ],
    },
    "india": {
        "legal_system": "common_law",
        "country": "India",
        "risk_flags": [
            "Section 27 of Indian Contract Act makes most non-compete clauses void post-employment.",
            "Arbitration clauses are enforceable under Arbitration and Conciliation Act 1996.",
            "IT Act and DPDP Act govern data privacy obligations.",
        ],
    },
    "singapore": {
        "legal_system": "common_law",
        "country": "Singapore",
        "risk_flags": [
            "Singapore enforces reasonable non-compete clauses — courts apply restraint of trade doctrine.",
            "PDPA governs personal data obligations.",
            "Strong arbitration jurisdiction — Singapore International Arbitration Centre widely used.",
        ],
    },
    "germany": {
        "legal_system": "civil_law",
        "country": "Germany",
        "risk_flags": [
            "German law requires compensation for post-contractual non-compete clauses.",
            "GDPR applies — strict data processing requirements.",
            "German courts may void clauses that are disproportionately one-sided.",
        ],
    },
    "france": {
        "legal_system": "civil_law",
        "country": "France",
        "risk_flags": [
            "French labor law heavily protects employees — many restrictive clauses are unenforceable.",
            "Non-compete clauses require financial compensation to be valid.",
            "GDPR applies — CNIL enforcement is active.",
        ],
    },
}

_JURISDICTION_PATTERNS = [
    r"laws? of (?:the (?:state|country|republic) of )?([A-Za-z\s]+)",
    r"governed by (?:the )?laws? of ([A-Za-z\s]+)",
    r"jurisdiction of ([A-Za-z\s]+)",
    r"courts? of ([A-Za-z\s]+)",
    r"([A-Za-z\s]+) law shall govern",
]


def detect_jurisdiction(document_text: str) -> dict[str, Any]:
    """
    Detects the governing law and jurisdiction from the document.

    Returns jurisdiction name, legal system type (common law / civil law),
    and a list of jurisdiction-specific risk flags to watch for.

    Args:
        document_text: Full text of the document to analyze.

    Returns:
        Dict containing:
          - jurisdiction_detected (str | None)
          - legal_system (str): "common_law", "civil_law", or "unknown"
          - country (str | None)
          - risk_flags (list[str]): jurisdiction-specific risks
          - raw_clause (str | None): the sentence where jurisdiction was found
          - confidence (str): "high", "medium", "low"
    """
    if not document_text:
        return {"error": "No document text provided."}

    text_lower = document_text.lower()
    sentences = re.split(r'(?<=[.!?])\s+|\n+', document_text)

    detected_jurisdiction = None
    raw_clause = None
    confidence = "low"

    # Try regex patterns first
    for pattern in _JURISDICTION_PATTERNS:
        match = re.search(pattern, text_lower)
        if match:
            candidate = match.group(1).strip().rstrip(".,;")
            # Find the original sentence
            for sentence in sentences:
                if match.group(0) in sentence.lower():
                    raw_clause = sentence.strip()
                    break
            detected_jurisdiction = candidate
            confidence = "high"
            break

    # If no regex match, try direct keyword lookup
    if not detected_jurisdiction:
        for jurisdiction in _JURISDICTION_PROFILES:
            if jurisdiction in text_lower:
                detected_jurisdiction = jurisdiction
                confidence = "medium"
                break

    if not detected_jurisdiction:
        return {
            "jurisdiction_detected": None,
            "legal_system": "unknown",
            "country": None,
            "risk_flags": [
                "No governing law clause detected. This is itself a risk — jurisdiction ambiguity can make disputes expensive.",
                "Without a governing law clause, courts may apply unexpected local law.",
            ],
            "raw_clause": None,
            "confidence": "low",
        }

    # Look up profile
    profile = None
    for key, val in _JURISDICTION_PROFILES.items():
        if key in detected_jurisdiction.lower():
            profile = val
            break

    if profile:
        return {
            "jurisdiction_detected": detected_jurisdiction,
            "legal_system": profile["legal_system"],
            "country": profile["country"],
            "risk_flags": profile["risk_flags"],
            "raw_clause": raw_clause,
            "confidence": confidence,
        }

    return {
        "jurisdiction_detected": detected_jurisdiction,
        "legal_system": "unknown",
        "country": None,
        "risk_flags": [
            f"Jurisdiction '{detected_jurisdiction}' detected but no specific risk profile available.",
            "Verify local enforceability of non-compete, indemnity, and data clauses.",
        ],
        "raw_clause": raw_clause,
        "confidence": confidence,
    }


# ──────────────────────────────────────────────────────────────────────────────
# Tool 3: flag_dangerous_patterns
# ──────────────────────────────────────────────────────────────────────────────

_DANGEROUS_PATTERNS: list[dict] = [
    {
        "name": "Perpetual IP License / Assignment",
        "danger_level": "CRITICAL",
        "patterns": [
            r"in perpetuity",
            r"irrevocably.*assign",
            r"perpetual.*licen",
            r"all rights.*vest.*company",
            r"outside.*working hours.*property",
            r"conceived.*outside.*working",
        ],
        "explanation": "Grants the company permanent, irrevocable rights to your work — including work done on personal time.",
        "irreversible": True,
    },
    {
        "name": "Unlimited Indemnity",
        "danger_level": "CRITICAL",
        "patterns": [
            r"any and all.*claims.*without limit",
            r"indemnif.*any.*all.*liabilit",
            r"hold harmless.*any.*all",
            r"indemnif.*third.party.*claims",
        ],
        "explanation": "You take on unlimited personal liability for company actions, including third-party lawsuits.",
        "irreversible": True,
    },
    {
        "name": "Unilateral Amendment Right",
        "danger_level": "HIGH",
        "patterns": [
            r"may.*amend.*at any time",
            r"right to.*modify.*without notice",
            r"sole discretion.*amend",
            r"change.*terms.*without.*consent",
            r"update.*without.*notice",
        ],
        "explanation": "The other party can change the terms of this agreement at any time without your consent.",
        "irreversible": False,
    },
    {
        "name": "Automatic Renewal Trap",
        "danger_level": "HIGH",
        "patterns": [
            r"auto.*renew.*unless.*cancel",
            r"automatically.*renew",
            r"evergreen.*clause",
            r"renew.*unless.*written.*notice",
        ],
        "explanation": "Contract renews automatically — missing the cancellation window locks you in for another full term.",
        "irreversible": False,
    },
    {
        "name": "Jury Trial Waiver",
        "danger_level": "HIGH",
        "patterns": [
            r"waiv.*right.*jury",
            r"jury.*trial.*waiv",
            r"waiv.*jury.*trial",
        ],
        "explanation": "You permanently waive your right to a jury trial for any dispute under this contract.",
        "irreversible": True,
    },
    {
        "name": "Class Action Waiver",
        "danger_level": "HIGH",
        "patterns": [
            r"waiv.*class action",
            r"class action.*waiv",
            r"no.*class.*arbitration",
            r"individual.*basis.*only",
        ],
        "explanation": "You cannot join a class action lawsuit — you must pursue any claims individually, which is often cost-prohibitive.",
        "irreversible": True,
    },
    {
        "name": "Salary at Sole Discretion",
        "danger_level": "HIGH",
        "patterns": [
            r"salary.*subject to change.*discretion",
            r"compensation.*sole discretion",
            r"salary.*may.*change.*without.*notice",
            r"at.*discretion.*without.*notice.*salary",
        ],
        "explanation": "Your compensation can be changed unilaterally at any time without notice or consent.",
        "irreversible": False,
    },
    {
        "name": "Termination Without Cause or Notice",
        "danger_level": "HIGH",
        "patterns": [
            r"terminat.*without cause",
            r"terminat.*without notice",
            r"at will.*terminat",
            r"sole discretion.*terminat",
            r"terminat.*at any time.*without",
        ],
        "explanation": "You can be terminated immediately, without reason, and without any notice period or severance.",
        "irreversible": False,
    },
    {
        "name": "Broad Non-Compete (Global / Long Duration)",
        "danger_level": "CRITICAL",
        "patterns": [
            r"non.compete.*global",
            r"worldwide.*non.compete",
            r"non.compete.*\d+\s*year",
            r"\d+\s*year.*non.compete",
            r"globally.*not.*work.*competitor",
        ],
        "explanation": "Extremely broad non-compete — global scope or multi-year duration is often unenforceable but still creates legal risk and chilling effect.",
        "irreversible": False,
    },
    {
        "name": "Data / AI Training Consent",
        "danger_level": "HIGH",
        "patterns": [
            r"ai.*training",
            r"machine learning.*data",
            r"train.*model.*your.*data",
            r"use.*data.*improve.*service",
            r"anonymized.*data.*train",
        ],
        "explanation": "Your data or work product may be used to train AI models, potentially without ongoing consent or compensation.",
        "irreversible": True,
    },
    {
        "name": "One-Sided Limitation of Liability",
        "danger_level": "MEDIUM",
        "patterns": [
            r"company.*not.*liable.*any.*damages",
            r"in no event.*company.*liable",
            r"company.*disclaim.*all.*liabilit",
            r"no.*warranty.*express.*implied",
        ],
        "explanation": "The company limits its own liability to near-zero while you retain full liability — a structurally one-sided arrangement.",
        "irreversible": False,
    },
]


def flag_dangerous_patterns(document_text: str) -> dict[str, Any]:
    """
    Compares document text against a library of known dangerous clause patterns.

    Returns matches with pattern name, matched text, danger level, and explanation.

    Args:
        document_text: Full text of the document to analyze.

    Returns:
        Dict containing:
          - matches (list): each dangerous pattern found with details
          - critical_count (int): number of CRITICAL patterns found
          - high_count (int): number of HIGH patterns found
          - total_danger_score (int): weighted score (CRITICAL=10, HIGH=7, MEDIUM=3)
          - most_dangerous (str | None): name of the highest-danger pattern found
    """
    if not document_text:
        return {"error": "No document text provided."}

    text_lower = document_text.lower()
    sentences = re.split(r'(?<=[.!?])\s+|\n+', document_text)

    matches = []
    critical_count = 0
    high_count = 0
    total_danger_score = 0

    for pattern_def in _DANGEROUS_PATTERNS:
        found_sentences = []
        for regex in pattern_def["patterns"]:
            for sentence in sentences:
                if re.search(regex, sentence.lower()) and sentence not in found_sentences:
                    found_sentences.append(sentence.strip())

        if found_sentences:
            danger = pattern_def["danger_level"]
            score = {"CRITICAL": 10, "HIGH": 7, "MEDIUM": 3}.get(danger, 1)
            total_danger_score += score

            if danger == "CRITICAL":
                critical_count += 1
            elif danger == "HIGH":
                high_count += 1

            matches.append({
                "pattern_name": pattern_def["name"],
                "danger_level": danger,
                "matched_sentences": found_sentences[:3],
                "explanation": pattern_def["explanation"],
                "irreversible": pattern_def["irreversible"],
                "score": score,
            })

    # Sort by danger score descending
    matches.sort(key=lambda x: x["score"], reverse=True)

    most_dangerous = matches[0]["pattern_name"] if matches else None

    return {
        "matches": matches,
        "critical_count": critical_count,
        "high_count": high_count,
        "total_danger_score": total_danger_score,
        "most_dangerous": most_dangerous,
        "patterns_checked": len(_DANGEROUS_PATTERNS),
        "patterns_triggered": len(matches),
    }


# ──────────────────────────────────────────────────────────────────────────────
# Tool 4: calculate_obligation_density
# ──────────────────────────────────────────────────────────────────────────────

_OBLIGATION_WORDS = [
    "shall", "must", "will", "agrees to", "is required to",
    "is obligated to", "undertakes to", "covenants to",
    "is responsible for", "warrants that", "represents that",
]

_PERMISSION_WORDS = [
    "may", "can", "has the right to", "is entitled to",
    "at its option", "in its discretion", "reserves the right",
    "is permitted to", "is allowed to",
]

# Patterns to detect which party an obligation applies to
_EMPLOYEE_PATTERNS = [
    r"\bemployee\b", r"\bcontractor\b", r"\bworker\b",
    r"\byou\b", r"\byour\b", r"\bthe party\b",
]
_COMPANY_PATTERNS = [
    r"\bcompany\b", r"\bemployer\b", r"\bclient\b",
    r"\borganization\b", r"\bfirm\b", r"\bcorporation\b",
]


def calculate_obligation_density(document_text: str) -> dict[str, Any]:
    """
    Counts obligation language vs permission language per section.

    High obligation density on one party (especially the weaker party)
    is a structural red flag indicating a one-sided contract.

    Args:
        document_text: Full text of the document to analyze.

    Returns:
        Dict containing:
          - total_obligations (int): total obligation phrases found
          - total_permissions (int): total permission phrases found
          - obligation_ratio (float): obligations / (obligations + permissions)
          - balance_verdict (str): "BALANCED", "OBLIGATION_HEAVY", "PERMISSION_HEAVY"
          - employee_obligations (int): obligations directed at the weaker party
          - company_obligations (int): obligations directed at the stronger party
          - party_balance_verdict (str): assessment of which party bears more obligations
          - high_obligation_sentences (list[str]): sentences with the most obligation language
    """
    if not document_text:
        return {"error": "No document text provided."}

    text_lower = document_text.lower()
    sentences = re.split(r'(?<=[.!?])\s+|\n+', document_text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 15]

    total_obligations = 0
    total_permissions = 0
    employee_obligations = 0
    company_obligations = 0
    high_obligation_sentences = []

    for sentence in sentences:
        s_lower = sentence.lower()
        sentence_obligations = sum(1 for w in _OBLIGATION_WORDS if w in s_lower)
        sentence_permissions = sum(1 for w in _PERMISSION_WORDS if w in s_lower)

        total_obligations += sentence_obligations
        total_permissions += sentence_permissions

        if sentence_obligations >= 2:
            high_obligation_sentences.append(sentence)

        if sentence_obligations > 0:
            is_employee = any(re.search(p, s_lower) for p in _EMPLOYEE_PATTERNS)
            is_company = any(re.search(p, s_lower) for p in _COMPANY_PATTERNS)
            if is_employee and not is_company:
                employee_obligations += sentence_obligations
            elif is_company and not is_employee:
                company_obligations += sentence_obligations

    total = total_obligations + total_permissions
    obligation_ratio = round(total_obligations / total, 2) if total > 0 else 0.0

    if obligation_ratio > 0.70:
        balance_verdict = "OBLIGATION_HEAVY"
    elif obligation_ratio < 0.30:
        balance_verdict = "PERMISSION_HEAVY"
    else:
        balance_verdict = "BALANCED"

    if employee_obligations > company_obligations * 1.5:
        party_balance_verdict = "HEAVILY_ONE_SIDED_AGAINST_EMPLOYEE"
    elif employee_obligations > company_obligations:
        party_balance_verdict = "SLIGHTLY_ONE_SIDED_AGAINST_EMPLOYEE"
    elif company_obligations > employee_obligations * 1.5:
        party_balance_verdict = "HEAVILY_ONE_SIDED_AGAINST_COMPANY"
    else:
        party_balance_verdict = "ROUGHLY_BALANCED"

    return {
        "total_obligations": total_obligations,
        "total_permissions": total_permissions,
        "obligation_ratio": obligation_ratio,
        "balance_verdict": balance_verdict,
        "employee_obligations": employee_obligations,
        "company_obligations": company_obligations,
        "party_balance_verdict": party_balance_verdict,
        "high_obligation_sentences": high_obligation_sentences[:5],
    }
