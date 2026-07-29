(() => {
  const dialog = document.querySelector("[data-project-code-dialog]");
  const data = window.PROJECT_CODE_DATA;
  if (!dialog || !data) return;

  const title = dialog.querySelector("[data-code-title]");
  const path = dialog.querySelector("[data-code-path]");
  const files = dialog.querySelector("[data-code-files]");
  const note = dialog.querySelector("[data-code-note]");
  const content = dialog.querySelector("[data-code-content]");

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

  function renderFile(group, file, button) {
    files.querySelectorAll(".project-code-file").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    title.textContent = file.title;
    path.textContent = file.path;
    const commitLink = file.commitUrl
      ? ` · <a href="${escapeHtml(file.commitUrl)}" target="_blank" rel="noreferrer">Git 커밋 근거 ↗</a>`
      : "";
    note.innerHTML = `<strong>${escapeHtml(file.ownership)}</strong> · ${escapeHtml(file.note)}${commitLink}`;
    content.textContent = file.code;
  }

  function openGroup(groupId) {
    const group = data.groups[groupId];
    if (!group) return;
    files.replaceChildren();
    group.files.forEach((file, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "project-code-file";
      button.innerHTML = `<strong>${escapeHtml(file.title)}</strong><small>${escapeHtml(file.role)}</small>`;
      button.addEventListener("click", () => renderFile(group, file, button));
      files.appendChild(button);
      if (index === 0) renderFile(group, file, button);
    });
    dialog.showModal();
  }

  document.querySelectorAll("[data-code-group]").forEach((button) => {
    button.addEventListener("click", () => openGroup(button.dataset.codeGroup));
  });
  dialog.querySelector("[data-code-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
})();
