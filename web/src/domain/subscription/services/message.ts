export const DEFAULT_MESSAGE =
  '📺 **{channel}** vient de publier une nouvelle vidéo : **{title}**\n{url}';

export const MAX_MESSAGE_LENGTH = 2000;

export const MESSAGE_PLACEHOLDERS = [
  { key: '{title}', label: 'Titre' },
  { key: '{url}', label: 'Lien' },
  { key: '{channel}', label: 'Chaîne' },
  { key: '{date}', label: 'Date' },
] as const;

export interface PreviewValues {
  title: string;
  url: string;
  channel: string;
  date: string;
}

/** Même rendu que le serveur, pour l'aperçu en direct. */
export function renderMessage(template: string, values: PreviewValues): string {
  const map: Record<string, string> = { ...values };
  return template.replace(/\{(\w+)\}/g, (match, key: string) => map[key] ?? match);
}

const DISCORD_WEBHOOK =
  /^https:\/\/(?:(?:canary|ptb)\.)?discord(?:app)?\.com\/api(?:\/v\d+)?\/webhooks\/\d+\/[\w-]+\/?$/;

export function isDiscordWebhookUrl(url: string): boolean {
  return DISCORD_WEBHOOK.test(url.trim());
}

/** Masque le token du webhook pour l'affichage : …/webhooks/123456/abcd•••• */
export function maskWebhookUrl(url: string): string {
  const match = url.match(/\/webhooks\/(\d+)\/([\w-]+)/);
  return match ? `…/webhooks/${match[1]}/${match[2]!.slice(0, 4)}••••` : url;
}
