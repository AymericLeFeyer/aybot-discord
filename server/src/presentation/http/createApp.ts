import { timingSafeEqual } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import express, { type ErrorRequestHandler, type RequestHandler } from 'express';
import { z } from 'zod';
import type { CreateSubscription } from '../../application/subscription/usecases/CreateSubscription.js';
import type { DeleteSubscription } from '../../application/subscription/usecases/DeleteSubscription.js';
import type { ListSubscriptions } from '../../application/subscription/usecases/ListSubscriptions.js';
import type { SendTestNotification } from '../../application/subscription/usecases/SendTestNotification.js';
import type { UpdateSubscription } from '../../application/subscription/usecases/UpdateSubscription.js';
import type { Subscription } from '../../domain/subscription/entities/Subscription.js';
import { MAX_MESSAGE_LENGTH } from '../../domain/subscription/services/messageTemplate.js';
import type { Poller } from '../../infrastructure/scheduler/Poller.js';
import { GatewayError, NotFoundError, ValidationError } from '../../shared/errors.js';
import { logger } from '../../shared/logger.js';

export interface AppDependencies {
  listSubscriptions: ListSubscriptions;
  createSubscription: CreateSubscription;
  updateSubscription: UpdateSubscription;
  deleteSubscription: DeleteSubscription;
  sendTestNotification: SendTestNotification;
  poller: Poller;
  adminPassword: string | null;
  webDistDir: string;
}

const messageSchema = z
  .string()
  .trim()
  .min(1, 'Le message est obligatoire.')
  .max(MAX_MESSAGE_LENGTH, `Le message dépasse ${MAX_MESSAGE_LENGTH} caractères.`);

const createSchema = z.object({
  channel: z.string().trim().min(1, 'La chaîne YouTube est obligatoire.'),
  webhookUrl: z.string().trim().min(1, "L'URL du webhook est obligatoire."),
  message: messageSchema,
  includeShorts: z.boolean().default(true),
});

const updateSchema = z.object({
  webhookUrl: z.string().trim().min(1).optional(),
  message: messageSchema.optional(),
  enabled: z.boolean().optional(),
  includeShorts: z.boolean().optional(),
});

/** Les IDs connus sont un détail interne : on ne les expose pas. */
function toDto({ knownVideoIds: _known, ...subscription }: Subscription) {
  return subscription;
}

function basicAuth(password: string): RequestHandler {
  const expected = Buffer.from(password);
  return (req, res, next) => {
    const [scheme, encoded] = (req.headers.authorization ?? '').split(' ');
    const provided = Buffer.from(
      scheme === 'Basic' && encoded
        ? Buffer.from(encoded, 'base64').toString().split(':').slice(1).join(':')
        : '',
    );
    if (provided.length === expected.length && timingSafeEqual(provided, expected)) return next();
    res.set('WWW-Authenticate', 'Basic realm="aybot"').status(401).send('Authentification requise');
  };
}

export function createApp(deps: AppDependencies): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  // Healthcheck Docker : volontairement hors authentification, n'expose aucune donnée.
  app.get('/healthz', (_req, res) => {
    res.json({ ok: true });
  });

  if (deps.adminPassword) app.use(basicAuth(deps.adminPassword));

  const api = express.Router();

  api.get('/status', (_req, res) => {
    res.json(deps.poller.status());
  });

  api.post('/check', async (_req, res) => {
    const started = await deps.poller.runNow();
    if (!started) {
      res.status(409).json({ error: 'Une vérification est déjà en cours.' });
      return;
    }
    res.json(deps.poller.status());
  });

  api.get('/subscriptions', async (_req, res) => {
    const subscriptions = await deps.listSubscriptions.execute();
    res.json(subscriptions.map(toDto));
  });

  api.post('/subscriptions', async (req, res) => {
    const input = createSchema.parse(req.body);
    const subscription = await deps.createSubscription.execute(input);
    res.status(201).json(toDto(subscription));
  });

  api.patch('/subscriptions/:id', async (req, res) => {
    const input = updateSchema.parse(req.body);
    const subscription = await deps.updateSubscription.execute(req.params.id, input);
    res.json(toDto(subscription));
  });

  api.delete('/subscriptions/:id', async (req, res) => {
    await deps.deleteSubscription.execute(req.params.id);
    res.status(204).end();
  });

  api.post('/subscriptions/:id/test', async (req, res) => {
    await deps.sendTestNotification.execute(req.params.id);
    res.status(204).end();
  });

  api.use((_req, res) => {
    res.status(404).json({ error: 'Route introuvable.' });
  });

  app.use('/api', api);

  // En production, le serveur sert aussi l'interface buildée.
  if (existsSync(deps.webDistDir)) {
    app.use(express.static(deps.webDistDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(deps.webDistDir, 'index.html'));
    });
  }

  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0]?.message ?? 'Requête invalide.' });
    } else if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else if (error instanceof GatewayError) {
      res.status(502).json({ error: error.message });
    } else {
      logger.error(error);
      res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  };
  app.use(errorHandler);

  return app;
}
