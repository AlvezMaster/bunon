"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Bot, Check, Copy, KeyRound, RefreshCw, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import { DashboardHeader } from "@/components/dashboard/DashboardParts";
import { useDay } from "@/components/questions/shared";
import { t } from "@/lib/i18n";

interface TokenMeta {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
  lastUsedAt: string | null;
}

const CAN = [
  "Read your questionnaires, questions and sent answers",
  "Search your documents and draft answers with their source",
  "Prepare answers for you to check and send",
  "Read your buyers, orders and activity log",
];
const CANNOT = ["Send an answer to a buyer", "Link, unlink or invite buyers", "Upload or delete documents, or add orders"];

/** Factory: connect its own AI agent to Bunon through the MCP connector, with tokens it can revoke. */
export default function FactoryAgentsPage() {
  const day = useDay();
  const [tokens, setTokens] = useState<TokenMeta[] | null>(null);
  const [endpoint, setEndpoint] = useState("");
  const [max, setMax] = useState(5);
  const [name, setName] = useState("");
  const [fresh, setFresh] = useState<string | null>(null);
  const [copied, setCopied] = useState<"token" | "config" | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/agent-tokens");
    const json = (await res.json()) as { tokens?: TokenMeta[]; endpoint?: string; max?: number; error?: string };
    if (!res.ok) return setError(json.error ?? t("Could not load agent tokens."));
    setTokens(json.tokens ?? []);
    setEndpoint(json.endpoint ?? "");
    setMax(json.max ?? 5);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const act = async (key: string, body: Record<string, unknown>) => {
    setBusy(key);
    setError("");
    try {
      const res = await fetch("/api/agent-tokens", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = (await res.json()) as { token?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      if (json.token) {
        setFresh(json.token);
        setName("");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Something went wrong."));
    } finally {
      setBusy(null);
    }
  };

  const config = JSON.stringify({ mcpServers: { bunon: { url: endpoint, headers: { Authorization: `Bearer ${fresh ?? "YOUR_AGENT_TOKEN"}` } } } }, null, 2);
  const copy = async (what: "token" | "config", value: string) => {
    await navigator.clipboard.writeText(value).catch(() => undefined);
    setCopied(what);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-canvas pb-24">
      <Navbar />
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 pt-10 sm:px-6">
        <DashboardHeader
          eyebrow="AI agents"
          title="Connect your own AI agent"
          note={t("If your factory uses an AI agent, connect it to Bunon through MCP. It works only with your factory's data, and a person still sends every answer.")}
        />

        {error && (
          <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
            {error}
          </p>
        )}

        <section className="grid gap-4 sm:grid-cols-2" aria-label={t("What an agent can do")}>
          <div className="glass-card space-y-3 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
              <Bot className="h-5 w-5 text-brand" aria-hidden="true" />
              {t("Your agent can")}
            </h2>
            <ul className="space-y-2 text-sm text-ink-muted">
              {CAN.map((c) => (
                <li key={c} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                  {t(c)}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass-card space-y-3 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
              <ShieldCheck className="h-5 w-5 text-brand" aria-hidden="true" />
              {t("Only a person can")}
            </h2>
            <ul className="space-y-2 text-sm text-ink-muted">
              {CANNOT.map((c) => (
                <li key={c} className="flex gap-2">
                  <span aria-hidden="true" className="mt-0.5 font-semibold text-danger">
                    ✕
                  </span>
                  {t(c)}
                </li>
              ))}
            </ul>
            <p className="text-xs text-ink-faint">{t("Every token you make or revoke, and every answer an agent prepares, is recorded in your activity log.")}</p>
          </div>
        </section>

        <section className="glass-card flex flex-col gap-4 p-5 sm:p-6" aria-labelledby="token-title">
          <div className="space-y-1">
            <h2 id="token-title" className="font-display text-xl font-semibold text-ink">
              {t("Agent tokens")}
            </h2>
            <p className="text-sm text-ink-muted">
              {t("A token lets one agent sign in as your factory. Up to")} {max}. {t("Revoke a token and that agent loses access at once.")}
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void act("create", { action: "create", name });
            }}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <label className="sr-only" htmlFor="token-name">
              {t("Name of the agent")}
            </label>
            <input
              id="token-name"
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("Name of the agent, e.g. Compliance assistant")}
              className="min-h-[48px] flex-1 rounded-lg border border-field bg-surface/70 px-3 text-base text-ink outline-none focus:border-brand"
            />
            <button type="submit" disabled={busy === "create" || (tokens?.length ?? 0) >= max} className="btn-primary-action min-h-[48px]">
              {busy === "create" ? <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <KeyRound className="h-4 w-4" aria-hidden="true" />}
              {t("Create token")}
            </button>
          </form>

          {fresh && (
            <div className="space-y-2 rounded-lg border border-success/40 bg-success-soft p-3">
              <p className="text-sm font-semibold text-success">{t("Token ready. Copy it now: Bunon will not show it again.")}</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input readOnly value={fresh} onFocus={(e) => e.currentTarget.select()} aria-label={t("Agent token")} className="min-h-[44px] flex-1 rounded-lg border border-line bg-surface px-3 font-mono text-sm text-ink" />
                <button type="button" onClick={() => void copy("token", fresh)} className="btn-tactile-hollow inline-flex min-h-[44px] items-center justify-center gap-2 px-4 text-sm">
                  {copied === "token" ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                  {copied === "token" ? t("Copied") : t("Copy token")}
                </button>
              </div>
            </div>
          )}

          {tokens && tokens.length > 0 && (
            <ul className="divide-y divide-line border-t border-line">
              {tokens.map((tk) => (
                <li key={tk.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <span className="text-ink-muted">
                    <strong className="font-medium text-ink">{tk.name}</strong> · {t("made")} {day(tk.createdAt)} · {tk.lastUsedAt ? `${t("last used")} ${day(tk.lastUsedAt)}` : t("not used yet")}
                  </span>
                  <button type="button" disabled={busy === tk.id} onClick={() => void act(tk.id, { action: "revoke", id: tk.id })} className="min-h-[44px] rounded-lg px-3 font-medium text-ink-muted hover:text-danger">
                    {t("Revoke")}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {tokens && tokens.length === 0 && !fresh && <p className="text-sm text-ink-faint">{t("No tokens yet.")}</p>}
        </section>

        <section className="glass-card flex flex-col gap-3 p-5 sm:p-6" aria-labelledby="connect-title">
          <h2 id="connect-title" className="font-display text-xl font-semibold text-ink">
            {t("Connect your agent")}
          </h2>
          <p className="text-sm text-ink-muted">{t("Add Bunon as an MCP server in your agent's settings. Most MCP clients accept a config like this:")}</p>
          <pre className="overflow-x-auto rounded-lg border border-line bg-surface p-3 font-mono text-xs leading-relaxed text-ink">{config}</pre>
          <button type="button" onClick={() => void copy("config", config)} className="btn-tactile-hollow inline-flex min-h-[44px] items-center justify-center gap-2 self-start px-4 text-sm">
            {copied === "config" ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            {copied === "config" ? t("Copied") : t("Copy config")}
          </button>
        </section>
      </main>
    </div>
  );
}
