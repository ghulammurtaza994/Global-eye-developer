/**
 * Global Eye Developer — main.js
 * Nav toggle, magnetic hover, card glow tracking, review slider dots,
 * and the contact form -> WhatsApp handoff.
 */
(function () {
  "use strict";

  document.getElementById("year") &&
    (document.getElementById("year").textContent = new Date().getFullYear());

  /* ---------- Mobile Navigation ---------- */
  const toggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");

  if (toggle && navLinks) {
    const openMenu = () => {
      navLinks.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
    };

    const closeMenu = () => {
      navLinks.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.contains("open");
      isOpen ? closeMenu() : openMenu();
    });

    // Close menu when clicking nav links
    navLinks.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navLinks.classList.contains("open")) {
        closeMenu();
        toggle.focus();
      }
    });
  }

  /* ---------- Card cursor-glow tracking ---------- */
  document.querySelectorAll(".service-card, .project-card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--my", `${e.clientY - rect.top}px`);
    });
  });

  /* ---------- Magnetic hover for buttons ---------- */
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduceMotion) {
    document.querySelectorAll(".magnetic").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const relX = e.clientX - rect.left - rect.width / 2;
        const relY = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${relX * 0.12}px, ${relY * 0.28}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
      });
    });
  }

  /* ---------- Reviews slider dots (mobile) ---------- */
  const track = document.getElementById("reviews-track");
  const dotsWrap = document.getElementById("reviews-dots");
  if (track && dotsWrap) {
    const cards = Array.from(track.children);
    cards.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.className = "dot" + (i === 0 ? " active" : "");
      dot.addEventListener("click", () => {
        cards[i].scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
      });
      dotsWrap.appendChild(dot);
    });

    const dots = Array.from(dotsWrap.children);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = cards.indexOf(entry.target);
          if (entry.isIntersecting && idx > -1) {
            dots.forEach((d) => d.classList.remove("active"));
            dots[idx].classList.add("active");
          }
        });
      },
      { root: track, threshold: 0.6 }
    );
    cards.forEach((c) => observer.observe(c));
  }

  /* ---------- Contact form -> WhatsApp handoff ---------- */
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  const WHATSAPP_NUMBER = "923376184616";

  function buildWhatsAppLink({ name, contact, service, message }) {
    const text =
      `Hi Global Eye Developer, I want to hire your services.\n` +
      `Name: ${name}\n` +
      `Contact: ${contact}\n` +
      `Service: ${service}\n` +
      `Details: ${message}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.className = "form-status";

      const data = {
        name: form.name.value.trim(),
        contact: form.contact.value.trim(),
        service: form.service.value,
        message: form.message.value.trim(),
      };

      if (!data.name || !data.contact || !data.message) {
        status.textContent = "Please fill in your name, contact and a short message.";
        status.className = "form-status error";
        return;
      }

      status.textContent = "Opening WhatsApp...";
      status.className = "form-status success";

      // Best-effort: log the lead server-side too, so nothing is lost if
      // the visitor's device can't hand off to WhatsApp. Non-blocking —
      // the WhatsApp redirect happens regardless of this call's outcome.
      fetch("/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).catch(() => {
        /* silent — WhatsApp handoff is the primary path */
      });

      const waLink = buildWhatsAppLink(data);
      window.open(waLink, "_blank", "noopener");
      form.reset();
    });
  }

  /* ---------- Smooth-scroll active nav link highlighting ---------- */
  const sections = document.querySelectorAll("section[id]");
  const navAnchors = document.querySelectorAll(".nav-link");
  if (sections.length && navAnchors.length) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navAnchors.forEach((a) => a.classList.remove("is-active"));
          const match = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
          if (match) match.classList.add("is-active");
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    sections.forEach((s) => navObserver.observe(s));
  }
})();
