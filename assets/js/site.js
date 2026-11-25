(function () {
  // ── Theme toggle ───────────────────────────────────────────────
  var root = document.documentElement;
  var toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var current = root.dataset.theme ||
        (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      var next = current === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  // ── Email: kept out of the HTML ────────────────────────────────
  // Elements carry the address reversed in data-eu/data-ed (see
  // _includes/email-data.html); it is only put together here.
  function rev(t) { return (t || "").split("").reverse().join(""); }
  window.siteEmail = function (el) { return rev(el.dataset.eu) + "@" + rev(el.dataset.ed); };
  document.querySelectorAll("a[data-eu]").forEach(function (a) {
    a.href = "mailto:" + window.siteEmail(a) + "?subject=" + encodeURIComponent(a.dataset.prefix || "");
  });

  // ── Album page: reveal photos in batches ───────────────────────
  // Only the first batch has real <img src>; later ones carry data-src and
  // are revealed by the "Show more" button or by scrolling near the end.
  var gallery = document.querySelector(".gallery");
  if (!gallery) return;
  var items = Array.prototype.slice.call(gallery.querySelectorAll(".gallery__item"));
  var batch = parseInt(gallery.dataset.batch, 10) || 24;
  var more = document.querySelector(".gallery-more");

  function revealNext() {
    var pending = items.filter(function (el) { return el.hidden; }).slice(0, batch);
    pending.forEach(function (el) {
      var im = el.querySelector("img[data-src]");
      if (im) { im.src = im.dataset.src; im.removeAttribute("data-src"); }
      el.hidden = false;
    });
    if (!items.some(function (el) { return el.hidden; }) && more) {
      more.remove();
      more = null;
    }
  }
  if (more) {
    more.querySelector("button").addEventListener("click", revealNext);
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting || !more) return;
        revealNext();
        // Re-observe so it fires again if the button is still in view.
        if (more) { io.unobserve(more); io.observe(more); }
      }, { rootMargin: "600px 0px" });
      io.observe(more);
    }
  }

  // ── Lightbox ───────────────────────────────────────────────────
  var box = document.querySelector(".lightbox");
  var img = box.querySelector(".lightbox__img");
  var cap = box.querySelector(".lightbox__caption");
  var index = -1, lastFocus = null;

  function visible() { return items; }

  function show(i) {
    var list = visible();
    if (!list.length) return;
    index = (i + list.length) % list.length;
    var el = list[index];
    img.src = el.dataset.full;
    img.alt = el.dataset.caption || "";
    cap.textContent = el.dataset.caption || "";
    // Preload neighbours for snappy navigation.
    [index + 1, index - 1].forEach(function (j) {
      var n = list[(j + list.length) % list.length];
      if (n) new Image().src = n.dataset.full;
    });
  }
  function open(el) {
    lastFocus = el;
    box.hidden = false;
    document.body.style.overflow = "hidden";
    show(visible().indexOf(el));
    void box.offsetWidth; // flush styles so the fade-in transition runs
    box.classList.add("is-open");
    box.querySelector(".lightbox__close").focus();
  }
  function close() {
    box.classList.remove("is-open");
    box.hidden = true;
    img.removeAttribute("src");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  items.forEach(function (el) {
    el.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return; // let cmd-click open the file
      e.preventDefault();
      open(el);
    });
  });
  box.querySelector(".lightbox__close").addEventListener("click", close);
  box.querySelector(".lightbox__prev").addEventListener("click", function () { show(index - 1); });
  box.querySelector(".lightbox__next").addEventListener("click", function () { show(index + 1); });
  box.addEventListener("click", function (e) { if (e.target === box) close(); });
  document.addEventListener("keydown", function (e) {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(index - 1);
    else if (e.key === "ArrowRight") show(index + 1);
  });

  // Swipe on touch screens.
  var x0 = null;
  box.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    x0 = null;
  });
})();
