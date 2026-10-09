import * as Location from 'expo-location';

export interface PermissionState {
  location: boolean;
}

export async function requestAllPermissions(): Promise<PermissionState> {
  const { status: locStatus } = await Location.requestForegroundPermissionsAsync();

  return {
    location: locStatus === 'granted',
  };
}

export async function checkPermissions(): Promise<PermissionState> {
  const { status: locStatus } = await Location.getForegroundPermissionsAsync();

  return {
    location: locStatus === 'granted',
  };
}
