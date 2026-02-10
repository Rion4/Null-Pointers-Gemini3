# RuleGuard AI

RuleGuard is a data-centric risk intelligence system designed for high-stakes documents (employment agreements, commercial contracts, etc.). It uses an expert-consensus engine to identify irreversible risks and provide structured decision intelligence.

## Key Features

- **Intent-Aware Routing**: Distinguishes between document summaries, deep risk analysis, and preventive guidance.
- **Expert Personas**: Multi-lens analysis across Legal, Financial, Compliance, and Insurance domains.
- **Preventive Mode**: Provides guidance and identifies common risks even before a document is signed or uploaded.
- **Minimalist Decision UI**: Focused on clear verdicts (Safe, Caution, Do Not Sign) and actionable highlights.

## Architecture

### Backend (Python/FastAPI)
- **ADK-Powered Engine**: Built using Google's Agent Development Kit (ADK).
- **Consensus Orchestrator**: Routes user queries and document context through specialized persona agents.
- **FastAPI Layer**: Serves the analysis API and handles PDF/document parsing.

### Frontend (Next.js/React)
- **Modern Chat Interface**: Glassmorphism design with Lucide icons and Tailwind CSS.
- **Persona Control**: Explicitly select the reasoning lens for any analysis.
- **Real-time Interaction**: Integrated status-handling for complex agent reasoning states.

## Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+
- Google GenAI API Key (configured in `.env`)

### Installation

1. **Clone the repository**
2. **Setup Backend**:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # or .\.venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```
3. **Setup Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Running Tests
Use the verification suite to ensure intent routing and persona selection are working:
```bash
python test_agent.py
```

## Principles
- **Decision Support, Not Advice**: RuleGuard provides risk awareness, not legal or financial recommendations.
- **Neutrality**: Balanced assessment of both benefits and liabilities.
- **Clarity**: Translating "fine print" into real-world impact.
