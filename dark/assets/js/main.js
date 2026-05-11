
const PORTAL_FULLSCREEN_FRAME_PARAM = "fullscreenFrame";

function isPortalFullscreenFrame() {
  try {
    return window.self !== window.top && new URL(window.location.href).searchParams.get(PORTAL_FULLSCREEN_FRAME_PARAM) === "1";
  } catch (error) {
    return false;
  }
}

function fullscreenFrameUrl(href = window.location.href) {
  const url = new URL(href, window.location.href);
  url.searchParams.set(PORTAL_FULLSCREEN_FRAME_PARAM, "1");
  return url.href;
}

function displayUrlFromFrame(frame) {
  try {
    const url = new URL(frame.contentWindow.location.href);
    url.searchParams.delete(PORTAL_FULLSCREEN_FRAME_PARAM);
    return url.href;
  } catch (error) {
    return "";
  }
}

function prepareFullscreenFrame(frame) {
  try {
    const doc = frame.contentDocument;
    if (!doc) return;

    if (!doc.getElementById("portal-fullscreen-frame-style")) {
      const style = doc.createElement("style");
      style.id = "portal-fullscreen-frame-style";
      style.textContent = `
        .global-fullscreen-toggle,
        .subcontent-fullscreen,
        .tv-fullscreen-link{display:none!important}
      `;
      doc.head.appendChild(style);
    }

    doc.querySelectorAll("a[href]").forEach((link) => {
      if (link.hasAttribute("download")) return;
      const target = (link.getAttribute("target") || "").toLowerCase();
      if (target && target !== "_self") return;

      const url = new URL(link.getAttribute("href"), doc.location.href);
      if (url.origin !== window.location.origin) return;
      if (!/^https?:$/.test(url.protocol)) return;
      url.searchParams.set(PORTAL_FULLSCREEN_FRAME_PARAM, "1");
      link.setAttribute("href", url.href);
    });
  } catch (error) {
    // Cross-origin destinations cannot be adjusted; leave them alone.
  }
}

function ensureFullscreenOverlayStyles() {
  if (document.getElementById("portal-fullscreen-overlay-style")) return;

  const style = document.createElement("style");
  style.id = "portal-fullscreen-overlay-style";
  style.textContent = `
    .portal-fullscreen-overlay{position:fixed;inset:0;z-index:2147483647;background:#020817}
    .portal-fullscreen-frame{width:100%;height:100%;border:0;background:#fff}
    .portal-fullscreen-exit{position:fixed;top:12px;right:12px;z-index:2}
  `;
  document.head.appendChild(style);
}

function closePersistentFullscreenOverlay(syncLocation = false) {
  const overlay = document.querySelector("[data-portal-fullscreen-overlay]");
  const frame = overlay?.querySelector("iframe");
  const nextHref = syncLocation && frame ? displayUrlFromFrame(frame) : "";

  overlay?.remove();
  document.documentElement.classList.remove("portal-fullscreen-active");

  if (nextHref && nextHref !== window.location.href) {
    window.location.href = nextHref;
  }
}

function openPersistentFullscreenOverlay() {
  if (document.querySelector("[data-portal-fullscreen-overlay]")) return;

  ensureFullscreenOverlayStyles();

  const overlay = document.createElement("div");
  overlay.className = "portal-fullscreen-overlay";
  overlay.dataset.portalFullscreenOverlay = "true";

  const frame = document.createElement("iframe");
  frame.className = "portal-fullscreen-frame";
  frame.title = "Fullscreen site view";
  frame.src = fullscreenFrameUrl();

  const exitButton = document.createElement("button");
  exitButton.type = "button";
  exitButton.className = "global-fullscreen-toggle portal-fullscreen-exit";
  exitButton.textContent = "exit full screen";
  exitButton.setAttribute("aria-label", "Exit fullscreen");
  exitButton.setAttribute("aria-pressed", "true");

  frame.addEventListener("load", () => prepareFullscreenFrame(frame));
  exitButton.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen?.();
      }
    } catch (error) {
      // Keep the manual exit path usable if the browser blocks the promise.
    }
    closePersistentFullscreenOverlay(true);
  });

  overlay.append(frame, exitButton);
  document.body.appendChild(overlay);
  document.documentElement.classList.add("portal-fullscreen-active");
}

function initGlobalFullscreenToggle() {
  if (isPortalFullscreenFrame()) return;

  const target = document.fullscreenEnabled === false ? null : document.documentElement;
  if (!target?.requestFullscreen) return;

  const mount =
    document.querySelector(".site-shell-header .shell-header__inner") ||
    document.querySelector(".site-header .nav-wrap");

  if (!mount) return;

  let button = document.querySelector("[data-global-fullscreen]");

  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.className = "global-fullscreen-toggle";
    button.dataset.globalFullscreen = "true";
    button.setAttribute("aria-label", "Enter fullscreen");

    const menuButton = mount.querySelector(".shell-menu-btn, .menu-btn");
    mount.insertBefore(button, menuButton || null);
  }

  const syncLabel = () => {
    const isFullscreen = Boolean(document.fullscreenElement);
    button.textContent = isFullscreen ? "exit full screen" : "full screen";
    button.setAttribute("aria-label", isFullscreen ? "Exit fullscreen" : "Enter fullscreen");
    button.setAttribute("aria-pressed", String(isFullscreen));
  };

  if (!button.dataset.globalFullscreenReady) {
    button.dataset.globalFullscreenReady = "true";
    button.addEventListener("click", async () => {
      try {
        if (!document.fullscreenElement) {
          await target.requestFullscreen?.();
          openPersistentFullscreenOverlay();
        } else {
          await document.exitFullscreen?.();
          closePersistentFullscreenOverlay(true);
        }
      } catch (error) {
        // Some embedded browsers block fullscreen; leave the page usable.
      }
      syncLabel();
    });
  }

  if (!window.__globalFullscreenToggleBound) {
    window.__globalFullscreenToggleBound = true;
    document.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement) {
        closePersistentFullscreenOverlay(true);
      }
      document.querySelectorAll("[data-global-fullscreen]").forEach((fullscreenButton) => {
        const isFullscreen = Boolean(document.fullscreenElement);
        fullscreenButton.textContent = isFullscreen ? "exit full screen" : "full screen";
        fullscreenButton.setAttribute("aria-label", isFullscreen ? "Exit fullscreen" : "Enter fullscreen");
        fullscreenButton.setAttribute("aria-pressed", String(isFullscreen));
      });
    });
  }

  syncLabel();
}

document.addEventListener("DOMContentLoaded", () => {
  initGlobalFullscreenToggle();

  const menuButtons = document.querySelectorAll(".menu-btn");

  menuButtons.forEach((menuBtn) => {
    const nav = menuBtn.parentElement?.querySelector(".nav");
    if (!nav) return;

    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = nav.classList.toggle("open");
      menuBtn.classList.toggle("active", isOpen);
      menuBtn.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (e) => {
      const clickedInsideNav = nav.contains(e.target);
      const clickedMenuBtn = menuBtn.contains(e.target);
      if (!clickedInsideNav && !clickedMenuBtn && window.innerWidth <= 860) {
        nav.classList.remove("open");
        menuBtn.classList.remove("active");
        menuBtn.setAttribute("aria-expanded", "false");
      }
    });
  });

  const expandButtons = document.querySelectorAll(".img-expand-btn");
  const zoomableImages = document.querySelectorAll(".zoom-img");

  if (expandButtons.length || zoomableImages.length) {
    const overlay = document.createElement("div");
    overlay.className = "image-lightbox";
    overlay.innerHTML = `
      <div class="image-lightbox__dialog" role="dialog" aria-modal="true" aria-label="Expanded image view">
        <button class="image-lightbox__close" type="button" aria-label="Close expanded image">×</button>
        <img class="image-lightbox__img" src="" alt="" />
      </div>
    `;

    document.body.appendChild(overlay);

    const overlayImg = overlay.querySelector(".image-lightbox__img");
    const closeBtn = overlay.querySelector(".image-lightbox__close");

    const openLightbox = (src, alt = "") => {
      overlayImg.src = src;
      overlayImg.alt = alt;
      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
    };

    const closeLightbox = () => {
      overlay.classList.remove("open");
      overlayImg.src = "";
      overlayImg.alt = "";
      document.body.style.overflow = "";
    };

    expandButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const fullSrc = button.getAttribute("data-full");
        const altText = button.getAttribute("data-alt") || "";
        if (fullSrc) openLightbox(fullSrc, altText);
      });
    });

    zoomableImages.forEach((img) => {
      img.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const fullSrc = img.currentSrc || img.src;
        const altText = img.alt || "";
        if (fullSrc) openLightbox(fullSrc, altText);
      });
    });

    closeBtn.addEventListener("click", closeLightbox);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeLightbox();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && overlay.classList.contains("open")) closeLightbox();
    });
  }


  const notif = document.getElementById("floatingNotif");
  if (notif) {
    const syncNotif = () => {
      if (window.scrollY > 650 && window.innerWidth > 768) {
        notif.classList.add("hide-notif");
      } else {
        notif.classList.remove("hide-notif");
      }
    };

    syncNotif();
    window.addEventListener("scroll", syncNotif, { passive: true });
    window.addEventListener("resize", syncNotif);
  }

  function initResearchWatchSlider() {
  const slider = document.getElementById("researchWatchSlider");
  const viewport = slider?.querySelector(".watch-viewport");
  const track = document.getElementById("watchTrack");
  const dotsWrap = document.getElementById("watchDots");
  const progressFill = document.getElementById("watchProgressFill");
  const progressText = document.getElementById("watchProgressText");

  if (!slider || !viewport || !track || !dotsWrap) return;

  const cards = Array.from(track.querySelectorAll(".watch-card"));
  const prevBtn = slider.querySelector(".watch-prev");
  const nextBtn = slider.querySelector(".watch-next");

  let index = 0;
  let autoSlide = null;
  let isDragging = false;
  let dragStartX = 0;
  let dragOffset = 0;
  let suppressClick = false;

  const visibleCards = () => (window.innerWidth <= 1100 ? 1 : 2);
  const slideCount = () => Math.max(1, cards.length - visibleCards() + 1);
  const maxIndex = () => slideCount() - 1;

  const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

  const getStepWidth = () => {
    if (!cards.length) return 0;
    const cardWidth = cards[0].getBoundingClientRect().width;
    const styles = window.getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;
    return cardWidth + gap;
  };

  const setTrackOffset = (offset, animate = true) => {
    track.style.transition = animate ? "transform 0.55s ease" : "none";
    track.style.transform = `translateX(-${offset}px)`;
  };

  const syncDots = () => {
    Array.from(dotsWrap.children).forEach((dot, dotIndex) => {
      dot.classList.toggle("active", dotIndex === index);
    });
  };

  const syncProgress = () => {
    const total = slideCount();
    const percent = ((index + 1) / total) * 100;

    if (progressFill) {
      progressFill.style.width = `${percent}%`;
    }

    if (progressText) {
      const currentText = String(index + 1).padStart(2, "0");
      const totalText = String(total).padStart(2, "0");
      progressText.textContent = `${currentText} / ${totalText}`;
    }
  };

  const buildDots = () => {
    const total = slideCount();
    dotsWrap.innerHTML = "";

    for (let i = 0; i < total; i += 1) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = `watch-dot${i === index ? " active" : ""}`;
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dot.addEventListener("click", () => {
        update(i);
        startAuto();
      });
      dotsWrap.appendChild(dot);
    }
  };

  const update = (nextIndex, animate = true) => {
    index = clamp(nextIndex, 0, maxIndex());
    const offset = index * getStepWidth();
    setTrackOffset(offset, animate);
    syncDots();
    syncProgress();
  };

  const next = () => {
    const nextIndex = index >= maxIndex() ? 0 : index + 1;
    update(nextIndex);
  };

  const prev = () => {
    const prevIndex = index <= 0 ? maxIndex() : index - 1;
    update(prevIndex);
  };

  const stopAuto = () => {
    if (autoSlide) {
      window.clearInterval(autoSlide);
      autoSlide = null;
    }
  };

  const startAuto = () => {
    stopAuto();
    if (slideCount() <= 1) return;
    autoSlide = window.setInterval(next, 4200);
  };

  const onPointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    isDragging = true;
    dragStartX = event.clientX;
    dragOffset = 0;
    suppressClick = false;

    viewport.classList.add("is-dragging");
    track.style.transition = "none";

    if (viewport.setPointerCapture) {
      viewport.setPointerCapture(event.pointerId);
    }

    stopAuto();
  };

  const onPointerMove = (event) => {
    if (!isDragging) return;

    dragOffset = event.clientX - dragStartX;

    if (Math.abs(dragOffset) > 8) {
      suppressClick = true;
    }

    const baseOffset = index * getStepWidth();
    let liveOffset = baseOffset - dragOffset;

    const minOffset = 0;
    const maxOffset = maxIndex() * getStepWidth();

    if (liveOffset < minOffset) {
      liveOffset = minOffset - (minOffset - liveOffset) * 0.18;
    }

    if (liveOffset > maxOffset) {
      liveOffset = maxOffset + (liveOffset - maxOffset) * 0.18;
    }

    setTrackOffset(liveOffset, false);
  };

  const onPointerEnd = (event) => {
    if (!isDragging) return;

    isDragging = false;
    viewport.classList.remove("is-dragging");

    if (viewport.releasePointerCapture) {
      try {
        viewport.releasePointerCapture(event.pointerId);
      } catch (error) {
        // ignore safe release errors
      }
    }

    const threshold = getStepWidth() * 0.18;

    if (dragOffset <= -threshold) {
      next();
    } else if (dragOffset >= threshold) {
      prev();
    } else {
      update(index);
    }

    window.setTimeout(() => {
      suppressClick = false;
    }, 0);

    startAuto();
  };

  cards.forEach((card) => {
    card.addEventListener("click", (event) => {
      if (suppressClick) {
        event.preventDefault();
        event.stopPropagation();
      }
    });
  });

  prevBtn?.addEventListener("click", () => {
    prev();
    startAuto();
  });

  nextBtn?.addEventListener("click", () => {
    next();
    startAuto();
  });

  slider.addEventListener("mouseenter", stopAuto);
  slider.addEventListener("mouseleave", startAuto);

  viewport.addEventListener("pointerdown", onPointerDown);
  viewport.addEventListener("pointermove", onPointerMove);
  viewport.addEventListener("pointerup", onPointerEnd);
  viewport.addEventListener("pointercancel", onPointerEnd);

  viewport.addEventListener("pointerleave", (event) => {
    if (isDragging && event.pointerType === "mouse") {
      onPointerEnd(event);
    }
  });

  window.addEventListener("resize", () => {
    buildDots();
    update(Math.min(index, maxIndex()), false);
    startAuto();
  });

  buildDots();
  update(0, false);
  startAuto();
}
  initResearchWatchSlider();

  const accordions = document.querySelectorAll(".accordion");

  const syncAccordion = (accordion, open) => {
    const trigger = accordion.querySelector(".accordion-trigger");
    const panel = accordion.querySelector(".accordion-panel");
    if (!trigger || !panel) return;
    accordion.classList.toggle("is-open", open);
    trigger.setAttribute("aria-expanded", String(open));
    panel.setAttribute("aria-hidden", String(!open));
    panel.style.maxHeight = open ? `${panel.scrollHeight}px` : "0px";
  };

  accordions.forEach((accordion, index) => {
    const trigger = accordion.querySelector(".accordion-trigger");
    const panel = accordion.querySelector(".accordion-panel");
    if (!trigger || !panel) return;

    if (!panel.id) {
      panel.id = `accordion-panel-${index + 1}`;
    }

    trigger.setAttribute("aria-controls", panel.id);
    const startsOpen = accordion.classList.contains("is-open");
    syncAccordion(accordion, startsOpen);

    trigger.addEventListener("click", () => {
      const willOpen = !accordion.classList.contains("is-open");
      const group = accordion.getAttribute("data-accordion-group");

      if (group && willOpen) {
        document.querySelectorAll(`.accordion[data-accordion-group="${group}"]`).forEach((item) => {
          if (item !== accordion) syncAccordion(item, false);
        });
      }

      syncAccordion(accordion, willOpen);
    });
  });

  window.addEventListener("resize", () => {
    accordions.forEach((accordion) => {
      if (accordion.classList.contains("is-open")) {
        const panel = accordion.querySelector(".accordion-panel");
        if (panel) panel.style.maxHeight = `${panel.scrollHeight}px`;
      }
    });
  });

});
