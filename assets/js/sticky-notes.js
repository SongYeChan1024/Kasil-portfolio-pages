(function (root) {
  'use strict';

  function mount({host, store, session, windowObject = root}) {
    const document = host.ownerDocument;
    const add = host.querySelector('[data-note-add]');
    const form = host.querySelector('[data-note-login]');
    const account = host.querySelector('[data-note-account]');
    const list = host.querySelector('[data-note-list]');
    const status = host.querySelector('[data-notes-status]');
    const refresh = host.querySelector('[data-note-refresh]');
    const setup = host.querySelector('[data-note-setup]');
    const views = new Map();
    let authenticated = false;
    let generation = 0;
    let busy = false;

    function message(text, error = false) {
      status.textContent = text;
      status.dataset.error = String(error);
    }

    function errorMessage(error) {
      const safe = ['AUTH', 'PERMISSION', 'PRIVATE', 'OWNER', 'SETUP', 'CONFLICT', 'DATA', 'LIMIT', 'NETWORK', 'LOCKED', 'REQUEST'];
      return safe.includes(error.code) ? error.message : '처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';
    }

    function dirty() {
      return [...views.values()].some(view => view.input.value !== (view.saved?.body || ''));
    }

    function revokeIfNeeded(error) {
      if (!['AUTH', 'OWNER', 'PRIVATE'].includes(error.code)) return false;
      lock({forget: error.code !== 'PRIVATE', text: errorMessage(error)});
      return true;
    }

    function controls() {
      add.disabled = !authenticated || busy || views.size >= 100;
      refresh.disabled = busy || [...views.values()].some(view => view.pending);
      form.querySelectorAll('input, button').forEach(input => { input.disabled = busy; });
      views.forEach(view => {
        view.input.disabled = busy || view.pending;
        view.paper.querySelector('.blog-sticky-save').disabled = busy || view.pending || !view.input.value.trim() || view.input.value === (view.saved?.body || '');
        view.paper.querySelector('.blog-sticky-remove').disabled = busy || view.pending;
      });
    }

    function lock({forget = false, text = '로그인하면 저장한 포스트잇을 볼 수 있어요.'} = {}) {
      generation++;
      store.disconnect();
      authenticated = false;
      busy = false;
      views.clear();
      list.replaceChildren();
      form.elements.namedItem('token').value = '';
      host.querySelector('[data-note-user]').textContent = '';
      form.hidden = false;
      account.hidden = true;
      setup.hidden = false;
      if (forget) session.clear();
      controls();
      message(text);
    }

    function element(tag, className, text) {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    }

    function card(note = null) {
      const id = note?.id || windowObject.crypto.randomUUID();
      const paper = element('form', 'blog-sticky-paper');
      const top = element('div', 'blog-sticky-paper-top');
      top.append(element('span', '', 'MEMO'), element('span', '', '●'));
      const label = element('label', 'visually-hidden', '포스트잇 내용');
      label.htmlFor = 'sticky-' + id;
      const input = element('textarea');
      input.id = label.htmlFor;
      input.maxLength = 5000;
      input.rows = 6;
      input.placeholder = '잊지 않게, 여기에 적어 두기…';
      input.value = note?.body || '';
      input.spellcheck = false;
      const actions = element('div', 'blog-sticky-actions');
      const remove = element('button', 'blog-sticky-remove', note ? '삭제' : '취소');
      remove.type = 'button';
      const save = element('button', 'blog-sticky-save', '저장');
      save.type = 'submit';
      const savedStatus = element('p', 'blog-sticky-paper-status');
      savedStatus.setAttribute('role', 'status');
      savedStatus.setAttribute('aria-live', 'polite');
      actions.append(remove, save);
      paper.append(top, label, input, actions, savedStatus);
      const view = {id, paper, input, saved: note, pending: false};
      views.set(id, view);

      function update(text, error = false) {
        save.disabled = view.pending || !input.value.trim() || input.value === (view.saved?.body || '');
        input.disabled = view.pending;
        remove.disabled = view.pending;
        save.textContent = view.pending ? '저장 중…' : '저장';
        if (text !== undefined) savedStatus.textContent = text;
        if (text !== undefined) savedStatus.dataset.error = String(error);
        controls();
      }

      input.addEventListener('input', () => update(input.value === (view.saved?.body || '') ? '저장된 내용입니다.' : '아직 저장하지 않은 내용입니다.'));
      paper.addEventListener('submit', async event => {
        event.preventDefault();
        if (!authenticated || view.pending || save.disabled) return;
        const ticket = generation;
        const previous = view.saved;
        const timestamp = new Date(Math.max(Date.now(), (Date.parse(previous?.updatedAt || '') || 0) + 1)).toISOString();
        const next = {id, body: input.value, createdAt: previous?.createdAt || timestamp, updatedAt: timestamp};
        view.pending = true;
        update('비공개로 저장하는 중입니다.');
        try {
          const saved = await store.save(next, {expectedUpdatedAt: previous?.updatedAt || null});
          if (ticket !== generation) return;
          view.saved = saved;
          remove.textContent = '삭제';
          update('저장됨 · ' + new Date(saved.updatedAt).toLocaleString('ko-KR', {month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'}));
        } catch (error) {
          if (ticket !== generation) return;
          if (revokeIfNeeded(error)) return;
          update(errorMessage(error), true);
        } finally {
          if (ticket === generation) { view.pending = false; update(); }
        }
      });
      remove.addEventListener('click', async () => {
        if (!authenticated || view.pending) return;
        if ((view.saved || input.value.trim()) && !windowObject.confirm(view.saved ? '이 포스트잇을 삭제할까요?' : '작성 중인 포스트잇을 버릴까요?')) return;
        const ticket = generation;
        view.pending = true;
        update('정리하는 중입니다.');
        try {
          if (view.saved) await store.remove(id, {expectedUpdatedAt: view.saved.updatedAt});
          if (ticket !== generation) return;
          paper.remove();
          views.delete(id);
          controls();
          message(views.size ? '' : '포스트잇 붙이기를 눌러 새 메모를 적어 보세요.');
        } catch (error) {
          if (ticket === generation && !revokeIfNeeded(error)) update(errorMessage(error), true);
        } finally {
          if (ticket === generation) { view.pending = false; update(); }
        }
      });
      update(note ? '저장된 포스트잇' : '내용을 적고 저장을 눌러 주세요.');
      return view;
    }

    function display(notes) {
      views.clear();
      list.replaceChildren();
      notes.forEach(note => list.append(card(note).paper));
      controls();
      message(notes.length ? '' : '포스트잇 붙이기를 눌러 첫 메모를 적어 보세요.');
    }

    async function login(token, remember, restoring = false) {
      lock({text: restoring ? '저장된 로그인을 확인하는 중입니다…' : '로그인하는 중입니다…'});
      const ticket = generation;
      busy = true;
      controls();
      try {
        const user = await store.connect(token);
        const notes = await store.load();
        if (ticket !== generation) return;
        const remembered = session.save(remember ? token : '');
        authenticated = true;
        form.hidden = true;
        setup.hidden = true;
        account.hidden = false;
        host.querySelector('[data-note-user]').textContent = user.login + ' · 나만 보는 메모';
        display(notes);
        if (remember && !remembered) message('이 브라우저가 로그인 유지를 차단했습니다. 현재 창에서만 로그인됩니다.');
      } catch (error) {
        if (ticket !== generation) return;
        store.disconnect();
        if (restoring && ['AUTH', 'OWNER'].includes(error.code)) session.clear();
        message(errorMessage(error), true);
        if (error.code === 'SETUP') setup.open = true;
      } finally {
        token = '';
        if (ticket === generation) { busy = false; controls(); }
      }
    }

    form.addEventListener('submit', event => {
      event.preventDefault();
      if (busy) return;
      const token = form.elements.namedItem('token');
      const value = token.value.trim();
      const remember = form.elements.namedItem('remember').checked;
      token.value = '';
      if (value) login(value, remember);
    });
    add.addEventListener('click', () => {
      if (!authenticated || add.disabled) return;
      const view = card();
      list.prepend(view.paper);
      view.input.focus();
      message('작성 후 저장을 누르면 다른 PC에서도 볼 수 있어요.');
    });
    refresh.addEventListener('click', async () => {
      if (!authenticated || refresh.disabled) return;
      if (dirty() && !windowObject.confirm('저장하지 않은 내용을 버리고 메모를 새로 불러올까요?')) return;
      const ticket = generation;
      busy = true;
      controls();
      message('최신 메모를 불러오는 중입니다…');
      try {
        const notes = await store.load();
        if (ticket === generation) display(notes);
      } catch (error) {
        if (ticket === generation && !revokeIfNeeded(error)) message(errorMessage(error), true);
      } finally {
        if (ticket === generation) { busy = false; controls(); }
      }
    });
    host.querySelector('[data-note-lock]').addEventListener('click', () => {
      if (dirty() && !windowObject.confirm('저장하지 않은 내용을 버리고 로그아웃할까요?')) return;
      lock({forget: true});
    });
    windowObject.addEventListener('beforeunload', event => {
      if (authenticated && dirty()) { event.preventDefault(); event.returnValue = ''; }
    });
    windowObject.addEventListener('pagehide', () => lock({text: ''}));
    windowObject.addEventListener('pageshow', event => {
      if (event.persisted) { const token = session.read(); if (token) login(token, true, true); }
    });
    windowObject.addEventListener('storage', event => {
      if (event.key !== null && event.key !== windowObject.KasilLoginSession?.key) return;
      const remembered = session.read();
      if (!remembered && authenticated) lock({text: '다른 창에서 로그아웃했습니다.'});
      else if (remembered) login(remembered, true, true);
    });
    lock();
    const remembered = session.read();
    if (remembered) login(remembered, true, true);
    return {lock};
  }

  root.KasilStickyBoard = {mount};
  const host = root.document?.querySelector('[data-sticky-notes]');
  if (host && root.KasilStickyStore && root.KasilLoginSession) {
    mount({host, store: root.KasilStickyStore.createStore(), session: root.KasilLoginSession.createSession(() => root.localStorage)});
  }
})(typeof window === 'undefined' ? globalThis : window);
