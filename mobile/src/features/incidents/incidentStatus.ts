import type { IncidentStatus } from './incident.types';

export function statusLabel(status: IncidentStatus): string {
  switch (status) {
    case 'CREATED':           return 'SOS created';
    case 'QUEUED':            return 'Waiting for a compatible relay';
    case 'RELAYED':           return 'Forwarded to nearby device';
    case 'UPLOADED':          return 'Alert received by server';
    case 'SMS_REQUESTED':     return 'Notification requested';
    case 'SMS_PROVIDER_ACCEPTED': return 'SMS provider accepted request';
    case 'SMS_DELIVERED':     return 'SMS delivered';
    case 'ACKNOWLEDGED':      return 'Contact acknowledged';
    case 'EXPIRED':           return 'Alert expired before delivery';
    case 'FAILED':            return 'Delivery failed';
  }
}

export function isTerminalStatus(status: IncidentStatus): boolean {
  return status === 'EXPIRED' || status === 'FAILED' || status === 'ACKNOWLEDGED';
}

export function canForward(status: IncidentStatus): boolean {
  return status === 'QUEUED' || status === 'CREATED';
}
