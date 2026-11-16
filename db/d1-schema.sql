-- Bunon on Cloudflare D1 (SQLite). Apply with:
--   npx wrangler d1 execute bunon --remote --file db/d1-schema.sql

-- Key/value store for accounts, links, invites, catalog state and ledger parties.
-- `version` lets the app update a value only if nobody changed it since it was read.
CREATE TABLE IF NOT EXISTS bunon_kv (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  version    INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

-- Append-only, hash-chained ledger. Block numbers are unique, so two writers can't both add the same block.
CREATE TABLE IF NOT EXISTS bunon_audit_ledger (
  block        INTEGER PRIMARY KEY,
  id           TEXT NOT NULL UNIQUE,
  time         TEXT NOT NULL,
  type         TEXT NOT NULL,
  actor        TEXT NOT NULL,
  summary      TEXT NOT NULL,
  style_code   TEXT,
  payload_hash TEXT,
  prev_hash    TEXT NOT NULL,
  hash         TEXT NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('verified', 'flagged'))
);

-- The database itself refuses to change or remove a ledger entry.
CREATE TRIGGER IF NOT EXISTS bunon_ledger_no_update BEFORE UPDATE ON bunon_audit_ledger
BEGIN SELECT RAISE(ABORT, 'bunon_audit_ledger is append-only'); END;

CREATE TRIGGER IF NOT EXISTS bunon_ledger_no_delete BEFORE DELETE ON bunon_audit_ledger
BEGIN SELECT RAISE(ABORT, 'bunon_audit_ledger is append-only'); END;
