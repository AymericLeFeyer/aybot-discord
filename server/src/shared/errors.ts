export class ValidationError extends Error {
  override readonly name = 'ValidationError';
}

export class NotFoundError extends Error {
  override readonly name = 'NotFoundError';
}

/** Erreur lors d'un appel à un service externe (YouTube, Discord). */
export class GatewayError extends Error {
  override readonly name = 'GatewayError';
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
