
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

  const lightboxSelector = ".img-expand-btn, .zoom-img, .zoomable-thumb";
  const lightboxTargets = document.querySelectorAll(lightboxSelector);

  if (lightboxTargets.length) {
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

    const getLightboxPayload = (target) => {
      if (target.matches(".img-expand-btn")) {
        return {
          src: target.getAttribute("data-full"),
          alt: target.getAttribute("data-alt") || "",
        };
      }

      return {
        src: target.currentSrc || target.src,
        alt: target.alt || "",
      };
    };

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

    document.addEventListener(
      "click",
      (event) => {
        const trigger = event.target.closest(lightboxSelector);
        if (!trigger || overlay.contains(trigger)) return;

        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") {
          event.stopImmediatePropagation();
        }

        const { src, alt } = getLightboxPayload(trigger);
        if (src) openLightbox(src, alt);
      },
      true,
    );

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

  function initWatchTopicVisuals() {
    const notes = document.querySelectorAll(".watch-note.accordion");
    if (!notes.length) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const presets = [
      {
        matches: ["agentic"],
        theme: "agentic",
        title: "Agentic decision flow",
        caption: "A goal turns into tool selection, chained actions, and an oversight burden that grows with autonomy.",
        steps: ["Goal input", "Tool choice", "Action chain", "Oversight loop"],
        details: [
          "A human objective is translated into machine-actionable intent.",
          "The system selects tools, memory, or APIs that expand capability and exposure.",
          "Multi-step execution compounds hidden errors, misuse, or unsafe delegation.",
          "Safety depends on oversight that can interrupt action before real-world impact.",
        ],
      },
      {
        matches: ["edge", "embedded", "iot", "armada", "fleet"],
        theme: "edge",
        title: "Edge deployment flow",
        caption: "The risk grows as local devices meet patch lag, operational drift, and fleet-wide exposure.",
        steps: ["Edge device", "Local exposure", "Operational drift", "Fleet hardening"],
        details: [
          "The model leaves centralized infrastructure and starts running on distributed hardware.",
          "Physical access, local interfaces, and weaker operational boundaries increase exposure.",
          "Patch lag, version drift, and uneven monitoring widen the attack surface over time.",
          "Security improves only when fleet controls close the loop across every deployed node.",
        ],
      },
      {
        matches: ["physical", "embodied", "automotive", "macsec", "vehicle", "sensor"],
        theme: "physical",
        title: "Cyber-physical impact flow",
        caption: "Small integrity failures can travel from sensing or communication layers into control and safety outcomes.",
        steps: ["Sensing/link", "Control path", "Safety effect", "Trusted recovery"],
        details: [
          "The first weakness appears in sensing, communication, or timing integrity.",
          "That weakness propagates into the control path that the system trusts for decisions.",
          "Once control is affected, the failure becomes a safety or mission-level consequence.",
          "Recovery requires trusted fallback behavior, verification, and safe-state control.",
        ],
      },
      {
        matches: ["software", "code", "offensive", "enclave", "protect ai", "protectai", "supply chain", "pipeline"],
        theme: "software",
        title: "Software attack flow",
        caption: "The issue moves from artifacts into pipeline trust, runtime behavior, and containment controls.",
        steps: ["Artifacts", "Pipeline trust", "Runtime abuse", "Control layer"],
        details: [
          "Models, weights, data, dependencies, or code artifacts enter the software pipeline.",
          "If the pipeline trusts them too easily, the attacker gains leverage before deployment.",
          "The abuse then appears at runtime through execution, extraction, or policy bypass.",
          "Containment depends on verification, monitoring, and enforceable control boundaries.",
        ],
      },
      {
        matches: ["cloud", "identity", "privilege", "encrypted", "compute", "soc", "runtime", "oligo", "qevlar", "cloudflare"],
        theme: "cloud",
        title: "Cloud control flow",
        caption: "Identity, workload, and runtime boundaries decide how quickly local exposure becomes system-wide risk.",
        steps: ["Access edge", "Live workload", "Privilege path", "Continuous control"],
        details: [
          "Exposure starts where identity, networking, or external access first touches the system.",
          "The next question is what the attacker can influence in the live workload itself.",
          "Privilege expansion determines whether the issue stays local or becomes systemic.",
          "Continuous controls must keep shrinking the blast radius while the system is running.",
        ],
      },
      {
        matches: ["glasswing", "evaluation", "safety", "accelerating", "research", "stack"],
        theme: "evaluation",
        title: "Assurance gap flow",
        caption: "Capability growth creates pressure on evaluation, leaving deployed behavior ahead of assurance.",
        steps: ["Capability shift", "Evaluation gap", "Risk surface", "Assurance redesign"],
        details: [
          "Model capability or deployment scope changes faster than the old assumptions allow.",
          "Existing evaluation methods fail to measure the new behavior that matters in practice.",
          "That gap leaves a real risk surface between benchmark confidence and deployed reality.",
          "Assurance has to be redesigned around scenarios, systems, and continuous validation.",
        ],
      },
    ];

    const fallback = {
      theme: "generic",
      title: "Security interpretation flow",
      caption: "A useful reading path is to ask what changes, where exposure appears, what system consequence follows, and which control responds.",
      steps: ["System change", "Exposure", "Consequence", "Response"],
      details: [
        "Start by identifying the technical or organizational change that introduces the topic.",
        "Then locate the point where exposure or attacker leverage first appears.",
        "Next ask what real system consequence follows if that exposure is exploited.",
        "Finally map the control, guardrail, or design change that can contain the risk.",
      ],
    };

    const getConfig = (note) => {
      const title = note.querySelector(".accordion-title")?.textContent || "";
      const preview = note.querySelector(".accordion-preview")?.textContent || "";
      const haystack = `${note.id} ${note.getAttribute("data-category") || ""} ${title} ${preview}`.toLowerCase();
      return presets.find((preset) => preset.matches.some((token) => haystack.includes(token))) || fallback;
    };

    const renderScene = (config) => {
      switch (config.theme) {
        case "agentic":
          return `
            <div class="watch-topic-visual__scene watch-topic-visual__scene--agentic" aria-hidden="true">
              <span class="watch-scene__path watch-scene__path--agentic-a watch-scene__actor" data-stage="1"></span>
              <span class="watch-scene__path watch-scene__path--agentic-b watch-scene__actor" data-stage="2"></span>
              <span class="watch-scene__path watch-scene__path--agentic-c watch-scene__actor" data-stage="3"></span>
              <div class="watch-scene__node watch-scene__node--goal watch-scene__actor" data-stage="0"><strong>Goal</strong><span>Prompt or mission</span></div>
              <div class="watch-scene__node watch-scene__node--planner watch-scene__actor" data-stage="1"><strong>Planner</strong><span>Chooses route</span></div>
              <div class="watch-scene__mini watch-scene__mini--tool-a watch-scene__actor" data-stage="1">API</div>
              <div class="watch-scene__mini watch-scene__mini--tool-b watch-scene__actor" data-stage="1">RAG</div>
              <div class="watch-scene__mini watch-scene__mini--tool-c watch-scene__actor" data-stage="1">Shell</div>
              <div class="watch-scene__node watch-scene__node--action watch-scene__actor" data-stage="2"><strong>Actions</strong><span>Runs in systems</span></div>
              <div class="watch-scene__node watch-scene__node--human watch-scene__actor" data-stage="3"><strong>Oversight</strong><span>Human checkpoint</span></div>
              <div class="watch-scene__ring watch-scene__ring--oversight watch-scene__actor" data-stage="3"></div>
              <span class="watch-scene__token"></span>
            </div>
          `;
        case "edge":
          return `
            <div class="watch-topic-visual__scene watch-topic-visual__scene--edge" aria-hidden="true">
              <div class="watch-scene__node watch-scene__node--cloud watch-scene__actor" data-stage="0"><strong>Cloud brain</strong><span>Model + updates</span></div>
              <span class="watch-scene__path watch-scene__path--edge-a watch-scene__actor" data-stage="0"></span>
              <div class="watch-scene__node watch-scene__node--device-a watch-scene__actor" data-stage="1"><strong>Edge device</strong><span>Local interfaces</span></div>
              <div class="watch-scene__node watch-scene__node--device-b watch-scene__actor" data-stage="1"><strong>Field node</strong><span>Physical exposure</span></div>
              <div class="watch-scene__band watch-scene__band--drift watch-scene__actor" data-stage="2"><span>Patch lag and drift widen the fleet attack surface</span></div>
              <div class="watch-scene__node watch-scene__node--control watch-scene__actor" data-stage="3"><strong>Fleet control</strong><span>Policy and recovery</span></div>
              <div class="watch-scene__shield watch-scene__shield--fleet watch-scene__actor" data-stage="3"></div>
              <span class="watch-scene__token"></span>
            </div>
          `;
        case "physical":
          return `
            <div class="watch-topic-visual__scene watch-topic-visual__scene--physical" aria-hidden="true">
              <div class="watch-scene__node watch-scene__node--sensor watch-scene__actor" data-stage="0"><strong>Sensing</strong><span>Signal integrity</span></div>
              <span class="watch-scene__path watch-scene__path--physical-a watch-scene__actor" data-stage="0"></span>
              <div class="watch-scene__node watch-scene__node--controller watch-scene__actor" data-stage="1"><strong>Controller</strong><span>Decision logic</span></div>
              <span class="watch-scene__path watch-scene__path--physical-b watch-scene__actor" data-stage="1"></span>
              <div class="watch-scene__node watch-scene__node--actuator watch-scene__actor" data-stage="2"><strong>Actuation</strong><span>Real-world effect</span></div>
              <div class="watch-scene__shield watch-scene__shield--safety watch-scene__actor" data-stage="3"></div>
              <div class="watch-scene__node watch-scene__node--recovery watch-scene__actor" data-stage="3"><strong>Safe state</strong><span>Recovery path</span></div>
              <span class="watch-scene__token"></span>
            </div>
          `;
        case "software":
          return `
            <div class="watch-topic-visual__scene watch-topic-visual__scene--software" aria-hidden="true">
              <div class="watch-scene__node watch-scene__node--artifact watch-scene__actor" data-stage="0"><strong>Artifacts</strong><span>Code, weights, data</span></div>
              <span class="watch-scene__path watch-scene__path--software-a watch-scene__actor" data-stage="0"></span>
              <div class="watch-scene__node watch-scene__node--gate watch-scene__actor" data-stage="1"><strong>Pipeline gate</strong><span>Scan and verify</span></div>
              <span class="watch-scene__path watch-scene__path--software-b watch-scene__actor" data-stage="1"></span>
              <div class="watch-scene__node watch-scene__node--runtime watch-scene__actor" data-stage="2"><strong>Runtime</strong><span>Execution surface</span></div>
              <div class="watch-scene__node watch-scene__node--monitor watch-scene__actor" data-stage="3"><strong>Control layer</strong><span>Observe and contain</span></div>
              <div class="watch-scene__shield watch-scene__shield--runtime watch-scene__actor" data-stage="3"></div>
              <span class="watch-scene__token"></span>
            </div>
          `;
        case "cloud":
          return `
            <div class="watch-topic-visual__scene watch-topic-visual__scene--cloud" aria-hidden="true">
              <div class="watch-scene__node watch-scene__node--identity watch-scene__actor" data-stage="0"><strong>Identity edge</strong><span>Credentials and ingress</span></div>
              <span class="watch-scene__path watch-scene__path--cloud-a watch-scene__actor" data-stage="0"></span>
              <div class="watch-scene__cluster watch-scene__cluster--workload watch-scene__actor" data-stage="1">
                <strong>Live workload</strong>
                <span>Inference pods and services</span>
              </div>
              <span class="watch-scene__path watch-scene__path--cloud-b watch-scene__actor" data-stage="1"></span>
              <div class="watch-scene__node watch-scene__node--privilege watch-scene__actor" data-stage="2"><strong>Privilege path</strong><span>Lateral reach</span></div>
              <div class="watch-scene__node watch-scene__node--guard watch-scene__actor" data-stage="3"><strong>Continuous control</strong><span>Limit blast radius</span></div>
              <div class="watch-scene__ring watch-scene__ring--boundary watch-scene__actor" data-stage="3"></div>
              <span class="watch-scene__token"></span>
            </div>
          `;
        case "evaluation":
          return `
            <div class="watch-topic-visual__scene watch-topic-visual__scene--evaluation" aria-hidden="true">
              <div class="watch-scene__bars watch-scene__bars--capability watch-scene__actor" data-stage="0">
                <span class="watch-scene__bar watch-scene__bar--a"></span>
                <span class="watch-scene__bar watch-scene__bar--b"></span>
                <span class="watch-scene__bar watch-scene__bar--c"></span>
              </div>
              <div class="watch-scene__node watch-scene__node--lab watch-scene__actor" data-stage="1"><strong>Evaluation lab</strong><span>Scenarios and tests</span></div>
              <div class="watch-scene__band watch-scene__band--gap watch-scene__actor" data-stage="2"><span>Capability is moving faster than assurance</span></div>
              <div class="watch-scene__node watch-scene__node--assurance watch-scene__actor" data-stage="3"><strong>Assurance loop</strong><span>Continuous validation</span></div>
              <span class="watch-scene__path watch-scene__path--evaluation-a watch-scene__actor" data-stage="1"></span>
              <span class="watch-scene__path watch-scene__path--evaluation-b watch-scene__actor" data-stage="3"></span>
              <span class="watch-scene__token"></span>
            </div>
          `;
        default:
          return `
            <div class="watch-topic-visual__scene watch-topic-visual__scene--generic" aria-hidden="true">
              <div class="watch-scene__node watch-scene__node--generic-a watch-scene__actor" data-stage="0"><strong>Change</strong><span>What shifts first</span></div>
              <span class="watch-scene__path watch-scene__path--generic-a watch-scene__actor" data-stage="0"></span>
              <div class="watch-scene__node watch-scene__node--generic-b watch-scene__actor" data-stage="1"><strong>Exposure</strong><span>Where leverage appears</span></div>
              <span class="watch-scene__path watch-scene__path--generic-b watch-scene__actor" data-stage="1"></span>
              <div class="watch-scene__node watch-scene__node--generic-c watch-scene__actor" data-stage="2"><strong>Consequence</strong><span>System effect</span></div>
              <span class="watch-scene__path watch-scene__path--generic-c watch-scene__actor" data-stage="2"></span>
              <div class="watch-scene__node watch-scene__node--generic-d watch-scene__actor" data-stage="3"><strong>Response</strong><span>Control and recovery</span></div>
              <span class="watch-scene__token"></span>
            </div>
          `;
      }
    };

    notes.forEach((note) => {
      const panelInner = note.querySelector(".accordion-panel-inner");
      if (!panelInner || panelInner.querySelector(".watch-topic-visual")) return;

      const config = getConfig(note);
      const visual = document.createElement("section");
      visual.className = `watch-topic-visual watch-topic-visual--${config.theme}`;
      visual.setAttribute("aria-label", `${config.title}. ${config.caption}`);
      visual.innerHTML = `
        <div class="watch-topic-visual__head">
          <span class="watch-topic-visual__eyebrow">Visual flow</span>
          <h4>${config.title}</h4>
          <p>${config.caption}</p>
        </div>
        ${renderScene(config)}
        <div class="watch-topic-visual__rail" aria-hidden="true">
          <span class="watch-topic-visual__beam">
            <span class="watch-topic-visual__progress"></span>
            <span class="watch-topic-visual__traveler"></span>
          </span>
          ${config.steps
            .map(
              (step, index) => `
            <div class="watch-topic-visual__node" style="--node-index:${index}">
              <span class="watch-topic-visual__index">0${index + 1}</span>
              <strong>${step}</strong>
              <span class="watch-topic-visual__detail">${config.details[index] || ""}</span>
            </div>
          `,
            )
            .join("")}
        </div>
      `;

      panelInner.insertBefore(visual, panelInner.firstChild);

      const trigger = note.querySelector(".accordion-trigger");
      const nodes = Array.from(visual.querySelectorAll(".watch-topic-visual__node"));
      const sceneActors = Array.from(visual.querySelectorAll(".watch-scene__actor"));
      let activeIndex = 0;
      let intervalId = null;

      const setActive = (index) => {
        const progress = nodes.length > 1 ? `${(index / (nodes.length - 1)) * 100}%` : "0%";
        visual.style.setProperty("--travel-percent", progress);
        visual.dataset.activeStage = String(index);
        nodes.forEach((node, nodeIndex) => {
          node.classList.toggle("is-active", nodeIndex === index);
          node.classList.toggle("is-complete", nodeIndex < index);
        });
        sceneActors.forEach((actor) => {
          const stage = Number(actor.dataset.stage || "-1");
          actor.classList.toggle("is-active", stage === index);
          actor.classList.toggle("is-complete", stage > -1 && stage < index);
        });
      };

      setActive(0);

      if (trigger) {
        trigger.addEventListener("click", () => {
          if (!note.classList.contains("is-open")) {
            activeIndex = 0;
            window.setTimeout(() => setActive(0), 180);
          }
        });
      }

      const stopPlayback = () => {
        if (intervalId) {
          window.clearInterval(intervalId);
          intervalId = null;
        }
      };

      const startPlayback = () => {
        if (prefersReducedMotion || nodes.length <= 1 || intervalId) return;
        intervalId = window.setInterval(() => {
          if (!note.classList.contains("is-open")) return;
          activeIndex = (activeIndex + 1) % nodes.length;
          setActive(activeIndex);
        }, 3200);
      };

      visual.addEventListener("mouseenter", stopPlayback);
      visual.addEventListener("mouseleave", startPlayback);

      if (!prefersReducedMotion && nodes.length > 1) {
        startPlayback();
      }
    });
  }

  initWatchTopicVisuals();

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
