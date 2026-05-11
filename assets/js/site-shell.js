(function(){
  const SITE_VARIANT_KEY = 'portalPreferredVersion';
  const PORTAL_FULLSCREEN_FRAME_PARAM = 'fullscreenFrame';

  function isPortalFullscreenFrame() {
    try {
      return window.self !== window.top && new URL(window.location.href).searchParams.get(PORTAL_FULLSCREEN_FRAME_PARAM) === '1';
    } catch (error) {
      return false;
    }
  }

  function fullscreenFrameUrl(href = window.location.href) {
    const url = new URL(href, window.location.href);
    url.searchParams.set(PORTAL_FULLSCREEN_FRAME_PARAM, '1');
    return url.href;
  }

  function displayUrlFromFrame(frame) {
    try {
      const url = new URL(frame.contentWindow.location.href);
      url.searchParams.delete(PORTAL_FULLSCREEN_FRAME_PARAM);
      return url.href;
    } catch (error) {
      return '';
    }
  }

  function prepareFullscreenFrame(frame) {
    try {
      const doc = frame.contentDocument;
      if (!doc) return;

      if (!doc.getElementById('portal-fullscreen-frame-style')) {
        const style = doc.createElement('style');
        style.id = 'portal-fullscreen-frame-style';
        style.textContent = `
          .global-fullscreen-toggle,
          .subcontent-fullscreen,
          .tv-fullscreen-link{display:none!important}
        `;
        doc.head.appendChild(style);
      }

      doc.querySelectorAll('a[href]').forEach((link) => {
        if (link.hasAttribute('download')) return;
        const target = (link.getAttribute('target') || '').toLowerCase();
        if (target && target !== '_self') return;

        const url = new URL(link.getAttribute('href'), doc.location.href);
        if (url.origin !== window.location.origin) return;
        if (!/^https?:$/.test(url.protocol)) return;
        url.searchParams.set(PORTAL_FULLSCREEN_FRAME_PARAM, '1');
        link.setAttribute('href', url.href);
      });
    } catch (error) {
      // Cross-origin destinations cannot be adjusted; leave them alone.
    }
  }

  function ensureFullscreenOverlayStyles() {
    if (document.getElementById('portal-fullscreen-overlay-style')) return;

    const style = document.createElement('style');
    style.id = 'portal-fullscreen-overlay-style';
    style.textContent = `
      .portal-fullscreen-overlay{position:fixed;inset:0;z-index:2147483647;background:#020817}
      .portal-fullscreen-frame{width:100%;height:100%;border:0;background:#fff}
      .portal-fullscreen-exit{position:fixed;top:12px;right:12px;z-index:2}
    `;
    document.head.appendChild(style);
  }

  function closePersistentFullscreenOverlay(syncLocation = false) {
    const overlay = document.querySelector('[data-portal-fullscreen-overlay]');
    const frame = overlay?.querySelector('iframe');
    const nextHref = syncLocation && frame ? displayUrlFromFrame(frame) : '';

    overlay?.remove();
    document.documentElement.classList.remove('portal-fullscreen-active');

    if (nextHref && nextHref !== window.location.href) {
      window.location.href = nextHref;
    }
  }

  function openPersistentFullscreenOverlay() {
    if (document.querySelector('[data-portal-fullscreen-overlay]')) return;

    ensureFullscreenOverlayStyles();

    const overlay = document.createElement('div');
    overlay.className = 'portal-fullscreen-overlay';
    overlay.dataset.portalFullscreenOverlay = 'true';

    const frame = document.createElement('iframe');
    frame.className = 'portal-fullscreen-frame';
    frame.title = 'Fullscreen site view';
    frame.src = fullscreenFrameUrl();

    const exitButton = document.createElement('button');
    exitButton.type = 'button';
    exitButton.className = 'global-fullscreen-toggle portal-fullscreen-exit';
    exitButton.textContent = 'exit full screen';
    exitButton.setAttribute('aria-label', 'Exit fullscreen');
    exitButton.setAttribute('aria-pressed', 'true');

    frame.addEventListener('load', () => prepareFullscreenFrame(frame));
    exitButton.addEventListener('click', async () => {
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
    document.documentElement.classList.add('portal-fullscreen-active');
  }

  function depthPrefix(){
    const depth = Number(document.body?.dataset?.depth || 0);
    return '../'.repeat(depth);
  }

  function preferredHomeHref(base) {
    try {
      return localStorage.getItem(SITE_VARIANT_KEY) === 'light'
        ? `${base}index.html?mode=light`
        : `${base}index.html`;
    } catch (error) {
      return `${base}index.html`;
    }
  }

  function syncLightModePreference() {
    try {
      const url = new URL(window.location.href);
      const mode = url.searchParams.get('mode');

      if (mode === 'light' || mode === 'dark') {
        localStorage.setItem(SITE_VARIANT_KEY, mode);
        url.searchParams.delete('mode');
        const nextSearch = url.searchParams.toString();
        const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ''}${url.hash}`;
        window.history.replaceState({}, '', nextUrl);
      }
    } catch (error) {
      // Ignore storage/history issues and keep the page usable.
    }
  }

  function rememberDarkVersionClicks(root) {
    root.querySelectorAll('a[href*="/dark/"], a[href^="dark/"], a[href^="../dark/"], a[href^="../../dark/"], a[href^="../../../dark/"]').forEach((link) => {
      link.addEventListener('click', () => {
        try {
          localStorage.setItem(SITE_VARIANT_KEY, 'dark');
        } catch (error) {
          // Ignore storage issues and continue navigation.
        }
      });
    });
  }

  function initGlobalFullscreenToggle() {
    if (isPortalFullscreenFrame()) return;

    const target = document.fullscreenEnabled === false ? null : document.documentElement;
    if (!target?.requestFullscreen) return;

    const mount =
      document.querySelector('.site-shell-header .shell-header__inner') ||
      document.querySelector('.site-header .nav-wrap');

    if (!mount) return;

    let button = document.querySelector('[data-global-fullscreen]');

    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'global-fullscreen-toggle';
      button.dataset.globalFullscreen = 'true';
      button.setAttribute('aria-label', 'Enter fullscreen');

      const menuButton = mount.querySelector('.shell-menu-btn, .menu-btn');
      mount.insertBefore(button, menuButton || null);
    }

    const syncLabel = () => {
      const isFullscreen = Boolean(document.fullscreenElement);
      button.textContent = isFullscreen ? 'exit full screen' : 'full screen';
      button.setAttribute('aria-label', isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen');
      button.setAttribute('aria-pressed', String(isFullscreen));
    };

    if (!button.dataset.globalFullscreenReady) {
      button.dataset.globalFullscreenReady = 'true';
      button.addEventListener('click', async () => {
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
      document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
          closePersistentFullscreenOverlay(true);
        }
        document.querySelectorAll('[data-global-fullscreen]').forEach((fullscreenButton) => {
          const isFullscreen = Boolean(document.fullscreenElement);
          fullscreenButton.textContent = isFullscreen ? 'exit full screen' : 'full screen';
          fullscreenButton.setAttribute('aria-label', isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen');
          fullscreenButton.setAttribute('aria-pressed', String(isFullscreen));
        });
      });
    }

    syncLabel();
  }

  syncLightModePreference();

  document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    if (!body) return;
    const base = depthPrefix();
    const homeHref = preferredHomeHref(base);
    const darkHref = body.dataset.darkHref || `${base}dark/index.html?mode=dark`;
    const nav = body.dataset.nav || 'home';
    const topMount = document.getElementById('site-shell-top');
    const headerMount = document.getElementById('site-shell-header');
    const footerMount = document.getElementById('site-shell-footer');

    const links = [
      { id:'home', href:homeHref, label:'Home' },
      { id:'research', href:`${base}research.html`, label:'Research' },
      { id:'trending', href:`${base}ongoing-work.html`, label:'Trending' },
      { id:'resources', href:`${base}publications.html`, label:'Resources' },
      { id:'about', href:`${base}about.html`, label:'About' },
      { id:'contact', href:`${base}contact.html`, label:'Contact' }
    ];

    if (topMount) {
      topMount.innerHTML = '';
    }

    if (headerMount) {
      headerMount.innerHTML = `
        <header class="site-header">
          <div class="container nav-wrap">
            <div class="brand-group">
              <a class="brand" href="${homeHref}" aria-label="Brojogopal Sapui Home">B<span>S</span></a>
              <a class="brand-hint" href="${darkHref}">Dark Version</a>
            </div>
            <nav class="nav" id="shellNav">
              ${links.map(link => `<a class="${link.id===nav ? 'active' : ''}${link.id==='trending' ? ' trending-link' : ''}" href="${link.href}">${link.label}</a>`).join('')}
            </nav>
            <button class="menu-btn" id="shellMenuBtn" aria-label="Toggle menu" aria-controls="shellNav" aria-expanded="false">
              <span></span><span></span><span></span>
            </button>
          </div>
        </header>`;
    }

    if (footerMount) {
      footerMount.innerHTML = `
        <footer class="site-footer">
          <div class="container footer-grid">
            <div>
              <h3>Brojogopal Sapui</h3>
              <p>AI Security• Hardware Trust • Edge/Physical AI</p>
            </div>
            <div>
              <h4>Navigate</h4>
              <a href="${base}research.html">Research</a>
              <a class="trending-link" href="${base}ongoing-work.html">Trending Topics</a>
              <a href="${base}publications.html">Resources</a>
            </div>
            <div>
              <h4>Focus</h4>
              <p>AI security, hardware trust, edge intelligence, trustworthy deployment, physical and agentic AI.</p>
            </div>
          </div>
        </footer>`;
    }

    if (headerMount) rememberDarkVersionClicks(headerMount);
    if (footerMount) rememberDarkVersionClicks(footerMount);
    initGlobalFullscreenToggle();
  });
})();
