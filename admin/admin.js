(function () {
  "use strict";

  const loading = document.getElementById("cms-loading");
  if (!window.CMS || !window.createClass || !window.h) {
    loading.textContent = "편집기를 불러오지 못했습니다. 인터넷 연결을 확인하고 새로고침해 주세요.";
    return;
  }

  const session = window.KasilLoginSession.createSession(() => window.localStorage);
  // Decap's default user record remains token-free. Remembering is an explicit opt-in.
  if (!session.read()) {
    try { window.localStorage.removeItem("decap-cms-user"); } catch (_) { /* Storage may be disabled. */ }
  }
  let autoAttempted = false;
  let loginView;
  let loginMessage = "";
  function notifyLogin(message) {
    loginMessage = message;
    if (loginView) loginView.setState({ busy: false, error: message });
  }

  const h = window.h;
  const Login = window.createClass({
    getInitialState: function () { return { busy: false, restoring: !!session.read() && !autoAttempted, error: loginMessage }; },
    componentDidMount: function () {
      loginView = this;
      const token = session.read();
      if (token && !autoAttempted) {
        autoAttempted = true;
        this.setState({ busy: true, restoring: true });
        this.props.onLogin({ token, remember: true });
      }
    },
    componentWillUnmount: function () { if (loginView === this) loginView = null; },
    submit: async function (event) {
      event.preventDefault();
      const input = event.currentTarget.elements.namedItem("github-token");
      let token = input.value.trim();
      if (!token) return;
      const remember = event.currentTarget.elements.namedItem("remember-login").checked;
      input.value = "";
      this.setState({ busy: true, error: "" });
      try {
        const response = await fetch("https://api.github.com/user", {
          headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json" },
          cache: "no-store"
        });
        if (!response.ok) throw new Error("토큰을 확인해 주세요.");
        this.props.onLogin({ token, remember });
      } catch (_) {
        this.setState({ error: "로그인하지 못했습니다. 토큰 유효기간과 저장소 Contents 쓰기 권한을 확인해 주세요." });
      } finally {
        token = "";
        this.setState({ busy: false });
      }
    },
    render: function () {
      if(this.state.restoring && !this.state.error) return h('main',{className:'author-login'},h('p',{role:'status'},'저장된 로그인 정보를 확인하고 편집기를 여는 중입니다…'));
      return h("main", { className: "author-login" },
        h("section", { className: "author-card" },
          h("h1", null, "Kasil Devlog 글쓰기"),
          h("p", null, "글 작성, 기존 글 수정, 이미지 업로드를 할 수 있습니다."),
          h("form", { onSubmit: this.submit },
            h("label", { htmlFor: "github-token" }, "GitHub 전용 토큰"),
            h("input", { id: "github-token", name: "github-token", type: "password", autoComplete: "off", spellCheck: false, required: true, disabled: this.state.busy, placeholder: "github_pat_…" }),
            h("label", { className: "remember-login", htmlFor: "remember-login" },
              h("input", { id: "remember-login", name: "remember-login", type: "checkbox", disabled: this.state.busy }),
              "이 브라우저에 로그인 유지"
            ),
            this.state.error ? h("p", { className: "author-error", role: "alert" }, this.state.error) : null,
            h("button", { type: "submit", disabled: this.state.busy }, this.state.busy ? "확인 중…" : "편집기 열기"),
            h("small", null, "로그인 유지를 선택하면 토큰을 이 브라우저에 보관합니다. 개인 PC에서만 사용해 주세요. 로그아웃하면 지워지며, 만료·폐기되면 새 토큰이 필요합니다.")
          ),
          h("details", null,
            h("summary", null, "처음 사용하는 경우: 토큰 만들기"),
            h("ol", null,
              h("li", null, h("a", { href: "https://github.com/settings/personal-access-tokens/new", target: "_blank", rel: "noopener noreferrer" }, "GitHub에서 Fine-grained token 만들기")),
              h("li", null, "Resource owner: SongYeChan1024. Repository access에서 Only select repositories를 선택합니다."),
              h("li", null, "Kasil_DevLog 저장소만 선택합니다."),
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
  const TokenBackend = window.KasilLoginSession.createBackend(native.BackendClass, session, Login, notifyLogin);
  window.CMS.registerBackend("github-token", TokenBackend);
  window.KasilImagePaste.register(window.CMS, window.createClass, h);
  window.KasilBlogManager.register(window.CMS, window.createClass, h);
  if (window.KasilTimeReadout) window.KasilTimeReadout.watch(document);
  loading.remove();
  window.CMS.init();
})();
