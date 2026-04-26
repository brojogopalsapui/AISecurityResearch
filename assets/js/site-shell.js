(function(){
  function depthPrefix(){
    const depth = Number(document.body?.dataset?.depth || 0);
    return '../'.repeat(depth);
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
      topMount.innerHTML = '';
    }

    if (headerMount) {
      headerMount.innerHTML = `
        <header class="site-header">
          <div class="container nav-wrap">
            <div class="brand-group">
              <a class="brand" href="${base}index.html" aria-label="Brojogopal Sapui Home">B<span>S</span></a>
              <a class="brand-hint" href="https://www.brojogopalsapui.com/dark/" target="_blank" rel="noopener noreferrer">Mobile View (Dark)</a>
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
  });
})();
