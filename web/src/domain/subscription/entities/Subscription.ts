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
  lastVideo: VideoSnapshot | null;
  lastCheckedAt: string | null;
  lastNotifiedAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionInput {
  /** URL youtube.com, @handle ou ID UC… */
  channel: string;
  webhookUrl: string;
  message: string;
  includeShorts: boolean;
}

export type UpdateSubscriptionInput = Partial<
  Pick<Subscription, 'webhookUrl' | 'message' | 'enabled' | 'includeShorts'>
>;
