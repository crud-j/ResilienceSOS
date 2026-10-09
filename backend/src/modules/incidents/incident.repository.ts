import { prisma } from '../../lib/prisma.js';
import type { Prisma, incidents } from '../../generated/prisma/client.js';
import type { CreateIncidentDto } from './incident.schema.js';

export async function findByClientId(clientIncidentId: string): Promise<incidents | null> {
  return prisma.incidents.findUnique({
    where: { client_incident_id: clientIncidentId as unknown as string },
  });
}

/** Upsert origin_devices record for the opaque origin_id, then create the incident + first event in one transaction. */
export async function createIncidentWithEvent(
  dto: CreateIncidentDto,
  gatewayCode?: string,
  requestId?: string
): Promise<incidents> {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Resolve or create the origin device record.
    let originDevice = await tx.origin_devices.findUnique({
      where: { origin_id: dto.origin_id },
    });
    if (!originDevice) {
      originDevice = await tx.origin_devices.create({
        data: { origin_id: dto.origin_id },
      });
    }

    // 2. Resolve gateway (optional — only if gateway_code header supplied).
    let gatewayId: string | null = null;
    if (gatewayCode) {
      const gw = await tx.gateways.findUnique({ where: { gateway_code: gatewayCode } });
      gatewayId = gw?.id ?? null;
    }

    // 3. Create the incident.
    const incident = await tx.incidents.create({
      data: {
        client_incident_id: dto.incident_id as unknown as string,
        origin_device_id: originDevice.id,
        gateway_id: gatewayId,
        origin_created_at: new Date(dto.created_at),
        origin_expires_at: new Date(dto.expires_at),
        latitude: dto.location?.latitude ?? null,
        longitude: dto.location?.longitude ?? null,
        location_accuracy_m: dto.location?.accuracy_m ?? null,
        location_captured_at: dto.location ? new Date(dto.location.captured_at) : null,
        battery_percent: dto.battery_percent ?? null,
        hop_count: dto.hop_count,
        schema_version: dto.schema_version,
      },
    });

    // 4. Record the INCIDENT_RECEIVED delivery event.
    await tx.delivery_events.create({
      data: {
        incident_id: incident.id,
        event_type: 'INCIDENT_RECEIVED',
        actor_type: 'GATEWAY',
        gateway_id: gatewayId,
        request_id: requestId ?? null,
        details: { hop_count: dto.hop_count, origin_id: dto.origin_id },
      },
    });

    // 5. Log the accepted ingestion attempt.
    await tx.ingestion_attempts.create({
      data: {
        gateway_id: gatewayId,
        client_incident_id: dto.incident_id,
        incident_id: incident.id,
        outcome: 'ACCEPTED',
        request_id: requestId ?? null,
      },
    });

    return incident;
  });
}

export async function recordDuplicateIngestion(
  dto: CreateIncidentDto,
  gatewayCode?: string,
  requestId?: string
): Promise<void> {
  let gatewayId: string | null = null;
  if (gatewayCode) {
    const gw = await prisma.gateways.findUnique({ where: { gateway_code: gatewayCode } });
    gatewayId = gw?.id ?? null;
  }

  await prisma.ingestion_attempts.create({
    data: {
      gateway_id: gatewayId,
      client_incident_id: dto.incident_id,
      outcome: 'DUPLICATE',
      request_id: requestId ?? null,
    },
  });
}

export async function findById(
  id: string
): Promise<(incidents & { delivery_events: { event_type: string; occurred_at: Date }[] }) | null> {
  return prisma.incidents.findUnique({
    where: { id },
    include: {
      delivery_events: {
        orderBy: { occurred_at: 'asc' },
        select: { event_type: true, occurred_at: true },
      },
    },
  });
}
