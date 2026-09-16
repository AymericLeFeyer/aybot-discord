export interface Video {
  id: string;
  title: string;
  url: string;
  channelId: string;
  channelName: string;
  publishedAt: Date;
  thumbnailUrl: string | null;
  isShort: boolean;
}
