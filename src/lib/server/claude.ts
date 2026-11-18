/**
 * Claude (Anthropic API): the default drafting and photo-reading model when ANTHROPIC_API_KEY is set.
 * Qwen stays available: set AI_DRAFTER=qwen to use Qwen on Cloudflare Workers AI (online) or Ollama (on the
 * factory's own computer) instead. Server-only.
 *
 * Env:
 *   ANTHROPIC_API_KEY     turns Claude on (never logged or sent to the browser)
 *   CLAUDE_MODEL          default claude-sonnet-5-5
 *   AI_DRAFTER=qwen       keep using Qwen even when the key is set
 *
 * Personal data is masked before every call and restored in the reply (../personal-data.ts), as for Qwen.
 * Requests use the server-side refusal fallback ("default"), so a declined request is retried on a fallback model.
 */
import Anthropic from "@anthropic-ai/sdk";
import { createMasker, PLACEHOLDER_NOTE } from "../personal-data.ts";

export const DEFAULT_CLAUDE_MODEL = "claude-sonnet-5-5";
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

let client: Anthropic | null = null;

/** The Claude model in use, or null when Claude is off (no key, or AI_DRAFTER=qwen). */
export function claudeModel(): string | null {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) return null;
  if ((process.env.AI_DRAFTER ?? "").trim().toLowerCase() === "qwen") return null;
  return process.env.CLAUDE_MODEL?.trim() || DEFAULT_CLAUDE_MODEL;
}

function api(timeoutMs: number) {
  client ??= new Anthropic({ maxRetries: 1 });
  return client.withOptions({ timeout: timeoutMs });
}

/** Structured outputs need every object closed and every property listed as required. */
function strictSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(strictSchema);
  if (!schema || typeof schema !== "object") return schema;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(schema)) out[k] = strictSchema(v);
  if (out.type === "object" && out.properties && typeof out.properties === "object") {
    out.additionalProperties = false;
    out.required = Object.keys(out.properties as object);
  }
  return out;
}

function textOf(message: Anthropic.Beta.BetaMessage): string {
  if (message.stop_reason === "refusal") throw new Error("Claude declined this request.");
  return message.content.map((b) => (b.type === "text" ? b.text : "")).join("");
}

export interface ClaudeReply {
  content: string;
  promptTokens: number | null;
  completionTokens: number | null;
}

/** One call that returns JSON matching `schema`, at low effort (a short, well-specified task). */
export async function claudeJson(system: string, user: string, schema: object, timeoutMs = 60_000): Promise<ClaudeReply> {
  const model = claudeModel();
  if (!model) throw new Error("Claude is not configured.");
  const masker = createMasker();
  const maskedUser = masker.mask(user);
  const masked = Object.values(masker.counts()).some((n) => n > 0);
  const maskedSystem = masked ? `${masker.mask(system)}\n${PLACEHOLDER_NOTE}` : masker.mask(system);
  const message = await api(timeoutMs).beta.messages.create({
    model,
    max_tokens: 2000,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    system: maskedSystem,
    messages: [{ role: "user", content: maskedUser }],
    output_config: { effort: "low", format: { type: "json_schema", schema: strictSchema(schema) as Record<string, unknown> } },
  });
  return { content: masker.unmaskJson(textOf(message)), promptTokens: message.usage.input_tokens, completionTokens: message.usage.output_tokens };
}

/** Reads the text in an image. The image itself can't be masked; the text it returns is masked in later calls. */
export async function claudeReadImage(prompt: string, base64: string, mediaType: "image/jpeg" | "image/png" | "image/webp", timeoutMs = 90_000): Promise<{ text: string; model: string }> {
  const model = claudeModel();
  if (!model) throw new Error("Claude is not configured.");
  const message = await api(timeoutMs).beta.messages.create({
    model,
    max_tokens: 4000,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: prompt },
        ],
      },
    ],
    output_config: { effort: "low" },
  });
  return { text: textOf(message), model: message.model };
}
