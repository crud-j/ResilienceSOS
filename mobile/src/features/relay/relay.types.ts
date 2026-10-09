export type RelayState = 'IDLE' | 'ADVERTISING' | 'DISCOVERING' | 'CONNECTED' | 'ERROR';

export interface ConnectedPeer {
  endpointId: string;
  endpointName: string;
  connectedAt: number;
}

export interface TransferAttempt {
  incidentId: string;
  endpointId: string;
  attemptedAt: number;
  success: boolean;
  failureReason?: string;
}
