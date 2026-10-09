import { NativeModule, requireNativeModule } from 'expo';
import type { ResilienceNearbyEvents, PermissionsResult } from './ResilienceNearby.types';

declare class ResilienceNearbyModule extends NativeModule<ResilienceNearbyEvents> {
  checkPermissions(): Promise<PermissionsResult>;
  startAdvertising(serviceId: string): Promise<void>;
  startDiscovery(serviceId: string): Promise<void>;
  requestConnection(endpointId: string): Promise<void>;
  acceptConnection(endpointId: string): Promise<void>;
  rejectConnection(endpointId: string): Promise<void>;
  sendPayload(endpointId: string, payload: string): Promise<void>;
  disconnect(endpointId: string): Promise<void>;
  stopAll(): Promise<void>;
}

export default requireNativeModule<ResilienceNearbyModule>('ResilienceNearby');
