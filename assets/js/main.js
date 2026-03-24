document.addEventListener("DOMContentLoaded", () => {
  /* --- 1. THEME TOGGLE LOGIC --- */
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;

  if (themeToggle) {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') body.classList.add('light-mode');

    themeToggle.addEventListener('click', () => {
      body.classList.toggle('light-mode');
      localStorage.setItem('theme', body.classList.contains('light-mode') ? 'light' : 'dark');
    });
  }

  /* --- 2. SCROLL REVEAL ANIMATIONS --- */
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

  revealElements.forEach(el => revealObserver.observe(el));

  /* --- 3. MENU BUTTON LOGIC (Existing) --- */
  const menuButtons = document.querySelectorAll(".menu-btn");
  menuButtons.forEach((menuBtn) => {
    const nav = menuBtn.parentElement?.querySelector(".nav");
    if (!nav) return;

    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = nav.classList.toggle("open");
      menuBtn.classList.toggle("active", isOpen);
    });

    document.addEventListener("click", (e) => {
      if (!nav.contains(e.target) && !menuBtn.contains(e.target) && window.innerWidth <= 860) {
        nav.classList.remove("open");
        menuBtn.classList.remove("active");
      }
    });
  });

  /* --- 4. LIGHTBOX LOGIC (Existing) --- */
  const expandButtons = document.querySelectorAll(".img-expand-btn");
  const zoomableImages = document.querySelectorAll(".zoom-img");

  if (expandButtons.length || zoomableImages.length) {
    const overlay = document.createElement("div");
    overlay.className = "image-lightbox";
    overlay.innerHTML = `
      <div class="image-lightbox__dialog" role="dialog" aria-modal="true">
        <button class="image-lightbox__close" type="button">×</button>
        <img class="image-lightbox__img" src="" alt="" />
      </div>`;
    document.body.appendChild(overlay);

    const overlayImg = overlay.querySelector(".image-lightbox__img");
    const closeLightbox = () => {
      overlay.classList.remove("open");
      document.body.style.overflow = "";
    };

    [...expandButtons, ...zoomableImages].forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        overlayImg.src = el.getAttribute("data-full") || el.src;
        overlay.classList.add("open");
        document.body.style.overflow = "hidden";
      });
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target.classList.contains('image-lightbox__close')) closeLightbox();
    });
  }

  /* --- 5. FLOATING NOTIFICATION (Existing) --- */
  const notif = document.getElementById("floatingNotif");
  if (notif) {
    const syncNotif = () => {
      if (window.scrollY > 650 && window.innerWidth > 768) {
        notif.classList.add("hide-notif");
      } else {
        notif.classList.remove("hide-notif");
      }
    };
    window.addEventListener("scroll", syncNotif, { passive: true });
  }

  /* --- 6. ACCORDION LOGIC (Existing) --- */
  const accordions = document.querySelectorAll(".accordion");
  accordions.forEach((accordion) => {
    const trigger = accordion.querySelector(".accordion-trigger");
    const panel = accordion.querySelector(".accordion-panel");
    if (!trigger || !panel) return;

    trigger.addEventListener("click", () => {
      const isOpen = accordion.classList.toggle("is-open");
      panel.style.maxHeight = isOpen ? `${panel.scrollHeight}px` : "0px";
    });
  });
});