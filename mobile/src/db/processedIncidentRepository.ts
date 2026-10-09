import { getDb } from './database';
import { RELAY_LIMITS } from '@/constants/relayLimits';

export type ProcessingOutcome =
  | 'ACCEPTED'
  | 'DUPLICATE'
  | 'REJECTED_EXPIRED'
  | 'REJECTED_HOP_LIMIT'
  | 'REJECTED_INVALID'
  | 'REJECTED_OVERSIZE';

export async function markProcessed(
  incidentId: string,
  outcome: ProcessingOutcome
): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  const retainUntil = now + RELAY_LIMITS.DUPLICATE_RETENTION_MS;

  await db.runAsync(
    `INSERT INTO processed_incidents (incident_id, first_seen_at, last_seen_at, outcome, retain_until)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (incident_id) DO UPDATE
       SET last_seen_at = excluded.last_seen_at,
           times_seen   = times_seen + 1,
           outcome      = excluded.outcome,
           retain_until = MAX(retain_until, excluded.retain_until)`,
    [incidentId, now, now, outcome, retainUntil]
  );
}

export async function wasProcessed(incidentId: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ incident_id: string }>(
    'SELECT incident_id FROM processed_incidents WHERE incident_id = ?',
    [incidentId]
  );
  return row !== null;
}

export async function pruneExpired(): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'DELETE FROM processed_incidents WHERE retain_until < ?',
    [Date.now()]
  );
}
