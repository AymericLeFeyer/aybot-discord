import { describe, expect, it } from 'vitest';
import type { Video } from '../../youtube/entities/Video.js';
import { MAX_MESSAGE_LENGTH, renderMessage } from './messageTemplate.js';
import { isDiscordWebhookUrl } from './webhookUrl.js';

const video: Video = {
  id: 'abc123',
  title: 'Ma vidéo',
  url: 'https://www.youtube.com/watch?v=abc123',
  channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
  channelName: 'AyLabs',
  publishedAt: new Date('2026-09-16T10:00:00Z'),
  thumbnailUrl: null,
  isShort: false,
};

describe('renderMessage', () => {
  it('remplace les placeholders connus et laisse les autres intacts', () => {
    expect(renderMessage('@everyone {channel} : {title} {url} {inconnu}', video)).toBe(
      '@everyone AyLabs : Ma vidéo https://www.youtube.com/watch?v=abc123 {inconnu}',
    );
  });

  it('formate la date en heure de Paris', () => {
    expect(renderMessage('{date}', video)).toBe('16/09/2026 12:00:00');
  });

  it('tronque à la limite Discord', () => {
    expect(renderMessage('x'.repeat(3000), video)).toHaveLength(MAX_MESSAGE_LENGTH);
  });
});

describe('isDiscordWebhookUrl', () => {
  it.each([
    'https://discord.com/api/webhooks/123456/abc-DEF_1',
    'https://canary.discord.com/api/webhooks/123/token',
    'https://discordapp.com/api/v10/webhooks/123/token',
  ])('accepte %s', (url) => expect(isDiscordWebhookUrl(url)).toBe(true));

  it.each([
    'http://discord.com/api/webhooks/1/a',
    'https://evil.com/api/webhooks/1/a',
    'discord.com',
  ])('refuse %s', (url) => expect(isDiscordWebhookUrl(url)).toBe(false));
});
