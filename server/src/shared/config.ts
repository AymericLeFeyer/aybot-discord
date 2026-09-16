import path from 'node:path';

function positiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const config = {
  port: positiveNumber(process.env.PORT, 3000),
  pollIntervalMinutes: positiveNumber(process.env.POLL_INTERVAL_MINUTES, 5),
  dataFile: path.resolve(process.env.DATA_FILE ?? './data/subscriptions.json'),
  /** Si défini, protège l'interface et l'API par HTTP Basic Auth (nom d'utilisateur libre). */
  adminPassword: process.env.ADMIN_PASSWORD || null,
  /** Dossier du front buildé, servi en statique en production. */
  webDistDir: path.resolve(process.env.WEB_DIST_DIR ?? '../web/dist'),
};
