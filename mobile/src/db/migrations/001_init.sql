-- =====================================================================
-- ResilienceSOS | ON-DEVICE database (SQLite via expo-sqlite)
-- File : 03_resilience_sos_mobile_sqlite.sql
-- NOT for PostgreSQL. Place in mobile/src/db/migrations/001_init.sql
-- and execute with db.execAsync() on first launch (guard with
-- PRAGMA user_version so it only runs once).
--
-- Rules from the architecture:
--   * SQLite is the single durable source of truth for the incident queue.
--   * Persist an incident BEFORE acknowledging it to a peer or forwarding.
--   * Never store a contact phone number here in plain text; keep it in
--     expo-secure-store. Never put contact data in relay payloads.
--   * Times are INTEGER epoch milliseconds (UTC).
-- =====================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ---------------------------------------------------------------------
-- incidents: originated here OR received as a relay. Same incident_id on every hop.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS incidents (
    incident_id            TEXT    PRIMARY KEY,            -- UUID generated once per SOS
    schema_version         INTEGER NOT NULL DEFAULT 1,
    origin_id              TEXT    NOT NULL,               -- opaque random id of the originator
    role                   TEXT    NOT NULL CHECK (role IN ('ORIGINATOR','RELAY')),
    incident_type          TEXT    NOT NULL DEFAULT 'USER_INITIATED_SOS',
    status                 TEXT    NOT NULL CHECK (status IN (
                               'DRAFT','CREATED','QUEUED','RELAYING','RELAYED','GATEWAY_QUEUED',
                               'UPLOADED','SMS_REQUESTED','SMS_PROVIDER_ACCEPTED','SMS_DELIVERED',
                               'ACKNOWLEDGED','CANCELLED','EXPIRED','FAILED')),
    created_at             INTEGER NOT NULL,               -- device clock at SOS creation
    expires_at             INTEGER NOT NULL,
    latitude               REAL    CHECK (latitude  IS NULL OR latitude  BETWEEN  -90 AND  90),
    longitude              REAL    CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
    accuracy_m             REAL    CHECK (accuracy_m IS NULL OR accuracy_m >= 0),
    location_captured_at   INTEGER,
    battery_percent        INTEGER CHECK (battery_percent IS NULL OR battery_percent BETWEEN 0 AND 100),
    hop_count              INTEGER NOT NULL DEFAULT 0 CHECK (hop_count >= 0),
    payload_json           TEXT    NOT NULL,               -- exact validated packet to forward
    payload_size_bytes     INTEGER NOT NULL CHECK (payload_size_bytes > 0 AND payload_size_bytes <= 4096),
    received_from_endpoint TEXT,                           -- NULL when originated locally
    received_at            INTEGER,                        -- when persisted as a relay
    last_forwarded_at      INTEGER,
    failure_reason         TEXT,
    server_incident_id     TEXT,                           -- from backend response, once uploaded
    backend_status         TEXT,                           -- last status reported BY THE BACKEND
    backend_status_at      INTEGER,
    updated_at             INTEGER NOT NULL,
    CHECK (expires_at > created_at),
    CHECK ((latitude IS NULL) = (longitude IS NULL))
);
CREATE INDEX IF NOT EXISTS idx_incidents_status   ON incidents (status, expires_at);
CREATE INDEX IF NOT EXISTS idx_incidents_expiry   ON incidents (expires_at);
CREATE INDEX IF NOT EXISTS idx_incidents_role     ON incidents (role, created_at DESC);

-- ---------------------------------------------------------------------
-- processed_incidents: duplicate suppression. Keep at least until expiry.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS processed_incidents (
    incident_id   TEXT    PRIMARY KEY,
    first_seen_at INTEGER NOT NULL,
    last_seen_at  INTEGER NOT NULL,
    times_seen    INTEGER NOT NULL DEFAULT 1,
    outcome       TEXT    NOT NULL CHECK (outcome IN (
                      'ACCEPTED','DUPLICATE','REJECTED_EXPIRED','REJECTED_HOP_LIMIT',
                      'REJECTED_INVALID','REJECTED_OVERSIZE')),
    retain_until  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_processed_retain ON processed_incidents (retain_until);

-- ---------------------------------------------------------------------
-- relay_transfer_attempts: every send/receive over Nearby Connections.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS relay_transfer_attempts (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_id      TEXT    NOT NULL REFERENCES incidents(incident_id) ON DELETE CASCADE,
    peer_endpoint_id TEXT    NOT NULL,                     -- Nearby endpoint id (ephemeral)
    direction        TEXT    NOT NULL CHECK (direction IN ('OUT','IN')),
    hop_count_sent   INTEGER,
    started_at       INTEGER NOT NULL,
    finished_at      INTEGER,
    result           TEXT    CHECK (result IN ('SUCCESS','PEER_ACK','PEER_DISCONNECTED',
                                               'REJECTED','TIMEOUT','ERROR')),
    error_code       TEXT,
    attempt_no       INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_transfer_incident ON relay_transfer_attempts (incident_id, started_at DESC);

-- ---------------------------------------------------------------------
-- incident_forwards: which peers already received which incident, so the
-- device does not endlessly forward to the same peer.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS incident_forwards (
    incident_id      TEXT    NOT NULL REFERENCES incidents(incident_id) ON DELETE CASCADE,
    peer_endpoint_id TEXT    NOT NULL,
    acknowledged     INTEGER NOT NULL DEFAULT 0 CHECK (acknowledged IN (0,1)),  -- peer ACK = receipt only
    forwarded_at     INTEGER NOT NULL,
    PRIMARY KEY (incident_id, peer_endpoint_id)
);

-- ---------------------------------------------------------------------
-- upload_queue: gateway uploads waiting for / retrying against the backend.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS upload_queue (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_id      TEXT    NOT NULL UNIQUE REFERENCES incidents(incident_id) ON DELETE CASCADE,
    state            TEXT    NOT NULL DEFAULT 'PENDING'
                             CHECK (state IN ('PENDING','IN_FLIGHT','UPLOADED','FAILED_PERMANENT')),
    attempt_count    INTEGER NOT NULL DEFAULT 0,
    next_attempt_at  INTEGER NOT NULL,                     -- exponential backoff with jitter
    last_attempt_at  INTEGER,
    last_http_status INTEGER,
    last_error_code  TEXT,
    created_at       INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_upload_due ON upload_queue (state, next_attempt_at);

-- ---------------------------------------------------------------------
-- user_settings: small key/value store (relay opt-in, consent, etc.).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_settings (
    key        TEXT    PRIMARY KEY,
    value      TEXT    NOT NULL,
    updated_at INTEGER NOT NULL
);
-- Expected keys: relay_opt_in, location_consent_at, privacy_ack_at, origin_id,
--                backend_contact_id (reference only; phone stays in secure-store)

-- ---------------------------------------------------------------------
-- diagnostics_log: bounded ring buffer for the Diagnostics screen.
-- No precise coordinates, phone numbers, or full payloads.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS diagnostics_log (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    ts        INTEGER NOT NULL,
    category  TEXT    NOT NULL CHECK (category IN ('PERMISSION','RADIO','NEARBY','LOCATION','UPLOAD','QUEUE','SYSTEM')),
    level     TEXT    NOT NULL CHECK (level IN ('INFO','WARN','ERROR')),
    message   TEXT    NOT NULL,
    details   TEXT
);
CREATE INDEX IF NOT EXISTS idx_diag_ts ON diagnostics_log (ts DESC);

-- Cap the log at 500 rows.
CREATE TRIGGER IF NOT EXISTS trg_diag_cap
AFTER INSERT ON diagnostics_log
BEGIN
    DELETE FROM diagnostics_log
     WHERE id <= (SELECT MAX(id) FROM diagnostics_log) - 500;
END;

-- Keep updated_at fresh on incident changes (guarded against recursion).
CREATE TRIGGER IF NOT EXISTS trg_incidents_touch
AFTER UPDATE ON incidents
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE incidents SET updated_at = CAST(strftime('%s','now') AS INTEGER) * 1000
     WHERE incident_id = NEW.incident_id;
END;

-- Cleanup helpers (run on app start / periodically):
--   DELETE FROM processed_incidents WHERE retain_until < :now;
--   DELETE FROM incidents WHERE expires_at < :now - 86400000 AND status IN ('EXPIRED','UPLOADED','CANCELLED','FAILED');

PRAGMA user_version = 1;
