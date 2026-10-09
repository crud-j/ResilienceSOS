import { API_BASE_URL } from '@/constants/config';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  statusCode: number;
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  token?: string
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => ({}));
    return { statusCode: res.status, data: json as T };
  } catch (err) {
    return { statusCode: 0, error: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function apiGet<T>(
  path: string,
  token?: string
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { headers });
    const json = await res.json().catch(() => ({}));
    return { statusCode: res.status, data: json as T };
  } catch (err) {
    return { statusCode: 0, error: err instanceof Error ? err.message : 'Network error' };
  }
}
