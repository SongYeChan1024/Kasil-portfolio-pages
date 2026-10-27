import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../assets/js/dist/sw.min.js', import.meta.url), 'utf8').then(text => text.replace(/^---[\s\S]*?---\r?\n/, ''));
const origin = 'https://songyechan1024.github.io';
function harness(cached = null, networkStatus = 200) {
  const handlers = {}, stats = {matched: 0, fetched: 0, stored: 0, deleted: []};
  const cache = {
    match: async () => {stats.matched++; return cached;},
    put: async () => {stats.stored++;}, addAll: async () => {}
  };
  vm.runInNewContext(source, {
    URL, Request, Response,
    importScripts: () => {},
    swconf: {purge: false, cacheName: 'chirpy-test', resources: [], interceptor: {paths: [], urlPrefixes: []}},
    self: {
      location: {href: `${origin}/Kasil-portfolio-pages/sw.min.js`, origin},
      addEventListener: (name, handler) => {handlers[name] = handler;},
      skipWaiting: async () => {}, clients: {claim: async () => {}}
    },
    caches: {
      open: async () => cache,
      keys: async () => ['chirpy-old', 'unrelated-app-cache', 'chirpy-test-auth-v1'],
      delete: async key => {stats.deleted.push(key); return true;}
    },
    fetch: async () => {stats.fetched++; if (networkStatus === 0) throw new Error('offline'); return new Response('fresh', {status: networkStatus});}
  });
  return {
    stats,
    async request(url, options) {
      let response;
      const waits = [];
      handlers.fetch({request: new Request(url, options),
        respondWith: value => {response = value;}, waitUntil: promise => waits.push(promise)});
      const result = response ? await response : null;
      await Promise.all(waits);
      return result;
    },
    async activate() {let done; handlers.activate({waitUntil: value => {done = value;}}); await done;}
  };
}

test('GitHub authentication bypasses old cached 401 before any cache lookup', async () => {
  const h = harness(new Response('', {status: 401}));
  const response = await h.request('https://api.github.com/user',
    {headers: {Authorization: 'Bearer TEST_ONLY_NOT_A_CREDENTIAL'}});
  assert.equal(response, null); // Browser performs the original network request.
  assert.equal(h.stats.matched, 0);
  assert.equal(h.stats.stored, 0);
});
test('all external requests, admin assets and no-store requests bypass cache', async () => {
  const h = harness(new Response('stale'));
  for (const [url, options] of [
    ['https://api.github.com/repos/owner/repo', {}],
    [`${origin}/Kasil-portfolio-pages/admin/`, {}],
    [`${origin}/Kasil-portfolio-pages/admin/admin.js`, {}],
    [`${origin}/Kasil-portfolio-pages/`, {cache: 'no-store'}],
    [`${origin}/Kasil-portfolio-pages/`, {headers: {Authorization: 'test'}}]
  ]) assert.equal(await h.request(url, options), null);
  assert.equal(h.stats.matched, 0);
});
test('failed responses are never reused or added to cache', async () => {
  const h = harness(new Response('', {status: 401}), 503);
  const response = await h.request(`${origin}/Kasil-portfolio-pages/`);
  assert.equal(response.status, 503);
  assert.equal(h.stats.fetched, 1);
  assert.equal(h.stats.stored, 0);
});
test('ordinary blog assets retain successful offline cache behavior', async () => {
  const cached = harness(new Response('cached'));
  assert.equal(await (await cached.request(`${origin}/Kasil-portfolio-pages/assets/main.css`)).text(), 'cached');
  assert.equal(cached.stats.fetched, 0);
  const fresh = harness();
  await fresh.request(`${origin}/Kasil-portfolio-pages/assets/main.css`);
  assert.equal(fresh.stats.stored, 1);
});
test('activation removes old Chirpy cache only', async () => {
  const h = harness(); await h.activate();
  assert.deepEqual(h.stats.deleted, ['chirpy-old']);
});
test('home and search index prefer the latest network content over a stale cache', async () => {
  for (const [url,options] of [
    [`${origin}/Kasil-portfolio-pages/`, {headers:{Accept:'text/html'}}],
    [`${origin}/Kasil-portfolio-pages/assets/js/data/search.json`, {}]
  ]) {
    const h=harness(new Response('old post list'));
    assert.equal(await (await h.request(url, options)).text(), 'fresh');
    assert.equal(h.stats.fetched,1);
    assert.equal(h.stats.stored,1);
  }
});
test('offline navigation can still use a successful cached page', async () => {
  const h=harness(new Response('offline page'),0);
  assert.equal(await (await h.request(`${origin}/Kasil-portfolio-pages/`, {headers:{Accept:'text/html'}})).text(), 'offline page');
  assert.equal(h.stats.fetched,1);
});
