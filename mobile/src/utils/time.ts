export function msToMinutes(ms: number): number {
  return Math.floor(ms / 60_000);
}

export function isExpired(expiresAtIso: string): boolean {
  return Date.now() > new Date(expiresAtIso).getTime();
}

export function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${msToMinutes(diff)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}
