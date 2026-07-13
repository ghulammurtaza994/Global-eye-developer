/**
 * Global Eye Developer — Starlight click trigger
 * Any element marked [data-burst] fires a shooting-star particle
 * explosion at the click point via the shared canvas engine in
 * particles-bg.js (window.GED_FX).
 */
(function () {
  "use strict";

  function fire(x, y) {
    if (window.GED_FX && typeof window.GED_FX.addBurst === "function") {
      window.GED_FX.addBurst(x, y);
    }
  }

  document.addEventListener("click", (e) => {
    const target = e.target.closest("[data-burst]");
    if (!target) return;
    fire(e.clientX, e.clientY);
  });

  // Keyboard activation (Enter/Space) on focusable cards should also spark,
  // centered on the element, so the effect isn't mouse-only.
  document.addEventListener("keyup", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const target = e.target.closest("[data-burst]");
    if (!target) return;
    const rect = target.getBoundingClientRect();
    fire(rect.left + rect.width / 2, rect.top + rect.height / 2);
  });
})();
