/* YCDI photo gallery: category filter and full-screen photo viewer.
   Works on any list marked data-lightbox whose photos are links marked data-lb.
   Without JavaScript each photo is simply a link to the full-size image. */
(function () {
  "use strict";

  /* ---------- Category filter (gallery page) ---------- */
  var bar = document.querySelector(".pg-filter");
  var countEl = document.querySelector("[data-pg-count]");
  if (bar) {
    var grid = document.querySelector(".pg[data-lightbox]");
    var chips = Array.prototype.slice.call(bar.querySelectorAll(".pg-chip"));
    bar.addEventListener("click", function (e) {
      var chip = e.target.closest(".pg-chip");
      if (!chip || !grid) return;
      var f = chip.getAttribute("data-filter");
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-pressed", on ? "true" : "false");
      });
      var shown = 0;
      Array.prototype.forEach.call(grid.querySelectorAll(".pg-item"), function (li) {
        var show = f === "all" || li.getAttribute("data-category") === f;
        li.hidden = !show;
        if (show) shown++;
      });
      if (countEl) countEl.textContent = shown + (shown === 1 ? " photo" : " photos");
    });
  }

  /* ---------- Photo viewer ---------- */
  var containers = document.querySelectorAll("[data-lightbox]");
  if (!containers.length) return;

  var ICON = {
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>'
  };

  var pv = document.createElement("div");
  pv.className = "pv";
  pv.setAttribute("role", "dialog");
  pv.setAttribute("aria-modal", "true");
  pv.setAttribute("aria-label", "Photo viewer");
  pv.hidden = true;
  pv.innerHTML =
    '<p class="pv-count" aria-live="polite"></p>' +
    '<button type="button" class="pv-btn pv-close" aria-label="Close photo viewer">' + ICON.close + "</button>" +
    '<button type="button" class="pv-btn pv-prev" aria-label="Previous photo">' + ICON.prev + "</button>" +
    '<figure class="pv-fig"><img class="pv-img" alt=""><figcaption class="pv-cap"><span class="pv-text"></span> <a class="pv-story" hidden></a></figcaption></figure>' +
    '<button type="button" class="pv-btn pv-next" aria-label="Next photo">' + ICON.next + "</button>";
  document.body.appendChild(pv);

  var img = pv.querySelector(".pv-img");
  var text = pv.querySelector(".pv-text");
  var story = pv.querySelector(".pv-story");
  var count = pv.querySelector(".pv-count");
  var btnClose = pv.querySelector(".pv-close");
  var btnPrev = pv.querySelector(".pv-prev");
  var btnNext = pv.querySelector(".pv-next");

  var list = [];      // the photos currently on show in this gallery (respects the filter)
  var index = 0;
  var opener = null;  // the thumbnail to return focus to

  function visibleLinks(container) {
    return Array.prototype.filter.call(container.querySelectorAll("a[data-lb]"), function (a) {
      var li = a.closest(".pg-item");
      return !(li && li.hidden);
    });
  }

  function preload(i) {
    if (list.length < 2) return;
    var a = list[(i + list.length) % list.length];
    if (a) { var p = new Image(); p.src = a.getAttribute("href"); }
  }

  function render() {
    var a = list[index];
    var thumb = a.querySelector("img");
    pv.classList.add("is-loading");
    img.onload = img.onerror = function () { pv.classList.remove("is-loading"); };
    img.src = a.getAttribute("href");
    img.alt = thumb ? thumb.getAttribute("alt") || "" : "";
    text.textContent = a.getAttribute("data-caption") || "";
    var url = a.getAttribute("data-story");
    if (url) {
      story.href = url;
      story.textContent = a.getAttribute("data-story-title") || "Read the story";
      story.hidden = false;
    } else {
      story.hidden = true;
    }
    count.textContent = (index + 1) + " of " + list.length;
    var many = list.length > 1;
    btnPrev.hidden = !many;
    btnNext.hidden = !many;
    preload(index + 1);
    preload(index - 1);
  }

  function open(container, a) {
    list = visibleLinks(container);
    index = Math.max(0, list.indexOf(a));
    opener = a;
    pv.hidden = false;
    document.documentElement.classList.add("pv-open");
    render();
    btnClose.focus();
  }

  function close() {
    pv.hidden = true;
    img.removeAttribute("src");
    document.documentElement.classList.remove("pv-open");
    if (opener) opener.focus();
  }

  function step(d) {
    if (list.length < 2) return;
    index = (index + d + list.length) % list.length;
    render();
  }

  Array.prototype.forEach.call(containers, function (container) {
    container.addEventListener("click", function (e) {
      var a = e.target.closest("a[data-lb]");
      if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return; // let "open in new tab" work
      e.preventDefault();
      open(container, a);
    });
  });

  btnClose.addEventListener("click", close);
  btnPrev.addEventListener("click", function () { step(-1); });
  btnNext.addEventListener("click", function () { step(1); });
  pv.addEventListener("click", function (e) {
    if (e.target === pv || e.target.classList.contains("pv-fig")) close(); // click on the dark backdrop
  });

  document.addEventListener("keydown", function (e) {
    if (pv.hidden) return;
    if (e.key === "Escape") { close(); return; }
    if (e.key === "ArrowLeft") { step(-1); e.preventDefault(); return; }
    if (e.key === "ArrowRight") { step(1); e.preventDefault(); return; }
    if (e.key === "Tab") { // keep keyboard focus inside the viewer
      var f = Array.prototype.filter.call(pv.querySelectorAll("button, a[href]"), function (el) { return !el.hidden; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    }
  });

  // Swipe left or right on touch screens
  var startX = null, startY = null;
  pv.addEventListener("touchstart", function (e) {
    if (e.touches.length !== 1) { startX = null; return; }
    startX = e.touches[0].clientX; startY = e.touches[0].clientY;
  }, { passive: true });
  pv.addEventListener("touchend", function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    var dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
    startX = null;
  }, { passive: true });
})();
