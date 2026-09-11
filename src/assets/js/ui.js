/* YCDI homepage interactions: animated stat counters.
   Numbers themselves are rendered by the build from the CMS data,
   so with JavaScript off (or reduced motion on) the correct figures
   are already on the page. This only animates them into view. */
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function format(n) {
    return Math.round(n).toLocaleString("en-GB");
  }

  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count-to"));
    if (isNaN(target)) return;
    var from = parseFloat(el.getAttribute("data-from")) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var prefix = el.getAttribute("data-prefix") || "";
    var dur = 1400;
    var start = null;

    function tick(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = prefix + format(from + (target - from) * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + format(target) + suffix;
    }
    requestAnimationFrame(tick);
  }

  function run(bar) {
    bar.classList.add("is-in");
    if (reduce) return; // leave the built-in final numbers as they are
    var nums = bar.querySelectorAll(".n[data-count-to]");
    for (var i = 0; i < nums.length; i++) {
      nums[i].textContent = "0";
      countUp(nums[i]);
    }
  }

  function init() {
    var bar = document.querySelector(".statbar");
    if (!bar) return;

    if (!("IntersectionObserver" in window)) {
      run(bar);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          run(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.35 });
    io.observe(bar);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();


/* Hero photo carousel. Progressive enhancement: the markup is a stack of <img>
   slides. With a single slide this does nothing and the still image shows as-is.
   With two or more, it wires up cross-fade autoplay, dots, arrows, swipe and
   keyboard, and it stops animating when the tab is hidden or reduced motion is on. */
(function () {
  "use strict";

  var root = document.querySelector("[data-hero-carousel]");
  if (!root) return;

  var slides = Array.prototype.slice.call(root.querySelectorAll(".hc-slide"));
  if (slides.length < 2) {
    if (slides[0]) slides[0].classList.add("is-active");
    return;
  }

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var INTERVAL = 5500;
  var index = 0;
  var timer = null;

  slides.forEach(function (s, i) {
    s.classList.toggle("is-active", i === 0);
    s.setAttribute("aria-hidden", i === 0 ? "false" : "true");
    s.setAttribute("role", "group");
    s.setAttribute("aria-roledescription", "slide");
    s.setAttribute("aria-label", (i + 1) + " of " + slides.length);
  });

  // Dots
  var dots = document.createElement("div");
  dots.className = "hc-dots";
  var dotEls = slides.map(function (_, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "hc-dot" + (i === 0 ? " is-active" : "");
    b.setAttribute("aria-label", "Show photograph " + (i + 1) + " of " + slides.length);
    if (i === 0) b.setAttribute("aria-current", "true");
    b.addEventListener("click", function () { go(i, true); });
    dots.appendChild(b);
    return b;
  });
  root.appendChild(dots);

  // Prev / next
  function navBtn(cls, label, path) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "hc-nav " + cls;
    b.setAttribute("aria-label", label);
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + path + '"/></svg>';
    return b;
  }
  var prev = navBtn("prev", "Previous photograph", "M15 18l-6-6 6-6");
  var next = navBtn("next", "Next photograph", "M9 6l6 6-6 6");
  prev.addEventListener("click", function () { go(index - 1, true); });
  next.addEventListener("click", function () { go(index + 1, true); });
  root.appendChild(prev);
  root.appendChild(next);

  function go(i, userInitiated) {
    i = (i + slides.length) % slides.length;
    if (i === index) return;
    slides[index].classList.remove("is-active");
    slides[index].setAttribute("aria-hidden", "true");
    dotEls[index].classList.remove("is-active");
    dotEls[index].removeAttribute("aria-current");
    index = i;
    slides[index].classList.add("is-active");
    slides[index].setAttribute("aria-hidden", "false");
    dotEls[index].classList.add("is-active");
    dotEls[index].setAttribute("aria-current", "true");
    if (userInitiated) restart();
  }

  function start() {
    if (reduce || timer) return;
    timer = setInterval(function () { go(index + 1); }, INTERVAL);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function restart() { stop(); start(); }

  // Pause when hovered, focused within, or tab hidden
  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", start);
  root.addEventListener("focusin", stop);
  root.addEventListener("focusout", start);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else start();
  });

  // Keyboard (arrow keys while a control inside the carousel has focus)
  root.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { go(index - 1, true); e.preventDefault(); }
    else if (e.key === "ArrowRight") { go(index + 1, true); e.preventDefault(); }
  });

  // Swipe / drag
  var startX = null;
  root.addEventListener("pointerdown", function (e) { startX = e.clientX; });
  root.addEventListener("pointerup", function (e) {
    if (startX === null) return;
    var dx = e.clientX - startX;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1), true);
    startX = null;
  });
  root.addEventListener("pointercancel", function () { startX = null; });

  start();
})();
