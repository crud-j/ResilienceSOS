export interface PermissionsResult {
  [permission: string]: boolean;
}

export interface EndpointFoundPayload {
  endpointId: string;
  endpointName: string;
  serviceId: string;
}

export interface ConnectionInitiatedPayload {
  endpointId: string;
  endpointName: string;
  authenticationDigits: string;
}

export interface ConnectionResultPayload {
  endpointId: string;
  statusCode: number;
  isSuccess: boolean;
}

export interface PayloadReceivedPayload {
  endpointId: string;
  payloadId: number;
  payload: string;
}

export interface PayloadTransferUpdatePayload {
  endpointId: string;
  payloadId: number;
  status: number;
  bytesTransferred: number;
  totalBytes: number;
}

export interface NearbyErrorPayload {
  operation: string;
  endpointId?: string;
  message: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ResilienceNearbyEvents {
  [key: string]: (event: any) => void;
  onEndpointFound: (event: EndpointFoundPayload) => void;
  onEndpointLost: (event: { endpointId: string }) => void;
  onConnectionInitiated: (event: ConnectionInitiatedPayload) => void;
  onConnectionResult: (event: ConnectionResultPayload) => void;
  onDisconnected: (event: { endpointId: string }) => void;
  onPayloadReceived: (event: PayloadReceivedPayload) => void;
  onPayloadTransferUpdate: (event: PayloadTransferUpdatePayload) => void;
  onNearbyError: (event: NearbyErrorPayload) => void;
}
