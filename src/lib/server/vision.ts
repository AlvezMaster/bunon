/**
 * Reads the text in a photo or scan of a factory document: a licence, a certificate, a signed policy page.
 * Server-only.
 *
 *   Default when ANTHROPIC_API_KEY is set: Claude (Sonnet) reads the image.
 *   Otherwise online (AI_PROVIDER=workers-ai): the hosted Qwen model on Cloudflare Workers AI reads it.
 *   On the factory's own computer: its local Qwen 3.5 model reads it through Ollama, so the photo never leaves.
 *
 * The model is told to copy the text exactly and add nothing. What it reads is stored like any other document,
 * marked "read from a photo", so a person can check it; answers drafted from it are still approved by a person.
 */
import { getOllamaBaseUrl, getOllamaStatus } from "./ollama.ts";
import { workersAiModel, workersAiReadImage } from "./workers-ai.ts";
import { claudeModel, claudeReadImage } from "./claude.ts";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const isImage = (name: string, type: string) => (IMAGE_TYPES as readonly string[]).includes(type) || /\.(jpe?g|png|webp)$/i.test(name);

const PROMPT =
  "Transcribe every piece of text in this image of a factory document, exactly as written, line by line. " +
  "Keep dates, numbers, names and licence numbers exactly as they appear. Keep Bangla text in Bangla. " +
  "Do not describe the image, summarise, translate, correct or add anything. If there is no readable text, reply with NO_TEXT only.";

export class VisionUnavailableError extends Error {}

/** Model output → plain text: no reasoning trace, no code fence, nothing when the model found no text. */
export function cleanTranscript(raw: string): string {
  const text = raw
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .replace(/^```[a-z]*\s*|```\s*$/gim, "")
    .replace(/\r\n/g, "\n")
    .trim();
  return /^NO_TEXT\.?$/i.test(text) ? "" : text;
}

function mimeOf(name: string, type: string) {
  if ((IMAGE_TYPES as readonly string[]).includes(type)) return type;
  if (/\.png$/i.test(name)) return "image/png";
  if (/\.webp$/i.test(name)) return "image/webp";
  return "image/jpeg";
}

/** The text in the image, and which model read it. Throws VisionUnavailableError when no model can read images. */
export async function readImageText(bytes: Uint8Array, name: string, type: string): Promise<{ text: string; model: string }> {
  const b64 = Buffer.from(bytes).toString("base64");
  if (claudeModel()) {
    try {
      const r = await claudeReadImage(PROMPT, b64, mimeOf(name, type) as "image/jpeg" | "image/png" | "image/webp");
      return { text: cleanTranscript(r.text), model: r.model };
    } catch (error) {
      throw new VisionUnavailableError(error instanceof Error ? error.message : "Claude could not read the image.");
    }
  }
  if (workersAiModel()) {
    try {
      const r = await workersAiReadImage(PROMPT, `data:${mimeOf(name, type)};base64,${b64}`);
      return { text: cleanTranscript(r.text), model: r.model };
    } catch (error) {
      throw new VisionUnavailableError(error instanceof Error ? error.message : "The online model could not read the image.");
    }
  }
  const status = await getOllamaStatus();
  const model = process.env.OLLAMA_VISION_MODEL?.trim() || status.model;
  if (!status.available || !model) throw new VisionUnavailableError("No AI model is running to read photos.");
  const res = await fetch(`${getOllamaBaseUrl()}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(180_000),
    body: JSON.stringify({ model, messages: [{ role: "user", content: PROMPT, images: [b64] }], stream: false, think: false, options: { temperature: 0, num_predict: 2000 } }),
  });
  const json = (await res.json().catch(() => null)) as { message?: { content?: string }; error?: string } | null;
  if (!res.ok || !json?.message) throw new VisionUnavailableError(json?.error ?? `The local model returned HTTP ${res.status}.`);
  return { text: cleanTranscript(json.message.content ?? ""), model };
}
