import { RELAY_LIMITS } from '@/constants/relayLimits';
import type { IncidentPayload } from '@/features/incidents/incident.types';

export interface RelayDecision {
  shouldForward: boolean;
  reason: string;
}

export function shouldForwardIncident(
  payload: IncidentPayload,
  processedIds: Set<string>
): RelayDecision {
  if (processedIds.has(payload.incident_id)) {
    return { shouldForward: false, reason: 'Already processed by this device' };
  }

  const expiresAt = new Date(payload.expires_at).getTime();
  if (Date.now() > expiresAt) {
    return { shouldForward: false, reason: 'Incident has expired' };
  }

  if (payload.hop_count >= RELAY_LIMITS.MAX_HOP_COUNT) {
    return { shouldForward: false, reason: 'Maximum hop count reached' };
  }

  return { shouldForward: true, reason: 'Eligible for forwarding' };
}

export function incrementHopCount(payload: IncidentPayload): IncidentPayload {
  return { ...payload, hop_count: payload.hop_count + 1 };
}

export function retryDelayMs(attempt: number): number {
  const base = RELAY_LIMITS.RETRY_BASE_DELAY_MS;
  const max = RELAY_LIMITS.RETRY_MAX_DELAY_MS;
  const jitter = Math.random() * RELAY_LIMITS.RETRY_JITTER_MS;
  return Math.min(base * 2 ** attempt + jitter, max);
}
