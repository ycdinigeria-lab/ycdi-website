/* Events page: keep "Upcoming" honest between site rebuilds.
   The build already sorts events by date. This checks again against today's date in the
   visitor's browser and moves anything that has passed into "Where we have been". */
(function () {
  "use strict";
  var upList = document.querySelector("[data-events-upcoming]");
  var pastList = document.querySelector("[data-events-past]");
  var pastSection = document.querySelector("[data-events-past-section]");
  var empty = document.querySelector("[data-events-empty]");
  if (!upList || !pastList) return;

  var now = new Date();
  var today = now.getFullYear() + "-" + ("0" + (now.getMonth() + 1)).slice(-2) + "-" + ("0" + now.getDate()).slice(-2);

  var cards = Array.prototype.slice.call(upList.querySelectorAll("[data-event-date]"));
  cards.forEach(function (card) {
    var d = card.getAttribute("data-event-date");
    if (!d || d >= today) return; // still to come (or happening today)

    // Past cards are plain: no photo, note or sign-up link
    var extras = card.querySelectorAll(".event-img, .event-note, .event-cta");
    for (var i = 0; i < extras.length; i++) extras[i].parentNode.removeChild(extras[i]);

    // Insert so the past list stays newest first
    var placed = false;
    var existing = pastList.querySelectorAll("[data-event-date]");
    for (var j = 0; j < existing.length; j++) {
      if (existing[j].getAttribute("data-event-date") < d) {
        pastList.insertBefore(card, existing[j]);
        placed = true;
        break;
      }
    }
    if (!placed) pastList.appendChild(card);
  });

  if (pastSection && pastList.querySelector("[data-event-date]")) pastSection.removeAttribute("hidden");
  if (empty && !upList.querySelector("[data-event-date]")) empty.removeAttribute("hidden");
})();
