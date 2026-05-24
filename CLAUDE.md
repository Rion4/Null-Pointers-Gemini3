## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

---

## Project: RuleGuard / ClauseGuard

AI-powered contract risk analysis system. Users upload legal documents (PDF/TXT), a multi-agent ADK pipeline analyzes them with 4 parallel expert personas, a critic validates findings, and a consensus orchestrator produces a structured verdict (SAFE TO PROCEED / PROCEED WITH CAUTION / DO NOT SIGN).

---

## Architecture

```
frontend/ (Next.js 14, TypeScript)
  app/
    page.tsx                  — landing page (Hero, features, interactive demo)
    chat/page.tsx             — main chat UI (file upload, analysis, results)
    layout.tsx / ClientLayout.tsx
  components/
    risk-analysis-card.tsx    — renders ConsensusVerdict (risks, benefits, ranked findings)
    scenario-analysis-card.tsx — renders ScenarioAnalysis
    document-context-bar.tsx  — shows active uploaded document
    browser-demo.tsx / interactive-demo.tsx — landing page demos
    backgrounds/              — animated background variants (aurora, dot-matrix, etc.)
    ui/                       — shadcn/ui component library (accordion, button, card, etc.)
  lib/
    ruleguard.ts              — RuleGuardClient: fetch wrapper for /api/upload and /api/analyze
    utils.ts                  — cn() utility (clsx + tailwind-merge)

backend/ (Python, FastAPI + Google ADK)
  main.py                     — FastAPI app; routes: GET /, POST /api/upload, POST /api/analyze, POST /api/analyze/stream
  requirements.txt            — fastapi, uvicorn, pydantic, pypdf, google-genai, python-dotenv, google-adk
  guardian/
    agent.py                  — ADK pipeline definition + all runner/session logic (main entry point)
    schemas.py                — Pydantic models: RiskItem, BenefitItem, ConsensusVerdict, ScenarioAnalysis, AnalysisRequest, etc.
    orchestrator.py           — System instructions for ConsensusOrchestrator, CriticAgent, ScenarioAdvisor, DialogueAdvisor
    tools.py                  — FunctionTools: extract_clauses(), detect_jurisdiction(), flag_dangerous_patterns(), calculate_obligation_density()
    document_ingestion.py     — Document ingestion layer
    risk_scoring.py           — Fallback scoring logic (used when ConsensusOrchestrator fails)
    personas/
      legal.py                — Legal expert: SYSTEM_INSTRUCTION, NAME, DESCRIPTION, OUTPUT_KEY
      financial.py            — Financial expert
      compliance.py           — Compliance expert
      insurance.py            — Insurance expert
```

---

## ADK Pipeline (backend/guardian/agent.py)

```
SequentialAgent: RuleGuard_Pipeline
  ├── ParallelAgent: ExpertPanel          ← 4 LlmAgents run concurrently
  │     ├── LlmAgent: LegalExpert         → output_key="legal_risks"
  │     ├── LlmAgent: FinancialExpert     → output_key="financial_risks"
  │     ├── LlmAgent: ComplianceExpert    → output_key="compliance_risks"
  │     └── LlmAgent: InsuranceExpert     → output_key="insurance_risks"
  ├── LlmAgent: CriticAgent               → output_key="critic_validated"
  └── LlmAgent: ConsensusOrchestrator     → output_key="final_verdict"
```

**Key design decisions:**
- Tools (extract_clauses, detect_jurisdiction, flag_dangerous_patterns, calculate_obligation_density) are pre-run in Python and injected into the user message — avoids 4–8 extra API round trips per agent call.
- `InMemorySessionService` is shared across all runners; session state is cleared between runs via `_clear_state_keys()`.
- Models: `gemini-2.5-flash` for both orchestrator/critic and persona agents (configurable via `GUARDIAN_MODEL` / `GUARDIAN_MODEL_FAST` env vars).
- Vertex AI toggle: set `GOOGLE_GENAI_USE_VERTEXAI=1` in `.env` to switch from API key auth to Vertex AI.

**Intent routing** (in `run_clauseguard_consensus`):
| Intent | Condition | Handler |
|---|---|---|
| `RISK_ASSESSMENT` | doc present, default | `_run_risk_pipeline()` → full ADK pipeline |
| `DOCUMENT_SUMMARY` | doc + "what is/about/overview" | `utility_runner` (plain text) |
| `FOLLOW_UP` | doc + "explain/clarify/why" | `dialogue_runner` (multi-turn) |
| `SCENARIO_ANALYSIS` | no doc + "what if/hypothetically" | `_run_scenario_analysis()` |
| `ADVERSARIAL_DOC` | "filed against me / lawsuit / C&D" | full pipeline, adversarial=true |
| `GENERAL_CHAT` | no doc, no scenario triggers | `utility_runner` |

**Streaming** (`/api/analyze/stream`): SSE via `run_clauseguard_streaming()`. Yields stage-by-stage progress events: `tools → experts (partial_result) → critic (partial_result) → consensus → complete`.

---

## Key Schemas (backend/guardian/schemas.py)

- **`RiskItem`** — `clause_text`, `risk_type`, `severity` (LOW/MEDIUM/HIGH/CRITICAL), `irreversible`, `explanation`, `recommendation`, `persona`, `weight`
- **`BenefitItem`** — `clause_text`, `benefit_type`, `strength` (WEAK/MODERATE/STRONG), `explanation`, `persona`
- **`ConsensusVerdict`** — `verdict` (SAFE TO PROCEED / PROCEED WITH CAUTION / DO NOT SIGN), `total_risk_score`, `risks`, `benefits`, `ranked_findings`, `document_type`, `adversarial`, `guidance` (ActionableGuidance, adversarial only)
- **`ScenarioAnalysis`** — for hypothetical questions without a document
- **`AnalysisRequest`** — `content`, `context`, `persona_mode` (auto/legal/financial/compliance/full), `user_id`, `conversation_history`

---

## Frontend API Client (frontend/lib/ruleguard.ts)

`RuleGuardClient` wraps two endpoints (base: `http://localhost:8000`):
- `uploadAndParse(file)` → `POST /api/upload` → `{ content, filename, charCount, pageCount }`
- `analyzeWithMultiTurn(content, context)` → `POST /api/analyze` → `ConsensusVerdict | ScenarioAnalysis | INFO`

**Note:** The client currently uses the non-streaming endpoint. The streaming endpoint (`/api/analyze/stream`) exists in the backend but is not wired up in the frontend yet.

---

## Dev Commands

```bash
# Backend
cd backend && uvicorn main:app --reload --port 8000

# Frontend
cd frontend && pnpm dev        # or npm run dev

# Docker (full stack)
docker compose up

# ADK web UI (inspect agent pipeline)
cd backend && adk web guardian/agent.py

# Run backend tests
cd backend && python test_pipeline.py
cd backend && python test_tools.py
cd backend && python test_live.py
```

---

## Environment Variables (.env in backend/)

| Variable | Purpose |
|---|---|
| `GOOGLE_API_KEY` | Gemini API key (used when Vertex AI is off) |
| `GOOGLE_GENAI_USE_VERTEXAI` | `1` = use Vertex AI, `0` = use API key |
| `GOOGLE_CLOUD_PROJECT` | GCP project (Vertex AI only) |
| `GOOGLE_CLOUD_LOCATION` | GCP region (default: `us-central1`) |
| `GUARDIAN_MODEL` | Model for orchestrator/critic (default: `gemini-2.5-flash`) |
| `GUARDIAN_MODEL_FAST` | Model for persona agents (default: `gemini-2.5-flash`) |

---

## Deployment

- **Backend**: Google Cloud Run via `deploy_cloud_run.sh` / `fix_and_deploy.sh`
- **Frontend**: Cloud Run via `frontend/cloudbuild.yaml` (Cloud Build)
- **Docker**: `docker-compose.yml` — backend on :8000, frontend on :3000
- See `HOSTING_README.md` for full Cloud Run deployment guide

---

## Patterns to Follow

- Persona agents never call tools directly — tools are pre-computed in Python and injected into the user message string.
- All Pydantic schemas live in `guardian/schemas.py` — single source of truth for backend↔frontend data contracts.
- Session state keys: `legal_risks`, `financial_risks`, `compliance_risks`, `insurance_risks`, `critic_validated`, `final_verdict`, `scenario_analysis`.
- Frontend uses `cn()` from `lib/utils.ts` (clsx + tailwind-merge) for all conditional classNames.
- UI components are shadcn/ui — add new ones with `npx shadcn@latest add <component>` from `frontend/`.
