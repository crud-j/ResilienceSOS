import Constants from 'expo-constants';

export const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  'http://10.0.2.2:4000';

export const NEARBY_SERVICE_ID = 'com.resiliencesos.app.nearby';

export const SCHEMA_VERSION = 1 as const;
