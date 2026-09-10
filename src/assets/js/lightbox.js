(function () {
  document.querySelectorAll(".galfilter").forEach(function (bar) {
    bar.addEventListener("click", function (e) {
      var b = e.target.closest(".galbtn"); if (!b) return;
      bar.querySelectorAll(".galbtn").forEach(function (x) { x.classList.remove("is-active"); });
      b.classList.add("is-active");
      var f = b.getAttribute("data-filter");
      var grid = bar.parentElement.querySelector(".galpage");
      grid.querySelectorAll(".gcell").forEach(function (c) {
        c.style.display = (f === "all" || c.getAttribute("data-category") === f) ? "" : "none";
      });
    });
  });
  var ov = document.createElement("div");
  ov.className = "lightbox"; ov.setAttribute("hidden", "");
  ov.innerHTML = '<button class="lb-close" aria-label="Close">&times;</button><figure><img alt=""><figcaption></figcaption></figure>';
  document.body.appendChild(ov);
  var img = ov.querySelector("img"), cap = ov.querySelector("figcaption");
  function open(src, alt, c) { img.src = src; img.alt = alt || ""; cap.textContent = c || ""; cap.style.display = c ? "" : "none"; ov.removeAttribute("hidden"); document.body.style.overflow = "hidden"; }
  function close() { ov.setAttribute("hidden", ""); img.src = ""; document.body.style.overflow = ""; }
  document.querySelectorAll("[data-lightbox] img").forEach(function (i) {
    i.style.cursor = "zoom-in";
    i.addEventListener("click", function () { open(i.getAttribute("src"), i.getAttribute("alt"), i.getAttribute("data-caption")); });
  });
  ov.addEventListener("click", function (e) { if (e.target === ov || e.target.classList.contains("lb-close")) close(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
})();
