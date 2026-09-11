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

/* Hero background slideshow: cross-fade + gentle Ken Burns, autoplay,
   minimal indicators, swipe and keyboard. No libraries.
   One photo -> stays a clean full-bleed hero, nothing runs.
   Reduced motion -> no autoplay and (via CSS) no fade or zoom. */
(function () {
  "use strict";

  var hero = document.querySelector(".hero");
  if (!hero) return;
  var slides = [].slice.call(hero.querySelectorAll(".hero-slide"));
  if (slides.length === 0) return;

  var index = 0;
  for (var k = 0; k < slides.length; k++) {
    if (slides[k].classList.contains("is-active")) { index = k; break; }
  }
  if (!slides[index].classList.contains("is-active")) slides[index].classList.add("is-active");

  // A single photo has nothing to rotate.
  if (slides.length < 2) return;

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var INTERVAL = 5500;
  var dotsWrap = hero.querySelector(".hero-dots");
  var dots = [];

  function go(i) {
    if (i === index) return;
    slides[index].classList.remove("is-active");
    if (dots[index]) dots[index].classList.remove("is-active");
    index = i;
    slides[index].classList.add("is-active");
    if (dots[index]) dots[index].classList.add("is-active");
  }
  function nextSlide() { go((index + 1) % slides.length); }
  function prevSlide() { go((index - 1 + slides.length) % slides.length); }

  var timer = null;
  function play() { if (!reduce && timer === null) timer = setInterval(nextSlide, INTERVAL); }
  function stop() { if (timer !== null) { clearInterval(timer); timer = null; } }
  function restart() { stop(); play(); }

  if (dotsWrap) {
    slides.forEach(function (_, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "hero-dot" + (i === index ? " is-active" : "");
      b.setAttribute("aria-label", "Show slide " + (i + 1) + " of " + slides.length);
      b.addEventListener("click", function () { go(i); restart(); });
      dotsWrap.appendChild(b);
      dots.push(b);
    });
    dotsWrap.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { nextSlide(); restart(); dots[index].focus(); }
      else if (e.key === "ArrowLeft") { prevSlide(); restart(); dots[index].focus(); }
    });
  }

  hero.addEventListener("mouseenter", stop);
  hero.addEventListener("mouseleave", play);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else play();
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) play(); else stop(); });
    }, { threshold: 0.25 }).observe(hero);
  }

  // Swipe on touch devices.
  var x0 = null;
  var surface = hero.querySelector(".hero-bg") || hero;
  surface.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  surface.addEventListener("touchend", function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) { if (dx < 0) nextSlide(); else prevSlide(); restart(); }
    x0 = null;
  }, { passive: true });

  play();
})();
