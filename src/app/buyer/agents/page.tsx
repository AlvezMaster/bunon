import { AgentSetup } from "@/components/agents/AgentSetup";

/** Buyer: connect its own AI agent to Bunon (read-only buyer MCP server). */
export default function BuyerAgentsPage() {
  return <AgentSetup role="buyer" />;
}
