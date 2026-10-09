import * as Location from 'expo-location';
import { v4 as uuidv4 } from 'uuid';
import { RELAY_LIMITS } from '@/constants/relayLimits';
import { SCHEMA_VERSION } from '@/constants/config';
import type { IncidentPayload } from '@/features/incidents/incident.types';
import type { SOSCreationParams } from './sos.types';

export async function createSOSPayload(params: SOSCreationParams): Promise<{
  payload: IncidentPayload;
}> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + RELAY_LIMITS.INCIDENT_EXPIRY_MS);

  let location: IncidentPayload['location'] = null;
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      location = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy_m: loc.coords.accuracy ?? 0,
        captured_at: new Date(loc.timestamp).toISOString(),
      };
    }
  } catch {
    // Location is optional; SOS still proceeds without it
  }

  const payload: IncidentPayload = {
    schema_version: SCHEMA_VERSION,
    incident_id: uuidv4(),
    origin_id: uuidv4(), // opaque per-device random identifier
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    incident_type: 'USER_INITIATED_SOS',
    location,
    battery_percent: params.batteryPercent,
    hop_count: 0,
  };

  return { payload };
}
