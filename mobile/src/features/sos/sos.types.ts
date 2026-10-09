export interface SOSCreationParams {
  batteryPercent: number | null;
}

export interface SOSCreationResult {
  success: boolean;
  incidentId?: string;
  error?: string;
}
