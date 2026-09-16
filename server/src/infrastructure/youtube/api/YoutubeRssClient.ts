import { XMLParser } from 'fast-xml-parser';
import type { ChannelFeed } from '../../../domain/youtube/entities/Channel.js';
import type { Video } from '../../../domain/youtube/entities/Video.js';
import type { YoutubeGateway } from '../../../domain/youtube/repositories/YoutubeGateway.js';
import type { ChannelReference } from '../../../domain/youtube/services/parseChannelReference.js';
import { GatewayError, NotFoundError } from '../../../shared/errors.js';

const REQUEST_TIMEOUT_MS = 15_000;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
// Cookies de consentement : sans eux, les IP européennes sont redirigées vers consent.youtube.com.
const CONSENT_COOKIES = 'SOCS=CAI; CONSENT=YES+cb';

interface RssLink {
  '@_rel'?: string;
  '@_href'?: string;
}

interface RssEntry {
  'yt:videoId'?: string;
  'yt:channelId'?: string;
  title?: string;
  link?: RssLink | RssLink[];
  author?: { name?: string };
  published?: string;
  'media:group'?: { 'media:thumbnail'?: { '@_url'?: string } };
}

interface RssFeed {
  feed?: { title?: string; entry?: RssEntry[] };
}

/**
 * Client basé sur le flux RSS public des chaînes (aucune clé d'API requise) :
 * https://www.youtube.com/feeds/videos.xml?channel_id=UC…
 */
export class YoutubeRssClient implements YoutubeGateway {
  private readonly parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseTagValue: false, // garde les titres comme « 2025 » en string
    isArray: (name) => name === 'entry',
  });

  async resolveChannelId(reference: ChannelReference): Promise<string> {
    if (reference.kind === 'id') return reference.channelId;

    const pageUrl =
      reference.kind === 'handle'
        ? `https://www.youtube.com/${encodeURIComponent(reference.handle)}`
        : reference.url;
    const response = await this.request(pageUrl);
    if (response.status === 404) throw new NotFoundError('Chaîne YouTube introuvable.');
    if (!response.ok) {
      throw new GatewayError(`YouTube a répondu ${response.status} en résolvant la chaîne.`);
    }

    const html = await response.text();
    const match =
      html.match(
        /<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/,
      ) ??
      html.match(/"externalId":"(UC[\w-]{22})"/) ??
      html.match(/<meta itemprop="identifier" content="(UC[\w-]{22})"/);
    if (!match?.[1]) {
      throw new GatewayError(
        "Impossible de trouver l'identifiant de la chaîne sur la page YouTube.",
      );
    }
    return match[1];
  }

  async getChannelFeed(channelId: string): Promise<ChannelFeed> {
    const response = await this.request(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`,
    );
    if (response.status === 404) {
      throw new NotFoundError(
        'Flux YouTube introuvable (chaîne inexistante ou sans vidéo publique).',
      );
    }
    if (!response.ok) throw new GatewayError(`Le flux YouTube a répondu ${response.status}.`);

    const parsed = this.parser.parse(await response.text()) as RssFeed;
    if (!parsed.feed) throw new GatewayError('Flux YouTube illisible.');

    const channelName = parsed.feed.title ?? channelId;
    const videos = (parsed.feed.entry ?? [])
      .map((entry) => this.toVideo(entry, channelId, channelName))
      .filter((video): video is Video => video !== null)
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

    return {
      channel: {
        id: channelId,
        name: channelName,
        url: `https://www.youtube.com/channel/${channelId}`,
      },
      videos,
    };
  }

  private toVideo(entry: RssEntry, channelId: string, channelName: string): Video | null {
    const id = entry['yt:videoId'];
    const publishedAt = entry.published ? new Date(entry.published) : null;
    if (!id || !publishedAt || Number.isNaN(publishedAt.getTime())) return null;

    const links = Array.isArray(entry.link) ? entry.link : entry.link ? [entry.link] : [];
    const href = links.find((link) => link['@_rel'] === 'alternate')?.['@_href'] ?? '';
    const isShort = href.includes('/shorts/');

    return {
      id,
      title: entry.title ?? '(sans titre)',
      url: isShort
        ? `https://www.youtube.com/shorts/${id}`
        : `https://www.youtube.com/watch?v=${id}`,
      channelId,
      channelName: entry.author?.name ?? channelName,
      publishedAt,
      thumbnailUrl: entry['media:group']?.['media:thumbnail']?.['@_url'] ?? null,
      isShort,
    };
  }

  private async request(url: string): Promise<Response> {
    try {
      return await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          Cookie: CONSENT_COOKIES,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      throw new GatewayError(`YouTube injoignable : ${(error as Error).message}`);
    }
  }
}
