import { shouldForwardIncident, incrementHopCount } from '../src/features/relay/relayPolicy';
import { RELAY_LIMITS } from '../src/constants/relayLimits';
import type { IncidentPayload } from '../src/features/incidents/incident.types';

function makePayload(overrides: Partial<IncidentPayload> = {}): IncidentPayload {
  return {
    schema_version: 1,
    incident_id: 'test-uuid-1234',
    origin_id: 'origin-abc',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    incident_type: 'USER_INITIATED_SOS',
    location: null,
    battery_percent: null,
    hop_count: 0,
    ...overrides,
  };
}

describe('relayPolicy', () => {
  describe('shouldForwardIncident', () => {
    it('allows a fresh valid incident', () => {
      const result = shouldForwardIncident(makePayload(), new Set());
      expect(result.shouldForward).toBe(true);
    });

    it('rejects already-processed incident', () => {
      const payload = makePayload();
      const processed = new Set([payload.incident_id]);
      const result = shouldForwardIncident(payload, processed);
      expect(result.shouldForward).toBe(false);
      expect(result.reason).toMatch(/already processed/i);
    });

    it('rejects expired incident', () => {
      const payload = makePayload({
        expires_at: new Date(Date.now() - 1000).toISOString(),
      });
      const result = shouldForwardIncident(payload, new Set());
      expect(result.shouldForward).toBe(false);
      expect(result.reason).toMatch(/expired/i);
    });

    it('rejects incident at hop limit', () => {
      const payload = makePayload({ hop_count: RELAY_LIMITS.MAX_HOP_COUNT });
      const result = shouldForwardIncident(payload, new Set());
      expect(result.shouldForward).toBe(false);
      expect(result.reason).toMatch(/hop count/i);
    });
  });

  describe('incrementHopCount', () => {
    it('increments hop_count by 1', () => {
      const payload = makePayload({ hop_count: 2 });
      const updated = incrementHopCount(payload);
      expect(updated.hop_count).toBe(3);
      expect(updated.incident_id).toBe(payload.incident_id);
    });

    it('does not mutate the original payload', () => {
      const payload = makePayload({ hop_count: 1 });
      incrementHopCount(payload);
      expect(payload.hop_count).toBe(1);
    });
  });
});
