export type ChannelReference =
  | { kind: 'id'; channelId: string }
  | { kind: 'handle'; handle: string }
  | { kind: 'url'; url: string };

const CHANNEL_ID = /^UC[\w-]{22}$/;
const HANDLE = /^@[\w.-]{3,30}$/;

/**
 * Interprète la saisie utilisateur : ID `UC…`, `@handle`,
 * ou URL youtube.com (/channel/UC…, /@handle, /c/nom, /user/nom).
 */
export function parseChannelReference(rawInput: string): ChannelReference | null {
  const input = rawInput.trim();
  if (CHANNEL_ID.test(input)) return { kind: 'id', channelId: input };
  if (HANDLE.test(input)) return { kind: 'handle', handle: input };

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.)/, '');
  if (host !== 'youtube.com') return null;

  const [first, second] = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  if (!first) return null;
  if (first === 'channel' && second && CHANNEL_ID.test(second)) {
    return { kind: 'id', channelId: second };
  }
  if (HANDLE.test(first)) return { kind: 'handle', handle: first };
  if ((first === 'c' || first === 'user') && second) {
    return { kind: 'url', url: `https://www.youtube.com/${first}/${encodeURIComponent(second)}` };
  }
  return null;
}
