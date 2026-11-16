/**
 * Who may see what. Every API route that returns shared data filters through here, so a company only
 * ever receives its own records and those of companies it is linked to (see src/lib/links.ts).
 */
import { orgIndex, linksForOrg } from "./accounts-repo.ts";
import { isLive, isReadable, acceptsNewQuestions, partnerOf, type Link } from "../links.ts";
import { factoryOf, type StyleData } from "../styles.ts";
import type { SessionPayload } from "./session.ts";

export interface Scope {
  orgId: string;
  role: SessionPayload["role"];
  links: Link[];
  idByName: (name: string | undefined) => string | undefined;
  orgNameOf: (id: string) => string;
}

export async function scopeFor(session: SessionPayload): Promise<Scope> {
  const idx = await orgIndex();
  const orgId = session.oid ?? idx.idByName(session.org) ?? `unknown:${session.sub}`;
  return {
    orgId,
    role: session.role,
    links: await linksForOrg(orgId),
    idByName: idx.idByName,
    orgNameOf: (id) => idx.byId.get(id)?.name ?? "Unknown company",
  };
}

/** The newest link between this company and a partner (there can be an old unlinked one and a new one). */
export function linkWith(scope: Scope, partnerOrgId: string): Link | undefined {
  return scope.links
    .filter((l) => partnerOf(l, scope.orgId) === partnerOrgId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .find((l) => isReadable(l));
}

export const canReadWith = (scope: Scope, partner: string | undefined) => !!partner && !!linkWith(scope, partner);
export const isLiveWith = (scope: Scope, partner: string | undefined) => {
  const l = partner ? linkWith(scope, partner) : undefined;
  return !!l && isLive(l);
};
export const takesQuestionsWith = (scope: Scope, partner: string | undefined) => {
  const l = partner ? linkWith(scope, partner) : undefined;
  return !!l && acceptsNewQuestions(l);
};

export function styleParties(scope: Scope, s: StyleData & { factoryOrgId?: string; buyerOrgId?: string }) {
  return { factory: s.factoryOrgId ?? scope.idByName(factoryOf(s)), buyer: s.buyerOrgId ?? scope.idByName(s.buyer) };
}

/** A factory sees the orders it makes; a buyer sees its own orders while linked to that factory. */
export function canSeeStyle(scope: Scope, s: StyleData): boolean {
  const p = styleParties(scope, s);
  if (scope.role === "factory") return p.factory === scope.orgId;
  return p.buyer === scope.orgId && canReadWith(scope, p.factory);
}

type QuestionnaireLike = { buyer: string; factory: string; buyerOrgId?: string; factoryOrgId?: string };

/** Parties of a questionnaire: stored company ids for ones made in the app, names for the demo ones. */
export function questionnaireParties(scope: Scope, q: QuestionnaireLike) {
  return { factory: q.factoryOrgId ?? scope.idByName(q.factory), buyer: q.buyerOrgId ?? scope.idByName(q.buyer) };
}

export function canSeeQuestionnaire(scope: Scope, q: QuestionnaireLike): boolean {
  const p = questionnaireParties(scope, q);
  const me = scope.role === "factory" ? p.factory : p.buyer;
  const other = scope.role === "factory" ? p.buyer : p.factory;
  return me === scope.orgId && canReadWith(scope, other);
}
