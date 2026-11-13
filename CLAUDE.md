# AyBot — Notifications YouTube → Discord

Dernière mise à jour : 2026-09-16

Monorepo npm workspaces : `server/` (Node 24 + Express 5, polling YouTube, envoi webhooks) et `web/` (React 19 + Vite 8 + shadcn/ui). Pas de bot Discord : uniquement des webhooks. Pas de clé API YouTube : flux RSS public.

## Commandes (racine)

| Commande                                                          | Effet                                                                   |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `npm run dev`                                                     | server (`tsx watch`, :3000) + web (Vite, :5173, proxy `/api` → :3000)   |
| `npm run build`                                                   | build web (`web/dist`) puis server (`server/dist`)                      |
| `npm start`                                                       | `node server/dist/main.js` — sert aussi `web/dist` + fallback SPA       |
| `npm run lint` / `format` / `format:check` / `typecheck` / `test` | ESLint (config racine), Prettier, tsc des 2 workspaces, Vitest (server) |

CI : `.github/workflows/ci.yml` → lint, format:check, typecheck, test, build (Node 24).

## Docker

- `Dockerfile` multi-stage `node:24-alpine` : `build` (npm ci + `npm run build`), `deps` (`npm ci --omit=dev --workspace server --include-workspace-root=false`), image finale non-root (`USER node`, uid 1000), `WORKDIR /app/server`, front copié dans `/app/web/dist`.
- Env figées dans l'image : `DATA_FILE=/data/subscriptions.json`, `WEB_DIST_DIR=/app/web/dist`, `PORT=3000`. `HEALTHCHECK` → `GET /healthz`.
- `docker-compose.yml` : service `aybot` sur l'image `ghcr.io/aymericlefeyer/aybot-discord:latest` (pas de `build:`), volume nommé `aybot-data:/data`, `init: true`, `restart: unless-stopped`, logs json-file 10m×3. Variables via `.env` racine (`.env.example`) : `AYBOT_PORT`, `POLL_INTERVAL_MINUTES`.
- CI : job `docker` (après `check`) → build `linux/amd64,linux/arm64` ; push GHCR sur `main` (`latest`, `sha-<commit>`) et tags `v*` (`X.Y.Z`, `X.Y`) ; PR = build seul. Auth via `GITHUB_TOKEN` (`packages: write`).
- Multi-arch sans QEMU : étapes `build`/`deps` en `--platform=$BUILDPLATFORM`, étape finale **sans aucun `RUN`** (`/data` créé dans `deps` puis `COPY --chown`). Ajouter un `RUN` dans l'étape finale ou une dépendance native côté serveur casserait ce principe.

## Stack & versions à respecter

- **TypeScript ~6.0** (pas 7.x) : `typescript-eslint` exige `<6.1`. Pas de `baseUrl` dans les tsconfig (déprécié en TS 6 → erreur TS5101) ; `paths` suffit.
- **shadcn/ui** (style `radix-nova`, Tailwind v4, lucide). Les composants générés importent `cn` depuis le paquet npm `cn` (pas clsx/tailwind-merge). Aliases dans `web/components.json` redirigés vers la structure DDD : ui → `@/presentation/components/ui`, utils → `@/shared/lib/utils`. Ajouter un composant : `cd web && npx shadcn@latest add <nom>`.
- `sonner.tsx` modifié : `next-themes` retiré, `theme="system"`. Le thème sombre = classe `.dark` sur `<html>` pilotée par `prefers-color-scheme` dans `web/src/main.tsx`.

## Configuration serveur (`server/.env`, voir `.env.example`)

| Variable                | Défaut                      | Rôle                                       |
| ----------------------- | --------------------------- | ------------------------------------------ |
| `PORT`                  | 3000                        | Port HTTP                                  |
| `POLL_INTERVAL_MINUTES` | 5                           | Intervalle du poller                       |
| `DATA_FILE`             | `./data/subscriptions.json` | Stockage JSON (relatif au cwd = `server/`) |
| `WEB_DIST_DIR`          | `../web/dist`               | Front servi en statique                    |

## Domaines DDD — server (`server/src`)

### subscription

- **Entité `Subscription`** : `id`, `channelId` (UC…), `channelName`, `webhookUrl`, `message` (template), `enabled`, `includeShorts`, `knownVideoIds[]` (≤ 100, interne, jamais exposé par l'API), `lastVideo {id,title,url,publishedAt}`, `lastCheckedAt`, `lastNotifiedAt`, `lastError`, `createdAt`, `updatedAt`.
- **`SubscriptionRepository`** : `findAll()`, `findById(id)`, `create(sub)`, `update(id, updater: (current) => Subscription): Subscription | null`, `delete(id): boolean`. Impl : `JsonFileSubscriptionRepository` (cache mémoire + file séquentielle + écriture atomique tmp→rename).
- **Services** : `detectNewVideos(sub, videos)` (non vues + publiées ≥ `createdAt` + filtre Shorts, tri ancien→récent ; rien si `lastCheckedAt === null`), `mergeKnownVideoIds`, `renderMessage(template, video)` (`{title}` `{url}` `{channel}` `{date}` heure de Paris, tronqué à 2000), `isDiscordWebhookUrl`.
- **Use cases** (`application/subscription/usecases`) :
  - `ListSubscriptions.execute()` — tri `createdAt` desc
  - `CreateSubscription.execute({channel, webhookUrl, message, includeShorts})` — résout la chaîne, lit le flux et **amorce `knownVideoIds`** (les vidéos existantes ne sont jamais notifiées)
  - `UpdateSubscription.execute(id, {webhookUrl?, message?, enabled?, includeShorts?})` — la chaîne n'est pas modifiable
  - `DeleteSubscription.execute(id)`
  - `SendTestNotification.execute(id)` — envoie le message rendu avec la dernière vidéo
  - `CheckSubscriptions.execute(): {checked, notified, errors}` — 1 fetch RSS par `channelId`, envoi par abonnement

### youtube

- `Video {id,title,url,channelId,channelName,publishedAt: Date,thumbnailUrl,isShort}`, `ChannelFeed {channel, videos}`.
- `YoutubeGateway` : `resolveChannelId(ChannelReference)`, `getChannelFeed(channelId)`. Impl : `YoutubeRssClient`.
- `parseChannelReference(input)` → `{kind:'id'} | {kind:'handle'} | {kind:'url'}` (ID UC…, `@handle`, URLs `/channel/`, `/@x`, `/c/`, `/user/`, `m.` et `www.`).

### notification

- `NotificationGateway.send(webhookUrl, {content})`. Impl : `DiscordWebhookClient` (retry sur 429 via `retry_after`, 3 tentatives).

### Infra transverse

- `Poller` (`infrastructure/scheduler`) : run au démarrage puis `setInterval`, pas de chevauchement (`runNow()` → false si déjà en cours).
- Erreurs (`shared/errors.ts`) → HTTP : `ZodError`/`ValidationError` 400, `NotFoundError` 404, `GatewayError` 502, autre 500. Format `{ error: string }`.

## Endpoints API

| Méthode | Route                         | Body / Réponse                                                             |
| ------- | ----------------------------- | -------------------------------------------------------------------------- |
| GET     | `/healthz`                    | → `{ok: true}` (healthcheck Docker)                                        |
| GET     | `/api/status`                 | → `{intervalMinutes, running, lastRunAt, nextRunAt}`                       |
| POST    | `/api/check`                  | lance une vérification et attend la fin → status ; 409 si déjà en cours    |
| GET     | `/api/subscriptions`          | → `Subscription[]` (sans `knownVideoIds`)                                  |
| POST    | `/api/subscriptions`          | `{channel, webhookUrl, message, includeShorts?=true}` → 201 `Subscription` |
| PATCH   | `/api/subscriptions/:id`      | `{webhookUrl?, message?, enabled?, includeShorts?}` → `Subscription`       |
| DELETE  | `/api/subscriptions/:id`      | → 204                                                                      |
| POST    | `/api/subscriptions/:id/test` | → 204 (502 si webhook/YouTube KO)                                          |

## Front (`web/src`)

- Domaines : `subscription` (entité + `SubscriptionRepository {list, create, update, remove, sendTest}` + services `message.ts` : `renderMessage`, `DEFAULT_MESSAGE`, `MESSAGE_PLACEHOLDERS`, `isDiscordWebhookUrl`, `maskWebhookUrl`) ; `monitoring` (`MonitorStatus`, `MonitorRepository {getStatus, triggerCheck}`).
- Use cases : `application/*/usecases/*UseCases.ts` (classes `execute()`), instanciés dans `infrastructure/container.ts` (`useCases.*`). Les hooks n'appellent **que** `useCases`.
- HTTP : `infrastructure/http/httpClient.ts` (`httpRequest`, base `VITE_API_BASE_URL` ou `/api`, erreurs → `ApiError`) ; clients par domaine `infrastructure/<domaine>/api/*Api.ts`.

| Route | Page                                                                      |
| ----- | ------------------------------------------------------------------------- |
| `/`   | `HomePage` : formulaire d'ajout (gauche, sticky) + cartes des abonnements |

| Hook                 | Rôle                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| `useSubscriptions()` | `{subscriptions, loading, error, refresh, create, update, remove, sendTest}`, refresh auto 30 s |
| `useMonitorStatus()` | `{status, checking, triggerCheck}`, refresh 30 s ; `status === null` = serveur hors ligne       |
| `useNow(ms=15000)`   | timestamp rafraîchi pour les dates relatives                                                    |

Composants : `SubscriptionForm` (création, ou édition si `subscription` fourni), `SubscriptionCard`, `MessageEditor` (insertion des placeholders au curseur), `MessagePreview` (rendu façon Discord), `MonitorStatusBar`.

## Points d'attention

- **Consentement YouTube (UE)** : sans cookies `SOCS=CAI; CONSENT=YES+cb`, la page d'une chaîne redirige vers consent.youtube.com et la résolution de `@handle` échoue.
- **RSS** : l'`<yt:channelId>` au niveau du feed n'a **pas** le préfixe `UC` (seulement dans les `<entry>`) → on garde l'ID résolu. Le lien `alternate` contient `/shorts/` pour les Shorts (seul moyen de les détecter sans API). Max 15 vidéos par flux. `parseTagValue: false` obligatoire sinon un titre « 2025 » devient un nombre.
- **Premières / lives programmés** apparaissent dans le RSS dès leur planification → notifiés à ce moment-là, pas au démarrage du live.
- **Échec d'envoi Discord** : la vidéo n'est pas ajoutée à `knownVideoIds` → retentée au prochain passage ; un webhook supprimé produit donc une erreur (`lastError`) toutes les 5 min jusqu'à correction/pause.
- **Éditer `subscriptions.json` à la main** pendant que le serveur tourne ne sert à rien : le repository garde un cache mémoire et réécrit le fichier. Arrêter le serveur avant.
- **Aucune authentification** (retirée volontairement, accès derrière VPN) : ne jamais exposer le serveur publiquement, l'API renvoie les URLs de webhook en clair.
- **Docker, bind mount au lieu du volume nommé** : le conteneur tourne en uid 1000 → le dossier hôte doit être accessible en écriture par cet uid (`chown 1000:1000 ./data`), sinon `EACCES` à la création d'un abonnement.
- **Lockfile généré sous Windows** : il contient bien les binaires natifs linux-musl (rolldown, tailwind oxide, lightningcss) nécessaires au build alpine. Si `npm ci` casse dans Docker après une mise à jour de deps, régénérer le lockfile (bug npm connu sur les optional deps multi-plateformes).
- ESLint `react-hooks` v7 : `Date.now()` pendant le rendu est interdit (`react-hooks/purity`) → passer par `useState(() => …)` ou `useNow`.
