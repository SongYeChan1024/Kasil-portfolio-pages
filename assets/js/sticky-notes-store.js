(function (root) {
  'use strict';

  const OWNER = 'SongYeChan1024';
  const OWNER_ID = 252518720;
  const REPOSITORY = 'Kasil_PrivateNotes';
  const FILE = 'sticky-notes.json';
  const MAX_BYTES = 750000;
  const MAX_NOTES = 100;
  const MAX_TEXT = 5000;
  const encoder = new TextEncoder();

  function fail(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function validateNote(note) {
    if (!note || typeof note.id !== 'string' || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(note.id) ||
        typeof note.body !== 'string' || !note.body.trim() || note.body.length > MAX_TEXT ||
        typeof note.createdAt !== 'string' || !Number.isFinite(Date.parse(note.createdAt)) ||
        typeof note.updatedAt !== 'string' || !Number.isFinite(Date.parse(note.updatedAt))) {
      throw fail('DATA', '메모 형식을 확인해 주세요. 메모는 5,000자까지 저장할 수 있습니다.');
    }
    return {id: note.id, body: note.body, createdAt: note.createdAt, updatedAt: note.updatedAt};
  }

  function validateData(data) {
    if (!data || data.version !== 1 || !Array.isArray(data.notes) || data.notes.length > MAX_NOTES) {
      throw fail('DATA', '저장된 메모 형식을 확인하지 못했습니다. 기존 메모는 덮어쓰지 않았습니다.');
    }
    const notes = data.notes.map(validateNote);
    if (new Set(notes.map(note => note.id)).size !== notes.length) {
      throw fail('DATA', '메모 번호가 중복되어 있습니다. 기존 메모는 덮어쓰지 않았습니다.');
    }
    return notes;
  }

  function encode(data) {
    const bytes = encoder.encode(JSON.stringify(data, null, 2) + '\n');
    if (bytes.length > MAX_BYTES) throw fail('LIMIT', '메모 저장 공간이 가득 찼습니다. 메모를 정리해 주세요.');
    let binary = '';
    for (let start = 0; start < bytes.length; start += 8192) {
      binary += String.fromCharCode(...bytes.subarray(start, start + 8192));
    }
    return btoa(binary);
  }

  function decode(file) {
    if (!file || file.type !== 'file' || file.encoding !== 'base64' ||
        typeof file.content !== 'string' || !Number.isInteger(file.size) ||
        file.size < 0 || file.size > MAX_BYTES || !/^[a-f0-9]{40}$/.test(file.sha || '') ||
        file.content.length > Math.ceil(MAX_BYTES / 3) * 4 + 20000) {
      throw fail('DATA', '저장된 메모 파일을 안전하게 읽지 못했습니다.');
    }
    try {
      const binary = atob(file.content.replace(/\s/g, ''));
      if (binary.length > MAX_BYTES) throw new Error('size');
      const text = new TextDecoder('utf-8', {fatal: true}).decode(Uint8Array.from(binary, c => c.charCodeAt(0)));
      return validateData(JSON.parse(text));
    } catch (error) {
      if (error.code) throw error;
      throw fail('DATA', '저장된 메모 파일이 올바르지 않습니다. 기존 메모는 덮어쓰지 않았습니다.');
    }
  }

  function createStore({fetchImpl = root.fetch.bind(root)} = {}) {
    const base = 'https://api.github.com/repos/' + OWNER + '/' + REPOSITORY;
    let token = '';
    let generation = 0;
    let controller = null;
    let queue = Promise.resolve();

    function disconnect() {
      generation++;
      token = '';
      controller?.abort();
      controller = null;
    }

    function current(ticket) {
      if (ticket !== generation) throw fail('LOCKED', '메모장이 잠겼습니다. 다시 로그인해 주세요.');
    }

    async function request(url, options = {}, auth = token, ticket = generation) {
      if (!auth) throw fail('AUTH', '메모를 보려면 먼저 로그인해 주세요.');
      let response;
      try {
        response = await fetchImpl(url, {
          ...options,
          headers: {
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2026-03-10',
            ...options.headers,
            Authorization: 'Bearer ' + auth
          },
          credentials: 'omit', cache: 'no-store', redirect: 'error',
          referrerPolicy: 'no-referrer', signal: controller?.signal
        });
      } catch (_) {
        current(ticket);
        throw fail('NETWORK', '연결하지 못했습니다. 인터넷 연결을 확인한 뒤 다시 저장해 주세요.');
      }
      current(ticket);
      if (response.status === 401) throw fail('AUTH', '로그인이 만료되었습니다. 다시 로그인해 주세요.');
      if (response.status === 403) throw fail('PERMISSION', '메모 저장소 접근 권한과 토큰 유효기간을 확인해 주세요.');
      if (response.status === 409 || response.status === 422) {
        throw fail('CONFLICT', '다른 곳에서 메모가 바뀌었습니다. 작성 중인 내용을 복사한 뒤 새로 불러와 주세요.');
      }
      return response;
    }

    async function json(response) {
      if (!response.ok) throw fail('REQUEST', '메모를 불러오거나 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      try { return await response.json(); }
      catch (_) { throw fail('DATA', '서버 응답을 확인하지 못했습니다.'); }
    }

    async function guard(auth = token, ticket = generation) {
      const response = await request(base, {}, auth, ticket);
      if (response.status === 404) {
        throw fail('SETUP', '비공개 메모 공간이 아직 연결되지 않았습니다. 아래 처음 연결하기 안내를 확인해 주세요.');
      }
      const repo = await json(response);
      current(ticket);
      if (repo.private !== true || repo.visibility !== 'private' || repo.has_pages !== false ||
          repo.owner?.login?.toLowerCase() !== OWNER.toLowerCase() || repo.owner?.id !== OWNER_ID ||
          repo.owner?.type !== 'User' || repo.name !== REPOSITORY ||
          repo.permissions?.admin !== true || repo.permissions?.push !== true ||
          typeof repo.default_branch !== 'string' || !repo.default_branch) {
        throw fail('PRIVATE', '본인 전용 비공개 저장소인지 확인하지 못해 메모 접근을 중단했습니다.');
      }
      const collaboratorsResponse = await request(base + '/collaborators?affiliation=all&per_page=100', {}, auth, ticket);
      const collaborators = await json(collaboratorsResponse);
      current(ticket);
      if (!Array.isArray(collaborators) || /rel="next"/.test(collaboratorsResponse.headers.get('link') || '') ||
          collaborators.some(user => user.id !== OWNER_ID || user.login?.toLowerCase() !== OWNER.toLowerCase())) {
        throw fail('PRIVATE', '다른 사용자에게 공유된 저장소에는 개인 메모를 저장하지 않습니다.');
      }
      return repo;
    }

    async function connect(candidate) {
      disconnect();
      const ticket = generation;
      controller = new AbortController();
      if (typeof candidate !== 'string' || !candidate.trim()) throw fail('AUTH', '로그인 정보를 입력해 주세요.');
      candidate = candidate.trim();
      const user = await json(await request('https://api.github.com/user', {}, candidate, ticket));
      current(ticket);
      if (user.id !== OWNER_ID || user.login?.toLowerCase() !== OWNER.toLowerCase()) {
        throw fail('OWNER', '이 메모장은 블로그 주인 계정으로만 사용할 수 있습니다.');
      }
      await guard(candidate, ticket);
      current(ticket);
      token = candidate;
      return {login: user.login, repository: OWNER + '/' + REPOSITORY};
    }

    async function readState(ticket) {
      current(ticket);
      const repo = await guard(token, ticket);
      const response = await request(base + '/contents/' + FILE + '?ref=' + encodeURIComponent(repo.default_branch), {}, token, ticket);
      if (response.status === 404) return {notes: [], sha: null, branch: repo.default_branch};
      const file = await json(response);
      current(ticket);
      return {notes: decode(file), sha: file.sha, branch: repo.default_branch};
    }

    async function load() {
      const ticket = generation;
      const state = await readState(ticket);
      current(ticket);
      return state.notes;
    }

    async function writeState(state, notes, ticket) {
      current(ticket);
      validateData({version: 1, notes});
      const body = {message: 'docs: update private sticky notes', content: encode({version: 1, notes}), branch: state.branch};
      if (state.sha) body.sha = state.sha;
      const result = await json(await request(base + '/contents/' + FILE, {
        method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)
      }, token, ticket));
      current(ticket);
      if (!/^[a-f0-9]{40}$/.test(result.content?.sha || '')) throw fail('DATA', '저장 결과를 확인하지 못했습니다. 새로 불러와 확인해 주세요.');
    }

    function enqueue(action) {
      const ticket = generation;
      const operation = queue.then(() => { current(ticket); return action(ticket); });
      queue = operation.catch(() => {});
      return operation;
    }

    function save(note, {expectedUpdatedAt = null} = {}) {
      const clean = validateNote(note);
      return enqueue(async ticket => {
        const state = await readState(ticket);
        const existing = state.notes.find(item => item.id === clean.id);
        if ((existing?.updatedAt ?? null) !== expectedUpdatedAt) {
          throw fail('CONFLICT', '다른 PC에서 이 메모가 바뀌었습니다. 작성 내용을 복사한 뒤 새로 불러와 주세요.');
        }
        if (!existing && state.notes.length >= MAX_NOTES) throw fail('LIMIT', '포스트잇은 100장까지 보관할 수 있습니다.');
        const notes = existing ? state.notes.map(item => item.id === clean.id ? clean : item) : [clean, ...state.notes];
        await writeState(state, notes, ticket);
        return clean;
      });
    }

    function remove(id, {expectedUpdatedAt = null} = {}) {
      return enqueue(async ticket => {
        const state = await readState(ticket);
        const existing = state.notes.find(note => note.id === id);
        if (!existing || existing.updatedAt !== expectedUpdatedAt) {
          throw fail('CONFLICT', '다른 곳에서 메모가 바뀌었습니다. 새로 불러온 뒤 확인해 주세요.');
        }
        await writeState(state, state.notes.filter(note => note.id !== id), ticket);
      });
    }

    return {connect, disconnect, load, save, remove};
  }

  root.KasilStickyStore = {createStore, limits: {notes: MAX_NOTES, text: MAX_TEXT}};
})(typeof window === 'undefined' ? globalThis : window);
