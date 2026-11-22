const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveAlbumLocation, normalizeSharedLocation } = require('../services/albumLocation');
const { normalizeIp } = require('../services/visitorInfo');

test('consented location is rounded and IP lookup is skipped entirely', async () => {
  const result = await resolveAlbumLocation({ body: { sharedLocation: { consent: true, latitude: 21.031234, longitude: 105.851234, label: 'Hà Nội' } } }, () => { throw Error('must not read IP'); }, () => { throw Error('must not look up IP'); });
  assert.deepEqual(result, { ipAddress: null, location: 'Hà Nội', locationSource: 'shared', sharedLocation: { latitude: 21.03, longitude: 105.85, label: 'Hà Nội', consent: true } });
});

test('missing consent or invalid coordinates fall back to IP without saving location payload', async () => {
  for (const sharedLocation of [undefined, { consent: false, latitude: 21, longitude: 105 }, { consent: true, latitude: '21', longitude: 105 }, { consent: true, latitude: 91, longitude: 105 }]) {
    const result = await resolveAlbumLocation({ body: { sharedLocation } }, () => '192.0.2.10', async () => 'IP location');
    assert.deepEqual(result, { ipAddress: '192.0.2.10', location: 'IP location', locationSource: 'ip', sharedLocation: null });
  }
  assert.equal(normalizeSharedLocation({ consent: true, latitude: 0, longitude: 180, label: 'x'.repeat(200) }).label.length, 160);
});

test('IPv6 is not truncated and invalid proxy values are rejected', () => {
  assert.equal(normalizeIp('2001:db8:85a3:0000:0000:8a2e:0370:7334'), '2001:db8:85a3:0000:0000:8a2e:0370:7334');
  assert.equal(normalizeIp('::ffff:192.0.2.10'), '192.0.2.10');
  assert.equal(normalizeIp('192.0.2.10:1234'), '192.0.2.10');
  assert.equal(normalizeIp('[2001:db8::1]:443'), '2001:db8::1');
  assert.equal(normalizeIp('not-an-ip'), '');
});
