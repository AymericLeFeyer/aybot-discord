import { describe, expect, it } from 'vitest';
import { parseChannelReference } from './parseChannelReference.js';

const ID = 'UC_x5XG1OV2P6uZZ5FSM9Ttw';

describe('parseChannelReference', () => {
  it.each([
    [ID, { kind: 'id', channelId: ID }],
    [`https://www.youtube.com/channel/${ID}`, { kind: 'id', channelId: ID }],
    [`youtube.com/channel/${ID}/videos`, { kind: 'id', channelId: ID }],
    ['@GoogleDevelopers', { kind: 'handle', handle: '@GoogleDevelopers' }],
    [
      'https://m.youtube.com/@GoogleDevelopers/videos',
      { kind: 'handle', handle: '@GoogleDevelopers' },
    ],
    ['https://www.youtube.com/c/Foo', { kind: 'url', url: 'https://www.youtube.com/c/Foo' }],
    ['https://www.youtube.com/user/Bar', { kind: 'url', url: 'https://www.youtube.com/user/Bar' }],
  ])('interprète %s', (input, expected) => {
    expect(parseChannelReference(input)).toEqual(expected);
  });

  it.each(['', 'pas une chaîne', 'https://vimeo.com/@foo', 'https://www.youtube.com/watch?v=abc'])(
    'refuse %s',
    (input) => expect(parseChannelReference(input)).toBeNull(),
  );
});
