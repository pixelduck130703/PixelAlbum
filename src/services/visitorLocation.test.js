import test from 'node:test';
import assert from 'node:assert/strict';
import { createVisitorLocationManager, getVisitorLocationPreference, saveVisitorLocationPreference, resolveVisitorCityName } from './visitorLocation.js';

function fixture(initialChoice = null, initialPermission = 'prompt') {
  let choice = initialChoice, clock = 10000, reads = 0;
  const permission = { state: initialPermission };
  const urls = [];
  const browser = { permissions: { query: async () => permission }, geolocation: { getCurrentPosition: callback => {
    reads++;
    permission.state = 'granted';
    callback({ coords: { latitude: 21.031234, longitude: 105.851234 }, timestamp: clock });
  } } };
  const manager = createVisitorLocationManager({ getChoice: () => choice, browser, secure: true, now: () => clock, fetcher: async url => { urls.push(new URL(url)); return { ok: true, json: async () => ({ city: 'Thanh Liệt', countryName: 'Việt Nam' }) }; } });
  return { manager, permission, urls, getReads: () => reads, choose: next => { choice = next; manager.clear(); }, advance: ms => { clock += ms; } };
}

test('combined choice is explicit; old consent is not silently migrated', () => {
  const values = new Map([['pixelalbum.album-location-consent.v2', 'granted']]);
  const storage = { getItem: k => values.get(k), setItem: (k,v) => values.set(k,v) };
  assert.equal(getVisitorLocationPreference(storage), null);
  for (const choice of ['both', 'weather', 'none']) {
    assert.equal(saveVisitorLocationPreference(choice, storage), true);
    assert.equal(getVisitorLocationPreference(storage), choice);
  }
  assert.equal(saveVisitorLocationPreference('invalid', storage), false);
});

test('no location access until explicit choice; both shares one request across weather and album', async () => {
  const f = fixture();
  await assert.rejects(f.manager.request());
  assert.equal(f.getReads(), 0);
  f.choose('both');
  const initial = f.manager.request({ allowPrompt: true });
  const weather = f.manager.request();
  assert.equal(initial, weather);
  const location = await weather;
  assert.equal(f.getReads(), 1);
  assert.deepEqual([location.latitude, location.longitude], [21.03, 105.85]);
  assert.equal(await resolveVisitorCityName(location), 'Thanh Liệt, Việt Nam');
  assert.deepEqual(f.manager.getAlbumLocation(), { consent: true, latitude: 21.03, longitude: 105.85, label: 'Thanh Liệt, Việt Nam' });
  assert.equal(f.urls[0].searchParams.get('latitude'), '21.03');
  assert.equal(f.urls[0].searchParams.get('longitude'), '105.85');
  f.permission.state = 'denied';
  assert.equal(f.manager.getAlbumLocation(), null);
  f.permission.state = 'granted';
  f.advance(120001);
  assert.equal(f.manager.getAlbumLocation(), null);
  await f.manager.request();
  assert.equal(f.getReads(), 2);
  f.choose('weather');
  assert.equal(f.manager.getAlbumLocation(), null);
  await f.manager.request({ allowPrompt: true });
  assert.equal(f.manager.getAlbumLocation(), null);
});

test('revisiting without a granted browser permission never triggers a prompt', async () => {
  const f = fixture('both', 'prompt');
  await assert.rejects(f.manager.request());
  assert.equal(f.getReads(), 0);
  assert.equal(f.manager.getAlbumLocation(), null);
  f.choose('none');
  await assert.rejects(f.manager.request({ allowPrompt: true }));
  assert.equal(f.getReads(), 0);
});
