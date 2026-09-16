import type { Video } from './Video.js';

export interface Channel {
  id: string;
  name: string;
  url: string;
}

export interface ChannelFeed {
  channel: Channel;
  /** Vidéos les plus récentes (15 max côté YouTube), de la plus récente à la plus ancienne. */
  videos: Video[];
}
