const test = require('node:test');
const assert = require('node:assert/strict');
const { createExchangeRateReader } = require('../services/exchangeRate');

const hour = 3600000;
const start = Date.UTC(2026, 10, 22);
const payload = (time, rate = 801.25) => ({ result: 'success', base_code: 'THB', rates: { VND: rate }, time_last_update_unix: time / 1000, time_next_update_unix: (time + 24 * hour) / 1000 });

test('exchange rate caches the provider response, including concurrent calls', async () => {
  let clock = start;
  let calls = 0;
  const reader = createExchangeRateReader({ now: () => clock, fetchImpl: async (url) => {
    calls++;
    assert.equal(url, 'https://open.er-api.com/v6/latest/THB');
    return Response.json(payload(clock));
  } });
  const [a, b] = await Promise.all([reader(), reader()]);
  assert.deepEqual(a, { rate: 801.25, updatedAt: new Date(start).toISOString(), stale: false });
  assert.deepEqual(a, b);
  clock += 60_000;
  assert.deepEqual(await reader(), a);
  assert.equal(calls, 1);
  clock = start + 24 * hour;
  assert.equal((await reader()).updatedAt, new Date(clock).toISOString());
  assert.equal(calls, 2);
});

test('exchange rate preserves and marks a stale quote when the provider fails', async () => {
  let clock = start;
  let calls = 0;
  const reader = createExchangeRateReader({ now: () => clock, fetchImpl: async () => {
    if (++calls === 1) return Response.json(payload(start));
    if (calls === 2) return new Response('', { status: 503 });
    return Response.json(payload(clock, 800));
  } });
  await reader();
  clock += 24 * hour;
  assert.deepEqual(await reader(), { rate: 801.25, updatedAt: new Date(start).toISOString(), stale: true });
  assert.equal((await reader()).stale, true);
  assert.equal(calls, 2);
  clock += hour;
  assert.equal((await reader()).rate, 800);
  assert.equal((await reader()).stale, false);
});

test('invalid initial rates are not displayed as live data', async () => {
  let calls = 0;
  const reader = createExchangeRateReader({ now: () => start, fetchImpl: async () => {
    calls++;
    return Response.json(payload(start, -1));
  } });
  await assert.rejects(reader);
  await assert.rejects(reader);
  assert.equal(calls, 1);
});
