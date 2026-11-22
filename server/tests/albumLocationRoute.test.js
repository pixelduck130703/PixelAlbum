const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

test('album view persists shared location or IP per event and clears the last IP on shared view', async () => {
  const queries = [];
  let ipCalls = 0;
  const dbPath = require.resolve('../database/db');
  const visitorPath = require.resolve('../services/visitorInfo');
  const originalDb = require.cache[dbPath];
  const originalVisitor = require.cache[visitorPath];
  const routePath = require.resolve('../routes/albums');
  const client = {
    async query(sql, values) {
      queries.push({ sql, values });
      if (/SELECT id, name, album/.test(sql)) return { rows: [{ id: 1, name: 'Test', album: 'https://example.com/album' }] };
      if (/UPDATE people/.test(sql)) return { rows: [{ albumViews: 1 }] };
      return { rows: [] };
    },
    release() {},
  };
  require.cache[dbPath] = { exports: { pool: { connect: async () => client } } };
  require.cache[visitorPath] = { exports: { getClientIp: () => { ipCalls++; return '192.0.2.10'; }, getIpLocation: async () => 'IP city', deviceDetector: { parse: () => ({}) } } };
  let server;
  try {
    const app = express();
    app.use(express.json()); app.use(require('../routes/albums'));
    server = await new Promise((resolve) => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
    const url = `http://127.0.0.1:${server.address().port}/api/people/public/test/album-view`;
    const post = (body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    assert.equal((await post({})).status, 200);
    assert.equal((await post({ sharedLocation: { consent: true, latitude: 21.031234, longitude: 105.851234, label: 'Hà Nội' } })).status, 200);
    assert.equal((await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify({ sharedLocation: { consent: true, latitude: 21.03, longitude: 105.85, label: '' } }) })).status, 200);
    assert.equal((await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'invalid' })).status, 400);
    const inserts = queries.filter((q) => q.sql.includes('INSERT INTO album_view_by_person_daily'));
    assert.equal(inserts.length, 3);
    assert.equal(inserts[0].values[14], '192.0.2.10');
    assert.equal(inserts[0].values[16], 'ip');
    assert.equal(inserts[1].values[14], null);
    assert.equal(inserts[1].values[16], 'shared');
    assert.deepEqual(JSON.parse(inserts[1].values[17]), { latitude: 21.03, longitude: 105.85, label: 'Hà Nội', consent: true });
    assert.match(inserts[1].sql, /ip_address = EXCLUDED\.ip_address/);
    assert.equal(ipCalls, 1);
    assert.equal(inserts[2].values[14], null);
    assert.equal(inserts[2].values[15], '21.03, 105.85');
    assert.equal(inserts[2].values[16], 'shared');
    assert.equal(queries.filter((q) => q.sql === 'COMMIT').length, 3);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (originalDb) require.cache[dbPath] = originalDb; else delete require.cache[dbPath];
    if (originalVisitor) require.cache[visitorPath] = originalVisitor; else delete require.cache[visitorPath];
    delete require.cache[routePath];
  }
});
