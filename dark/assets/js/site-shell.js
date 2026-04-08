(function(){
  function depthPrefix(){
    const depth = Number(document.body?.dataset?.depth || 0);
    return '../'.repeat(depth);
  }

  function currentSignal(nav){
    const map = {
      home: "",
      research: "",
      trending: "",
      resources: "",
      about: "",
      contact: ""
    };
    return map[nav] || "";
  }

  document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    if (!body) return;
    const base = depthPrefix();
    const nav = body.dataset.nav || 'home';
    const topMount = document.getElementById('site-shell-top');
    const headerMount = document.getElementById('site-shell-header');
    const footerMount = document.getElementById('site-shell-footer');

    const links = [
      { id:'home', href:`${base}index.html`, label:'Home' },
      { id:'research', href:`${base}research.html`, label:'Research' },
      { id:'trending', href:`${base}ongoing-work.html`, label:'Trending' },
      { id:'resources', href:`${base}publications.html`, label:'Resources' },
      { id:'about', href:`${base}about.html`, label:'About' },
      { id:'contact', href:`${base}contact.html`, label:'Contact' }
    ];

    if (topMount) {
      topMount.innerHTML = "";
    }

    if (headerMount) {
      headerMount.innerHTML = `
        <header class="site-shell-header">
          <div class="container shell-header__inner">
            <a class="shell-brand" href="${base}index.html" aria-label="Brojogopal Sapui AI Security home">
              <span class="shell-brand__mark">BS</span>
              <span class="shell-brand__copy">
                <strong>AI Security</strong>
                <small>Brojogopal Sapui</small>
              </span>
            </a>
            <button class="shell-menu-btn" id="shellMenuBtn" aria-label="Open navigation" aria-controls="shellNav" aria-expanded="false">
              <span></span><span></span><span></span>
            </button>
            <nav class="shell-nav" id="shellNav">
              ${links.map(link => `<a class="${link.id===nav ? 'active' : ''}${link.id==='trending' ? ' trending-link' : ''}" href="${link.href}">${link.label}</a>`).join('')}
            </nav>
          </div>
          <div class="portal-orb portal-orb--a"></div>
          <div class="portal-orb portal-orb--b"></div>
        </header>`;
    }

    if (footerMount) {
      footerMount.innerHTML = `
        <footer class="site-shell-footer">
          <div class="container shell-footer__grid">
            <section class="shell-footer__card shell-footer__card--wide">
              <span class="portal-pill">Brojogopal Sapui</span>
              <h3>Unified AI security portal for guided reading</h3>
              <p>A single dark visual system now runs across the site with clearer contrast, stronger grouping, and faster access to structured AI security topics.</p>
            </section>
            <section class="shell-footer__card">
              <h4>Navigate</h4>
              <div class="shell-footer__links">
                ${links.slice(0,4).map(link => `<a class="${link.id==='trending' ? 'trending-link' : ''}" href="${link.href}">${link.label}</a>`).join('')}
              </div>
            </section>
            <section class="shell-footer__card">
              <h4>Focus</h4>
              <p>AI security, hardware trust, edge intelligence, trustworthy deployment, physical and agentic AI.</p>
            </section>
          </div>
        </footer>`;
    }
  });
})();
