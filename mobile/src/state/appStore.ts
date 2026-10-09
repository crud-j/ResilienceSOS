import { useState, useCallback } from 'react';
import type { LocalIncident } from '@/features/incidents/incident.types';
import type { RelayState, ConnectedPeer } from '@/features/relay/relay.types';

// Minimal global state via useState — replace with Zustand or React Context if the
// app grows beyond a handful of screens.
export interface AppState {
  incidents: LocalIncident[];
  relayState: RelayState;
  connectedPeers: ConnectedPeer[];
  isOnline: boolean;
}

export const DEFAULT_APP_STATE: AppState = {
  incidents: [],
  relayState: 'IDLE',
  connectedPeers: [],
  isOnline: false,
};
