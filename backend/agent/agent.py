"""
ADK root agent — Patient Discharge Form generator.

The agent is intentionally stateless: each invocation generates a fresh
4-wave A2UI v0.8 JSONL stream for a Patient Discharge Form surface.

Run this agent as a local API server:
    cd backend/agent
    uv run adk api_server .        # starts on http://localhost:8000

The Express backend (backend/server.js) proxies requests to this server
via POST /run_sse and forwards the streamed JSONL as SSE events.
"""

from google.adk.agents.llm_agent import Agent

from .discharge_form import build_system_prompt

root_agent = Agent(
    # gemini-2.5-flash: best available model with free-tier quota
    model="gemini-2.5-flash",

    name="discharge_form_agent",

    description=(
        "Healthcare AI agent that generates a Patient Discharge Form user "
        "interface using the A2UI v0.8 streaming protocol.  Outputs raw JSONL "
        "only — no markdown, no executable code."
    ),

    instruction=build_system_prompt(),
)
