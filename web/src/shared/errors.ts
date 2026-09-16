export class ValidationError extends Error {
  override readonly name = 'ValidationError';
}

export class ApiError extends Error {
  override readonly name = 'ApiError';

  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Une erreur inattendue est survenue.';
}
