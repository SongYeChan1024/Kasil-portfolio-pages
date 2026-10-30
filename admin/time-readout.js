(function (root) {
  "use strict";

  // 브라우저의 날짜·시간 칸은 언어 설정에 따라 오전/오후 12시간제로 보인다.
  // 오후 3시에 「현재시각」을 누른 뒤 시만 11로 바꾸면 23:30으로 저장되므로,
  // 실제로 저장될 시각을 24시간제로 바로 아래에 보여 준다.
  function describe(value, now) {
    const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/.exec(value || "");
    if (!match) return null;
    const hour = Number(match[2]);
    const minute = match[3];
    const half = hour < 12 ? "오전" : "오후";
    const hour12 = hour % 12 || 12;
    const spoken = half + " " + hour12 + "시" + (minute === "00" ? "" : " " + Number(minute) + "분");
    const future = new Date(match[1] + "T" + match[2] + ":" + minute) > now;
    let text = "저장 시각: " + match[1] + " " + match[2] + ":" + minute + " (" + spoken + ")";
    if (future) text += " — 지금보다 미래라서 이 시각이 지나고 다시 빌드될 때까지 사이트에 보이지 않습니다.";
    return { text, future };
  }

  function attach(input) {
    const readout = root.document.createElement("p");
    readout.className = "kasil-time-readout";
    readout.setAttribute("aria-live", "polite");
    (input.parentElement || input).insertAdjacentElement("afterend", readout);
    let last;
    const update = () => {
      if (input.value === last) return;
      last = input.value;
      const info = describe(input.value, new Date());
      readout.hidden = !info;
      readout.textContent = info ? info.text : "";
      readout.classList.toggle("is-future", !!(info && info.future));
    };
    input.addEventListener("input", update);
    input.addEventListener("change", update);
    // 「현재시각」 버튼처럼 스크립트가 값을 넣으면 input 이벤트가 오지 않아 주기적으로도 확인한다.
    const timer = root.setInterval(() => {
      if (!input.isConnected) { root.clearInterval(timer); readout.remove(); return; }
      update();
    }, 400);
    update();
  }

  function watch(doc) {
    const seen = new WeakSet();
    const scan = () => doc.querySelectorAll('input[type="datetime-local"]').forEach((input) => {
      if (seen.has(input)) return;
      seen.add(input);
      attach(input);
    });
    new root.MutationObserver(scan).observe(doc.body, { childList: true, subtree: true });
    scan();
  }

  root.KasilTimeReadout = { describe, watch };
})(typeof window !== "undefined" ? window : globalThis);
