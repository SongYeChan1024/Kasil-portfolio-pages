import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../assets/js/sticky-notes-store.js', import.meta.url), 'utf8');
const owner = {login: 'SongYeChan1024', id: 252518720};
const endpoint = 'https://api.github.com/repos/SongYeChan1024/Kasil_PrivateNotes';
const sha = 'a'.repeat(40);
const token = 'TEST_ONLY_NOT_A_CREDENTIAL';
const sample = (id = 'sample-note', body = '한글 메모\n두 번째 줄') => ({id, body, createdAt: '2026-10-30T00:00:00.000Z', updatedAt: '2026-10-30T00:00:00.000Z'});

function harness(overrides = {}) {
  const state = {
    user: {...owner},
    repo: {name: 'Kasil_PrivateNotes', private: true, visibility: 'private', has_pages: false, owner: {...owner, type: 'User'}, permissions: {admin: true, push: true}, default_branch: 'main'},
    collaborators: [{...owner}], notes: [], sha: null, calls: [], ...overrides
  };
  const context = vm.createContext({TextEncoder, TextDecoder, Uint8Array, AbortController, atob, btoa});
  vm.runInContext(source, context);
  const response = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {status, headers});
  const fetchImpl = async (url, options) => {
    state.calls.push({url, options});
    if (options.signal?.aborted) throw new Error('aborted');
    if (state.networkError) throw new Error('PRIVATE_FAILURE_BODY_' + token);
    if (url === 'https://api.github.com/user') return response(state.user, state.userStatus || 200);
    if (url === endpoint) return response(state.repo, state.repoStatus || 200);
    if (url.includes('/collaborators?')) return response(state.collaborators, 200, state.collaboratorHeaders);
    if (url.includes('/contents/')) {
      if (options.method === 'PUT') {
        if (state.writeStatus) return response({message: token}, state.writeStatus);
        const body = JSON.parse(options.body);
        assert.equal(body.sha ?? null, state.sha);
        state.notes = JSON.parse(Buffer.from(body.content, 'base64').toString('utf8')).notes;
        state.sha = sha;
        return response({content: {sha}});
      }
      if (state.badFile) return response(state.badFile);
      if (!state.sha) return response({}, 404);
      const content = Buffer.from(JSON.stringify({version: 1, notes: state.notes}));
      return response({type: 'file', encoding: 'base64', sha: state.sha, size: content.length, content: content.toString('base64')});
    }
    throw new Error('Unexpected test request');
  };
  return {state, create: () => context.KasilStickyStore.createStore({fetchImpl})};
}

test('two independent devices read and update the same private notes with Unicode intact', async () => {
  const h = harness(), first = h.create(), second = h.create();
  await first.connect(token);
  assert.equal((await first.load()).length, 0);
  await first.save(sample());
  await second.connect(token);
  const notes = await second.load();
  assert.equal(notes[0].body, '한글 메모\n두 번째 줄');
  const updated = {...notes[0], body: '다른 PC에서 수정 📝', updatedAt: '2026-10-30T00:01:00.000Z'};
  await second.save(updated, {expectedUpdatedAt: notes[0].updatedAt});
  assert.equal((await first.load())[0].body, updated.body);
});

test('every request uses header authentication, no browser cookies, no cache and no redirects', async () => {
  const h = harness(), store = h.create();
  await store.connect(token); await store.load(); await store.save(sample());
  for (const {url, options} of h.state.calls) {
    assert.ok(url.startsWith('https://api.github.com/'));
    assert.ok(!url.includes(token));
    assert.equal(options.headers.Authorization, 'Bearer ' + token);
    assert.equal(options.cache, 'no-store');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.redirect, 'error');
    assert.equal(options.referrerPolicy, 'no-referrer');
  }
});

test('another account cannot read any note contents', async () => {
  const h = harness({user: {login: 'other-user', id: 123}}), store = h.create();
  await assert.rejects(store.connect(token), {code: 'OWNER'});
  assert.ok(h.state.calls.every(call => !call.url.includes('/contents/')));
});

for (const [name, change] of [
  ['public repository', repo => {repo.private = false; repo.visibility = 'public';}],
  ['enabled Pages', repo => {repo.has_pages = true;}],
  ['different owner', repo => {repo.owner.id = 123;}],
  ['organization owner', repo => {repo.owner.type = 'Organization';}],
  ['missing ownership permission', repo => {repo.permissions.admin = false;}]
]) test(name + ' fails closed before note contents are requested', async () => {
  const h = harness(); change(h.state.repo);
  await assert.rejects(h.create().connect(token), {code: 'PRIVATE'});
  assert.ok(h.state.calls.every(call => !call.url.includes('/contents/')));
});

test('shared repositories and incomplete collaborator pages fail closed', async () => {
  for (const options of [
    {collaborators: [{...owner}, {login: 'other', id: 123}]},
    {collaboratorHeaders: {Link: '<https://api.github.com/example?page=2>; rel="next"'}}
  ]) {
    const h = harness(options);
    await assert.rejects(h.create().connect(token), {code: 'PRIVATE'});
    assert.ok(h.state.calls.every(call => !call.url.includes('/contents/')));
  }
});

test('privacy is checked again before reading and before saving', async () => {
  const h = harness(), store = h.create(); await store.connect(token);
  const firstContentCount = h.state.calls.filter(call => call.url.includes('/contents/')).length;
  h.state.repo.private = false;
  await assert.rejects(store.load(), {code: 'PRIVATE'});
  await assert.rejects(store.save(sample()), {code: 'PRIVATE'});
  assert.equal(h.state.calls.filter(call => call.url.includes('/contents/')).length, firstContentCount);
});

test('edits from another device are preserved and stale edits cannot overwrite the same note', async () => {
  const h = harness(), store = h.create(); await store.connect(token);
  await store.save(sample());
  h.state.notes.push(sample('another-note', '다른 PC가 추가한 메모'));
  await store.save({...sample(), body: '수정', updatedAt: '2026-10-30T00:02:00.000Z'}, {expectedUpdatedAt: sample().updatedAt});
  assert.equal(h.state.notes.length, 2);
  const writes = h.state.calls.filter(call => call.options.method === 'PUT').length;
  await assert.rejects(store.save({...sample(), body: '오래된 수정'}, {expectedUpdatedAt: sample().updatedAt}), {code: 'CONFLICT'});
  assert.equal(h.state.calls.filter(call => call.options.method === 'PUT').length, writes);
  assert.equal(h.state.notes[0].body, '수정');
});

test('SHA conflicts do not trigger a blind retry', async () => {
  const h = harness({writeStatus: 409}), store = h.create(); await store.connect(token);
  await assert.rejects(store.save(sample()), {code: 'CONFLICT'});
  assert.equal(h.state.calls.filter(call => call.options.method === 'PUT').length, 1);
});

test('malformed private data is never overwritten', async () => {
  const h = harness({badFile: {type: 'file', encoding: 'base64', sha, size: 8, content: btoa('not JSON')}}), store = h.create();
  await store.connect(token);
  await assert.rejects(store.save(sample()), {code: 'DATA'});
  assert.ok(h.state.calls.every(call => call.options.method !== 'PUT'));
});

test('oversized notes are rejected and remote data remains unchanged', async () => {
  const h = harness(), store = h.create(); await store.connect(token);
  assert.throws(() => store.save(sample('long-note', 'a'.repeat(5001))), {code: 'DATA'});
  assert.equal(h.state.notes.length, 0);
});

test('deleting a saved note preserves the other notes', async () => {
  const h = harness({notes: [sample('one'), sample('two')], sha}), store = h.create(); await store.connect(token);
  await store.remove('one', {expectedUpdatedAt: sample().updatedAt});
  assert.deepEqual(h.state.notes.map(note => note.id), ['two']);
});

test('logout revokes subsequent calls and safe errors never echo network credentials', async () => {
  const h = harness(), store = h.create(); await store.connect(token);
  h.state.networkError = true;
  await assert.rejects(store.load(), error => error.code === 'NETWORK' && !error.message.includes(token));
  store.disconnect();
  await assert.rejects(store.load(), {code: 'AUTH'});
});

test('logout while authentication is in flight prevents it from restoring a session', async () => {
  let resume;
  const context = vm.createContext({TextEncoder, TextDecoder, Uint8Array, AbortController, atob, btoa});
  vm.runInContext(source, context);
  const store = context.KasilStickyStore.createStore({fetchImpl: () => new Promise(resolve => {resume = resolve;})});
  const pending = store.connect(token);
  store.disconnect();
  resume(new Response(JSON.stringify(owner)));
  await assert.rejects(pending, {code: 'LOCKED'});
  await assert.rejects(store.load(), {code: 'AUTH'});
});

test('private memo data has no browser persistence or public blog content endpoint', () => {
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|console\./);
  assert.doesNotMatch(source, /Kasil_DevLog\/contents|_posts|download_url/);
});
