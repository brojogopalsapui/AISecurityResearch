(function(){
  function initMenu(){
    const btn = document.getElementById('shellMenuBtn');
    const nav = document.getElementById('shellNav');
    if (!btn || !nav) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = nav.classList.toggle('open');
      btn.classList.toggle('active', open);
      btn.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('nav-open', open);
    });
    document.addEventListener('click', (e) => {
      if (!nav.classList.contains('open')) return;
      if (!nav.contains(e.target) && !btn.contains(e.target)) {
        nav.classList.remove('open');
        btn.classList.remove('active');
        btn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      }
    });
  }

  function createLightbox(){
    let overlay = document.querySelector('.portal-lightbox');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'portal-lightbox';
    overlay.innerHTML = `
      <div class="portal-lightbox__dialog" role="dialog" aria-modal="true" aria-label="Expanded image view">
        <button class="portal-lightbox__close" type="button" aria-label="Close expanded image">×</button>
        <img class="portal-lightbox__img" src="" alt="" />
      </div>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  function initLightbox(){
    const lightboxSelector = '.img-expand-btn, .zoom-img, .zoomable-thumb, .hero-figure-img, .feature-media img, .portal-media img, .visual-panel img';
    const targets = document.querySelectorAll(lightboxSelector);
    if (!targets.length) return;
    const overlay = createLightbox();
    const img = overlay.querySelector('.portal-lightbox__img');
    const closeBtn = overlay.querySelector('.portal-lightbox__close');

    const close = () => {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      img.src = '';
      img.alt = '';
    };

    const open = (src, alt='') => {
      if (!src) return;
      img.src = src;
      img.alt = alt;
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    document.addEventListener('click', (e) => {
      const target = e.target.closest(lightboxSelector);
      if (!target || overlay.contains(target)) return;

      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === 'function') {
        e.stopImmediatePropagation();
      }

      const src = target.matches('.img-expand-btn') ? target.getAttribute('data-full') : (target.currentSrc || target.src);
      const alt = target.matches('.img-expand-btn') ? (target.getAttribute('data-alt') || 'Expanded image') : (target.alt || 'Expanded image');
      open(src, alt);
    }, true);

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('open')) close(); });
  }

  function initAccordions(){
    const accordions = document.querySelectorAll('.accordion');
    if (!accordions.length) return;

    const syncAccordion = (accordion, open) => {
      const trigger = accordion.querySelector('.accordion-trigger');
      const panel = accordion.querySelector('.accordion-panel');
      if (!trigger || !panel) return;
      accordion.classList.toggle('is-open', open);
      trigger.setAttribute('aria-expanded', String(open));
      panel.setAttribute('aria-hidden', String(!open));
      panel.style.maxHeight = open ? `${panel.scrollHeight}px` : '0px';
    };

    accordions.forEach((accordion, index) => {
      const trigger = accordion.querySelector('.accordion-trigger');
      const panel = accordion.querySelector('.accordion-panel');
      if (!trigger || !panel) return;
      if (!panel.id) panel.id = `portal-accordion-panel-${index + 1}`;
      trigger.setAttribute('aria-controls', panel.id);
      syncAccordion(accordion, accordion.classList.contains('is-open'));
      trigger.addEventListener('click', () => {
        const willOpen = !accordion.classList.contains('is-open');
        const group = accordion.getAttribute('data-accordion-group');
        if (group && willOpen) {
          document.querySelectorAll(`.accordion[data-accordion-group="${group}"]`).forEach(item => {
            if (item !== accordion) syncAccordion(item, false);
          });
        }
        syncAccordion(accordion, willOpen);
      });
    });

    window.addEventListener('resize', () => {
      accordions.forEach(accordion => {
        if (accordion.classList.contains('is-open')) {
          const panel = accordion.querySelector('.accordion-panel');
          if (panel) panel.style.maxHeight = `${panel.scrollHeight}px`;
        }
      });
    });
  }

  function initReveal(){
    const nodes = document.querySelectorAll('main > section, .content-card, .post-card, .topic-card, .section-card, .panel, .feature-card, .quick-card, .pulse-card, .profile-card, .resource-card, .watch-note');
    if (!('IntersectionObserver' in window)) {
      nodes.forEach(el => el.classList.add('portal-reveal', 'is-visible'));
      return;
    }
    nodes.forEach(el => el.classList.add('portal-reveal'));
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    nodes.forEach(el => io.observe(el));
  }

  function initJumpRail(){
    const toc = document.querySelector('.toc');
    const hero = document.querySelector('.page-hero, .hero');
    if (!toc || !hero) return;
    const links = Array.from(toc.querySelectorAll('a[href^="#"]')).slice(0, 8);
    if (!links.length) return;
    const rail = document.createElement('nav');
    rail.className = 'portal-chip-rail';
    rail.setAttribute('aria-label', 'Quick section links');
    rail.innerHTML = links.map(a => `<a href="${a.getAttribute('href')}">${a.textContent.trim()}</a>`).join('');
    hero.insertAdjacentElement('afterend', rail);
  }

  function initCollapsibleCards(){
    const cards = document.querySelectorAll('.content-card, .panel');
    cards.forEach(card => {
      if (card.closest('.page-hero') || card.closest('.cta-band') || card.closest('.site-shell-footer') || card.classList.contains('portal-skip-collapse')) return;
      if (card.querySelector('.portal-toggle') || card.classList.contains('accordion')) return;
      const children = Array.from(card.children).filter(el => el.nodeType === 1 && el.tagName !== 'BUTTON');
      const textLength = (card.textContent || '').trim().length;
      if (children.length < 4 || textLength < 850) return;
      const wrap = document.createElement('div');
      wrap.className = 'portal-collapse';
      const keep = 3;
      children.slice(keep).forEach(node => wrap.appendChild(node));
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'portal-toggle';
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = '<span>View full note</span><strong>+</strong>';
      btn.addEventListener('click', () => {
        const open = card.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(open));
        btn.innerHTML = open ? '<span>Hide extra detail</span><strong>−</strong>' : '<span>View full note</span><strong>+</strong>';
      });
      card.appendChild(wrap);
      card.appendChild(btn);
    });
  }

  function initWatchTopicVisuals(){
    const notes = document.querySelectorAll('.watch-note.accordion');
    if (!notes.length) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const presets = [
      {
        matches: ['agentic'],
        theme: 'agentic',
        title: 'Agentic decision flow',
        caption: 'A goal turns into tool selection, chained actions, and an oversight burden that grows with autonomy.',
        steps: ['Goal input', 'Tool choice', 'Action chain', 'Oversight loop'],
        details: [
          'A human objective is translated into machine-actionable intent.',
          'The system selects tools, memory, or APIs that expand capability and exposure.',
          'Multi-step execution compounds hidden errors, misuse, or unsafe delegation.',
          'Safety depends on oversight that can interrupt action before real-world impact.'
        ]
      },
      {
        matches: ['edge', 'embedded', 'iot', 'armada', 'fleet'],
        theme: 'edge',
        title: 'Edge deployment flow',
        caption: 'The risk grows as local devices meet patch lag, operational drift, and fleet-wide exposure.',
        steps: ['Edge device', 'Local exposure', 'Operational drift', 'Fleet hardening'],
        details: [
          'The model leaves centralized infrastructure and starts running on distributed hardware.',
          'Physical access, local interfaces, and weaker operational boundaries increase exposure.',
          'Patch lag, version drift, and uneven monitoring widen the attack surface over time.',
          'Security improves only when fleet controls close the loop across every deployed node.'
        ]
      },
      {
        matches: ['physical', 'embodied', 'automotive', 'macsec', 'vehicle', 'sensor'],
        theme: 'physical',
        title: 'Cyber-physical impact flow',
        caption: 'Small integrity failures can travel from sensing or communication layers into control and safety outcomes.',
        steps: ['Sensing/link', 'Control path', 'Safety effect', 'Trusted recovery'],
        details: [
          'The first weakness appears in sensing, communication, or timing integrity.',
          'That weakness propagates into the control path that the system trusts for decisions.',
          'Once control is affected, the failure becomes a safety or mission-level consequence.',
          'Recovery requires trusted fallback behavior, verification, and safe-state control.'
        ]
      },
      {
        matches: ['software', 'code', 'offensive', 'enclave', 'protect ai', 'protectai', 'supply chain', 'pipeline'],
        theme: 'software',
        title: 'Software attack flow',
        caption: 'The issue moves from artifacts into pipeline trust, runtime behavior, and containment controls.',
        steps: ['Artifacts', 'Pipeline trust', 'Runtime abuse', 'Control layer'],
        details: [
          'Models, weights, data, dependencies, or code artifacts enter the software pipeline.',
          'If the pipeline trusts them too easily, the attacker gains leverage before deployment.',
          'The abuse then appears at runtime through execution, extraction, or policy bypass.',
          'Containment depends on verification, monitoring, and enforceable control boundaries.'
        ]
      },
      {
        matches: ['cloud', 'identity', 'privilege', 'encrypted', 'compute', 'soc', 'runtime', 'oligo', 'qevlar', 'cloudflare'],
        theme: 'cloud',
        title: 'Cloud control flow',
        caption: 'Identity, workload, and runtime boundaries decide how quickly local exposure becomes system-wide risk.',
        steps: ['Access edge', 'Live workload', 'Privilege path', 'Continuous control'],
        details: [
          'Exposure starts where identity, networking, or external access first touches the system.',
          'The next question is what the attacker can influence in the live workload itself.',
          'Privilege expansion determines whether the issue stays local or becomes systemic.',
          'Continuous controls must keep shrinking the blast radius while the system is running.'
        ]
      },
      {
        matches: ['glasswing', 'evaluation', 'safety', 'accelerating', 'research', 'stack'],
        theme: 'evaluation',
        title: 'Assurance gap flow',
        caption: 'Capability growth creates pressure on evaluation, leaving deployed behavior ahead of assurance.',
        steps: ['Capability shift', 'Evaluation gap', 'Risk surface', 'Assurance redesign'],
        details: [
          'Model capability or deployment scope changes faster than the old assumptions allow.',
          'Existing evaluation methods fail to measure the new behavior that matters in practice.',
          'That gap leaves a real risk surface between benchmark confidence and deployed reality.',
          'Assurance has to be redesigned around scenarios, systems, and continuous validation.'
        ]
      }
    ];

    const fallback = {
      theme: 'generic',
      title: 'Security interpretation flow',
      caption: 'A useful reading path is to ask what changes, where exposure appears, what system consequence follows, and which control responds.',
      steps: ['System change', 'Exposure', 'Consequence', 'Response'],
      details: [
        'Start by identifying the technical or organizational change that introduces the topic.',
        'Then locate the point where exposure or attacker leverage first appears.',
        'Next ask what real system consequence follows if that exposure is exploited.',
        'Finally map the control, guardrail, or design change that can contain the risk.'
      ]
    };

    const getConfig = (note) => {
      const title = note.querySelector('.accordion-title')?.textContent || '';
      const preview = note.querySelector('.accordion-preview')?.textContent || '';
      const haystack = `${note.id} ${note.getAttribute('data-category') || ''} ${title} ${preview}`.toLowerCase();
      return presets.find((preset) => preset.matches.some((token) => haystack.includes(token))) || fallback;
    };

    const renderScene = (config) => {
      switch (config.theme) {
        case 'agentic':
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
        case 'edge':
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
        case 'physical':
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
        case 'software':
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
        case 'cloud':
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
        case 'evaluation':
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
      const panelInner = note.querySelector('.accordion-panel-inner');
      if (!panelInner || panelInner.querySelector('.watch-topic-visual')) return;

      const config = getConfig(note);
      const visual = document.createElement('section');
      visual.className = `watch-topic-visual watch-topic-visual--${config.theme}`;
      visual.setAttribute('aria-label', `${config.title}. ${config.caption}`);
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
          ${config.steps.map((step, index) => `
            <div class="watch-topic-visual__node" style="--node-index:${index}">
              <span class="watch-topic-visual__index">0${index + 1}</span>
              <strong>${step}</strong>
              <span class="watch-topic-visual__detail">${config.details[index] || ''}</span>
            </div>
          `).join('')}
        </div>
      `;

      panelInner.insertBefore(visual, panelInner.firstChild);

      const trigger = note.querySelector('.accordion-trigger');
      const nodes = Array.from(visual.querySelectorAll('.watch-topic-visual__node'));
      const sceneActors = Array.from(visual.querySelectorAll('.watch-scene__actor'));
      let activeIndex = 0;
      let intervalId = null;

      const setActive = (index) => {
        const progress = nodes.length > 1 ? `${(index / (nodes.length - 1)) * 100}%` : '0%';
        visual.style.setProperty('--travel-percent', progress);
        visual.dataset.activeStage = String(index);
        nodes.forEach((node, nodeIndex) => {
          node.classList.toggle('is-active', nodeIndex === index);
          node.classList.toggle('is-complete', nodeIndex < index);
        });
        sceneActors.forEach((actor) => {
          const stage = Number(actor.dataset.stage || '-1');
          actor.classList.toggle('is-active', stage === index);
          actor.classList.toggle('is-complete', stage > -1 && stage < index);
        });
      };

      setActive(0);

      if (trigger) {
        trigger.addEventListener('click', () => {
          if (!note.classList.contains('is-open')) {
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
          if (!note.classList.contains('is-open')) return;
          activeIndex = (activeIndex + 1) % nodes.length;
          setActive(activeIndex);
        }, 3200);
      };

      visual.addEventListener('mouseenter', stopPlayback);
      visual.addEventListener('mouseleave', startPlayback);

      if (!prefersReducedMotion && nodes.length > 1) {
        startPlayback();
      }
    });
  }

  function initTilt(){
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const cards = document.querySelectorAll('.quick-card, .feature-card, .content-card, .panel, .post-card, .section-card, .topic-card, .foundation-card, .profile-card, .pulse-card, .resource-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const rx = (0.5 - py) * 6;
        const ry = (px - 0.5) * 8;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  function enhanceExternalLinks(){
    document.querySelectorAll('main a[href^="http"]').forEach(a => {
      if (!a.target) a.target = '_blank';
      a.rel = a.rel || 'noopener noreferrer';
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initMenu();
    initLightbox();
    initWatchTopicVisuals();
    initAccordions();
    initReveal();
    initJumpRail();
    initCollapsibleCards();
    initTilt();
    enhanceExternalLinks();
  });
})();
