import test from 'node:test';
import assert from 'node:assert/strict';
import { recordAndOpenAlbum } from './albumNavigation.js';

const never = () => new Promise(() => {});
const url = 'https://example.com/album';
const location = { consent: true, latitude: 21.03, longitude: 105.85 };

function fixture(overrides = {}) {
  const posts = [];
  const navigation = [];
  const options = { url, getHints: async () => ({ mobile: true }), getLocation: async () => location, hasConsent: () => true,
    postView: async (body) => { posts.push(body); }, navigate: (target) => { navigation.push(target); }, hintTimeout: 5, locationTimeout: 10, postTimeout: 10, ...overrides };
  return { options, posts, navigation };
}

test('normal and verified album can record shared location before navigating in the current tab', async () => {
  const { options, posts, navigation } = fixture();
  await recordAndOpenAlbum(options);
  assert.deepEqual(posts, [{ clientHints: { mobile: true }, sharedLocation: location }]);
  assert.deepEqual(navigation, [url]);
});

test('stalled location and device APIs fall back to IP and still navigate once', async () => {
  const { options, posts, navigation } = fixture({ getHints: never, getLocation: never });
  await recordAndOpenAlbum(options);
  assert.deepEqual(posts, [{ clientHints: null }]);
  assert.deepEqual(navigation, [url]);
});

test('refused consent never requests location; backend failure or timeout cannot block album', async () => {
  for (const postView of [never, async () => { throw Error('offline'); }]) {
    let calls = 0;
    const { options, navigation } = fixture({ hasConsent: () => false, getLocation: () => { calls++; return location; }, postView });
    await recordAndOpenAlbum(options);
    assert.equal(calls, 0);
    assert.deepEqual(navigation, [url]);
  }
});

test('revocation while locating never includes coordinates in the record', async () => {
  let consent = true;
  const { options, posts, navigation } = fixture({ hasConsent: () => consent, getLocation: async () => { consent = false; return location; } });
  await recordAndOpenAlbum(options);
  assert.deepEqual(posts, [{ clientHints: { mobile: true } }]);
  assert.deepEqual(navigation, [url]);
});
