import { getDb } from './database';
import type { IncidentPayload } from '@/features/incidents/incident.types';

export type SQLiteIncidentStatus =
  | 'DRAFT' | 'CREATED' | 'QUEUED' | 'RELAYING' | 'RELAYED'
  | 'GATEWAY_QUEUED' | 'UPLOADED' | 'SMS_REQUESTED' | 'SMS_PROVIDER_ACCEPTED'
  | 'SMS_DELIVERED' | 'ACKNOWLEDGED' | 'CANCELLED' | 'EXPIRED' | 'FAILED';

export interface DBIncident {
  incident_id: string;
  schema_version: number;
  origin_id: string;
  role: 'ORIGINATOR' | 'RELAY';
  incident_type: string;
  status: SQLiteIncidentStatus;
  created_at: number;
  expires_at: number;
  latitude: number | null;
  longitude: number | null;
  accuracy_m: number | null;
  location_captured_at: number | null;
  battery_percent: number | null;
  hop_count: number;
  payload_json: string;
  payload_size_bytes: number;
  received_from_endpoint: string | null;
  received_at: number | null;
  last_forwarded_at: number | null;
  failure_reason: string | null;
  server_incident_id: string | null;
  backend_status: string | null;
  backend_status_at: number | null;
  updated_at: number;
}

export async function insertOriginatorIncident(payload: IncidentPayload): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  const payloadJson = JSON.stringify(payload);
  const payloadSize = new TextEncoder().encode(payloadJson).length;

  await db.runAsync(
    `INSERT INTO incidents
       (incident_id, schema_version, origin_id, role, incident_type, status,
        created_at, expires_at,
        latitude, longitude, accuracy_m, location_captured_at,
        battery_percent, hop_count,
        payload_json, payload_size_bytes, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      payload.incident_id,
      payload.schema_version,
      payload.origin_id,
      'ORIGINATOR',
      payload.incident_type,
      'CREATED',
      new Date(payload.created_at).getTime(),
      new Date(payload.expires_at).getTime(),
      payload.location?.latitude ?? null,
      payload.location?.longitude ?? null,
      payload.location?.accuracy_m ?? null,
      payload.location ? new Date(payload.location.captured_at).getTime() : null,
      payload.battery_percent ?? null,
      payload.hop_count,
      payloadJson,
      payloadSize,
      now,
    ]
  );
}

export async function insertRelayIncident(
  payload: IncidentPayload,
  fromEndpointId: string
): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  const payloadJson = JSON.stringify(payload);
  const payloadSize = new TextEncoder().encode(payloadJson).length;

  await db.runAsync(
    `INSERT OR IGNORE INTO incidents
       (incident_id, schema_version, origin_id, role, incident_type, status,
        created_at, expires_at,
        latitude, longitude, accuracy_m, location_captured_at,
        battery_percent, hop_count,
        payload_json, payload_size_bytes,
        received_from_endpoint, received_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      payload.incident_id,
      payload.schema_version,
      payload.origin_id,
      'RELAY',
      payload.incident_type,
      'QUEUED',
      new Date(payload.created_at).getTime(),
      new Date(payload.expires_at).getTime(),
      payload.location?.latitude ?? null,
      payload.location?.longitude ?? null,
      payload.location?.accuracy_m ?? null,
      payload.location ? new Date(payload.location.captured_at).getTime() : null,
      payload.battery_percent ?? null,
      payload.hop_count,
      payloadJson,
      payloadSize,
      fromEndpointId,
      now,
      now,
    ]
  );
}

export async function updateStatus(
  incidentId: string,
  status: SQLiteIncidentStatus,
  failureReason?: string
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE incidents SET status = ?, failure_reason = ?, updated_at = ? WHERE incident_id = ?`,
    [status, failureReason ?? null, Date.now(), incidentId]
  );
}

export async function setServerInfo(
  incidentId: string,
  serverIncidentId: string,
  backendStatus: string
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE incidents
        SET server_incident_id = ?, backend_status = ?, backend_status_at = ?,
            status = 'UPLOADED', updated_at = ?
      WHERE incident_id = ?`,
    [serverIncidentId, backendStatus, Date.now(), Date.now(), incidentId]
  );
}

export async function getQueuedIncidents(): Promise<DBIncident[]> {
  const db = await getDb();
  return db.getAllAsync<DBIncident>(
    `SELECT * FROM incidents
      WHERE status IN ('CREATED','QUEUED')
        AND expires_at > ?
      ORDER BY created_at ASC`,
    [Date.now()]
  );
}

export async function getAllIncidents(): Promise<DBIncident[]> {
  const db = await getDb();
  return db.getAllAsync<DBIncident>(
    'SELECT * FROM incidents ORDER BY created_at DESC'
  );
}

export async function getIncidentById(incidentId: string): Promise<DBIncident | null> {
  const db = await getDb();
  return db.getFirstAsync<DBIncident>(
    'SELECT * FROM incidents WHERE incident_id = ?',
    [incidentId]
  );
}

export async function markExpiredIncidents(): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE incidents
        SET status = 'EXPIRED', updated_at = ?
      WHERE expires_at < ?
        AND status IN ('CREATED','QUEUED','RELAYING','RELAYED','GATEWAY_QUEUED')`,
    [Date.now(), Date.now()]
  );
}
