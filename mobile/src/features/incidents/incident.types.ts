export type IncidentStatus =
  | 'CREATED'
  | 'QUEUED'
  | 'RELAYED'
  | 'UPLOADED'
  | 'SMS_REQUESTED'
  | 'SMS_PROVIDER_ACCEPTED'
  | 'SMS_DELIVERED'
  | 'ACKNOWLEDGED'
  | 'EXPIRED'
  | 'FAILED';

export interface IncidentLocation {
  latitude: number;
  longitude: number;
  accuracy_m: number;
  captured_at: string; // ISO-8601
}

export interface IncidentPayload {
  schema_version: number;
  incident_id: string;
  origin_id: string;
  created_at: string;
  expires_at: string;
  incident_type: 'USER_INITIATED_SOS';
  location: IncidentLocation | null;
  battery_percent: number | null;
  hop_count: number;
}

export interface LocalIncident {
  id: number;
  incidentId: string;
  status: IncidentStatus;
  payload: IncidentPayload;
  createdAt: number; // Unix ms
  updatedAt: number;
  lastRelayAttemptAt: number | null;
  lastError: string | null;
}
