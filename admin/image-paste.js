(function (root) {
  "use strict";

  const extensions = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };
  const maxBytes = 10 * 1024 * 1024;

  function clipboardImages(data) {
    const items = Array.from(data?.items || []);
    const files = items.length
      ? items.filter(item => item.kind === "file").map(item => item.getAsFile()).filter(Boolean)
      : Array.from(data?.files || []);
    return files.filter(file => file.type.startsWith("image/"));
  }

  function prepareFiles(files) {
    for (const file of files) {
      if (!extensions[file.type]) throw new Error("PNG, JPEG, WebP, GIF 이미지를 붙여 넣어 주세요.");
      if (!file.size) throw new Error("이미지 내용이 비어 있습니다. 다시 캡처해 주세요.");
      if (file.size > maxBytes) throw new Error("이미지는 한 장당 10MB까지 붙여 넣을 수 있습니다.");
    }
    return files.map(file => new File([file],
      `capture-${new Date().toISOString().replace(/[:.]/g, "-")}-${root.crypto.randomUUID()}.${extensions[file.type]}`,
      { type: file.type }));
  }

  function publicUrl(folder, path) {
    const name = path.split("/").pop();
    return `${folder.replace(/\/$/, "")}/${encodeURIComponent(name)}`;
  }

  function assetPath(folder, path) {
    const prefix = `${folder.replace(/\/$/, "")}/`;
    return typeof path === "string" && path.startsWith(prefix) ? decodeURIComponent(path.slice(prefix.length)) : path;
  }

  function transferForImages(urls, raw) {
    const transfer = new DataTransfer();
    transfer.setData("text/plain", urls.map(url => `![캡처 이미지](${url})`).join("\n\n") + "\n");
    if (!raw) {
      // Decap's image toolbar uses these Slate shortcode blocks. The native HTML
      // paste parser in the pinned bundle can discard image-only HTML fragments.
      const fragment = urls.map(url => ({
        type: "shortcode", id: "image",
        data: { shortcode: "image", shortcodeData: { image: url, alt: "캡처 이미지", title: "" } },
        children: [{ text: "" }]
      }));
      fragment.push({ type: "paragraph", children: [{ text: "" }] });
      transfer.setData("application/x-slate-fragment", root.btoa(encodeURIComponent(JSON.stringify(fragment))));
    }
    return transfer;
  }

  function register(CMS, createClass, h) {
    const native = CMS.getWidget("markdown");
    const Control = createClass({
      getInitialState() { return { busy: false, message: "", error: false }; },
      componentWillUnmount() { this.unmounted = true; },
      isValid() { return !this.pending; },
      getFolder() { return this.props.field.get("paste_public_folder"); },
      getAsset(path, field) { return this.props.getAsset(assetPath(this.getFolder(), path), field); },
      blockWhileBusy(event) {
        if (this.pending && !this.forwarding) { event.preventDefault(); event.stopPropagation(); }
      },
      async paste(event) {
        if (this.forwarding) return;
        if (this.pending) { this.blockWhileBusy(event); return; }
        const editor = event.target.closest('[data-slate-editor="true"]');
        if (!editor || !this.container.contains(editor) || this.props.isDisabled) return;
        const images = clipboardImages(event.clipboardData);
        if (!images.length) return;
        event.preventDefault();
        event.stopPropagation();
        const selection = root.getSelection();
        if (!selection?.rangeCount || !editor.contains(selection.anchorNode) || !editor.contains(selection.focusNode)) return;
        const range = selection.getRangeAt(0).cloneRange();
        const raw = !!editor.closest(".cms-editor-raw");
        const urls = [];
        let failure = "";
        this.pending = true;
        this.setState({ busy: true, message: "캡처 이미지를 글에 추가하는 중…", error: false });
        try {
          const files = prepareFiles(images);
          for (const file of files) {
            // Decap stages these files in the open draft; its normal Save uploads them with the post.
            const result = await this.props.onPersistMedia(file, { field: this.props.field });
            if (this.unmounted) return;
            if (result?.type !== "ADD_DRAFT_ENTRY_MEDIA_FILE" || !result.payload?.path) {
              throw new Error("이미지를 추가하지 못했습니다. 다시 붙여 넣거나 이미지 업로드 메뉴를 사용해 주세요.");
            }
            const url = publicUrl(this.getFolder(), result.payload.path);
            const displayURL = result.payload.url || result.payload.displayURL;
            if (displayURL) this.props.onAddAsset({ path: url, url: displayURL, toString() { return this.url; } });
            urls.push(url);
          }
        } catch (error) {
          failure = error.message || "이미지를 추가하지 못했습니다. 다시 시도해 주세요.";
        }
        if (this.unmounted) return;
        try {
          if (urls.length) {
            editor.focus();
            selection.removeAllRanges();
            selection.addRange(range);
            this.forwarding = true;
            // Use Slate's existing paste pipeline, preserving cursor position, Markdown and undo history.
            const transfer = transferForImages(urls, raw);
            const pasteEvent = new ClipboardEvent("paste", {
              bubbles: true, cancelable: true, clipboardData: transfer
            });
            // Slate checks that the event comes from an editable leaf, not the
            // editor root. Dispatch at the restored caret's actual DOM target.
            const target = range.startContainer.nodeType === 3 ? range.startContainer.parentElement : range.startContainer;
            target.dispatchEvent(pasteEvent);
            // Chromium's rich editor consumes beforeinput; synthetic paste does
            // not generate that browser default action automatically.
            if (!pasteEvent.defaultPrevented) {
              const inputEvent = new InputEvent("beforeinput", {
                bubbles: true, cancelable: true, inputType: "insertFromPaste", dataTransfer: transfer
              });
              target.dispatchEvent(inputEvent);
              if (!inputEvent.defaultPrevented) throw new Error("Editor did not handle paste");
            }
          }
          this.setState({ message: [urls.length ? `이미지 ${urls.length}장을 추가했습니다. 글을 저장하면 함께 업로드됩니다.` : "", failure].filter(Boolean).join(" "), error: !!failure });
        } catch (_) {
          this.setState({ message: "본문에 이미지를 넣지 못했습니다. 이미지 업로드 메뉴에서 다시 추가해 주세요.", error: true });
        } finally {
          this.forwarding = false;
          this.pending = false;
          this.setState({ busy: false });
        }
      },
      render() {
        return h("div", {
          className: "image-paste-widget", ref: node => { this.container = node; },
          "aria-busy": this.state.busy,
          onPasteCapture: this.paste, onKeyDownCapture: this.blockWhileBusy,
          onBeforeInputCapture: this.blockWhileBusy, onPointerDownCapture: this.blockWhileBusy
        },
        h("p", { className: "image-paste-help" }, "캡처 후 본문에서 Ctrl+V · 이미지는 글을 저장할 때 함께 업로드됩니다."),
        h(native.control, { ...this.props, getAsset: this.getAsset }),
        h("p", { className: this.state.error ? "image-paste-status image-paste-error" : "image-paste-status", role: "status", "aria-live": "polite" }, this.state.message));
      }
    });
    const Preview = createClass({
      render() {
        const folder = this.props.field.get("paste_public_folder");
        return h(native.preview, { ...this.props, getAsset: (path, field) => this.props.getAsset(assetPath(folder, path), field) });
      }
    });
    CMS.registerWidget("clipboard-markdown", Control, Preview, native.schema);
  }

  root.KasilImagePaste = { register, clipboardImages, prepareFiles, publicUrl, assetPath, transferForImages };
})(typeof window === "undefined" ? globalThis : window);
