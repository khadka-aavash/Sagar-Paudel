/* ==========================================================================
   script.js — Sagar Paudel · Portfolio
   Vanilla JS, no dependencies:
     · mobile menu drawer          · scroll reveals
     · smooth scrolling            · project filtering
     · theme toggle (light/dark)   · speaking rail controls
     · active-link highlighting    · feature modal (focus trap, ESC, overlay)
     · copy-to-clipboard email     · footer year
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
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
  var projectCards = Array.prototype.slice.call(document.querySelectorAll(".project-card[data-category]"));
  var filterStatus = document.getElementById("filter-status");
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

  /* ---------------- Project category filtering ---------------- */
  function applyFilter(filter) {
    var shown = 0;
    projectCards.forEach(function (card) {
      var match = filter === "all" || card.getAttribute("data-category") === filter;
      card.classList.remove("pop-in");
      if (match) {
        shown += 1;
        card.hidden = false;
        void card.offsetWidth; /* restart entry animation */
        card.classList.add("pop-in");
      } else {
        card.hidden = true;
      }
    });
    if (filterStatus) {
      filterStatus.textContent = filter === "all"
        ? "Showing all " + shown + " projects"
        : "Showing " + shown + " " + filter + " project" + (shown === 1 ? "" : "s");
    }
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      filterButtons.forEach(function (other) {
        var isActive = other === button;
        other.classList.toggle("is-active", isActive);
        other.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
      applyFilter(button.getAttribute("data-filter") || "all");
    });
  });

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

    function openModal(card) {
      if (closeTimer) { window.clearTimeout(closeTimer); closeTimer = null; }
      lastFocused = document.activeElement;
      fillModal(card);
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
    Array.prototype.forEach.call(document.querySelectorAll("[data-feature]"), function (card) {
      card.addEventListener("click", function (event) {
        if (event.target.closest("a")) return; /* let real links behave normally */
        openModal(card);
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
