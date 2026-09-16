import type { VideoSnapshot } from '../../../domain/subscription/entities/Subscription.js';
import type { Video } from '../../../domain/youtube/entities/Video.js';

export function toVideoSnapshot(video: Video): VideoSnapshot {
  return {
    id: video.id,
    title: video.title,
    url: video.url,
    publishedAt: video.publishedAt.toISOString(),
  };
}
