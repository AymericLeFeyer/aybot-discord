import { ApiError } from '@/shared/errors';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

/** Client HTTP de base : JSON, erreurs `{ error }` du serveur converties en ApiError. */
export async function httpRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError('Serveur injoignable. Le bot est-il démarré ?', 0);
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? `Erreur ${response.status}`, response.status);
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
}
