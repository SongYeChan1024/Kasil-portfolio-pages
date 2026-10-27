(function () {
  "use strict";

  const loading = document.getElementById("cms-loading");
  if (!window.CMS || !window.createClass || !window.h) {
    loading.textContent = "편집기를 불러오지 못했습니다. 인터넷 연결을 확인하고 새로고침해 주세요.";
    return;
  }

  // Decap normally persists its user (including an OAuth token) in localStorage.
  // This backend returns metadata only and starts a fresh login on every page load.
  try { window.localStorage.removeItem("decap-cms-user"); } catch (_) { /* Storage may be disabled. */ }

  const h = window.h;
  const Login = window.createClass({
    getInitialState: function () { return { busy: false, error: "" }; },
    submit: async function (event) {
      event.preventDefault();
      const input = event.currentTarget.elements.namedItem("github-token");
      let token = input.value.trim();
      if (!token) return;
      input.value = "";
      this.setState({ busy: true, error: "" });
      try {
        const response = await fetch("https://api.github.com/user", {
          headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json" },
          cache: "no-store"
        });
        if (!response.ok) throw new Error("토큰을 확인해 주세요.");
        await this.props.onLogin({ token: token });
      } catch (_) {
        this.setState({ error: "로그인하지 못했습니다. 토큰 유효기간과 저장소 Contents 쓰기 권한을 확인해 주세요." });
      } finally {
        token = "";
        this.setState({ busy: false });
      }
    },
    render: function () {
      return h("main", { className: "author-login" },
        h("section", { className: "author-card" },
          h("h1", null, "Kasil Devlog 글쓰기"),
          h("p", null, "글 작성, 기존 글 수정, 이미지 업로드를 할 수 있습니다."),
          h("form", { onSubmit: this.submit },
            h("label", { htmlFor: "github-token" }, "GitHub 전용 토큰"),
            h("input", { id: "github-token", name: "github-token", type: "password", autoComplete: "off", spellCheck: false, required: true, disabled: this.state.busy, placeholder: "github_pat_…" }),
            this.state.error ? h("p", { className: "author-error", role: "alert" }, this.state.error) : null,
            h("button", { type: "submit", disabled: this.state.busy }, this.state.busy ? "확인 중…" : "편집기 열기"),
            h("small", null, "토큰은 현재 페이지 메모리에서만 사용합니다. 새로고침하거나 창을 닫으면 다시 입력해야 합니다.")
          ),
          h("details", null,
            h("summary", null, "처음 사용하는 경우: 토큰 만들기"),
            h("ol", null,
              h("li", null, h("a", { href: "https://github.com/settings/personal-access-tokens/new", target: "_blank", rel: "noopener noreferrer" }, "GitHub에서 Fine-grained token 만들기")),
              h("li", null, "Resource owner: SongYeChan1024. Repository access에서 Only select repositories를 선택합니다."),
              h("li", null, "Kasil-portfolio-pages 저장소만 선택합니다."),
              h("li", null, "Repository permissions → Contents를 Read and write로 설정합니다. Metadata는 기본 읽기 권한을 둡니다."),
              h("li", null, "유효기간을 정하고 Generate token을 누른 뒤 이 입력창에 붙여 넣습니다.")
            )
          ),
          h("a", { href: "../" }, "← 블로그로 돌아가기")
        )
      );
    }
  });

  const native = window.CMS.getBackend("github");
  if (!native || !native.BackendClass) {
    loading.textContent = "GitHub 편집 기능을 불러오지 못했습니다. 새로고침해 주세요.";
    return;
  }
  class TokenBackend extends native.BackendClass {
    authComponent() { return Login; }
    async authenticate(credentials) {
      this._currentUserPromise = undefined;
      this._userIsOriginMaintainerPromises = undefined;
      try {
        const user = await super.authenticate(credentials);
        // Keep credentials on the backend instance, never in Decap's persisted user.
        const { token, ...metadata } = user;
        return metadata;
      } catch (error) {
        await super.logout();
        throw error;
      }
    }
    restoreUser() { throw new Error("관리자 토큰을 다시 입력해 주세요."); }
  }
  window.CMS.registerBackend("github-token", TokenBackend);
  loading.remove();
  window.CMS.init();
})();
