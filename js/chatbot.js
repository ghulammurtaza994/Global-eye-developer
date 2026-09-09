/**
 * GLOBAL EYE DEVELOPER — EYE·BOT AI Chat Assistant
 * ================================================
 * Floating AI chatbot widget for the Global Eye Developer website.
 *
 * How it works
 *  - An intent-matching AI engine (keyword scoring + fuzzy word match with
 *    roman-Urdu support) understands visitor messages and answers from a
 *    built-in business knowledge base. No API key needed, works offline.
 *  - Optionally it can consult a real LLM (see CONFIG.remoteAI below) and
 *    falls back to the built-in brain on failure / rate-limit.
 *  - Order fee guidance: orders are quoted individually ("order ki fee
 *    order ke hisaab se"), and when the visitor shows interest the bot
 *    reveals the WhatsApp number for a direct handoff.
 */
(function () {
  "use strict";

  /* =====================================================================
     CONFIG — change these when you want to customise the assistant
     ===================================================================== */
  var CONFIG = {
    /* The WhatsApp number shown to interested visitors (no plus signs) */
    wsNumber: "923376184616",
    /* Pretty number displayed inside the chat */
    wsDisplay: "+92 337 618 4616",
    /*
       Optional real-AI brain. Leave "" to use only the local engine.
       Examples:
         "https://text.pollinations.ai/prompt/"   (free, no key, ~1 req / 15 s)
         or any OpenAI-compatible endpoint you wire up.
       When set, the bot asks the LLM first and only falls back to the
       local knowledge engine if it fails or times out.
    */
    remoteAI: "",
    remoteAITimeoutMs: 9000,
    /* Small delays so the bot feels human */
    typingMinMs: 450,
    typingPerCharMs: 6,
    tipDelayMs: 2600
  };

  /* Few helpers adopted from the site theme */
  var BLUE = "#0066ff";
  var CYAN = "#00b3ff";
  var BRAND = 'GLOBAL EYE <span style="color:#cfe0ff">DEVELOPER</span>';
  var WA_PLAIN = "https://wa.me/" + CONFIG.wsNumber;

  function waHref(text) {
    return WA_PLAIN + "?text=" + encodeURIComponent(text);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalize(s) {
    return String(s)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function nowTime() {
    var d = new Date();
    var h = d.getHours() % 12 || 12;
    var m = (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
    return h + ":" + m + (d.getHours() < 12 ? " AM" : " PM");
  }
/* =====================================================================
     KNOWLEDGE BASE — the 8 services the business provides
     ===================================================================== */
  var SERVICES = [
    {
      id: "software",
      icon: "🖥️",
      label: "Software Development",
      keywords: ["software", "erp", "crm", "saas", "desktop", "application", "apps", "custom software", "business automation", "management system", "inventory", "pos", "billing system"],
      blurb: "Custom software solutions — ERP, CRM, SaaS platforms, business automation, desktop & mobile apps — engineered end to end.",
      reply: "🖥️ <b>Software Development</b><br>Custom software, ERP, CRM, SaaS platforms &amp; business automation — desktop ya web, sab end-to-end banaya jaata hai.<br><br>Order ki fee requirements ke hisaab se banti hai. Say <b>\"interested\"</b> for our WhatsApp number."
    },
    {
      id: "website",
      icon: "🌐",
      label: "Website Development",
      keywords: ["website", "web development", "web dev", "web site", "landing page", "business website", "portfolio website", "static site", "website banao"],
      blurb: "Modern, blazing-fast websites — business sites, landing pages, portfolios and e-commerce — with SEO built in.",
      reply: "🌐 <b>Website Development</b><br>Fast, modern, SEO-ready websites — business sites, landing pages, portfolios &amp; e-commerce. Requirement batayein (pages, features, design reference) — hum usi hisaab se build karte hain.<br><br>Price order ke hisaab se! Say <b>\"interested\"</b> to get our WhatsApp number."
    },
    {
      id: "frontend",
      icon: "🎨",
      label: "Frontend Development",
      keywords: ["frontend", "front end", "front-end", "html css", "html", "css", "ui code", "responsive", "pixel perfect", "front end developer"],
      blurb: "Pixel-perfect frontend builds — HTML/CSS/JS — animations, responsive layouts, converting Figma/XD designs into clean code.",
      reply: "🎨 <b>Frontend Development</b><br>Design ko pixel-perfect code mein convert karna — HTML/CSS/JS, animations, responsive layouts. Figma ya Adobe design ho toh hum clean production code bana dete hain.<br><br>Quote chaahiye? Say <b>\"interested\"</b>."
    },
    {
      id: "fullstack",
      icon: "⚙️",
      label: "Full Stack Development",
      keywords: ["full stack", "fullstack", "full-stack", "backend", "back end", "api", "database", "auth", "authentication", "deployment", "mvp", "complete product", "react", "node"],
      blurb: "Complete products — frontend + backend + database + APIs + auth + deployment, from idea to a live product.",
      reply: "⚙️ <b>Full Stack Development</b><br>Idea se live tak poori product — frontend, backend, database, APIs, auth, deployment. Milestone-based delivery. <br><br>Order ki fee requirements ke hisaab se banti hai — say <b>\"interested\"</b> aur WhatsApp par baat karein."
    },
    {
      id: "uiux",
      icon: "🖌️",
      label: "UI/UX Designing",
      keywords: ["ui ux", "uiux", "ui/ux", "ux ui", "ui design", "ux", "user interface", "user experience", "wireframe", "prototype", "figma", "design system"],
      blurb: "User-first UI/UX — wireframes, interactive prototypes, design systems and conversion-focused interfaces.",
      reply: "🖌️ <b>UI/UX Designing</b><br>Wireframe se le kar polished design system tak — user-first interfaces jo conversion badhate hain. Figma/XD me clean, developer-ready designs.<br><br>Requirements batayein — say <b>\"interested\"</b> for our WhatsApp."
    },
    {
      id: "graphic",
      icon: "💡",
      label: "Graphic Designing",
      keywords: ["graphic", "graphics", "logo", "branding", "brand identity", "poster", "flyer", "banner", "social media post", "thumbnail", "creative design", "brochure"],
      blurb: "Brand identities, logos, social creatives, posters and complete visual systems — AI-assisted, hand-finished.",
      reply: "💡 <b>Graphic Designing</b><br>Logos, branding, social media creatives, posters, flyers — AI-assisted generation ke baad hand-finished polish. Aapki brand identity banakar dete hain.<br><br>Interested? Say <b>\"interested\"</b> — WhatsApp number share karunga."
    },
    {
      id: "marketing",
      icon: "📈",
      label: "Digital Marketing",
      keywords: ["marketing", "digital marketing", "seo", "smm", "social media marketing", "ads", "campaign", "google ads", "facebook ads", "instagram marketing", "growth"],
      blurb: "Digital marketing & SEO — search visibility, ad campaigns and social media growth that converts.",
      reply: "📈 <b>Digital Marketing</b><br>SEO, ad campaigns (Google/Facebook/Instagram), social media management — results par focus, AI-assisted growth campaigns.<br><br>Ask for the WhatsApp number by saying <b>\"interested\"</b>!"
    },
    {
      id: "shopify",
      icon: "🛍️",
      label: "Shopify Store Designing",
      keywords: ["shopify", "ecommerce", "e-commerce", "online store", "dropshipping", "dropship", "store design", "shop"],
      blurb: "Launch-ready Shopify stores — theme customization, product setup, payments and conversion-optimised design.",
      reply: "🛍️ <b>Shopify Store Designing</b><br>Complete Shopify store — theme customization, product setup, payments, launch-ready. Dropshipping ya branded store, dono handle karte hain.<br><br>Price order ke hisaab se — say <b>\"interested\"</b> for our WhatsApp."
    }
  ];
/* =====================================================================
     PROJECTS KNOWLEDGE + REPLY TEMPLATES (variants for a natural feel)
     ===================================================================== */
  var PROJECTS =
    "📁 <b>Selected work:</b><br>" +
    "• <b>eRentaCar Pro</b> — car rental platform (online booking, payments, admin panel)<br>" +
    "• <b>ERP Network</b> — business management (sales, inventory, HR modules)<br>" +
    "• <b>Gym Management Suite</b> — memberships, attendance, billing + built-in e-commerce store<br>" +
    "• Multiple UI/UX rebrands & marketing sites for founders & startups.<br><br>" +
    "Kisi project ki detail chahiye ya apna project discuss karna hai? Say <b>\"interested\"</b>.";

  var GREETING =
    "👋 <b>Salam!</b> Main <b>EYE·BOT</b> hoon — " + BRAND +
    " ka AI assistant. 🤖<br>" +
    "Mujhse poochiye kuch bhi — <b>services</b>, <b>pricing</b>, <b>projects</b>, " +
    "ya seedha order karna ho toh bata dein. Neeche chips par tap karein 👇";

  function servicesIntro() {
    var list = SERVICES.map(function (s) {
      return "• " + s.icon + " <b>" + s.label + "</b> — " + s.blurb;
    });
    return (
      "Yeh hain <b>" + SERVICES.length + " services</b> jo hum provide karte hain:<br><br>" +
      list.join("<br>") +
      "<br><br>Kisi service ka detail jaane ke liye uska naam type karein, ya <b>\"interested\"</b> bolein " +
      "to WhatsApp number de doon ga. 😊"
    );
  }

  var PRICING_REPLY =
    "💰 <b>Pricing</b><br>" +
    "<b>Order ki fee order ke hisaab se hoti hai</b> — koi fixed packages nahi. Custom quote banate waqt ye dekha jaata hai:<br>" +
    "• Scope (pages, features, integrations)<br>• Timeline<br>• Design & revisions<br><br>" +
    "Is liye exact rate <b>requirements dekh kar</b> bataya jaata hai — aap WhatsApp par idea/requirements bhejein " +
    "to official quote mil jaaye ga. Abhi number dikha du?";

  var T = {
    pricing: [PRICING_REPLY, PRICING_REPLY],
    location: [
      "📍 Hum <b>Lahore, Pakistan</b> (251-C Block, PIA Society) se kaam karte hain — lekin clients poori duniya se hain. Remote collaboration fully supported. 😄"
    ],
    hours: [
      "🕐 Hum <b>24/7 available</b> hain — haftay ke 7 din. WhatsApp par kabhi bhi message karein, team usually minutes mein reply karti hai."
    ],
    payment: [
      "💳 <b>Payment terms</b><br>Milestone-based: project start par ek advance, phir progress milestones ke saath remaining. Exact terms aapki written quote mein clear hote hain — full transparency. 🙂"
    ],
    timeline: [
      "⏱️ <b>Timeline</b><br>Scope ke hisaab se: landing pages <b>3–7 din</b>, business websites <b>1–3 haftay</b>, full-stack/SaaS products <b>4–10+ haftay</b>. Requirements review ke baad exact deadline confirm hoti hai."
    ],
    support: [
      "🛡️ <b>Support & revisions</b><br>Har project ke saath post-delivery support milta hai taake sab smooth chale. Revision terms bhi aapki quote mein defined hote hain."
    ],
    ai: [
      "🤖 <b>Fun fact:</b> AI chatbot aur AI call agents banana bhi humari service hai! Main khud unhi ka result hoon. 😄 Agar aap apni website ke liye AI chatbot chahte hain — bilkul yahi widget bana sakte hain. Say <b>\"interested\"</b>!"
    ],
    thanks: ["😊 Khush rahiye! Aur koi sawaal ho toh bata dein."],
    bye: ["👋 Khuda hafiz! Jab bhi zaroorat ho, main yahin hoon. 🌟"],
    fallback: [
      "Hmm, is baar samajh nahi saka 🤔 — main in cheezon ke baare mein jaanta hoon:<br>• <b>8 services</b> (software, website, frontend, full-stack, UI/UX, graphic, marketing, Shopify)<br>• <b>Pricing</b> (order ke hisaab se)<br>• <b>Projects</b> & <b>Contact/WhatsApp</b><br><br>Koi ek select karein ya seedha service ka naam type karein!"
    ]
  };
/* =====================================================================
     INTENT ENGINE — keyword scoring + fuzzy word match (roman-Urdu aware)
     ===================================================================== */
  var INTEREST_WORDS = [
    "interested", "interest", "order", "book", "booking", "hire", "quote",
    "estimate", "buy", "purchase", "want", "chahiye", "chahye", "karna hai",
    "karwana hai", "karwao", "banao", "bana do", "bana de", "banani hai",
    "start karein", "lets talk", "let's talk", "baat karein", "baat karni",
    "budget", "contact", "whatsapp", "number den", "number do", "deal",
    "paid", "ready to pay", "advance", "register", "client", "signup", "sign up"
  ];

  var INTENTS = [
    {
      id: "menu",
      keywords: ["services", "service", "what do you do", "what do u do", "capabilities", "what can you do", "offerings", "offer", "provide", "kya karte", "kya karta", "kaam", "menu", "options", "help", "help me"],
      reply: servicesIntro
    },
    {
      id: "pricing",
      keywords: ["price", "prices", "pricing", "cost", "costs", "rate", "rates", "fee", "fees", "charge", "charges", "how much", "kitna", "kima", "amount", "budget", "quote", "estimate", "pakage", "package"],
      reply: T.pricing
    },
    {
      id: "contact",
      keywords: ["whatsapp", "contact", "phone", "number", "call", "talk", "human", "agent", "person", "baat", "message", "reach", "email", "gmail", "touch"],
      reply: "showWa"
    },
    {
      id: "projects",
      keywords: ["project", "projects", "portfolio", "work", "built", "previous work", "case study", "examples", "sample", "samples", "client work", "done", "designed", "developed"],
      reply: PROJECTS
    },
    {
      id: "location",
      keywords: ["location", "where", "address", "lahore", "pakistan", "based", "office", "country"],
      reply: T.location
    },
    {
      id: "hours",
      keywords: ["hours", "timing", "timings", "open", "available", "time zone", "24/7", "24 7", "24hour", "24 hours"],
      reply: T.hours
    },
    {
      id: "payment",
      keywords: ["payment", "advance", "terms", "milestone", "pay", "installment", "emi"],
      reply: T.payment
    },
    {
      id: "timeline",
      keywords: ["timeline", "how long", "time lag", "kitna time", "duration", "days", "weeks", "week", "deadline", "delivery", "when"],
      reply: T.timeline
    },
    {
      id: "support",
      keywords: ["support", "warranty", "revision", "revisions", "guarantee", "after delivery", "maintenance"],
      reply: T.support
    },
    {
      id: "ai",
      keywords: ["chatbot", "chat bot", "call agent", "ai agent", "ai chatbot", "ai solutions", "artificial", "automation"],
      reply: T.ai
    },
    {
      id: "greeting",
      keywords: ["hello", "hi", "hey", "hii", "hiii", "salam", "asalam", "assalam", "wsalam", "good morning", "good afternoon", "good evening", "how are you", "hr u", "kya haal"],
      reply: GREETING
    },
    {
      id: "thanks",
      keywords: ["thank", "thanks", "shukria", "thx", "ty", "nice", "great", "awesome", "good job"],
      reply: T.thanks
    },
    {
      id: "bye",
      keywords: ["bye", "goodbye", "see you", "later", "khuda hafiz", "allah hafiz", "gtg"],
      reply: T.bye
    },
    {
      id: "reset",
      keywords: ["reset", "restart", "clear chat", "start over", "new chat"],
      reply: "reset"
    }
  ];
/* ---------- Fuzzy word matcher (edit-distance, roman-Urdu friendly) ---------- */
  function levenshtein(a, b) {
    if (a === b) return 0;
    var al = a.length, bl = b.length;
    if (!al) return bl;
    if (!bl) return al;
    var prev = new Array(bl + 1), curr = new Array(bl + 1), i, j;
    for (j = 0; j <= bl; j++) prev[j] = j;
    for (i = 1; i <= al; i++) {
      curr[0] = i;
      for (j = 1; j <= bl; j++) {
        var cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min(
          prev[j] + 1,
          curr[j - 1] + 1,
          prev[j - 1] + cost
        );
      }
      var tmp = prev; prev = curr; curr = tmp;
    }
    return prev[bl];
  }

  function fuzzyIncludes(word, list) {
    /* returns true if word is close to any list entry */
    for (var k = 0; k < list.length; k++) {
      if (word === list[k]) return true;
      var l = list[k];
      if (Math.max(word.length, l.length) <= 4 && levenshtein(word, l) <= 1) return true;
      if (word.length >= 5 && levenshtein(word, l) <= 2) return true;
    }
    return false;
  }

  /* ---------- Service matching ---------- */
  function matchService(text) {
    var words = normalize(text).split(" ");
    var best = null, bestScore = 0;
    for (var s = 0; s < SERVICES.length; s++) {
      var score = 0;
      for (var w = 0; w < words.length; w++) {
        if (fuzzyIncludes(words[w], SERVICES[s].keywords)) score += 3;
      }
      /* multi-word keyword match */
      var kwlist = SERVICES[s].keywords;
      for (var k = 0; k < kwlist.length; k++) {
        if (normalize(text).indexOf(kwlist[k]) !== -1) score += 4;
      }
      if (score > bestScore) { bestScore = score; best = SERVICES[s]; }
    }
    return bestScore >= 4 ? best : null;
  }

  /* ---------- Intent matching ---------- */
  function matchIntent(text) {
    var n = normalize(text);
    var words = n.split(" ");
    var best = null, bestScore = 0;
    for (var i = 0; i < INTENTS.length; i++) {
      var score = 0;
      for (var w = 0; w < words.length; w++) {
        if (fuzzyIncludes(words[w], INTENTS[i].keywords)) score += 2;
      }
      if (n.indexOf(INTENTS[i].keywords.join(" ")) !== -1) score += 0; /* noop */
      for (var k = 0; k < INTENTS[i].keywords.length; k++) {
        if (n.indexOf(INTENTS[i].keywords[k]) !== -1) score += 3;
      }
      if (score > bestScore) { bestScore = score; best = INTENTS[i]; }
    }
    return bestScore >= 3 ? best : null;
  }

  /* ---------- Interest detection ("order ki fee order ke hisaab se") ---------- */
  function isInterested(text) {
    var n = normalize(text);
    if (!n) return false;
    for (var i = 0; i < INTEREST_WORDS.length; i++) {
      if (n === INTEREST_WORDS[i]) return true;
      if (n.indexOf(INTEREST_WORDS[i]) !== -1) return true;
    }
    return false;
  }

  /* ---------- Reply resolution ---------- */
  function resolveReply(reply) {
    if (typeof reply === "function") return reply();
    if (reply === "showWa") return undefined; /* handled by caller */
    if (reply === "reset") return undefined;
    if (Array.isArray(reply)) return reply[Math.floor(Math.random() * reply.length)];
    return reply;
  }

  /* =====================================================================
     REMOTE AI (optional) — used only when CONFIG.remoteAI is set
     ===================================================================== */
  function remoteReply(text) {
    if (!CONFIG.remoteAI) {
      var p = new Promise(function (_, rej) { rej(new Error("disabled")); });
      return p;
    }
    var url = CONFIG.remoteAI + encodeURIComponent(text);
    var timedOut = false;
    var timer = setTimeout(function () { timedOut = true; }, CONFIG.remoteAITimeoutMs);

    function fail(reason) {
      clearTimeout(timer);
      return new Promise(function (_, rej) { rej(new Error(reason)); });
    }

    return fetch(url)
      .then(function (r) { return r.ok ? r.text() : fail("http " + r.status); })
      .then(function (body) {
        clearTimeout(timer);
        if (timedOut) return fail("timeout");
        return body && body.trim().length > 1 ? body.trim() : fail("empty");
      })
      .catch(function (e) {
        clearTimeout(timer);
        return fail(e && e.message ? e.message : "remote fail");
      });
  }
/* =====================================================================
     WIDGET UI — launcher bubble, chat panel, tip bubble
     ===================================================================== */
  function buildLauncherSvg() {
    return '<svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true">' +
      '<path d="M24 12 a12 12 0 1 1 0 0 24 0 0 24z" fill="none" stroke="#fff" stroke-width="2.4"/>' +
      '<circle cx="24" cy="24" r="11" fill="rgba(255,255,255,0.95)"/>' +
      '<circle cx="20" cy="21" r="2.6" fill="#0b3b8c"/>' +
      '<circle cx="28" cy="21" r="2.6" fill="#0b3b8c"/>' +
      '<path d="M16 30 Q24 27 32 30" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M16 30 l1.6 2.2 3.4 1.4 5.4 1.4 7 2.2" stroke="rgba(255,255,255,0.85)" stroke-width="1.1" fill="none" stroke-linecap="round"/></svg>';
  }

  var launcher, panel, body, form, input, sendBtn, chipsRow, badge, tip;
  var isOpen = false;
  var justOpened = false;

  function buildWidget() {
    var root = document.createElement("div");
    root.id = "ge-chat-root";

    /* Tip bubble (one-time) */
    tip = document.createElement("div");
    tip.className = "ge-chat-tip";
    tip.innerHTML =
      "👋 <b>Neeche tap karein</b> — main aapki services, pricing aur WhatsApp number mein madad " +
      "kar sakta hoon 💬";
    var tipX = document.createElement("button");
    tipX.className = "ge-chat-tip-x";
    tipX.type = "button";
    tipX.setAttribute("aria-label", "Dismiss");
    tipX.textContent = "×";
    tipX.addEventListener("click", function (e) { e.stopPropagation(); hideTip(); });
    tip.appendChild(tipX);
    root.appendChild(tip);

    /* Launcher */
    launcher = document.createElement("button");
    launcher.className = "ge-chat-launcher";
    launcher.type = "button";
    launcher.setAttribute("aria-label", "Open EYE BOT chat");
    launcher.innerHTML = buildLauncherSvg();
    badge = document.createElement("span");
    badge.className = "ge-chat-badge";
    badge.textContent = "1";
    launcher.appendChild(badge);
    launcher.addEventListener("click", toggle);
    root.appendChild(launcher);

    /* Panel */
    panel = document.createElement("div");
    panel.className = "ge-chat-panel";
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML =
      '<div class="ge-chat-head">' +
        '<span class="ge-chat-avatar">' +
          '<svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true">' +
            '<circle cx="24" cy="24" r="16" fill="white" fill-opacity="0.22"/>' +
            '<circle cx="18" cy="20" r="8" fill="white" fill-opacity="0.9"/>' +
            '<circle cx="30" cy="20" r="8" fill="white" fill-opacity="0.9"/>' +
            '<circle cx="17" cy="19" r="2.4" fill="#0066ff"/>' +
            '<circle cx="29" cy="19" r="2.4" fill="#0066ff"/>' +
            '<path d="M13 32 Q 24 26 35 32" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>' +
          '</svg>' +
        '</span>' +
        '<span class="ge-chat-head-txt">' +
          '<strong>EYE·BOT — ' + BRAND + '</strong>' +
          '<span class="ge-chat-status">● Online — replies instantly</span>' +
        '</span>' +
        '<button class="ge-chat-close" type="button" aria-label="Close chat">×</button>' +
      '</div>' +
      '<div class="ge-chat-body"></div>' +
      '<div class="ge-chat-chips" role="group" aria-label="Quick questions"></div>' +
      '<form class="ge-chat-form">' +
        '<input type="text" placeholder="Type a message..." aria-label="Message EYE BOT" autocomplete="off">' +
        '<button type="submit" aria-label="Send">' +
          '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 3 L8 9 M10 9 L18 3" stroke="white" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M3 13 L13 13 21 13" stroke="white" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>' +
        '</button>' +
      '</form>' +
      '<div class="ge-chat-attribution">Powered by Global Eye Developer · AI</div>';

    panel.querySelector(".ge-chat-close").addEventListener("click", close);
    root.appendChild(panel);

    body = panel.querySelector(".ge-chat-body");
    chipsRow = panel.querySelector(".ge-chat-chips");
    form = panel.querySelector(".ge-chat-form");
    input = form.querySelector("input");
    sendBtn = form.querySelector("button");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var val = input.value.trim();
      if (!val) return;
      input.value = "";
      sendUser(val);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen) close();
    });

    document.body.appendChild(root);
  }
/* ---------- Messages ---------- */
  var WELCOME_MSG =
    "👋 <b>Salam!</b> Main <b>EYE·BOT</b> hoon — " + BRAND +
    " ka AI assistant. 🤖<br>" +
    "Mujhse poochiye kuch bhi: <b>services</b>, <b>pricing</b>, <b>projects</b>, " +
    "ya order karna hai to bata dein. Neeche chips par tap karein 👇";

  function addBot(html, extra, withTime) {
    var wrap = document.createElement("div");
    wrap.className = "ge-chat-msg bot";
    wrap.innerHTML = html;
    if (extra) {
      var wa = document.createElement("div");
      wa.className = "ge-chat-wa";
      wa.innerHTML = extra;
      wrap.appendChild(wa);
    }
    if (withTime) {
      var t = document.createElement("span");
      t.className = "ge-chat-time";
      t.textContent = nowTime();
      wrap.appendChild(t);
    }
    body.appendChild(wrap);
    scrollDown();
  }

  function addUser(text) {
    var el = document.createElement("div");
    el.className = "ge-chat-msg user";
    el.innerHTML = escapeHtml(text) + '<span class="ge-chat-time">' + nowTime() + "</span>";
    body.appendChild(el);
    scrollDown();
  }

  function scrollDown() {
    body.scrollTop = body.scrollHeight;
  }

  /* Typing indicator */
  function typing(on) {
    var existing = body.querySelector(".ge-chat-typing");
    if (existing) { body.removeChild(existing); }
    if (!on) return;
    var w = document.createElement("div");
    w.className = "ge-chat-typing";
    w.setAttribute("aria-label", "EYE BOT is typing");
    w.innerHTML = "<span></span><span></span><span></span>";
    body.appendChild(w);
    scrollDown();
  }

  /* WhatsApp lead card — shown when visitor is interested */
  function showWa(serviceLabel) {
    var line1 =
      "Mera naam <b>EYE·BOT</b> hoon 😊 — aap seedha humare WhatsApp par order/quote " +
      "discuss kar sakte hain. Yeh raha number:";
    var num = "<span class=\"wa-num\">📱 " + CONFIG.wsDisplay + "</span>";
    var msg = "Hi Global Eye Developer!" +
      (serviceLabel ? " I'm interested in " + serviceLabel + "." : " I want to discuss a project.") +
      " Can we talk?";
    var btn = '<a class="wa-btn" href="' + waHref(msg) + '" target="_blank" rel="noopener">' +
      "💬 Chat on WhatsApp</a>";
    return '<span class="ge-chat-wa">' + line1 + num + btn + "</span>";
  }

  /* ---------- Chips (quick questions) ---------- */
  function buildChips() {
    var labels = [
      "8 Services",
      "Pricing 💰",
      "Interested 🙌",
      "Projects",
      "Contact"
    ];
    chipsRow.innerHTML = "";
    labels.forEach(function (l) {
      var c = document.createElement("button");
      c.type = "button";
      c.className = "ge-chat-chip";
      c.textContent = l;
      c.addEventListener("click", function () { chipClick(l); });
      chipsRow.appendChild(c);
    });
  }

  function chipClick(label) {
    if (!isOpen) open();
    var map = {
      "8 Services": "services batao",
      "Pricing 💰": "pricing kya hai",
      "Interested 🙌": "interested",
      "Projects": "projects",
      "Contact": "whatsapp number"
    };
    sendUser(map[label] || label);
  }

  /* ---------- Launcher / panel ---------- */
  function toggle() {
    isOpen ? close() : open();
  }

  function open() {
    isOpen = true;
    justOpened = true;
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    badge.style.display = "none";
    hideTip();
    if (body && body.querySelectorAll(".ge-chat-msg").length === 0) {
      addBot(WELCOME_MSG, "", false);
    }
    setTimeout(function () {
      try { input.focus && input.focus(); } catch (_) {}
    }, 220);
  }

  function close() {
    isOpen = false;
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  }

  function hideTip() {
    if (tip) tip.classList.remove("show");
    try { localStorage.setItem("ge-chat-tip", "1"); } catch (_) {}
  }
/* =====================================================================
     CHAT FLOW — main entry point for every user message
     ===================================================================== */
  var busy = false;

  /* Local brain — deterministic, conversion-safe, always available.
     Returns: { reset } | { wa, html } | { hit, html } | { hit:false } */
  function localReply(text) {
    var resetIntent = matchIntent(text);
    if (resetIntent && resetIntent.id === "reset") return { reset: true };

    /* interest -> show WhatsApp number (the conversion rule) */
    var interested = isInterested(text);
    var svc = matchService(text);
    var svcLabel = svc ? svc.label : "";

    if (interested) {
      return {
        wa: true,
        html:
          "🎉 <b>Great!</b> Aap ka interest dekh kar khushi hui! 🥳<br>" +
          "Neeche WhatsApp number hai — tap karein aur humare team se seedha " +
          "baat karein. Quote bhi wahin milega, <i>aapke order ke hisaab se</i>:" +
          showWa(svcLabel)
      };
    }
    if (svc) return { hit: true, html: svc.reply };

    var intent = matchIntent(text);
    if (intent) {
      var r = resolveReply(intent.reply);
      if (r) return { hit: true, html: r };
    }
    return { hit: false };
  }

  function sendUser(text) {
    addUser(text);
    typing(true);
    busy = true;

    function finish(replyHtml) {
      typing(false);
      busy = false;
      addBot(replyHtml, "", true);
      buildChips();
      storeHistory();
    }

    /* Deterministic local brain — never overridden by remote AI */
    var pre = localReply(text);
    if (pre.reset) {
      setTimeout(function () {
        typing(false);
        busy = false;
        body.innerHTML = "";
        addBot(GREETING);
        storeHistory();
      }, delayFor());
      return;
    }
    if (pre.wa || pre.hit) {
      setTimeout(function () { finish(pre.html); }, delayFor());
      return;
    }

    /* Only unmatched queries may ask the remote AI; fall back otherwise */
    var fallbackHtml = T.fallback[Math.floor(Math.random() * T.fallback.length)];

    if (CONFIG.remoteAI) {
      var usedLocal = null;
      var timer = setTimeout(function () {
        if (usedLocal !== null) return;
        usedLocal = true;
        finish(fallbackHtml);
      }, CONFIG.remoteAITimeoutMs + 400);

      remoteReply(text)
        .then(function (remote) {
          if (usedLocal !== null) return;
          usedLocal = true;
          clearTimeout(timer);
          finish(remoteBlocks(remote, fallbackHtml));
        })
        .catch(function () {
          if (usedLocal !== null) return;
          usedLocal = true;
          clearTimeout(timer);
          finish(fallbackHtml);
        });
    } else {
      setTimeout(function () { finish(fallbackHtml); }, delayFor());
    }
  }

  function remoteBlocks(raw, fallback) {
    /* Render plain AI text safely — shield from HTML injection */
    var s = String(raw || "").trim();
    if (s.length < 2) return fallback;
    var esc = escapeHtml(s).replace(/\n/g, "<br>");
    return '<div style="font-size:13.5px;line-height:1.5">' + esc + "</div>";
  }

  function delayFor() {
    return CONFIG.typingMinMs + Math.random() * 300;
  }

  /* Session memory in localStorage (nice-to-have, never blocks) */
  function storeHistory() {
    try {
      localStorage.setItem("ge-chat-history", JSON.stringify(body.innerHTML));
    } catch (_) {}
  }

  function restoreHistory() {
    try {
      var saved = localStorage.getItem("ge-chat-history");
      if (saved && saved.length < 12000) {
        body.innerHTML = saved;
        scrollDown();
      }
    } catch (_) {}
  }

  /* =====================================================================
     INIT
     ===================================================================== */
  function init() {
    buildWidget();
    buildChips();

    /* one-time launcher tooltip */
    var shown = false;
    try { shown = localStorage.getItem("ge-chat-tip") === "1"; } catch (_) {}
    if (!shown) {
      setTimeout(function () {
        tip.classList.add("show");
        setTimeout(function () { tip.classList.remove("show"); }, 7000);
      }, CONFIG.tipDelayMs);
    }

    restoreHistory();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();