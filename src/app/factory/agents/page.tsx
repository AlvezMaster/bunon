"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot, Check, CircleAlert, Copy, KeyRound, Plug, RefreshCw, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import { DashboardHeader } from "@/components/dashboard/DashboardParts";
import { useDay } from "@/components/questions/shared";
import { formatBdt, PLANS } from "@/lib/plans";
import { t } from "@/lib/i18n";

interface TokenMeta {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
  lastUsedAt: string | null;
}

type TestState = { state: "idle" } | { state: "busy" } | { state: "ok"; tools: number; factory: string } | { state: "fail"; message: string };

const CAN = ["Read your questionnaires, questions and sent answers", "Search your documents and draft answers with their source", "Prepare answers for you to check and send", "Read your buyers, orders and activity log"];
const CANNOT = ["Send an answer to a buyer", "Link, unlink or invite buyers", "Upload or delete documents, or add orders"];

/** Calls the factory MCP endpoint the way an agent would, so "Test connection" proves the token really works. */
async function rpc(token: string, method: string, params?: Record<string, unknown>) {
  const res = await fetch("/api/mcp/factory", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  return (await res.json()) as { result?: { tools?: unknown[]; content?: Array<{ text: string }>; isError?: boolean }; error?: { code: number; message: string } };
}

/** Factory: connect its own AI agent to Bunon in three steps — make a token, add the config, test it. */
export default function FactoryAgentsPage() {
  const day = useDay();
  const [tokens, setTokens] = useState<TokenMeta[] | null>(null);
  const [endpoint, setEndpoint] = useState("");
  const [max, setMax] = useState(5);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [fresh, setFresh] = useState<string | null>(null);
  const [freshId, setFreshId] = useState<string | null>(null);
  const [copied, setCopied] = useState<"token" | "config" | null>(null);
  const [configCopied, setConfigCopied] = useState(false);
  const [testToken, setTestToken] = useState("");
  const [test, setTest] = useState<TestState>({ state: "idle" });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/agent-tokens");
    const json = (await res.json()) as { tokens?: TokenMeta[]; endpoint?: string; max?: number; allowed?: boolean; error?: string };
    if (!res.ok) return setError(json.error ?? t("Could not load agent tokens."));
    setTokens(json.tokens ?? []);
    setEndpoint(json.endpoint ?? "");
    setMax(json.max ?? 5);
    setAllowed(json.allowed !== false);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const act = async (key: string, body: Record<string, unknown>) => {
    setBusy(key);
    setError("");
    try {
      const res = await fetch("/api/agent-tokens", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = (await res.json()) as { token?: string; meta?: TokenMeta; error?: string };
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      if (body.action === "revoke" && body.id === freshId) {
        setFresh(null);
        setFreshId(null);
        setConfigCopied(false);
      }
      if (json.token) {
        setFresh(json.token);
        setFreshId(json.meta?.id ?? null);
        setTestToken(json.token);
        setTest({ state: "idle" });
        setName("");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? t(e.message) : t("Something went wrong."));
    } finally {
      setBusy(null);
    }
  };

  const runTest = async () => {
    setTest({ state: "busy" });
    try {
      const token = testToken.trim();
      const [list, call] = await Promise.all([rpc(token, "tools/list"), rpc(token, "tools/call", { name: "get_overview", arguments: {} })]);
      if (call.error?.code === -32001) throw new Error(t("That token is wrong or was revoked. Make a new one in step 1."));
      if (call.error?.code === -32002) throw new Error(t("Your plan does not include AI agents."));
      if (call.error || call.result?.isError) throw new Error(call.error?.message ?? call.result?.content?.[0]?.text ?? t("Something went wrong."));
      const overview = JSON.parse(call.result?.content?.[0]?.text ?? "{}") as { factory?: string };
      setTest({ state: "ok", tools: list.result?.tools?.length ?? 0, factory: overview.factory ?? "" });
      await load();
    } catch (e) {
      setTest({ state: "fail", message: e instanceof Error ? e.message : t("Something went wrong.") });
    }
  };

  const config = JSON.stringify({ mcpServers: { bunon: { url: endpoint, headers: { Authorization: `Bearer ${fresh ?? "YOUR_AGENT_TOKEN"}` } } } }, null, 2);
  const copy = async (what: "token" | "config", value: string) => {
    await navigator.clipboard.writeText(value).catch(() => undefined);
    setCopied(what);
    if (what === "config") setConfigCopied(true);
    setTimeout(() => setCopied(null), 2000);
  };
  const full = (tokens?.length ?? 0) >= max;

  return (
    <div className="min-h-screen bg-canvas pb-24">
      <Navbar />
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 pt-10 sm:px-6">
        <DashboardHeader eyebrow="AI agents" title="Connect your AI agent" note={t("Your agent works only with your factory's data. A person still sends every answer.")} />

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        {allowed === null && !error && <div className="glass-card h-64 animate-pulse motion-reduce:animate-none" aria-hidden="true" />}

        {allowed === false && (
          <section className="glass-card flex flex-col items-start gap-4 p-6 sm:p-8" aria-labelledby="upgrade-title">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand/10 text-brand">
              <Bot className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="space-y-2">
              <h2 id="upgrade-title" className="font-display text-2xl font-semibold text-ink">
                {t("AI agents come with Pro")}
              </h2>
              <p className="max-w-prose text-base text-ink-muted">
                {t("On Pro, your own AI agent can read your questionnaires, search your documents and prepare answers for you to check.")} {formatBdt(PLANS.pro.priceBdt ?? 0)} / {t("month")}.
              </p>
            </div>
            <Link href="/factory/billing" className="btn-primary-action min-h-[48px]">
              {t("Upgrade to Pro")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>
        )}

        {allowed && (
          <ol className="flex flex-col gap-4" aria-label={t("Three steps to connect your agent")}>
            <Step n={1} done={fresh !== null} title={t("Make a token")} note={t("A token lets one agent sign in as your factory. Bunon shows it only once.")}>
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
                  placeholder={t("Agent name, e.g. Compliance assistant")}
                  className="min-h-[48px] flex-1 rounded-lg border border-field bg-surface/70 px-3 text-base text-ink outline-none focus:border-brand"
                />
                <button type="submit" disabled={busy === "create" || full} className={`${fresh ? "btn-tactile-hollow inline-flex items-center justify-center gap-2 px-4" : "btn-primary-action"} min-h-[48px]`}>
                  {busy === "create" ? <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <KeyRound className="h-4 w-4" aria-hidden="true" />}
                  {fresh ? t("Make another") : t("Create token")}
                </button>
              </form>
              {full && (
                <p className="text-sm text-ink-muted">
                  {t("You have")} {max} {t("tokens, the most allowed. Revoke one below to make a new one.")}
                </p>
              )}
              {fresh && (
                <div className="flex flex-col gap-2 rounded-lg border border-success/40 bg-success-soft p-3">
                  <p className="text-sm font-semibold text-success">{t("Token ready. Copy it now: Bunon will not show it again.")}</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input readOnly value={fresh} onFocus={(e) => e.currentTarget.select()} aria-label={t("Agent token")} className="min-h-[44px] flex-1 rounded-lg border border-line bg-surface px-3 font-mono text-sm text-ink" />
                    <CopyButton done={copied === "token"} label={t("Copy token")} onClick={() => void copy("token", fresh)} />
                  </div>
                </div>
              )}
            </Step>

            <Step n={2} done={configCopied} title={t("Add Bunon to your agent")} note={t("Paste this into your agent's MCP settings. Most MCP clients accept it as it is.")}>
              <pre className="overflow-x-auto rounded-lg border border-line bg-surface p-3 font-mono text-xs leading-relaxed text-ink">{config}</pre>
              {!fresh && <p className="text-sm text-ink-faint">{t("Make a token first and it is filled in for you.")}</p>}
              <CopyButton done={copied === "config"} label={t("Copy config")} onClick={() => void copy("config", config)} />
            </Step>

            <Step n={3} done={test.state === "ok"} title={t("Test the connection")} note={t("Bunon calls itself with your token, just as your agent will.")}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void runTest();
                }}
                className="flex flex-col gap-2 sm:flex-row"
              >
                <label className="sr-only" htmlFor="test-token">
                  {t("Agent token")}
                </label>
                <input
                  id="test-token"
                  value={testToken}
                  onChange={(e) => setTestToken(e.target.value)}
                  placeholder="bnn_agent_…"
                  autoComplete="off"
                  spellCheck={false}
                  className="min-h-[48px] flex-1 rounded-lg border border-field bg-surface/70 px-3 font-mono text-base text-ink outline-none focus:border-brand"
                />
                <button type="submit" disabled={!testToken.trim() || test.state === "busy"} className={`${fresh ? "btn-primary-action" : "btn-tactile-hollow inline-flex items-center justify-center gap-2 px-4"} min-h-[48px]`}>
                  {test.state === "busy" ? <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Plug className="h-4 w-4" aria-hidden="true" />}
                  {t("Test connection")}
                </button>
              </form>
              <div aria-live="polite">
                {test.state === "ok" && (
                  <p className="flex items-center gap-2 rounded-lg border border-success/40 bg-success-soft p-3 text-sm font-semibold text-success">
                    <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {t("Connected")} · {test.tools} {t("tools")}
                    {test.factory && ` · ${test.factory}`}
                  </p>
                )}
                {test.state === "fail" && (
                  <p className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {test.message}
                  </p>
                )}
              </div>
            </Step>
          </ol>
        )}

        {allowed && tokens && tokens.length > 0 && (
          <section className="flex flex-col gap-2" aria-labelledby="tokens-title">
            <h2 id="tokens-title" className="font-display text-lg font-semibold text-ink">
              {t("Your tokens")} <span className="text-sm font-normal text-ink-faint [font-variant-numeric:tabular-nums]">{tokens.length} / {max}</span>
            </h2>
            <ul className="glass-card divide-y divide-line px-4">
              {tokens.map((tk) => (
                <li key={tk.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <span className="text-ink-muted">
                    <strong className="font-medium text-ink">{tk.name}</strong> · {tk.lastUsedAt ? `${t("last used")} ${day(tk.lastUsedAt)}` : t("not used yet")}
                  </span>
                  <button type="button" disabled={busy === tk.id} onClick={() => void act(tk.id, { action: "revoke", id: tk.id })} className="min-h-[44px] rounded-lg px-3 font-medium text-ink-muted hover:text-danger">
                    {t("Revoke")}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <details className="glass-card group p-5 sm:p-6">
          <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 font-display text-lg font-semibold text-ink">
            <ShieldCheck className="h-5 w-5 text-brand" aria-hidden="true" />
            {t("What an agent can and cannot do")}
            <ArrowRight className="ml-auto h-4 w-4 text-ink-faint transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none" aria-hidden="true" />
          </summary>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <ul className="space-y-2 text-sm text-ink-muted">
              {CAN.map((c) => (
                <li key={c} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                  {t(c)}
                </li>
              ))}
            </ul>
            <ul className="space-y-2 text-sm text-ink-muted">
              {CANNOT.map((c) => (
                <li key={c} className="flex gap-2">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
                  {t("Only a person can:")} {t(c).toLowerCase()}
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-4 text-xs text-ink-faint">{t("Every token you make or revoke, and every answer an agent prepares, is recorded in your activity log.")}</p>
        </details>
      </main>
    </div>
  );
}

function Step({ n, done, title, note, children }: { n: number; done: boolean; title: string; note: string; children: React.ReactNode }) {
  return (
    <li className="glass-card flex gap-4 p-5 sm:p-6">
      <span
        aria-hidden="true"
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold [font-variant-numeric:tabular-nums] ${done ? "bg-success text-white" : "bg-brand/10 text-brand"}`}
      >
        {done ? <Check className="h-4 w-4" /> : n}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="space-y-1">
          <h2 className="font-display text-lg font-semibold text-ink">
            <span className="sr-only">
              {t("Step")} {n}
              {done ? `, ${t("done")}` : ""}:{" "}
            </span>
            {title}
          </h2>
          <p className="text-sm text-ink-muted">{note}</p>
        </div>
        {children}
      </div>
    </li>
  );
}

function CopyButton({ done, label, onClick }: { done: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="btn-tactile-hollow inline-flex min-h-[44px] items-center justify-center gap-2 self-start px-4 text-sm">
      {done ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
      {done ? t("Copied") : label}
    </button>
  );
}
