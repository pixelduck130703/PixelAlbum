import test from 'node:test';
import assert from 'node:assert/strict';
import { recordAndOpenAlbum, queueAlbumView } from './albumNavigation.js';

const never = () => new Promise(() => {});
const url = 'https://example.com/album';
const location = { consent: true, latitude: 21.03, longitude: 105.85 };

function fixture(overrides = {}) {
  const posts = [];
  const navigation = [];
  const options = { url, getHints: () => ({ mobile: true }), getLocation: () => location, hasConsent: () => true,
    postView: (body) => { posts.push(body); }, navigate: (target) => { navigation.push(target); }, ...overrides };
  return { options, posts, navigation };
}

test('normal and verified album queue prepared shared location and immediately navigate', () => {
  const { options, posts, navigation } = fixture();
  recordAndOpenAlbum(options);
  assert.deepEqual(posts, [{ clientHints: { mobile: true }, sharedLocation: location }]);
  assert.deepEqual(navigation, [url]);
});

test('unavailable prepared location and hints fall back to IP without any wait', () => {
  const { options, posts, navigation } = fixture({ getHints: () => null, getLocation: () => null });
  recordAndOpenAlbum(options);
  assert.deepEqual(posts, [{ clientHints: null }]);
  assert.deepEqual(navigation, [url]);
});

test('refused consent never reads location; pending, rejected or thrown request cannot block album', () => {
  for (const postView of [never, async () => { throw Error('offline'); }, () => { throw Error('offline'); }]) {
    let calls = 0;
    const { options, navigation } = fixture({ hasConsent: () => false, getLocation: () => { calls++; return location; }, postView });
    recordAndOpenAlbum(options);
    assert.equal(calls, 0);
    assert.deepEqual(navigation, [url]);
  }
});

test('revocation while reading never includes coordinates in the record', () => {
  let consent = true;
  const { options, posts, navigation } = fixture({ hasConsent: () => consent, getLocation: () => { consent = false; return location; } });
  recordAndOpenAlbum(options);
  assert.deepEqual(posts, [{ clientHints: { mobile: true } }]);
  assert.deepEqual(navigation, [url]);
});

test('beacon is synchronous and never duplicates accepted submissions; fetch fallback keeps request alive', () => {
  const calls = [];
  const body = { clientHints: null, sharedLocation: location };
  const fetcher = (target, options) => { calls.push(['fetch', target, options]); return never(); };
  queueAlbumView(url, body, { sendBeacon: (target, data) => { calls.push(['beacon', target, JSON.parse(data)]); return true; } }, fetcher);
  assert.deepEqual(calls, [['beacon', url, body]]);
  queueAlbumView(url, body, { sendBeacon: () => false }, fetcher);
  assert.equal(calls.length, 2);
  assert.equal(calls[1][2].keepalive, true);
  assert.equal(calls[1][2].headers['Content-Type'], 'text/plain;charset=UTF-8');
  assert.deepEqual(JSON.parse(calls[1][2].body), body);
});
