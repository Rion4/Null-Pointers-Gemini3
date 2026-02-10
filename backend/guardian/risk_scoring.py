# guardian/risk_scoring.py

SEVERITY_WEIGHTS = {
    "LOW": 1,
    "MEDIUM": 3,
    "HIGH": 7,
    "CRITICAL": 10,
}

def determine_verdict(total_score, irreversible_count, critical_count):
    """
    Final decision engine.
    """
    if critical_count >= 1 and irreversible_count >= 1:
        return "DO NOT SIGN"

    if total_score >= 25:
        return "DO NOT SIGN"

    if total_score >= 12:
        return "PROCEED WITH CAUTION"

    return "SAFE TO PROCEED"


def score_risks(risks: list[dict]) -> dict:
    """
    Computes total risk score, irreversibility index,
    and final verdict.
    """
    total_score = 0
    irreversible_count = 0
    critical_count = 0
    scored_risks = []

    for risk in risks:
        severity = risk.get("severity", "LOW")
        weight = SEVERITY_WEIGHTS.get(severity, 1)

        total_score += weight

        if risk.get("irreversible") is True:
            irreversible_count += 1

        if severity == "CRITICAL":
            critical_count += 1

        risk["score"] = weight
        scored_risks.append(risk)

    irreversibility_index = (
        irreversible_count / max(len(risks), 1)
    )

    verdict = determine_verdict(
        total_score,
        irreversible_count,
        critical_count
    )

    return {
        "total_risk_score": total_score,
        "irreversibility_index": round(irreversibility_index, 2),
        "irreversible_risks": irreversible_count,
        "critical_risks": critical_count,
        "verdict": verdict,
        "scored_risks": scored_risks,
    }