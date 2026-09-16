# AyBot

Surveille des chaînes YouTube toutes les 5 minutes et publie chaque nouvelle vidéo sur Discord via webhook, avec un message personnalisé.

- Aucune clé d'API YouTube : utilise le flux RSS public des chaînes.
- Aucun bot Discord à créer : un simple webhook de salon suffit.
- Interface web pour ajouter une chaîne, un webhook et le message (aperçu en direct, bouton de test).

## Démarrage

```bash
npm install
npm run dev          # API sur :3000 + interface sur http://localhost:5173
```

Production :

```bash
npm run build
npm start            # API + interface sur http://localhost:3000
```

Configuration : copier `server/.env.example` vers `server/.env` (port, intervalle, fichier de données, mot de passe optionnel).

## Utilisation

1. Discord → paramètres du salon → **Intégrations** → **Webhooks** → **Nouveau webhook** → copier l'URL.
2. Dans l'interface : coller l'URL de la chaîne (`https://www.youtube.com/@MaChaine`, `@MaChaine` ou ID `UC…`), le webhook et le message.
3. Cliquer **Tester** pour recevoir un exemple avec la dernière vidéo.

Placeholders disponibles dans le message : `{title}`, `{url}`, `{channel}`, `{date}`. Les mentions `@everyone` / `@here` fonctionnent.

## Docker (homelab)

Image publiée sur GHCR par la CI : `ghcr.io/aymericlefeyer/aybot-discord`, pour `linux/amd64` et `linux/arm64`.

- Push sur `main` → tags `latest` et `sha-<commit>`
- Tag git `v1.2.3` → tags `1.2.3` et `1.2`

Sur le homelab, seuls `docker-compose.yml` et `.env` sont nécessaires (pas besoin de cloner le repo) :

```bash
mkdir aybot && cd aybot
curl -fsSLO https://raw.githubusercontent.com/AymericLeFeyer/aybot-discord/main/docker-compose.yml
curl -fsSL https://raw.githubusercontent.com/AymericLeFeyer/aybot-discord/main/.env.example -o .env   # à éditer
docker compose up -d
```

- Interface : `http://<ip-du-homelab>:3000` (port modifiable via `AYBOT_PORT`).
- Mise à jour : `docker compose pull && docker compose up -d`.
- Données persistées dans le volume nommé `aybot-data` (`/data/subscriptions.json`). Sauvegarde : `docker compose cp aybot:/data/subscriptions.json ./backup.json`.
- Derrière un reverse proxy (Traefik, Caddy, Nginx Proxy Manager…), pointer vers le port 3000 du conteneur. Définir `ADMIN_PASSWORD` si l'interface est accessible hors du réseau local.
- Build local de l'image : `docker build -t aybot-discord .`
