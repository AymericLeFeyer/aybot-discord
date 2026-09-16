import type { ChannelFeed } from '../entities/Channel.js';
import type { ChannelReference } from '../services/parseChannelReference.js';

export interface YoutubeGateway {
  /** Retourne l'identifiant `UC…` d'une chaîne à partir d'une référence (ID, handle, URL). */
  resolveChannelId(reference: ChannelReference): Promise<string>;
  getChannelFeed(channelId: string): Promise<ChannelFeed>;
}
