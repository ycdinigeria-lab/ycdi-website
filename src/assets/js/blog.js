/* Blog post: "Copy link" button. Everything else on the page works without JavaScript. */
(function () {
  "use strict";
  var box = document.querySelector("[data-share]");
  if (!box) return;
  var btn = box.querySelector("[data-copy]");
  var label = box.querySelector("[data-copy-label]");
  var status = box.querySelector("[data-copy-status]");
  var url = box.getAttribute("data-url") || window.location.href;
  if (!btn) return;

  function done(ok) {
    var text = ok ? "Link copied" : "Copy failed";
    if (label) label.textContent = text;
    if (status) status.textContent = text;
    setTimeout(function () { if (label) label.textContent = "Copy link"; }, 2400);
  }

  function fallback() {
    var t = document.createElement("textarea");
    t.value = url; t.setAttribute("readonly", "");
    t.style.position = "absolute"; t.style.left = "-9999px";
    document.body.appendChild(t); t.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(t);
    done(ok);
  }

  btn.addEventListener("click", function () {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { done(true); }, fallback);
    } else {
      fallback();
    }
  });
})();
