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
