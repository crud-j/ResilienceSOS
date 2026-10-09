import { getDb } from './database';
import { RELAY_LIMITS } from '@/constants/relayLimits';

export type UploadState = 'PENDING' | 'IN_FLIGHT' | 'UPLOADED' | 'FAILED_PERMANENT';

export interface UploadQueueEntry {
  id: number;
  incident_id: string;
  state: UploadState;
  attempt_count: number;
  next_attempt_at: number;
  last_attempt_at: number | null;
  last_http_status: number | null;
  last_error_code: string | null;
  created_at: number;
}

function nextBackoffMs(attempt: number): number {
  const base = RELAY_LIMITS.RETRY_BASE_DELAY_MS;
  const max = RELAY_LIMITS.RETRY_MAX_DELAY_MS;
  const jitter = Math.random() * RELAY_LIMITS.RETRY_JITTER_MS;
  return Math.min(base * 2 ** attempt + jitter, max);
}

export async function enqueue(incidentId: string): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    `INSERT OR IGNORE INTO upload_queue (incident_id, state, attempt_count, next_attempt_at, created_at)
     VALUES (?, 'PENDING', 0, ?, ?)`,
    [incidentId, now, now]
  );
}

export async function getDueUploads(): Promise<UploadQueueEntry[]> {
  const db = await getDb();
  return db.getAllAsync<UploadQueueEntry>(
    `SELECT * FROM upload_queue
      WHERE state IN ('PENDING','IN_FLIGHT')
        AND next_attempt_at <= ?
      ORDER BY next_attempt_at ASC`,
    [Date.now()]
  );
}

export async function recordSuccess(incidentId: string, httpStatus: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE upload_queue
        SET state = 'UPLOADED', last_http_status = ?, last_attempt_at = ?
      WHERE incident_id = ?`,
    [httpStatus, Date.now(), incidentId]
  );
}

export async function recordFailure(
  incidentId: string,
  httpStatus: number | null,
  errorCode: string,
  attempt: number
): Promise<void> {
  const db = await getDb();
  const permanent = attempt >= RELAY_LIMITS.MAX_RETRY_ATTEMPTS;
  const nextAt = permanent ? Date.now() : Date.now() + nextBackoffMs(attempt);
  await db.runAsync(
    `UPDATE upload_queue
        SET state          = ?,
            attempt_count  = attempt_count + 1,
            last_attempt_at = ?,
            last_http_status = ?,
            last_error_code = ?,
            next_attempt_at = ?
      WHERE incident_id = ?`,
    [permanent ? 'FAILED_PERMANENT' : 'PENDING', Date.now(), httpStatus, errorCode, nextAt, incidentId]
  );
}

export async function remove(incidentId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM upload_queue WHERE incident_id = ?', [incidentId]);
}
