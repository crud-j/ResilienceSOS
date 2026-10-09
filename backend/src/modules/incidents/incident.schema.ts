import { z } from 'zod';

const MAX_PACKET_BYTES = 4 * 1024;
const MAX_HOP_COUNT = 5;
const SCHEMA_VERSION = 1;

const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy_m: z.number().nonnegative(),
  captured_at: z.string().datetime(),
});

export const CreateIncidentSchema = z.object({
  schema_version: z.literal(SCHEMA_VERSION),
  incident_id: z.string().uuid(),
  origin_id: z.string().min(1).max(80),
  created_at: z.string().datetime(),
  expires_at: z.string().datetime(),
  incident_type: z.literal('USER_INITIATED_SOS'),
  location: LocationSchema.nullable(),
  battery_percent: z.number().int().min(0).max(100).nullable(),
  hop_count: z.number().int().min(0).max(MAX_HOP_COUNT),
});

export type CreateIncidentDto = z.infer<typeof CreateIncidentSchema>;

export function validateIncidentPayloadSize(rawBody: string): boolean {
  return Buffer.byteLength(rawBody, 'utf8') <= MAX_PACKET_BYTES;
}

export function validateIncidentNotExpired(expiresAt: string): boolean {
  return Date.now() < new Date(expiresAt).getTime();
}
