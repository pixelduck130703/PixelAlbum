import test from 'node:test';
import assert from 'node:assert/strict';
import { getSharedAlbumLocation, albumLocationDisplay, hasAlbumLocationConsent, setAlbumLocationConsent } from './albumLocation.js';

test('homepage album consent is opt-in, remembered across views, and revocable', () => {
  const entries = new Map();
  const storage = { getItem: (key) => entries.get(key), setItem: (key, val) => entries.set(key, val), removeItem: (key) => entries.delete(key) };
  assert.equal(hasAlbumLocationConsent(storage), false);
  assert.equal(setAlbumLocationConsent(true, storage), true);
  assert.equal(hasAlbumLocationConsent(storage), true);
  assert.equal(hasAlbumLocationConsent(storage), true);
  assert.deepEqual([...entries.values()], ['granted']);
  assert.equal(setAlbumLocationConsent(false, storage), true);
  assert.equal(hasAlbumLocationConsent(storage), false);
  const blocked = { getItem: () => { throw Error('blocked'); }, setItem: () => { throw Error('blocked'); } };
  assert.equal(hasAlbumLocationConsent(blocked), false);
  assert.equal(setAlbumLocationConsent(true, blocked), false);
});

test('without album consent or already-granted browser permission there is no location access', async () => {
  for (const permission of ['denied', 'prompt', 'granted']) {
    let calls = 0;
    const browser = { permissions: { query: async () => ({ state: permission }) }, geolocation: { getCurrentPosition: () => { calls++; } } };
    assert.equal(await getSharedAlbumLocation(false, browser, true), null);
    if (permission !== 'granted') assert.equal(await getSharedAlbumLocation(true, browser, true), null);
    assert.equal(calls, 0);
  }
});

test('consented location only sends rounded coordinates to city lookup, then album', async () => {
  const browser = { permissions: { query: async () => ({ state: 'granted' }) }, geolocation: { getCurrentPosition: (success) => success({ coords: { latitude: 21.031234, longitude: 105.851234 } }) } };
  const payload = await getSharedAlbumLocation(true, browser, true, async (url) => {
    const params = new URL(url).searchParams;
    assert.equal(params.get('latitude'), '21.03'); assert.equal(params.get('longitude'), '105.85');
    return { ok: true, json: async () => ({ city: 'Hà Nội', countryName: 'Việt Nam' }) };
  });
  assert.deepEqual(payload, { consent: true, latitude: 21.03, longitude: 105.85, label: 'Hà Nội, Việt Nam' });
  const unavailable = await getSharedAlbumLocation(true, browser, true, async () => { throw Error('network'); });
  assert.equal(unavailable.label, '');
  const noPosition = { ...browser, geolocation: { getCurrentPosition: (_, fail) => fail(Error('unavailable')) } };
  assert.equal(await getSharedAlbumLocation(true, noPosition, true), null);
});

test('admin never uses previous IP for a shared-location event and old events still display', () => {
  const daily = { ipAddress: '192.0.2.10' };
  const detail = { locationSource: 'shared', ipAddress: null, location: 'Hà Nội', sharedLocation: { latitude: 21.03, longitude: 105.85 } };
  assert.equal(albumLocationDisplay(detail, daily).label, 'Hà Nội');
  assert.ok(!albumLocationDisplay(detail, daily).title.includes('192.0.2.10'));
  assert.equal(albumLocationDisplay({ locationSource: 'ip', ipAddress: '192.0.2.11' }, daily).label, '192.0.2.11');
  assert.equal(albumLocationDisplay({}, daily).label, '192.0.2.10');
  assert.equal(albumLocationDisplay({ locationSource: 'ip', ipAddress: null }, daily).label, 'Không rõ vị trí');
});

test('maps link is only created for consented, valid and rounded coordinates', () => {
  const sharedLocation = { consent: true, latitude: 21.031234, longitude: 105.851234 };
  const detail = { locationSource: 'shared', sharedLocation };
  const link = new URL(albumLocationDisplay(detail, {}).mapsUrl);
  assert.equal(link.origin, 'https://www.google.com');
  assert.equal(link.pathname, '/maps/search/');
  assert.equal(link.searchParams.get('api'), '1');
  assert.equal(link.searchParams.get('query'), '21.03,105.85');
  for (const invalid of [null, { ...sharedLocation, consent: false }, { ...sharedLocation, latitude: 91 }, { ...sharedLocation, longitude: Infinity }, { ...sharedLocation, latitude: '21.03' }]) {
    assert.equal(albumLocationDisplay({ ...detail, sharedLocation: invalid }, {}).mapsUrl, null);
  }
  assert.equal(albumLocationDisplay({ locationSource: 'ip', sharedLocation, location: 'Localhost' }, {}).mapsUrl, null);
  assert.equal(albumLocationDisplay({ location: 'Hà Nội' }, {}).mapsUrl, null);
});
