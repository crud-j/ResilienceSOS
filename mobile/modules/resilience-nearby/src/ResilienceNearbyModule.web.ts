import { registerWebModule, NativeModule } from 'expo';

// ResilienceNearbyModule is not available on the web platform.
class ResilienceNearbyModule extends NativeModule<{}> {}

export default registerWebModule(ResilienceNearbyModule, 'ResilienceNearbyModule');
