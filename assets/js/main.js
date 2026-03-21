
document.addEventListener("DOMContentLoaded", () => {
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
    const track = document.getElementById("watchTrack");
    const dotsWrap = document.getElementById("watchDots");

    if (!slider || !track || !dotsWrap) return;

    const cards = Array.from(track.querySelectorAll(".watch-card"));
    const prevBtn = slider.querySelector(".watch-prev");
    const nextBtn = slider.querySelector(".watch-next");
    let index = 0;
    let autoSlide = null;

    const visibleCards = () => (window.innerWidth <= 1100 ? 1 : 2);
    const maxIndex = () => Math.max(0, cards.length - visibleCards());

    const getStepWidth = () => {
      if (!cards.length) return 0;
      const cardWidth = cards[0].getBoundingClientRect().width;
      const gap = parseFloat(window.getComputedStyle(track).columnGap || window.getComputedStyle(track).gap || "0") || 0;
      return cardWidth + gap;
    };

    const buildDots = () => {
      const total = maxIndex() + 1;
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

    const update = (nextIndex) => {
      index = Math.max(0, Math.min(nextIndex, maxIndex()));
      const offset = index * getStepWidth();
      track.style.transform = `translateX(-${offset}px)`;
      Array.from(dotsWrap.children).forEach((dot, dotIndex) => {
        dot.classList.toggle("active", dotIndex === index);
      });
    };

    const next = () => {
      index = index >= maxIndex() ? 0 : index + 1;
      update(index);
    };

    const prev = () => {
      index = index <= 0 ? maxIndex() : index - 1;
      update(index);
    };

    const stopAuto = () => {
      if (autoSlide) {
        window.clearInterval(autoSlide);
        autoSlide = null;
      }
    };

    const startAuto = () => {
      stopAuto();
      if (cards.length <= visibleCards()) return;
      autoSlide = window.setInterval(next, 4200);
    };

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

    window.addEventListener("resize", () => {
      buildDots();
      update(Math.min(index, maxIndex()));
      startAuto();
    });

    buildDots();
    update(0);
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
