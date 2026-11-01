/* ==========================================================================
   script.js — Sagar Paudel · Portfolio
   Vanilla JS, no dependencies:
     · mobile menu drawer          · scroll reveals
     · smooth scrolling            · scroll-progress bar
     · theme toggle (light/dark)   · speaking rail controls
     · active-link highlighting    · feature modal (focus trap, ESC, overlay)
     · copy-to-clipboard email     · footer year
     · publication cards (same modal, abstract + citation)
   ========================================================================== */
(function () {
  "use strict";

  var NAV_BREAKPOINT = 1000; /* keep in sync with the drawer media query */

  var header = document.getElementById("site-header");
  var nav = document.getElementById("site-nav");
  var menuToggle = document.getElementById("menu-toggle");
  var themeToggle = document.getElementById("theme-toggle");
  var metaTheme = document.getElementById("meta-theme");
  var yearEl = document.getElementById("year");
  var copyBtn = document.getElementById("copy-email");

  /* ---------------- Footer year ---------------- */
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* ---------------- Safe storage (works in sandboxes & GitHub Pages) ----- */
  var store = {
    get: function (key) {
      try { return window.localStorage.getItem(key); } catch (e) { return null; }
    },
    set: function (key, value) {
      try { window.localStorage.setItem(key, value); } catch (e) { /* no-op */ }
    }
  };

  /* ---------------- Mobile menu toggle ---------------- */
  function closeMenu() {
    if (!nav || !menuToggle) return;
    nav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");
  }
  function openMenu() {
    if (!nav || !menuToggle) return;
    nav.classList.add("is-open");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Close menu");
  }
  if (menuToggle && nav) {
    menuToggle.addEventListener("click", function () {
      if (nav.classList.contains("is-open")) { closeMenu(); } else { openMenu(); }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > NAV_BREAKPOINT) { closeMenu(); }
    });
    /* Tapping anywhere outside the open drawer closes it */
    document.addEventListener("click", function (event) {
      if (!nav.classList.contains("is-open")) return;
      if (nav.contains(event.target) || menuToggle.contains(event.target)) return;
      closeMenu();
    });
  }

  /* ---------------- Header elevation on scroll ---------------- */
  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------- Smooth scrolling ---------------- */
  var navLinks = document.querySelectorAll("[data-nav-link]");
  navLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
      var href = link.getAttribute("href");
      if (!href || href.charAt(0) !== "#") return;
      var targetId = href.slice(1);
      var target = targetId ? document.getElementById(targetId) : null;
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        target.addEventListener("blur", function () {
          target.removeAttribute("tabindex");
        }, { once: true });
      }
      if (nav && nav.classList.contains("is-open")) { closeMenu(); }
    });
  });

  /* ---------------- Theme toggle (light / dark) ---------------- */
  var root = document.documentElement;
  var prefersDark = window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  function applyTheme(theme) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
      if (themeToggle) {
        themeToggle.setAttribute("aria-pressed", "true");
        themeToggle.setAttribute("aria-label", "Switch to light mode");
      }
      if (metaTheme) { metaTheme.setAttribute("content", "#0B120D"); }
    } else {
      root.removeAttribute("data-theme");
      if (themeToggle) {
        themeToggle.setAttribute("aria-pressed", "false");
        themeToggle.setAttribute("aria-label", "Switch to dark mode");
      }
      if (metaTheme) { metaTheme.setAttribute("content", "#F7F5EC"); }
    }
  }

  applyTheme(store.get("sp-theme") || (prefersDark ? "dark" : "light"));

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var isDark = root.getAttribute("data-theme") === "dark";
      var next = isDark ? "light" : "dark";
      applyTheme(next);
      store.set("sp-theme", next);
    });
  }

  /* ---------------- Active nav-link highlighting ---------------- */
  var sections = Array.prototype.slice
    .call(document.querySelectorAll("main section[id]"))
    .filter(Boolean);
  var linkById = {};
  navLinks.forEach(function (link) {
    var href = link.getAttribute("href") || "";
    if (href.charAt(0) === "#" && href.length > 1) {
      linkById[href.slice(1)] = linkById[href.slice(1)] || [];
      linkById[href.slice(1)].push(link);
    }
  });
  if ("IntersectionObserver" in window && sections.length) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        Object.keys(linkById).forEach(function (id) {
          linkById[id].forEach(function (link) {
            link.classList.toggle("is-active", id === entry.target.id);
          });
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (section) { sectionObserver.observe(section); });
  }

  /* ---------------- Scroll-reveal animations ---------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------------- Copy email to clipboard ---------------- */
  if (copyBtn) {
    var copyLabel = copyBtn.querySelector(".copy-label");
    var copyDefault = copyLabel ? copyLabel.textContent : "Copy email";
    var copyTimer = null;

    var showCopied = function () {
      copyBtn.classList.add("is-copied");
      if (copyLabel) { copyLabel.textContent = "Copied"; }
      if (copyTimer) { window.clearTimeout(copyTimer); }
      copyTimer = window.setTimeout(function () {
        copyBtn.classList.remove("is-copied");
        if (copyLabel) { copyLabel.textContent = copyDefault; }
      }, 1800);
    };

    var fallbackCopy = function (text) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); showCopied(); } catch (e) { /* no-op */ }
      document.body.removeChild(ta);
    };

    copyBtn.addEventListener("click", function () {
      var email = copyBtn.getAttribute("data-email") || "";
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(showCopied, function () {
          fallbackCopy(email);
        });
      } else {
        fallbackCopy(email);
      }
    });
  }

  /* ---------------- Speaking rail (horizontal scroller) ----------------
     Arrows advance exactly one card at a time and dim at either end. */
  var rail = document.getElementById("feature-rail");
  var railViewport = document.getElementById("rail-viewport") || (rail ? rail.parentElement : null);
  var railPrev = document.getElementById("rail-prev");
  var railNext = document.getElementById("rail-next");

  if (rail && railViewport && railPrev && railNext) {
    var railItems = function () {
      return Array.prototype.slice.call(rail.children);
    };

    /* Left edge that a snapped card lines up with */
    var railOrigin = function () {
      var pad = parseFloat(window.getComputedStyle(rail).paddingLeft) || 0;
      return railViewport.getBoundingClientRect().left + pad;
    };

    var fallbackStep = function () {
      var card = rail.querySelector(".feature-card");
      if (!card) return railViewport.clientWidth * 0.8;
      var styles = window.getComputedStyle(rail);
      var gap = parseFloat(styles.columnGap || styles.gap || "24") || 24;
      return card.getBoundingClientRect().width + gap;
    };

    var railStep = function (direction) {
      var origin = railOrigin();
      var items = railItems();
      var delta = null;
      var i, offset;

      if (direction > 0) {
        for (i = 0; i < items.length; i += 1) {
          offset = items[i].getBoundingClientRect().left - origin;
          if (offset > 8) { delta = offset; break; }
        }
      } else {
        for (i = items.length - 1; i >= 0; i -= 1) {
          offset = items[i].getBoundingClientRect().left - origin;
          if (offset < -8) { delta = offset; break; }
        }
      }

      if (delta === null) { delta = direction * fallbackStep(); }
      railViewport.scrollBy({ left: delta, behavior: "smooth" });
    };

    var syncArrows = function () {
      var max = rail.scrollWidth - railViewport.clientWidth - 2;
      railPrev.disabled = railViewport.scrollLeft <= 2;
      railNext.disabled = railViewport.scrollLeft >= max;
    };

    railPrev.addEventListener("click", function () { railStep(-1); });
    railNext.addEventListener("click", function () { railStep(1); });

    var railTicking = false;
    railViewport.addEventListener("scroll", function () {
      if (railTicking) return;
      railTicking = true;
      window.requestAnimationFrame(function () {
        syncArrows();
        railTicking = false;
      });
    }, { passive: true });

    window.addEventListener("resize", syncArrows);
    window.addEventListener("load", syncArrows);
    syncArrows();
  }

  /* ---------------- Feature modal ---------------- */
  var modal = document.getElementById("feature-modal");

  if (modal) {
    var modalDialog = modal.querySelector(".modal-dialog");
    var modalScroll = modal.querySelector(".modal-scroll");
    var modalMedia = document.getElementById("modal-media");
    var modalKind = document.getElementById("modal-kind");
    var modalTitle = document.getElementById("modal-title");
    var modalMeta = document.getElementById("modal-meta");
    var modalContent = document.getElementById("modal-content");
    var modalTags = document.getElementById("modal-tags");
    var modalAuthor = modal.querySelector(".modal-author");
    var lastFocused = null;
    var closeTimer = null;

    var ICONS = {
      date: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/></svg>',
      event: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4 7v6c0 4.6 3.4 7.4 8 8.5 4.6-1.1 8-3.9 8-8.5V7l-8-4Z"/></svg>',
      place: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10.5c0 5.5-8 12-8 12s-8-6.5-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10.5" r="3"/></svg>'
    };

    var addMeta = function (icon, text) {
      if (!text) return;
      var li = document.createElement("li");
      li.innerHTML = icon + "<span></span>";
      li.querySelector("span").textContent = text;
      modalMeta.appendChild(li);
    };

    var focusable = function () {
      return Array.prototype.slice
        .call(modalDialog.querySelectorAll('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'))
        .filter(function (el) { return el.offsetParent !== null || el === modalDialog; });
    };

    var lockScroll = function () {
      var gap = window.innerWidth - document.documentElement.clientWidth;
      if (gap > 0) { document.body.style.paddingRight = gap + "px"; }
      document.body.classList.add("is-locked");
    };
    var unlockScroll = function () {
      document.body.classList.remove("is-locked");
      document.body.style.paddingRight = "";
    };

    function fillModal(card) {
      var media = card.querySelector(".feature-media");
      /* undo anything the publication variant changed */
      modalMedia.classList.remove("modal-media--pub");
      if (modalAuthor) { modalAuthor.hidden = false; }
      modalTags.hidden = false;
      var full = card.querySelector(".feature-full");
      var tags = card.querySelectorAll(".tag-list--pink .tag");

      /* Hero media — reuse the card's resolved background so the photo
         (or its generated fallback) carries straight into the modal. */
      if (media) {
        var cs = window.getComputedStyle(media);
        modalMedia.style.backgroundImage = cs.backgroundImage;
        modalMedia.style.backgroundColor = cs.backgroundColor;
      }

      modalKind.textContent = card.getAttribute("data-kind") || "";
      modalTitle.textContent = (card.querySelector(".feature-title") || {}).textContent || "";

      modalMeta.innerHTML = "";
      addMeta(ICONS.date, card.getAttribute("data-date"));
      addMeta(ICONS.event, card.getAttribute("data-event"));
      addMeta(ICONS.place, card.getAttribute("data-location"));

      modalContent.innerHTML = full ? full.innerHTML : "";

      modalTags.innerHTML = "";
      Array.prototype.forEach.call(tags, function (tag) {
        var li = document.createElement("li");
        li.className = "tag";
        li.textContent = tag.textContent;
        modalTags.appendChild(li);
      });
    }

    /* ---- Publication variant of the same modal ----------------------- */
    var PUB_TONES = { journal: "tone-1", preprint: "tone-5", report: "tone-3", dataset: "tone-2", conference: "tone-4" };
    var OPEN_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';
    var COPY_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"/></svg>';

    /* Borrow the card artwork for a tone so the hero matches the site */
    var toneHero = function (tone) {
      var probe = document.createElement("div");
      probe.className = "feature-media " + tone;
      probe.style.cssText = "position:absolute;left:-9999px;top:0;width:10px;height:10px;visibility:hidden;";
      document.body.appendChild(probe);
      var cs = window.getComputedStyle(probe);
      var out = { image: cs.backgroundImage, color: cs.backgroundColor };
      document.body.removeChild(probe);
      return out;
    };

    var copyText = function (text, done) {
      var fallback = function () {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.cssText = "position:fixed;opacity:0;";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); done(); } catch (e) { /* no-op */ }
        document.body.removeChild(ta);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else { fallback(); }
    };

    function fillPubModal(item) {
      var typeEl = item.querySelector(".pub-type");
      var typeMatch = /pub-type--(\w+)/.exec(typeEl ? typeEl.className : "");
      var hero = toneHero(PUB_TONES[typeMatch ? typeMatch[1] : ""] || "tone-1");
      var title = (item.querySelector(".pub-title") || {}).textContent || "";
      var authors = item.getAttribute("data-authors") || "";
      var venue = item.getAttribute("data-venue") || "";
      var date = item.getAttribute("data-date") || "";
      var full = item.querySelector(".pub-full");
      var link = item.querySelector(".pub-link");
      var href = link ? (link.getAttribute("href") || "#") : "#";

      modalMedia.style.backgroundImage = hero.image;
      modalMedia.style.backgroundColor = hero.color;
      modalMedia.classList.add("modal-media--pub");
      if (modalAuthor) { modalAuthor.hidden = true; }

      modalKind.textContent = item.getAttribute("data-pub-kind") || (typeEl ? typeEl.textContent : "");
      modalTitle.textContent = title;

      modalMeta.innerHTML = "";
      addMeta(ICONS.date, date);
      addMeta(ICONS.event, venue);

      modalContent.innerHTML = "";
      if (authors) {
        var by = document.createElement("p");
        by.className = "pub-authors";
        var label = document.createElement("strong");
        label.textContent = "Authors";
        by.appendChild(label);
        by.appendChild(document.createTextNode(authors));
        modalContent.appendChild(by);
      }
      var body = document.createElement("div");
      body.innerHTML = full ? full.innerHTML : "";
      modalContent.appendChild(body);

      /* Actions: open the publication, copy a citation */
      var actions = document.createElement("div");
      actions.className = "pub-actions";

      var open = document.createElement("a");
      open.className = "btn btn-primary";
      open.innerHTML = "<span></span>" + OPEN_ICON;
      open.querySelector("span").textContent = item.getAttribute("data-cta") || "Read publication";
      if (href === "#" || href === "") {
        /* link not filled in yet — keep the button but make it inert */
        open.setAttribute("href", "#");
        open.setAttribute("aria-disabled", "true");
        open.classList.add("is-disabled");
        open.addEventListener("click", function (event) { event.preventDefault(); });
      } else {
        open.setAttribute("href", href);
        if (/^https?:/i.test(href)) { open.setAttribute("target", "_blank"); open.setAttribute("rel", "noopener"); }
      }
      actions.appendChild(open);

      var cite = document.createElement("button");
      cite.type = "button";
      cite.className = "btn btn-outline";
      cite.innerHTML = COPY_ICON + "<span></span>";
      var citeLabel = cite.querySelector("span");
      citeLabel.textContent = "Copy citation";
      cite.addEventListener("click", function () {
        var text = [authors, title, venue, date].filter(Boolean).join(". ") + ".";
        copyText(text, function () {
          citeLabel.textContent = "Copied";
          cite.classList.add("is-copied");
          window.setTimeout(function () { citeLabel.textContent = "Copy citation"; cite.classList.remove("is-copied"); }, 1800);
        });
      });
      actions.appendChild(cite);
      modalContent.appendChild(actions);

      modalTags.innerHTML = "";
      modalTags.hidden = true;
    }

    function openModal(card) {
      if (closeTimer) { window.clearTimeout(closeTimer); closeTimer = null; }
      lastFocused = document.activeElement;
      if (card.classList.contains("pub-item")) { fillPubModal(card); } else { fillModal(card); }
      modal.hidden = false;
      lockScroll();
      if (modalScroll) { modalScroll.scrollTop = 0; }
      /* next frame so the transition has a starting state to animate from */
      window.requestAnimationFrame(function () {
        modal.classList.add("is-open");
        modalDialog.focus({ preventScroll: true });
      });
    }

    function closeModal() {
      if (modal.hidden) return;
      modal.classList.remove("is-open");
      unlockScroll();
      closeTimer = window.setTimeout(function () {
        modal.hidden = true;
        modalContent.innerHTML = "";
        modalMeta.innerHTML = "";
        modalTags.innerHTML = "";
      }, 260);
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus({ preventScroll: true });
      }
    }

    /* Open: the arrow button, or anywhere on the card */
    Array.prototype.forEach.call(document.querySelectorAll("[data-feature-open]"), function (btn) {
      btn.setAttribute("aria-haspopup", "dialog");
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-feature]"), function (card) {
      card.addEventListener("click", function (event) {
        if (event.target.closest("a")) return; /* let real links behave normally */
        openModal(card);
      });
    });

    /* Publications: the Read link or a click anywhere on the row opens the card */
    Array.prototype.forEach.call(document.querySelectorAll(".pub-item"), function (item) {
      var readLink = item.querySelector(".pub-link");
      if (readLink) { readLink.setAttribute("aria-haspopup", "dialog"); }
      item.addEventListener("click", function (event) {
        var anchor = event.target.closest("a");
        if (anchor && anchor !== readLink) return;      /* other links behave normally */
        if (anchor && (event.metaKey || event.ctrlKey || event.shiftKey)) return;
        event.preventDefault();                          /* the pop-up replaces the "#" jump */
        openModal(item);
      });
    });

    /* Close: X button, overlay, ESC */
    Array.prototype.forEach.call(modal.querySelectorAll("[data-modal-close]"), function (el) {
      el.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        if (!modal.hidden) {
          closeModal();
          return;
        }
        if (nav && nav.classList.contains("is-open")) {
          closeMenu();
          if (menuToggle) { menuToggle.focus(); }
        }
        return;
      }

      /* Keep Tab inside the dialog while it is open */
      if (event.key === "Tab" && !modal.hidden) {
        var items = focusable();
        if (!items.length) { event.preventDefault(); return; }
        var first = items[0];
        var last = items[items.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === modalDialog)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  } else {
    /* Modal markup missing — still allow ESC to close the nav drawer */
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav && nav.classList.contains("is-open")) {
        closeMenu();
        if (menuToggle) { menuToggle.focus(); }
      }
    });
  }
})();

/* ==========================================================================
   v2 additions — hero counters, scroll cue, progress bar, and the blog,
   project & publication filters
   ========================================================================== */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Hero stat counters (count up once, on load) ---- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-count]"), function (el) {
    var end = parseInt(el.getAttribute("data-count"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    if (isNaN(end) || reduce) { el.textContent = (isNaN(end) ? el.textContent : end) + suffix; return; }
    var start = null, dur = 1400;
    function tick(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + (p === 1 ? suffix : "");
      if (p < 1) window.requestAnimationFrame(tick);
    }
    el.textContent = "0";
    window.requestAnimationFrame(tick);
  });

  /* ---- Scroll cue fades after the visitor starts scrolling ---- */
  var cue = document.getElementById("hero-cue");
  if (cue) {
    var sync = function () { cue.classList.toggle("is-hidden", window.scrollY > 120); };
    window.addEventListener("scroll", sync, { passive: true });
    sync();
  }

  /* ---- Reading-progress bar (a thin line above the header) ---- */
  var bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  var barTicking = false;
  function updateBar() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var p = max > 0 ? h.scrollTop / max : 0;
    bar.style.transform = "scaleX(" + Math.min(Math.max(p, 0), 1) + ")";
    barTicking = false;
  }
  window.addEventListener("scroll", function () {
    if (barTicking) return;
    barTicking = true;
    window.requestAnimationFrame(updateBar);
  }, { passive: true });
  window.addEventListener("resize", updateBar);
  updateBar();

  /* ---- Generic chip filter (blog, projects and publications pages) ---- */
  function setupFilter(o) {
    var btns = Array.prototype.slice.call(document.querySelectorAll("[" + o.btn + "]"));
    var items = Array.prototype.slice.call(document.querySelectorAll(o.items));
    if (!btns.length || !items.length) return;
    var status = document.getElementById(o.status);
    var empty = document.getElementById(o.empty);
    var groups = Array.prototype.slice.call(document.querySelectorAll(o.groups || "[data-none]"));

    function apply(value) {
      var shown = 0;
      items.forEach(function (it) {
        var ok = value === "all" || it.getAttribute(o.attr) === value;
        it.hidden = !ok;
        if (ok) shown++;
      });
      groups.forEach(function (g) { g.hidden = !g.querySelector(o.items + ":not([hidden])"); });
      if (empty) empty.hidden = shown !== 0;
      if (status) status.textContent = "Showing " + (value === "all" ? "all " : "") + shown + " " + (shown === 1 ? o.one : o.many);
    }
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        btns.forEach(function (x) {
          var on = x === b;
          x.classList.toggle("is-active", on);
          x.setAttribute("aria-pressed", on ? "true" : "false");
        });
        apply(b.getAttribute(o.btn));
      });
    });
  }

  setupFilter({ btn: "data-blog-filter", items: "#blog-grid .blog-card[data-group]", attr: "data-group",
    status: "blog-status", empty: "blog-empty", one: "item", many: "items" });
  setupFilter({ btn: "data-project-filter", items: "#project-grid .work-card[data-group]", attr: "data-group",
    status: "project-status", empty: "project-empty", one: "project", many: "projects" });
  setupFilter({ btn: "data-pub-filter", items: ".pub-item[data-year]", attr: "data-year",
    status: "pub-status", empty: "pub-empty", groups: "[data-pub-group]", one: "output", many: "outputs" });
})();
