import type { Video } from '../../youtube/entities/Video.js';

/** Limite Discord pour le champ `content` d'un message. */
export const MAX_MESSAGE_LENGTH = 2000;

export function renderMessage(template: string, video: Video): string {
  const values: Record<string, string> = {
    title: video.title,
    url: video.url,
    channel: video.channelName,
    date: video.publishedAt.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
  };
  const rendered = template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
  return rendered.length > MAX_MESSAGE_LENGTH
    ? `${rendered.slice(0, MAX_MESSAGE_LENGTH - 1)}…`
    : rendered;
}
