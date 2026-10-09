import { apiPost } from '@/services/api/apiClient';
import {
  getDueUploads,
  recordSuccess,
  recordFailure,
  remove,
} from '@/db/uploadQueueRepository';
import { getIncidentById, setServerInfo } from '@/db/incidentRepository';
import { logger } from '@/utils/logger';

export async function processUploadQueue(): Promise<void> {
  const due = await getDueUploads();
  if (due.length === 0) return;

  for (const entry of due) {
    const incident = await getIncidentById(entry.incident_id);
    if (!incident) {
      // Stale queue entry — clean up
      await remove(entry.incident_id);
      continue;
    }

    const payload = JSON.parse(incident.payload_json);
    const res = await apiPost<{ incident_id: string; status: string }>(
      '/v1/incidents',
      payload
    );

    if (res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 409) {
      // 409 = idempotent duplicate; treat as success
      await recordSuccess(entry.incident_id, res.statusCode);
      if (res.data?.incident_id) {
        await setServerInfo(entry.incident_id, res.data.incident_id, res.data.status ?? 'UPLOADED');
      }
      logger.info('Upload succeeded', { incidentId: entry.incident_id });
    } else {
      const errorCode = res.error ?? `HTTP_${res.statusCode}`;
      await recordFailure(entry.incident_id, res.statusCode || null, errorCode, entry.attempt_count);
      logger.warn('Upload failed; will retry', { incidentId: entry.incident_id, errorCode });
    }
  }
}
