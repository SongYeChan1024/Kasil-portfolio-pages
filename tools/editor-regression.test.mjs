import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

class Transfer {
  values = new Map();
  setData(type, value) { this.values.set(type, value); }
  getData(type) { return this.values.get(type) || ''; }
}
const context = vm.createContext({ File, crypto: webcrypto, Date, DataTransfer: Transfer, btoa });
for (const file of ['image-paste.js', 'login-session.js']) {
  vm.runInContext(await readFile(new URL(`../admin/${file}`, import.meta.url), 'utf8'), context);
}
const paste = context.KasilImagePaste;
const login = context.KasilLoginSession;
const png = () => new File(['fixture'], 'image.png', { type: 'image/png' });

test('clipboard text and non-image files remain ordinary paste; files fallback works', () => {
  assert.equal(paste.clipboardImages({ items: [{ kind:'string', type:'text/plain' }] }).length, 0);
  const image = png();
  assert.deepEqual(Array.from(paste.clipboardImages({ files:[image, new File(['hello'], 'note.txt', {type:'text/plain'})] })), [image]);
  assert.equal(paste.clipboardImages({ items:[{kind:'file',getAsFile:()=>image}], files:[image] }).length, 1);
});
test('captures with the same original name get distinct safe names and retain bytes', async () => {
  const files = paste.prepareFiles([png(), png()]);
  assert.notEqual(files[0].name, files[1].name);
  assert.match(files[0].name, /^capture-[a-zA-Z0-9-]+\.png$/);
  assert.equal(await files[0].text(), 'fixture');
});
test('empty, unsupported and oversized images fail before staging any files', () => {
  assert.throws(() => paste.prepareFiles([new File([], 'empty.png', {type:'image/png'})]), /비어/);
  assert.throws(() => paste.prepareFiles([new File(['svg'], 'x.svg', {type:'image\/svg+xml'})]), /PNG/);
  assert.throws(() => paste.prepareFiles([{type:'image/png',size:10*1024*1024+1}]), /10MB/);
});
test('public image URLs round-trip to staged media filenames, including Korean', () => {
  const folder = 'https://site.example/blog/assets/img/uploads';
  const url = paste.publicUrl(folder, 'assets/img/uploads/사진.png');
  assert.equal(url, folder + '/%EC%82%AC%EC%A7%84.png');
  assert.equal(paste.assetPath(folder, url), '사진.png');
  assert.equal(paste.assetPath(folder, 'https://elsewhere.example/a.png'), 'https://elsewhere.example/a.png');
});
test('rich and raw paste keep multiple-image order using the pinned native editor formats', () => {
  const urls = ['/img/one.png', '/img/two.png'];
  const rich = paste.transferForImages(urls, false);
  const fragment = JSON.parse(decodeURIComponent(atob(rich.getData('application/x-slate-fragment'))));
  assert.deepEqual(fragment.filter(x=>x.type==='shortcode').map(x=>x.data.shortcodeData.image), urls);
  assert.equal(fragment.at(-1).type, 'paragraph');
  const raw = paste.transferForImages(urls, true);
  assert.equal(raw.getData('application/x-slate-fragment'), '');
  assert.equal(raw.getData('text/plain'), '![캡처 이미지](/img/one.png)\n\n![캡처 이미지](/img/two.png)\n');
});

function authHarness() {
  const stored = new Map([['unrelated', 'keep']]);
  const session = login.createSession(() => ({
    getItem: key => stored.get(key), setItem:(key,value)=>stored.set(key,value), removeItem:key=>stored.delete(key)
  }));
  class Native {
    async authenticate({token}) { this.token=token; if(token==='INVALID_TEST_TOKEN') throw new Error('401'); return {login:'test-author',token}; }
    logout() { this.token=null; this.loggedOut=true; }
  }
  const Backend = login.createBackend(Native, session, 'Login');
  return { stored, session, Backend, backend:new Backend() };
}
test('default login keeps the token out of persistent session and CMS user metadata', async () => {
  const {backend,session} = authHarness();
  const user = await backend.authenticate({token:'TEST_ONLY_NOT_A_CREDENTIAL',remember:false});
  assert.equal(user.token, undefined);
  assert.equal(session.read(), '');
  assert.equal(backend.token, 'TEST_ONLY_NOT_A_CREDENTIAL');
});
test('explicit remember option restores the session after creating a fresh backend', async () => {
  const {backend,session,Backend} = authHarness();
  await backend.authenticate({token:'TEST_ONLY_NOT_A_CREDENTIAL',remember:true});
  assert.equal(session.read(), 'TEST_ONLY_NOT_A_CREDENTIAL');
  const next = new Backend();
  const user = await next.restoreUser();
  assert.equal(user.login, 'test-author');
  assert.equal(user.token, undefined);
  assert.equal(next.token, 'TEST_ONLY_NOT_A_CREDENTIAL');
});
test('logout removes remembered token without clearing unrelated browser data', async () => {
  const {backend,session,stored} = authHarness();
  await backend.authenticate({token:'TEST_ONLY_NOT_A_CREDENTIAL',remember:true});
  await backend.logout();
  assert.equal(session.read(), '');
  assert.equal(backend.token, null);
  assert.equal(stored.get('unrelated'), 'keep');
});
test('invalid remembered token is discarded and cannot loop automatic login', async () => {
  const {backend,session} = authHarness();
  session.save('INVALID_TEST_TOKEN');
  await assert.rejects(backend.restoreUser(), /401/);
  assert.equal(session.read(), '');
  assert.equal(backend.token, null);
  assert.throws(()=>backend.restoreUser(), /다시 입력/);
});
test('blocked browser storage does not break an ordinary login', async () => {
  const session = login.createSession(()=>{throw new Error('storage blocked');});
  let notice='';
  class Native { async authenticate({token}) {return {token,login:'test'};} logout() {} }
  const Backend=login.createBackend(Native,session,null,message=>{notice=message;});
  const user=await new Backend().authenticate({token:'TEST_ONLY_NOT_A_CREDENTIAL',remember:true});
  assert.equal(user.login,'test');
  assert.equal(session.read(),'');
  assert.match(notice,/저장.*차단/);
});

test('saved login opens the editor without showing token fields; failure restores the login form', async () => {
  const source=await readFile(new URL('../admin/admin.js',import.meta.url),'utf8');
  function harness(token) {
    let definition,notify,submitted;
    const session={read:()=>token};
    const root={CMS:{getBackend:()=>({BackendClass:class{}}),registerBackend(){},init(){}},
      createClass(value){definition=value;return value;},h:(type,props,...children)=>({type,props,children}),
      localStorage:{removeItem(){}},KasilImagePaste:{register(){}},KasilBlogManager:{register(){}},
      KasilLoginSession:{createSession:()=>session,createBackend(native,stored,view,callback){notify=callback;return class{};}}};
    vm.runInNewContext(source,{window:root,document:{getElementById:()=>({remove(){}})}});
    const control={...definition,props:{onLogin(value){submitted=value;}},setState(value){Object.assign(this.state,value);}};
    control.state=control.getInitialState();return {control,notify:message=>notify(message),submitted:()=>submitted};
  }
  const saved=harness('TEST_ONLY_NOT_A_CREDENTIAL');
  assert.equal(saved.control.state.restoring,true);
  assert.equal(JSON.stringify(saved.control.render()).includes('github-token'),false);
  saved.control.componentDidMount();assert.equal(saved.submitted().remember,true);
  saved.notify('인증 실패');assert.equal(JSON.stringify(saved.control.render()).includes('github-token'),true);
  const empty=harness('');assert.equal(empty.control.state.restoring,false);
  assert.equal(JSON.stringify(empty.control.render()).includes('github-token'),true);
  const writePage=await readFile(new URL('../_tabs/write.md',import.meta.url),'utf8');
  assert.match(writePage,/window\.location\.replace\([^\n]*\/admin\/#\/collections\/posts\/new/);
});
