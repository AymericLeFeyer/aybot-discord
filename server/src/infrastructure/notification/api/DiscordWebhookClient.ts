import type {
  NotificationGateway,
  NotificationPayload,
} from '../../../domain/notification/repositories/NotificationGateway.js';
import { GatewayError } from '../../../shared/errors.js';

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 3;

export class DiscordWebhookClient implements NotificationGateway {
  async send(webhookUrl: string, payload: NotificationPayload): Promise<void> {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      let response: Response;
      try {
        response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Les titres viennent de tiers : empêche tout @everyone/@here/rôle injecté.
          body: JSON.stringify({ ...payload, allowed_mentions: { parse: [] } }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch (error) {
        throw new GatewayError(`Discord injoignable : ${(error as Error).message}`);
      }

      if (response.ok) return;

      // Rate limit : Discord indique combien de secondes attendre.
      if (response.status === 429 && attempt < MAX_ATTEMPTS) {
        const body = (await response.json().catch(() => ({}))) as { retry_after?: number };
        await new Promise((resolve) => setTimeout(resolve, (body.retry_after ?? 1) * 1000));
        continue;
      }

      const detail = await response.text().catch(() => '');
      if (response.status === 404 || response.status === 401) {
        throw new GatewayError('Webhook Discord introuvable (supprimé ou URL invalide).');
      }
      throw new GatewayError(`Discord a répondu ${response.status} ${detail}`.trim());
    }
    throw new GatewayError('Discord : trop de requêtes, réessaie plus tard.');
  }
}
