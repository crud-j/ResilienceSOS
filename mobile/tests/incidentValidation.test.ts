import { validateIncidentPayload } from '../src/features/incidents/incident.validation';
import { RELAY_LIMITS } from '../src/constants/relayLimits';

function validPayload() {
  return {
    schema_version: 1,
    incident_id: '550e8400-e29b-41d4-a716-446655440000',
    origin_id: 'origin-xyz',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    incident_type: 'USER_INITIATED_SOS' as const,
    location: {
      latitude: 14.5,
      longitude: 121.0,
      accuracy_m: 25,
      captured_at: new Date().toISOString(),
    },
    battery_percent: 54,
    hop_count: 0,
  };
}

describe('validateIncidentPayload', () => {
  it('accepts a valid payload', () => {
    expect(validateIncidentPayload(validPayload()).valid).toBe(true);
  });

  it('rejects missing incident_id', () => {
    const { incident_id: _, ...rest } = validPayload();
    const result = validateIncidentPayload(rest);
    expect(result.valid).toBe(false);
  });

  it('rejects invalid UUID', () => {
    const result = validateIncidentPayload({ ...validPayload(), incident_id: 'not-a-uuid' });
    expect(result.valid).toBe(false);
  });

  it('rejects expired payload', () => {
    const result = validateIncidentPayload({
      ...validPayload(),
      expires_at: new Date(Date.now() - 1000).toISOString(),
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/expired/i);
  });

  it('rejects oversized payload', () => {
    const result = validateIncidentPayload(
      validPayload(),
      RELAY_LIMITS.MAX_PACKET_BYTES + 1
    );
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/bytes/i);
  });

  it('rejects out-of-range latitude', () => {
    const result = validateIncidentPayload({
      ...validPayload(),
      location: { ...validPayload().location!, latitude: 200 },
    });
    expect(result.valid).toBe(false);
  });

  it('rejects hop count at maximum', () => {
    const result = validateIncidentPayload({
      ...validPayload(),
      hop_count: RELAY_LIMITS.MAX_HOP_COUNT,
    });
    expect(result.valid).toBe(false);
  });
});
