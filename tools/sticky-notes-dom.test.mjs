import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../assets/js/sticky-notes.js', import.meta.url), 'utf8');
const home = await readFile(new URL('../_layouts/home.html', import.meta.url), 'utf8');

// A minimal DOM surface keeps interaction tests independent of browser installation.
class Element {
  constructor(tag, document) { this.tagName = tag; this.ownerDocument = document; this.children = []; this.dataset = {}; this.attributes = {}; this.listeners = {}; this.value = ''; this.disabled = false; this.hidden = false; this.className = ''; this.text = ''; }
  append(...nodes) { nodes.forEach(node => { node.parent = this; this.children.push(node); }); }
  prepend(node) { node.parent = this; this.children.unshift(node); }
  replaceChildren(...nodes) { this.children.forEach(node => {node.parent = null;}); this.children = []; this.append(...nodes); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(node => node !== this); this.parent = null; }
  set textContent(value) { this.text = value; this.replaceChildren(); }
  get textContent() { return this.text + this.children.map(node => node.textContent).join(''); }
  setAttribute(name, value) { this.attributes[name] = value; if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value; if (name === 'class') this.className = value; if (name === 'name') this.name = value; if (name === 'hidden') this.hidden = true; if (name === 'disabled') this.disabled = true; }
  matches(selector) { if (selector.startsWith('.')) return this.className.split(' ').includes(selector.slice(1)); if (selector.startsWith('[')) return Object.hasOwn(this.attributes, selector.slice(1, -1)); return this.tagName === selector; }
  querySelectorAll(selector) { const selectors = selector.split(',').map(value => value.trim()); const result = []; const visit = node => {for (const child of node.children) {if (selectors.some(value => child.matches(value))) result.push(child); visit(child);}}; visit(this); return result; }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  get elements() { return {namedItem: name => this.querySelectorAll('input').find(node => node.name === name)}; }
  addEventListener(name, listener) { (this.listeners[name] ||= []).push(listener); }
  async emit(name, event = {}) { await Promise.all((this.listeners[name] || []).map(listener => listener({preventDefault() {}, currentTarget: this, ...event}))); }
  focus() { this.ownerDocument.activeElement = this; }
}

function documentFixture() {
  const document = {createElement(tag) {return new Element(tag, document);}};
  const panel = home.match(/<section class="blog-sticky"[\s\S]*?<\/section>/)[0];
  const container = document.createElement('root'), stack = [container];
  for (const token of panel.match(/<[^>]+>|[^<]+/g)) {
    if (token.startsWith('</')) {stack.pop(); continue;}
    if (token.startsWith('<')) {
      const tag = token.match(/^<([a-z][a-z0-9-]*)/i)?.[1];
      if (!tag) continue;
      const node = document.createElement(tag);
      for (const match of token.slice(tag.length + 1, -1).matchAll(/([\w-]+)(?:="([^"]*)")?/g)) node.setAttribute(match[1], match[2] || '');
      stack.at(-1).append(node);
      if (!['input', 'br', 'meta', 'link'].includes(tag)) stack.push(node);
    } else stack.at(-1).text += token;
  }
  return container.querySelector('[data-sticky-notes]');
}

const original = {id: 'existing-note', body: '저장된 메모', createdAt: '2026-10-30T00:00:00.000Z', updatedAt: '2026-10-30T00:00:00.000Z'};
const settle = () => new Promise(resolve => setImmediate(resolve));
async function setup() {
  const host = documentFixture();
  const state = {notes: [structuredClone(original)], calls: [], remembered: 'TEST_ONLY_NO_CREDENTIAL', error: null};
  const store = {connect: async () => ({login: 'SongYeChan1024'}), disconnect() {}, load: async () => structuredClone(state.notes),
    async save(note) {state.calls.push(structuredClone(note)); if (state.error) throw state.error; if (state.delay) await state.delay; state.notes = [structuredClone(note), ...state.notes.filter(item => item.id !== note.id)]; return structuredClone(note);},
    async remove(id) {state.notes = state.notes.filter(note => note.id !== id);}};
  const session = {read: () => state.remembered, save: value => {state.remembered = value; return true;}, clear() {state.remembered = '';}};
  const listeners = {}, windowObject = {crypto: {randomUUID: () => 'note-' + (state.sequence = (state.sequence || 0) + 1)}, confirm: () => true, KasilLoginSession: {key: 'auth-session'}, addEventListener(name, listener) {(listeners[name] ||= []).push(listener);}};
  const context = vm.createContext({console}); vm.runInContext(source, context);
  const board = context.KasilStickyBoard.mount({host, store, session, windowObject});
  await settle();
  return {host, state, board, listeners, list: host.querySelector('[data-note-list]'), async windowEvent(name, event) {for (const listener of listeners[name] || []) await listener(event); await settle();}};
}
async function add(h, body = '') {
  await h.host.querySelector('[data-note-add]').emit('click');
  const paper = h.list.children[0];
  paper.querySelector('textarea').value = body;
  await paper.querySelector('textarea').emit('input');
  return paper;
}

test('remembered blog login restores notes and add creates a post-it under the control', async () => {
  const h = await setup();
  assert.equal(h.list.children.length, 1);
  const paper = await add(h);
  assert.equal(h.list.children[0], paper);
  assert.equal(paper.querySelector('textarea').value, '');
  assert.equal(h.host.querySelector('[data-note-account]').hidden, false);
});
test('saving a post-it preserves Unicode and treats HTML as plain note text', async () => {
  const h = await setup(), text = '<img src=x onerror=alert(1)> 한글 📝';
  const paper = await add(h, text);
  await paper.emit('submit');
  assert.equal(h.state.notes[0].body, text);
  assert.equal(paper.querySelector('img'), null);
  assert.equal(paper.querySelector('.blog-sticky-save').disabled, true);
  assert.match(paper.querySelector('.blog-sticky-paper-status').textContent, /저장됨/);
});
test('saving one card never saves another unsaved draft', async () => {
  const h = await setup();
  await add(h, '아직 저장하지 않은 초안');
  const second = await add(h, '저장할 메모');
  await second.emit('submit');
  assert.equal(h.state.calls.length, 1);
  assert.equal(h.state.calls[0].body, '저장할 메모');
  assert.ok(!h.state.notes.some(note => note.body.includes('초안')));
});
test('failed save keeps editable text and error state', async () => {
  const h = await setup(), paper = await add(h, '다시 저장할 내용');
  h.state.error = Object.assign(new Error('연결 오류'), {code: 'NETWORK'});
  await paper.emit('submit');
  assert.equal(paper.querySelector('textarea').value, '다시 저장할 내용');
  assert.equal(paper.querySelector('textarea').disabled, false);
  assert.equal(paper.querySelector('.blog-sticky-paper-status').dataset.error, 'true');
  assert.equal(paper.querySelector('.blog-sticky-save').disabled, false);
});
test('logout clears note DOM and a pending save cannot restore it', async () => {
  const h = await setup(), paper = await add(h, '저장 중인 메모');
  let finish; h.state.delay = new Promise(resolve => {finish = resolve;});
  const pending = paper.emit('submit');
  await settle();
  await h.host.querySelector('[data-note-lock]').emit('click');
  assert.equal(h.list.children.length, 0);
  assert.equal(h.state.remembered, '');
  finish(); await pending;
  assert.equal(h.list.children.length, 0);
  assert.equal(h.host.querySelector('[data-note-login]').hidden, false);
});
test('pagehide clears notes without forgetting an opted-in login', async () => {
  const h = await setup();
  await h.windowEvent('pagehide', {});
  assert.equal(h.list.children.length, 0);
  assert.equal(h.state.remembered, 'TEST_ONLY_NO_CREDENTIAL');
  await h.windowEvent('pageshow', {persisted: true});
  assert.equal(h.list.children.length, 1);
});
test('unrelated storage events preserve login and actual cross-tab logout clears notes', async () => {
  const h = await setup();
  await h.windowEvent('storage', {key: 'unrelated'});
  assert.equal(h.list.children.length, 1);
  h.state.remembered = '';
  await h.windowEvent('storage', {key: 'auth-session'});
  assert.equal(h.list.children.length, 0);
});
test('expired authentication or unsafe privacy state clears already displayed notes', async () => {
  for (const code of ['AUTH', 'OWNER', 'PRIVATE']) {
    const h = await setup(), paper = await add(h, '저장할 메모');
    h.state.error = Object.assign(new Error('접근 중단'), {code});
    await paper.emit('submit');
    assert.equal(h.list.children.length, 0);
    assert.equal(h.host.querySelector('[data-note-account]').hidden, true);
  }
});
