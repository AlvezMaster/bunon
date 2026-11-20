import { AgentSetup } from "@/components/agents/AgentSetup";

/** Factory: connect its own AI agent to Bunon (factory MCP server). */
export default function FactoryAgentsPage() {
  return <AgentSetup role="factory" />;
}
