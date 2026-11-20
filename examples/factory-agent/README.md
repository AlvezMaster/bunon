# Sample factory agent

A small AI agent for a garment factory, built with the [Vercel AI SDK](https://ai-sdk.dev) agent loop (`ToolLoopAgent`).
It shows how a factory connects its own AI agent to Bunon.

- **Model:** an open model on the factory's own computer through [Ollama](https://ollama.com) (default `qwen3.5:4b`).
  Any OpenAI-compatible endpoint works too.
- **Tools:** Bunon's factory MCP server (`/api/mcp/factory`) over HTTP, signed in with an agent token. The agent sees
  only that factory's data, through the same access rules as a person.

It finds open buyer questions and drafts answers from the factory's own documents. Each draft carries the exact quote
Bunon verified. With `--prepare` it leaves the drafts in Bunon for a person to check. **Nothing reaches a buyer until a
person presses Send.** Without `--prepare` it only reads.

## Run it

1. In Bunon, open **AI agents** (factory, Pro plan) and make a token.
2. Pull the model: `ollama pull qwen3.5:4b`
3. Install and run:

```powershell
cd examples/factory-agent
npm install
$env:BUNON_URL = "https://your-bunon-site"
$env:BUNON_AGENT_TOKEN = "bnn_agent_…"
node agent.mjs --max 3            # dry run: drafts and reports, saves nothing
node agent.mjs --max 3 --prepare  # also leaves the drafts for a person to check and send
```

Settings: `MODEL` (default `qwen3.5:4b`), `MODEL_URL` (default `http://localhost:11434/v1`), `MODEL_API_KEY` (only
for hosted endpoints).

A buyer's agent works the same way with a buyer token and the read-only buyer MCP server (`/api/mcp/buyer`).
