/**
 * Organisations, signed-up users, factory profiles, invites and factory ↔ buyer links.
 * The demo companies and their links are seeded here; everything created through the app is stored
 * in the key/value store (see kv.ts).
 */
import { createHash, randomBytes } from "node:crypto";
import { KvAbort, kvRead, kvUpdate } from "./kv.ts";
import { hashPassword, type UserRole } from "./session.ts";
import { INVITE_TTL_MS, inviteState, settle, type Invite, type Link, type LinkResult } from "../links.ts";
import { orgName } from "../questionnaire.ts";

export interface Org {
  id: string;
  kind: UserRole;
  name: string;
  country: string;
  createdAt: string;
  /** "demo" for the seeded fictional companies, "self_declared" for factories that signed up. */
  profileStatus: "demo" | "self_declared" | "none";
}

/** What a factory tells us about itself at sign-up. Self-declared: Bunon checks only the format. */
export interface FactoryProfile {
  orgId: string;
  legalName: string;
  address: string;
  district: string;
  workers: number;
  tradeLicence: string;
  bin: string;
  erc: string;
  association: "BGMEA" | "BKMEA" | "none";
  membershipNo: string;
  difeLicence: string;
  declaredBy: string;
  declaredAt: string;
}

export interface StoredUser {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  organization: string;
  role: UserRole;
  clearance_level: string;
  cluster_id: string;
  avatar_initial: string;
  org_id: string;
  org_role: "owner" | "member";
  created_at: string;
}

const DEMO_DAY = "2026-10-01T09:00:00.000Z";
export const SEED_ORGS: Org[] = [
  { id: "org-nodiwear", kind: "factory", name: "Nodiwear Apparel Ltd. (fictional factory)", country: "BD", createdAt: DEMO_DAY, profileStatus: "demo" },
  { id: "org-kanthaloom", kind: "factory", name: "Kanthaloom Knitwear Ltd. (fictional factory)", country: "BD", createdAt: DEMO_DAY, profileStatus: "demo" },
  { id: "org-nordlys", kind: "buyer", name: "Nordlys Apparel AB (fictional EU brand)", country: "SE", createdAt: DEMO_DAY, profileStatus: "demo" },
  { id: "org-vela", kind: "buyer", name: "Vela Outfitters GmbH (fictional EU brand)", country: "DE", createdAt: DEMO_DAY, profileStatus: "demo" },
  { id: "org-nrs", kind: "buyer", name: "Nordic Retail Syndicate (fictional)", country: "DE", createdAt: DEMO_DAY, profileStatus: "demo" },
];

/** The two seeded demo accounts and the companies they belong to. */
export const SEED_USER_ORG: Record<string, string> = { "usr-factory-01": "org-nodiwear", "usr-buyer-01": "org-nordlys" };

/** Which seeded factory owns the fixture documents in src/lib/fixtures/factory-documents.ts. */
export const FIXTURE_DOCS_ORG = "org-nodiwear";

const seedLink = (factoryOrgId: string, buyerOrgId: string): Link => ({
  id: `lnk-${factoryOrgId.slice(4)}-${buyerOrgId.slice(4)}`,
  factoryOrgId,
  buyerOrgId,
  createdAt: DEMO_DAY,
  via: "seed",
  status: "active",
});
export const seedLinks = (): Record<string, Link> =>
  Object.fromEntries(
    [seedLink("org-nodiwear", "org-nordlys"), seedLink("org-nodiwear", "org-vela"), seedLink("org-nodiwear", "org-nrs"), seedLink("org-kanthaloom", "org-nordlys")].map(
      (l) => [l.id, l]
    )
  );

export const LINKS_KEY = "accounts:links";
const K = { orgs: "accounts:orgs", users: "accounts:users", profiles: "accounts:profiles", invites: "accounts:invites", links: "accounts:links" };
const none = <T>(v: T) => () => v;

// ---------- organisations ----------

const norm = (name: string) => orgName(name).toLowerCase().replace(/\s+/g, " ").trim();

export async function allOrgs(): Promise<Org[]> {
  return [...SEED_ORGS, ...(await kvRead<Org[]>(K.orgs, none([])))];
}

export async function orgIndex() {
  const orgs = await allOrgs();
  const byId = new Map(orgs.map((o) => [o.id, o]));
  const byName = new Map(orgs.map((o) => [norm(o.name), o]));
  return { orgs, byId, idByName: (name: string | undefined) => (name ? byName.get(norm(name))?.id : undefined) };
}

export async function orgNameTaken(name: string): Promise<boolean> {
  return (await orgIndex()).idByName(name) !== undefined;
}

// ---------- users ----------

export async function findStoredUser(email: string): Promise<StoredUser | null> {
  const needle = email.trim().toLowerCase();
  return (await kvRead<StoredUser[]>(K.users, none([]))).find((u) => u.email.toLowerCase() === needle) ?? null;
}

export interface NewAccount {
  role: UserRole;
  company: string;
  fullName: string;
  email: string;
  password: string;
  country: string;
  profile?: Omit<FactoryProfile, "orgId" | "declaredBy" | "declaredAt">;
}

/** Creates the organisation, its first user (the owner) and, for factories, the self-declared profile. */
export async function createAccount(a: NewAccount): Promise<{ user: StoredUser; org: Org }> {
  const now = new Date().toISOString();
  const org: Org = {
    id: `org-${randomBytes(6).toString("hex")}`,
    kind: a.role,
    name: a.company.trim(),
    country: a.country,
    createdAt: now,
    profileStatus: a.role === "factory" ? "self_declared" : "none",
  };
  const user: StoredUser = {
    id: `usr-${randomBytes(8).toString("hex")}`,
    email: a.email.trim().toLowerCase(),
    password_hash: await hashPassword(a.password),
    full_name: a.fullName.trim(),
    organization: org.name,
    role: a.role,
    clearance_level: a.role === "factory" ? "FACTORY OWNER" : "BUYER OWNER",
    cluster_id: org.id,
    avatar_initial: a.fullName.trim().charAt(0).toUpperCase() || "?",
    org_id: org.id,
    org_role: "owner",
    created_at: now,
  };
  await kvUpdate<Org[]>(K.orgs, none([]), (list) => {
    if (list.some((o) => o.id === org.id)) return;
    if (list.some((o) => norm(o.name) === norm(org.name))) throw new KvAbort("ORG_TAKEN");
    list.push(org);
  });
  await kvUpdate<StoredUser[]>(K.users, none([]), (list) => {
    if (list.some((u) => u.id === user.id)) return;
    if (list.some((u) => u.email === user.email)) throw new KvAbort("EMAIL_TAKEN");
    list.push(user);
  });
  if (a.role === "factory" && a.profile) {
    const profile: FactoryProfile = { ...a.profile, orgId: org.id, declaredBy: user.full_name, declaredAt: now };
    await kvUpdate<Record<string, FactoryProfile>>(K.profiles, none({}), (all) => {
      all[org.id] = profile;
    });
  }
  return { user, org };
}

/**
 * Changes a signed-up user's name or passphrase. Only users stored in the app can change; the shared demo
 * accounts are seeded and stay as they are, so judges and visitors can always sign in to them.
 */
export async function updateStoredUser(id: string, change: { fullName?: string; password?: string }): Promise<StoredUser> {
  const hash = change.password ? await hashPassword(change.password) : null;
  const list = await kvUpdate<StoredUser[]>(K.users, none([]), (all) => {
    const u = all.find((x) => x.id === id);
    if (!u) throw new KvAbort("NO_SUCH_USER");
    if (change.fullName) {
      u.full_name = change.fullName.trim();
      u.avatar_initial = u.full_name.charAt(0).toUpperCase() || "?";
    }
    if (hash) u.password_hash = hash;
  });
  return list.find((x) => x.id === id)!;
}

// ---------- sign out everywhere ----------

const SIGNOUTS_KEY = "accounts:signouts";
const SIGNOUT_CACHE_MS = 30_000;
let signoutCache: { at: number; map: Record<string, number> } | null = null;

/** Ends every session of this user that started before now (in seconds, like a session's iat). */
export async function signOutEverywhere(userId: string, nowSec = Math.floor(Date.now() / 1000)): Promise<number> {
  const map = await kvUpdate<Record<string, number>>(SIGNOUTS_KEY, none({}), (all) => {
    all[userId] = nowSec;
  });
  signoutCache = { at: Date.now(), map: { ...map } };
  return nowSec;
}

/**
 * When this user last signed out everywhere (seconds), or 0. Read through a 30-second cache, so other servers
 * notice a sign-out within half a minute without a database read on every request.
 */
export async function signedOutAt(userId: string): Promise<number> {
  if (!signoutCache || Date.now() - signoutCache.at > SIGNOUT_CACHE_MS) {
    signoutCache = { at: Date.now(), map: await kvRead<Record<string, number>>(SIGNOUTS_KEY, none({})).catch(() => signoutCache?.map ?? {}) };
  }
  return signoutCache.map[userId] ?? 0;
}

export async function getFactoryProfile(orgId: string): Promise<FactoryProfile | null> {
  return (await kvRead<Record<string, FactoryProfile>>(K.profiles, none({})))[orgId] ?? null;
}

// ---------- links ----------

/** All links with their time-based steps applied (a finished 12-hour hold reads as unlinked). */
export async function getLinks(now = Date.now()): Promise<Link[]> {
  return Object.values(await kvRead<Record<string, Link>>(K.links, seedLinks)).map((l) => settle(l, now));
}

export async function linksForOrg(orgId: string, now = Date.now()): Promise<Link[]> {
  return (await getLinks(now)).filter((l) => l.factoryOrgId === orgId || l.buyerOrgId === orgId);
}

/**
 * Applies one step (unlink, cancel, agree) to the stored link inside the store's lock, so two
 * people pressing buttons at the same moment can't overwrite each other.
 */
export async function applyLinkStep(linkId: string, step: (l: Link) => LinkResult): Promise<LinkResult> {
  let result: LinkResult = { ok: false, error: "Unknown link." };
  await kvUpdate<Record<string, Link>>(K.links, seedLinks, (all) => {
    const current = all[linkId];
    result = current ? step(settle(current)) : { ok: false, error: "Unknown link." };
    if (result.ok) all[linkId] = result.link;
  });
  return result;
}

/** Saves one link (used when a new link is created). */
export async function saveLink(link: Link): Promise<void> {
  await kvUpdate<Record<string, Link>>(K.links, seedLinks, (all) => {
    all[link.id] = link;
  });
}

// ---------- invites ----------

const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

/** A new single-use invite. Only the hash of the token is stored; the link is shown to the factory once. */
export async function createInvite(factoryOrgId: string, createdBy: string, note: string): Promise<{ token: string; invite: Invite }> {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  const invite: Invite = {
    id: `inv-${randomBytes(6).toString("hex")}`,
    factoryOrgId,
    tokenHash: tokenHash(token),
    note: note.trim().slice(0, 120),
    createdBy,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + INVITE_TTL_MS).toISOString(),
  };
  await kvUpdate<Invite[]>(K.invites, none([]), (list) => {
    if (!list.some((i) => i.id === invite.id)) list.push(invite);
  });
  return { token, invite };
}

export async function invitesForFactory(factoryOrgId: string): Promise<Invite[]> {
  return (await kvRead<Invite[]>(K.invites, none([]))).filter((i) => i.factoryOrgId === factoryOrgId);
}

export async function findInvite(token: string): Promise<Invite | null> {
  if (typeof token !== "string" || token.length < 20 || token.length > 100) return null;
  const h = tokenHash(token);
  return (await kvRead<Invite[]>(K.invites, none([]))).find((i) => i.tokenHash === h) ?? null;
}

export async function revokeInvite(factoryOrgId: string, id: string): Promise<boolean> {
  let done = false;
  await kvUpdate<Invite[]>(K.invites, none([]), (list) => {
    done = false;
    const inv = list.find((i) => i.id === id && i.factoryOrgId === factoryOrgId);
    if (inv && inviteState(inv) === "open") {
      inv.revokedAt = new Date().toISOString();
      done = true;
    }
  });
  return done;
}

export type AcceptResult = { ok: true; link: Link; created: boolean } | { ok: false; error: string };

/** Uses up the invite and links the buyer to the factory (or returns the link they already have). */
export async function acceptInvite(token: string, buyerOrgId: string): Promise<AcceptResult> {
  const h = tokenHash(token);
  const now = Date.now();
  let failure: string | null = null;
  let factoryOrgId = "";
  await kvUpdate<Invite[]>(K.invites, none([]), (list) => {
    failure = null;
    const inv = list.find((i) => i.tokenHash === h);
    const state = inv ? inviteState(inv, now) : null;
    if (!inv || state !== "open") {
      failure = state === "used" ? "This invite has already been used." : state === "expired" ? "This invite has expired. Ask the factory for a new one." : "This invite is not valid.";
      return;
    }
    inv.usedAt = new Date(now).toISOString();
    inv.usedByOrgId = buyerOrgId;
    factoryOrgId = inv.factoryOrgId;
  });
  if (failure) return { ok: false, error: failure };

  const existing = (await linksForOrg(buyerOrgId, now)).find((l) => l.factoryOrgId === factoryOrgId && (l.status === "active" || l.status === "unlink_pending"));
  if (existing) return { ok: true, link: existing, created: false };
  const link: Link = {
    id: `lnk-${randomBytes(6).toString("hex")}`,
    factoryOrgId,
    buyerOrgId,
    createdAt: new Date(now).toISOString(),
    via: "invite",
    status: "active",
  };
  await saveLink(link);
  return { ok: true, link, created: true };
}
