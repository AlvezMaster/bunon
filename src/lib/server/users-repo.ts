/**
 * User lookup for authentication — PostgreSQL `bunon_users` when available, seeded memory otherwise.
 */
import { SEED_USERS, type SeedUser } from "../seed/users-seed.ts";
import { getDataSourceKind, getPool, invalidateDataSource, type DataSourceKind } from "./data-source.ts";
import { SEED_USER_ORG, findStoredUser } from "./accounts-repo.ts";

export type DbUser = SeedUser & { org_id?: string };

export interface UserLookup {
  user: DbUser | null;
  source: DataSourceKind;
}

export async function findUserByEmail(email: string): Promise<UserLookup> {
  const needle = email.trim().toLowerCase();
  let source = await getDataSourceKind();
  if (source === "postgres") {
    try {
      const { rows } = await getPool().query<DbUser>(
        "SELECT id, email, password_hash, full_name, organization, role, clearance_level, cluster_id, avatar_initial FROM bunon_users WHERE LOWER(email) = $1 LIMIT 1",
        [needle]
      );
      if (rows[0]) return { user: rows[0], source };
      return { user: await findStoredUser(needle), source };
    } catch (err) {
      console.warn("[bunon/users] postgres lookup failed, falling back to memory:", err instanceof Error ? err.message : err);
      invalidateDataSource();
      source = "memory";
    }
  }
  return { user: SEED_USERS.find((u) => u.email.toLowerCase() === needle) ?? (await findStoredUser(needle)), source };
}

/** The organisation a user belongs to (seeded users map by id). */
export function orgIdOfUser(u: DbUser): string | undefined {
  return u.org_id ?? SEED_USER_ORG[u.id];
}

/** Public projection of a user (never includes the password hash). */
export function toPublicUser(u: DbUser) {
  return {
    id: u.id,
    email: u.email,
    fullName: u.full_name,
    organization: u.organization,
    role: u.role,
    clearanceLevel: u.clearance_level,
    clusterId: u.cluster_id,
    avatarInitial: u.avatar_initial,
    orgId: orgIdOfUser(u),
  };
}

export type PublicUser = ReturnType<typeof toPublicUser>;
