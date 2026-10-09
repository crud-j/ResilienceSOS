import { z } from 'zod';
import { RELAY_LIMITS } from '@/constants/relayLimits';
import { SCHEMA_VERSION } from '@/constants/config';

const IncidentLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy_m: z.number().nonnegative(),
  captured_at: z.string().datetime(),
});

export const IncidentPayloadSchema = z.object({
  schema_version: z.literal(SCHEMA_VERSION),
  incident_id: z.string().uuid(),
  origin_id: z.string().min(1).max(80),
  created_at: z.string().datetime(),
  expires_at: z.string().datetime(),
  incident_type: z.literal('USER_INITIATED_SOS'),
  location: IncidentLocationSchema.nullable(),
  battery_percent: z.number().int().min(0).max(100).nullable(),
  hop_count: z.number().int().min(0).max(RELAY_LIMITS.MAX_HOP_COUNT),
});

export type ValidatedIncidentPayload = z.infer<typeof IncidentPayloadSchema>;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateIncidentPayload(
  raw: unknown,
  serializedBytes?: number
): ValidationResult {
  if (serializedBytes !== undefined && serializedBytes > RELAY_LIMITS.MAX_PACKET_BYTES) {
    return { valid: false, error: `Packet exceeds ${RELAY_LIMITS.MAX_PACKET_BYTES} bytes` };
  }

  const result = IncidentPayloadSchema.safeParse(raw);
  if (!result.success) {
    return { valid: false, error: result.error.issues[0]?.message ?? 'Invalid payload' };
  }

  const payload = result.data;
  const now = Date.now();
  const expiresAt = new Date(payload.expires_at).getTime();

  if (expiresAt < now) {
    return { valid: false, error: 'Incident has expired' };
  }

  if (payload.hop_count >= RELAY_LIMITS.MAX_HOP_COUNT) {
    return { valid: false, error: 'Hop count at maximum limit' };
  }

  return { valid: true };
}
