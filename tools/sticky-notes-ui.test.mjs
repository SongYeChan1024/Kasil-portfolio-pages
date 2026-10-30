import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {mkdtemp, readFile, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const run = promisify(execFile);
const chrome = [process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'
].find(value => value && existsSync(value));

export async function fixture() {
  const directory = await mkdtemp(path.join(tmpdir(), 'kasil-postit-'));
  const home = await readFile(path.join(root, '_layouts/home.html'), 'utf8');
  const panel = home.match(/<section class="blog-sticky"[\s\S]*?<\/section>/)?.[0];
  assert.ok(panel, 'The actual home template must contain the post-it panel');
  const asset = name => pathToFileURL(path.join(root, name)).href;
  let content = `<link rel="stylesheet" href="${asset('assets/css/blog-board.css')}"><link rel="stylesheet" href="${asset('assets/css/sticky-notes.css')}">
    <section class="blog-board" data-accent="green"><header class="blog-cover"><div class="blog-cover-copy"><span class="blog-eyebrow">KASIL · DEVELOPMENT JOURNAL</span><h1>Kasil's Devlog</h1><p>게임을 만들고, 배우는 과정을 기록합니다.</p></div></header>
    <nav class="blog-top-tabs"><a class="blog-tab" aria-current="page">전체 글</a><a class="blog-tab">Blender</a><a class="blog-tab">Unity</a><a class="blog-tab">개인 프로젝트</a></nav>
    <div class="blog-columns"><div class="blog-main"><div class="blog-list-heading"><div><p class="blog-kicker">POSTS</p><h2>배우고 만드는 기록</h2></div></div><div class="blog-post-row"><div class="blog-post-copy"><div class="blog-post-meta">개발일지</div><h3>작은 배움도 하나씩 기록합니다.</h3><p class="blog-post-summary">포스트잇은 글쓰기 화면을 열지 않고 바로 사용할 수 있습니다.</p></div></div></div><aside class="blog-right">${panel}</aside></div></section>
    <script src="${asset('admin/login-session.js')}" defer></script><script src="${asset('assets/js/sticky-notes-store.js')}" defer></script><script src="${asset('assets/js/sticky-notes.js')}" defer></script>`;
  const bootstrapUrl = pathToFileURL(path.join(directory, 'bootstrap.js')).href;
  const uiUrl = pathToFileURL(path.join(root, 'assets/js/sticky-notes.js')).href;
  content = content.replace('<script src="' + uiUrl, '<script src="' + bootstrapUrl + '" defer></script>\n<script src="' + uiUrl);
  const checksUrl = pathToFileURL(path.join(directory, 'checks.js')).href;
  await writeFile(path.join(directory, 'bootstrap.js'), `
    (() => {
      const copy = value => JSON.parse(JSON.stringify(value));
      const note = {id:'preview-note',body:'작은 아이디어를 잊지 않게.\\n여기에 적고 저장해 두세요.',createdAt:'2026-10-30T00:00:00.000Z',updatedAt:'2026-10-30T00:00:00.000Z'};
      const state = {notes:[note],calls:[],fail:false,delay:false,pending:null,remembered:'PREVIEW_ONLY_NOT_A_CREDENTIAL'};
      window.__stickyFixture = state;
      window.confirm = () => true;
      window.KasilLoginSession.createSession = () => ({read:()=>state.remembered,save:value=>{state.remembered=value;return true;},clear:()=>{state.remembered='';}});
      window.KasilStickyStore.createStore = () => ({
        connect:async()=>({login:'SongYeChan1024'}),disconnect:()=>{},load:async()=>copy(state.notes),
        async save(note) {
          state.calls.push(copy(note));
          if(state.fail)throw Object.assign(new Error('연결하지 못했습니다. 다시 저장해 주세요.'),{code:'NETWORK'});
          if(state.delay)await new Promise(resolve=>{state.pending=resolve;});
          state.notes=[copy(note),...state.notes.filter(item=>item.id!==note.id)];return copy(note);
        },
        async remove(id){state.notes=state.notes.filter(note=>note.id!==id);}
      });
    })();
  `);
  await writeFile(path.join(directory, 'checks.js'), `
    (async () => {
      const tick=()=>new Promise(resolve=>setTimeout(resolve,20));
      const wait=async check=>{for(let i=0;i<80;i++){if(check())return;await tick();}throw new Error('UI did not settle');};
      const checks=[];
      const check=(condition,label)=>{if(!condition)throw new Error(label);checks.push(label);};
      const host=document.querySelector('[data-sticky-notes]');
      const list=host.querySelector('[data-note-list]');
      const fixture=window.__stickyFixture;
      const type=(input,value)=>{input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));};
      try {
        await wait(()=>!host.querySelector('[data-note-account]').hidden);
        check(list.children.length===1,'saved note restored after login');
        if(new URLSearchParams(location.search).has('preview')) {
          host.querySelector('[data-note-add]').click();
          document.body.dataset.tests='preview';return;
        }
        host.querySelector('[data-note-add]').click();
        const first=list.firstElementChild;
        check(list.children.length===2 && first.querySelector('textarea').value==='','new post-it appears below the add control');
        const payload='<img src=x onerror="window.__executed=true"> 한글 메모 📝';
        type(first.querySelector('textarea'),payload);
        first.requestSubmit();
        await wait(()=>first.querySelector('.blog-sticky-paper-status').textContent.startsWith('저장됨'));
        check(fixture.notes.some(note=>note.body===payload),'save persists the selected note');
        check(!first.querySelector('img') && !window.__executed,'note text cannot execute HTML');
        check(first.querySelector('.blog-sticky-save').disabled,'saved button is disabled until edited');
        window.dispatchEvent(new StorageEvent('storage',{key:'unrelated-test-setting',newValue:'value'}));
        check(!host.querySelector('[data-note-account]').hidden,'unrelated storage changes do not log out the author');
        host.querySelector('[data-note-add]').click();
        const draft=list.firstElementChild;
        type(draft.querySelector('textarea'),'저장 전 초안');
        type(first.querySelector('textarea'),'저장 실패에도 남을 내용');
        fixture.fail=true;first.requestSubmit();
        await wait(()=>first.querySelector('.blog-sticky-paper-status').dataset.error==='true');
        check(first.querySelector('textarea').value==='저장 실패에도 남을 내용','failed save preserves input');
        check(!fixture.calls.some(note=>note.body==='저장 전 초안'),'saving one note does not save another draft');
        fixture.fail=false;fixture.delay=true;first.requestSubmit();
        await wait(()=>!!fixture.pending);
        host.querySelector('[data-note-lock]').click();
        check(list.children.length===0 && !host.querySelector('[data-note-login]').hidden,'logout clears private note DOM immediately');
        fixture.pending();await tick();await tick();
        check(list.children.length===0,'a pending save cannot repopulate notes after logout');
        const output=document.createElement('output');output.id='sticky-ui-test-result';output.textContent=JSON.stringify({passed:checks.length,checks});document.body.append(output);
        document.body.dataset.tests='passed';
      } catch(error) {
        document.body.dataset.tests='failed';const output=document.createElement('output');output.id='sticky-ui-test-result';output.textContent=String(error.message);document.body.append(output);
      }
    })();
  `);
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    *{box-sizing:border-box}body{margin:0;background:#fafafa;color:#242434;font:14px system-ui,sans-serif}main{max-width:1120px;margin:0 auto;padding:24px}a{color:#23815b}button,input,textarea{font:inherit}button{cursor:pointer}li[hidden]{display:none}#sticky-ui-test-result{display:block;font-size:12px;overflow-wrap:anywhere}
    </style></head><body><main>${content}</main><script src="${checksUrl}" defer></script></body></html>`;
  const file = path.join(directory, 'index.html');
  await writeFile(file, html);
  return {directory, url: pathToFileURL(file).href};
}

if (!process.argv.includes('--preview')) test('inline post-its save, preserve failed drafts, and clear private DOM on logout', {skip: !chrome || process.env.RUN_BROWSER_TESTS !== '1', timeout: 60000}, async () => {
  const page = await fixture();
  const {stdout} = await run(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--user-data-dir=' + path.join(page.directory, 'browser-tests'), '--virtual-time-budget=10000', '--dump-dom', page.url
  ], {windowsHide: true, timeout: 45000, maxBuffer: 2000000});
  const outcome = stdout.match(/<output id="sticky-ui-test-result">([\s\S]*?)<\/output>/)?.[1];
  assert.match(stdout, /data-tests="passed"/, outcome || 'No browser test result');
  assert.equal(JSON.parse(outcome).passed, 10);
});

if (process.argv.includes('--preview')) {
  const page = await fixture();
  console.log(JSON.stringify({url: page.url + '?preview=1', directory: page.directory, chrome}));
}
