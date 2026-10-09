import { Router } from 'express';
import { ingestIncident } from './incident.service.js';
import { findById } from './incident.repository.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createError } from '../../middleware/errorHandler.js';

export const incidentRouter = Router();

// POST /v1/incidents — ingest from an authorized gateway
incidentRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const rawSize = Buffer.byteLength(JSON.stringify(req.body), 'utf8');
    const gatewayCode = req.headers['x-gateway-id'] as string | undefined;
    const requestId = req.headers['x-request-id'] as string | undefined;

    const { incident, isDuplicate } = await ingestIncident(req.body, rawSize, gatewayCode, requestId);

    res.status(isDuplicate ? 200 : 201).json({
      incident_id: incident.id,
      client_incident_id: incident.client_incident_id,
      status: incident.status,
      gateway_received_at: incident.gateway_received_at,
      is_duplicate: isDuplicate,
    });
  })
);

// GET /v1/incidents/:id — return status with event timeline
incidentRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const incident = await findById(req.params['id'] as string);
    if (!incident) throw createError(404, 'NOT_FOUND', 'Incident not found');

    res.json({
      incident_id: incident.id,
      client_incident_id: incident.client_incident_id,
      status: incident.status,
      notification_status: incident.notification_status,
      gateway_received_at: incident.gateway_received_at,
      hop_count: incident.hop_count,
      events: incident.delivery_events.map((e: { event_type: string; occurred_at: Date }) => ({
        type: e.event_type,
        occurred_at: e.occurred_at,
      })),
    });
  })
);
