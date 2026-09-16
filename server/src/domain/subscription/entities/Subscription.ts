export interface VideoSnapshot {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
}

export interface Subscription {
  id: string;
  channelId: string;
  channelName: string;
  webhookUrl: string;
  /** Template avec placeholders : {title} {url} {channel} {date} */
  message: string;
  enabled: boolean;
  includeShorts: boolean;
  /** IDs des vidéos déjà vues (bornés à MAX_KNOWN_VIDEO_IDS) pour ne jamais notifier deux fois. */
  knownVideoIds: string[];
  lastVideo: VideoSnapshot | null;
  lastCheckedAt: string | null;
  lastNotifiedAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export const MAX_KNOWN_VIDEO_IDS = 100;
