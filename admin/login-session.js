(function (root) {
  "use strict";
  const key = "kasil-devlog:SongYeChan1024/Kasil-portfolio-pages:token";
  function createSession(storage) {
    return {
      read() { try { return storage().getItem(key) || ""; } catch (_) { return ""; } },
      save(token) {
        try { if (token) storage().setItem(key, token); else storage().removeItem(key); return true; }
        catch (_) { return false; }
      },
      clear() { return this.save(""); }
    };
  }

  function createBackend(NativeBackend, session, Login, notify = () => {}) {
    return class TokenBackend extends NativeBackend {
      authComponent() { return Login; }
      async authenticate(credentials) {
        this._currentUserPromise = undefined;
        this._userIsOriginMaintainerPromises = undefined;
        try {
          const user = await super.authenticate({ token: credentials.token });
          // Only remember a token after both identity and repository access pass.
          const saved = session.save(credentials.remember ? credentials.token : "");
          if (credentials.remember && !saved) notify("브라우저가 로그인 정보 저장을 차단했습니다. 이번 창에서만 로그인됩니다.");
          const { token, ...metadata } = user;
          return metadata;
        } catch (error) {
          session.clear();
          await super.logout();
          notify("로그인하지 못했습니다. 토큰 유효기간과 이 저장소의 Contents 쓰기 권한을 확인해 주세요.");
          throw error;
        }
      }
      restoreUser() {
        const token = session.read();
        if (!token) throw new Error("관리자 토큰을 다시 입력해 주세요.");
        return this.authenticate({ token, remember: true });
      }
      logout() { session.clear(); return super.logout(); }
    };
  }
  root.KasilLoginSession = { createSession, createBackend, key };
})(typeof window === "undefined" ? globalThis : window);
