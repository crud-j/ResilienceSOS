import {
  findByClientId,
  createIncidentWithEvent,
  recordDuplicateIngestion,
} from './incident.repository.js';
import {
  CreateIncidentSchema,
  validateIncidentNotExpired,
} from './incident.schema.js';
import { createError } from '../../middleware/errorHandler.js';
import { logger } from '../../lib/logger.js';
import type { incidents } from '../../generated/prisma/client.js';

export interface IngestResult {
  incident: incidents;
  isDuplicate: boolean;
}

export async function ingestIncident(
  body: unknown,
  rawBodySize: number,
  gatewayCode?: string,
  requestId?: string
): Promise<IngestResult> {
  if (rawBodySize > 4 * 1024) {
    throw createError(413, 'PAYLOAD_TOO_LARGE', 'Incident payload exceeds 4 KB limit');
  }

  const parsed = CreateIncidentSchema.safeParse(body);
  if (!parsed.success) {
    throw createError(400, 'INVALID_PAYLOAD', parsed.error.issues[0]?.message ?? 'Invalid payload');
  }

  const dto = parsed.data;

  if (!validateIncidentNotExpired(dto.expires_at)) {
    throw createError(422, 'INCIDENT_EXPIRED', 'Incident has already expired');
  }

  const existing = await findByClientId(dto.incident_id);
  if (existing) {
    await recordDuplicateIngestion(dto, gatewayCode, requestId).catch(() => {});
    logger.info({ clientIncidentId: dto.incident_id }, 'Duplicate upload ignored');
    return { incident: existing, isDuplicate: true };
  }

  const incident = await createIncidentWithEvent(dto, gatewayCode, requestId);
  logger.info({ incidentId: incident.id, clientIncidentId: dto.incident_id }, 'Incident ingested');
  return { incident, isDuplicate: false };
}
