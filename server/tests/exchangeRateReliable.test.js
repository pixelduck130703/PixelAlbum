'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createExchangeRateReliable, validRate } = require('../services/exchangeRateReliable');

const sampleNow = new Date('2026-11-27T00:00:00.000Z').getTime();
function fakeResponse(body) { return { ok: true, json: async () => body }; }

const fakeProviders = [
  { name: 'backup', url: 'https://example.test/backup', parse: json => ({ rate: json.rate, date: json.date }) },
];

test('accepts primary rate and caches it to prevent one-minute polling storms', async () => {
  let calls = 0;
  const r = createExchangeRateReliable({ now: () => sampleNow, providers: [] });
  const first = await r.get(async () => { calls++; return { rate: 778.12, updatedAt: '2026-11-26T10:00:00Z' }; });
  const second = await r.get(async () => { calls++; throw new Error('network'); });
  assert.equal(first.rate, 778.12);
  assert.equal(second.rate, 778.12);
  assert.equal(calls, 1);
});

test('uses backup when the existing provider fails', async () => {
  const r = createExchangeRateReliable({ now: () => sampleNow, providers: fakeProviders, fetchImpl: async () => fakeResponse({ rate: 782, date: '2026-11-27' }) });
  const value = await r.get(async () => { throw new Error('429'); });
  assert.equal(value.rate, 782);
  assert.equal(value.source, 'backup');
  assert.equal(value.stale, false);
});

test('rejects inverted, missing, and unrealistic THB/VND rates', async () => {
  assert.equal(validRate(0.0013), null);
  assert.equal(validRate('oops'), null);
  assert.equal(validRate(780), 780);
  assert.equal(validRate(10000), null);
});

test('uses last known value with stale label during total outage', async () => {
  let current = sampleNow;
  let shouldFail = false;
  const r = createExchangeRateReliable({ now: () => current, cacheMs: 1000, maxStaleMs: 86400000, providers: fakeProviders,
    fetchImpl: async () => shouldFail ? { ok: false, status: 503 } : fakeResponse({ rate: 777, date: '2026-11-27' }),
  });
  await r.get(async () => { throw new Error('source unavailable'); });
  current += 2000; shouldFail = true;
  const value = await r.get(async () => { throw new Error('source unavailable'); });
  assert.equal(value.rate, 777);
  assert.equal(value.stale, true);
});

test('unavailable sources without a cache produce an error, never pretend rate is 750', async () => {
  const r = createExchangeRateReliable({ now: () => sampleNow, providers: fakeProviders, fetchImpl: async () => ({ ok: false, status: 429 }) });
  await assert.rejects(() => r.get(async () => { throw new Error('source unavailable'); }), /Không truy xuất/);
});
