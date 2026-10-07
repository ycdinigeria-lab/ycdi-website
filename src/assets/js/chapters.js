/* Chapters page: choose a state (from the buttons or the map) to see its chapters.
   Without JavaScript every chapter is simply listed. */
(function () {
  "use strict";
  var root = document.querySelector("[data-chapter-explorer]");
  if (!root) return;
  var chips = Array.prototype.slice.call(root.querySelectorAll(".statechip"));
  var rows = Array.prototype.slice.call(root.querySelectorAll(".chrow"));
  var shapes = Array.prototype.slice.call(root.querySelectorAll(".ngmap path.has"));

  function select(state) {
    chips.forEach(function (c) {
      var on = c.getAttribute("data-state") === state;
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-pressed", on ? "true" : "false");
    });
    rows.forEach(function (r) {
      r.hidden = !(state === "all" || r.getAttribute("data-state") === state);
    });
    shapes.forEach(function (s) {
      s.classList.toggle("is-active", s.getAttribute("data-state") === state);
    });
  }

  chips.forEach(function (c) {
    c.addEventListener("click", function () { select(c.getAttribute("data-state")); });
  });
  shapes.forEach(function (s) {
    s.addEventListener("click", function () {
      var st = s.getAttribute("data-state");
      select(s.classList.contains("is-active") ? "all" : st);
    });
  });
})();
