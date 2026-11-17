/**
 * Cloudflare Workers AI: the hosted Qwen model the online demo uses, because a model running on a
 * factory's own computer can't be reached from a website on Vercel. Server-only.
 *
 * Env:
 *   AI_PROVIDER=workers-ai           turn it on (otherwise Bunon uses Ollama on this computer)
 *   WORKERS_AI_MODEL                 default @cf/qwen/qwen3.8-27b
 *   WORKERS_AI_ACCOUNT_ID / _TOKEN   default to the D1 account id and token (the token needs Workers AI access)
 *
 * Cloudflare states it does not train on content sent to Workers AI. The free plan includes a small
 * daily allowance; when it runs out, calls fail and Bunon falls back to its rules.
 */

import { createMasker, PLACEHOLDER_NOTE } from "../personal-data.ts";

export const DEFAULT_WORKERS_AI_MODEL = "@cf/qwen/qwen3.8-27b";

function config() {
  if ((process.env.AI_PROVIDER ?? "").trim().toLowerCase() !== "workers-ai") return null;
  const account = (process.env.WORKERS_AI_ACCOUNT_ID ?? process.env.D1_ACCOUNT_ID)?.trim();
  const token = (process.env.WORKERS_AI_TOKEN ?? process.env.D1_API_TOKEN)?.trim();
  const model = process.env.WORKERS_AI_MODEL?.trim() || DEFAULT_WORKERS_AI_MODEL;
  return account && token ? { account, token, model } : null;
}

export const workersAiModel = (): string | null => config()?.model ?? null;

/** True for model names served by Workers AI (they start with "@cf/"). */
export const isCloudModel = (model: string | null | undefined) => !!model && model.startsWith("@cf/");

export interface WorkersAiReply {
  content: string;
  promptTokens: number | null;
  completionTokens: number | null;
}

/**
 * One chat call that must return JSON matching `schema`. Temperature 0, thinking off.
 * Personal data is masked before the call and restored in the reply (../personal-data.ts).
 */
export async function workersAiJson(system: string, user: string, schema: object, timeoutMs = 60_000): Promise<WorkersAiReply> {
  const c = config();
  if (!c) throw new Error("Workers AI is not configured.");
  const masker = createMasker();
  const maskedUser = masker.mask(user);
  const masked = Object.values(masker.counts()).some((n) => n > 0);
  const maskedSystem = masked ? `${masker.mask(system)}\n${PLACEHOLDER_NOTE}` : masker.mask(system);
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${c.account}/ai/run/${c.model}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
    body: JSON.stringify({
      messages: [
        { role: "system", content: maskedSystem },
        { role: "user", content: maskedUser },
      ],
      temperature: 0,
      // A draft is a short JSON object; no reasoning trace is wanted (it only adds time and cost).
      max_completion_tokens: 400,
      reasoning_effort: "low",
      chat_template_kwargs: { enable_thinking: false },
      response_format: { type: "json_schema", json_schema: { name: "result", schema } },
    }),
  });
  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    errors?: Array<{ message?: string }>;
    result?: {
      response?: unknown;
      choices?: Array<{ message?: { content?: string | null } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
  } | null;
  if (!res.ok || !json?.success || !json.result) {
    throw new Error(json?.errors?.[0]?.message ?? `Workers AI returned HTTP ${res.status}`);
  }
  const r = json.result;
  const content = r.choices?.[0]?.message?.content ?? (typeof r.response === "string" ? r.response : r.response ? JSON.stringify(r.response) : "");
  // Some models wrap JSON in a code fence; keep only the object.
  const body = content.slice(content.indexOf("{"), content.lastIndexOf("}") + 1);
  return { content: masker.unmaskJson(body || content), promptTokens: r.usage?.prompt_tokens ?? null, completionTokens: r.usage?.completion_tokens ?? null };
}
