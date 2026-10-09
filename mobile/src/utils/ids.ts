import { v4 as uuidv4 } from 'uuid';

export function generateIncidentId(): string {
  return uuidv4();
}

export function generateOriginId(): string {
  return uuidv4();
}
