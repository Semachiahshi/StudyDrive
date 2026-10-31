/*
 * Polyfills for old Safari (iOS 12–15.3, e.g. iPad Air 2). Loaded only in
 * browsers without CSS cascade layers, before the app's scripts; see the
 * root layout. Next.js already covers Array#at, Object.hasOwn,
 * Object.fromEntries and Array#flat. Plain ES5 on purpose.
 */
(function () {
  if (!Promise.allSettled) {
    Promise.allSettled = function (items) {
      return Promise.all(
        Array.prototype.map.call(Array.from(items), function (p) {
          return Promise.resolve(p).then(
            function (value) { return { status: "fulfilled", value: value }; },
            function (reason) { return { status: "rejected", reason: reason }; }
          );
        })
      );
    };
  }

  if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function (search, replacement) {
      if (search instanceof RegExp) return this.replace(search, replacement);
      return this.split(String(search)).join(String(replacement));
    };
  }

  if (window.crypto && !window.crypto.randomUUID) {
    window.crypto.randomUUID = function () {
      var b = window.crypto.getRandomValues(new Uint8Array(16));
      b[6] = (b[6] & 0x0f) | 0x40;
      b[8] = (b[8] & 0x3f) | 0x80;
      var h = [];
      for (var i = 0; i < 16; i++) h.push((b[i] + 0x100).toString(16).slice(1));
      return h.slice(0, 4).join("") + "-" + h.slice(4, 6).join("") + "-" + h.slice(6, 8).join("") + "-" +
        h.slice(8, 10).join("") + "-" + h.slice(10).join("");
    };
  }

  // <dialog> arrived in Safari 15.4. Before that it is an unknown element:
  // give it show/showModal/close, a backdrop, Escape and the close event.
  if (typeof window.HTMLDialogElement !== "function") {
    var proto = window.HTMLUnknownElement.prototype;
    var backdrop = null;
    var isDialog = function (el) { return el.tagName === "DIALOG"; };
    var fire = function (el, type) {
      var e = document.createEvent("Event");
      e.initEvent(type, false, true);
      return el.dispatchEvent(e);
    };
    Object.defineProperty(proto, "open", {
      configurable: true,
      get: function () { return isDialog(this) && this.hasAttribute("open"); },
      set: function (v) { if (isDialog(this)) { if (v) this.setAttribute("open", ""); else this.removeAttribute("open"); } },
    });
    proto.show = function () { if (isDialog(this)) this.setAttribute("open", ""); };
    proto.showModal = function () {
      if (!isDialog(this)) return;
      var dialog = this;
      if (!backdrop) {
        backdrop = document.createElement("div");
        backdrop.className = "legacy-dialog-backdrop";
      }
      // Clicks on the backdrop count as clicks on the dialog, like the native one.
      backdrop.onclick = function () { dialog.click(); };
      document.body.appendChild(backdrop);
      dialog.setAttribute("open", "");
      dialog.setAttribute("data-modal", "");
      var focusable = dialog.querySelector("input, select, textarea, button");
      if (focusable) focusable.focus();
    };
    proto.close = function (value) {
      if (!isDialog(this) || !this.hasAttribute("open")) return;
      if (value !== undefined) this.returnValue = value;
      this.removeAttribute("open");
      this.removeAttribute("data-modal");
      if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      fire(this, "close");
    };
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" && e.key !== "Esc") return;
      var open = document.querySelectorAll("dialog[data-modal]");
      var top = open[open.length - 1];
      if (top && fire(top, "cancel")) top.close();
    });
  }
})();
