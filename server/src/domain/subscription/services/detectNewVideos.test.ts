import { describe, expect, it } from 'vitest';
import type { Video } from '../../youtube/entities/Video.js';
import type { Subscription } from '../entities/Subscription.js';
import { detectNewVideos, mergeKnownVideoIds } from './detectNewVideos.js';

function video(id: string, publishedAt: string, isShort = false): Video {
  return {
    id,
    title: `Vidéo ${id}`,
    url: `https://www.youtube.com/watch?v=${id}`,
    channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
    channelName: 'Chaîne',
    publishedAt: new Date(publishedAt),
    thumbnailUrl: null,
    isShort,
  };
}

function subscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 'sub-1',
    channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
    channelName: 'Chaîne',
    webhookUrl: 'https://discord.com/api/webhooks/1/abc',
    message: '{title}',
    enabled: true,
    includeShorts: true,
    knownVideoIds: ['old'],
    lastVideo: null,
    lastCheckedAt: '2026-01-01T00:00:00Z',
    lastNotifiedAt: null,
    lastError: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('detectNewVideos', () => {
  it('retourne les vidéos inconnues, de la plus ancienne à la plus récente', () => {
    const videos = [
      video('b', '2026-01-03T00:00:00Z'),
      video('a', '2026-01-02T00:00:00Z'),
      video('old', '2025-12-31T00:00:00Z'),
    ];
    expect(detectNewVideos(subscription(), videos).map((v) => v.id)).toEqual(['a', 'b']);
  });

  it("ignore les vidéos publiées avant la création de l'abonnement", () => {
    const videos = [video('unlisted-then-public', '2025-06-01T00:00:00Z')];
    expect(detectNewVideos(subscription(), videos)).toEqual([]);
  });

  it('exclut les Shorts si includeShorts est false', () => {
    const videos = [
      video('short', '2026-01-02T00:00:00Z', true),
      video('long', '2026-01-02T00:00:00Z'),
    ];
    expect(
      detectNewVideos(subscription({ includeShorts: false }), videos).map((v) => v.id),
    ).toEqual(['long']);
  });

  it("ne notifie rien tant qu'aucune vérification n'a amorcé l'historique", () => {
    const videos = [video('a', '2026-01-02T00:00:00Z')];
    expect(
      detectNewVideos(subscription({ lastCheckedAt: null, knownVideoIds: [] }), videos),
    ).toEqual([]);
  });
});

describe('mergeKnownVideoIds', () => {
  it('place les nouvelles vidéos en tête sans doublon et borne la taille', () => {
    const known = Array.from({ length: 100 }, (_, i) => `k${i}`);
    const merged = mergeKnownVideoIds(known, [
      video('new', '2026-01-02T00:00:00Z'),
      video('k0', '2026-01-01T00:00:00Z'),
    ]);
    expect(merged[0]).toBe('new');
    expect(merged[1]).toBe('k0');
    expect(merged).toHaveLength(100);
    expect(new Set(merged).size).toBe(100);
  });
});
