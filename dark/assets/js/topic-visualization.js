(function(){
  function escapeHtml(value){
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function colorMap(theme){
    if (theme === 'dark') {
      return {
        blue: { fill: 'rgba(106,169,255,.14)', stroke: '#6aa9ff' },
        teal: { fill: 'rgba(69,209,199,.14)', stroke: '#45d1c7' },
        amber: { fill: 'rgba(255,180,84,.14)', stroke: '#ffb454' },
        red: { fill: 'rgba(255,107,135,.14)', stroke: '#ff6b87' },
        violet: { fill: 'rgba(164,140,255,.14)', stroke: '#a48cff' },
        slate: { fill: 'rgba(186,205,230,.08)', stroke: '#9bb0c8' }
      };
    }
    return {
      blue: { fill: 'rgba(47,109,246,.09)', stroke: '#2f6df6' },
      teal: { fill: 'rgba(15,138,143,.09)', stroke: '#0f8a8f' },
      amber: { fill: 'rgba(240,178,77,.12)', stroke: '#d69120' },
      red: { fill: 'rgba(217,72,107,.09)', stroke: '#d9486b' },
      violet: { fill: 'rgba(111,107,255,.10)', stroke: '#6f6bff' },
      slate: { fill: 'rgba(80,108,138,.08)', stroke: '#7c91a8' }
    };
  }

  function renderStage(config, lensKey){
    const theme = config.theme || 'light';
    const palette = colorMap(theme);
    const lens = config.lenses[lensKey];
    const nodes = config.nodes.map(node => {
      const tone = palette[node.color] || palette.blue;
      const focused = lens.focus.includes(node.id);
      return `
        <g class="tv-node${focused ? ' is-focused' : ''}" data-node="${escapeHtml(node.id)}">
          <rect x="${node.x}" y="${node.y}" rx="24" ry="24" width="${node.w}" height="${node.h}" fill="${tone.fill}" stroke="${tone.stroke}" />
          <text x="${node.x + 18}" y="${node.y + 30}" fill="var(--tv-muted)" font-size="12" font-weight="800" letter-spacing=".08em">${escapeHtml(node.kicker.toUpperCase())}</text>
          <text x="${node.x + 18}" y="${node.y + 58}" fill="var(--tv-text)" font-size="20" font-weight="800">${escapeHtml(node.title)}</text>
          <text x="${node.x + 18}" y="${node.y + 86}" fill="var(--tv-muted)" font-size="13">${escapeHtml(node.summary)}</text>
        </g>`;
    }).join('');

    const edges = config.edges.map((edge, index) => {
      const from = config.nodes.find(node => node.id === edge.from);
      const to = config.nodes.find(node => node.id === edge.to);
      if (!from || !to) return '';
      const x1 = from.x + from.w;
      const y1 = from.y + from.h / 2;
      const x2 = to.x;
      const y2 = to.y + to.h / 2;
      const mid = Math.round((x1 + x2) / 2);
      const path = `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
      return `
        <path class="tv-edge" d="${path}" />
        <circle class="tv-particle" cx="${mid}" cy="${Math.round((y1 + y2) / 2)}" r="5" fill="${index % 2 ? 'var(--tv-accent)' : 'var(--tv-primary)'}" />`;
    }).join('');

    return `
      <svg viewBox="0 0 1180 640" role="img" aria-label="${escapeHtml(config.figureAlt)}">
        <defs>
          <linearGradient id="tvGridFade" x1="0" x2="1">
            <stop offset="0%" stop-color="rgba(127,152,189,.0)"></stop>
            <stop offset="50%" stop-color="rgba(127,152,189,.18)"></stop>
            <stop offset="100%" stop-color="rgba(127,152,189,.0)"></stop>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="1180" height="640" rx="26" fill="transparent"></rect>
        <g opacity=".34">
          ${Array.from({length: 9}, (_, i) => `<line x1="0" y1="${60 + i * 60}" x2="1180" y2="${60 + i * 60}" stroke="url(#tvGridFade)" />`).join('')}
          ${Array.from({length: 10}, (_, i) => `<line x1="${90 + i * 110}" y1="0" x2="${90 + i * 110}" y2="640" stroke="url(#tvGridFade)" />`).join('')}
        </g>
        <text x="32" y="40" fill="var(--tv-muted)" font-size="14" font-weight="800" letter-spacing=".08em">${escapeHtml(lens.stageLabel.toUpperCase())}</text>
        ${edges}
        ${nodes}
      </svg>`;
  }

  function renderBullets(items){
    return items.map(item => `<li>${escapeHtml(item)}</li>`).join('');
  }

  document.addEventListener('DOMContentLoaded', () => {
    const config = window.TOPIC_VISUALIZATION;
    if (!config) return;

    document.body.classList.add('topic-visualization-page');
    document.body.dataset.topicTheme = config.theme || 'light';
    if (!document.body.dataset.depth) document.body.dataset.depth = '3';
    if (!document.body.dataset.nav) document.body.dataset.nav = 'research';
    if (!document.body.dataset.page) document.body.dataset.page = config.slug || 'topic-visualization';

    document.title = config.pageTitle;

    const root = document.getElementById('topicVisualizationRoot');
    if (!root) return;

    const lenses = Object.entries(config.lenses);
    const defaultLens = config.defaultLens && config.lenses[config.defaultLens] ? config.defaultLens : lenses[0][0];

    root.innerHTML = `
      <div class="tv-back-row">
        <a class="tv-back-link" href="${escapeHtml(config.backHref)}">← ${escapeHtml(config.backLabel)}</a>
      </div>
      <section class="tv-hero">
        <article class="tv-hero-card">
          <div class="tv-hero-copy">
            <span class="tv-eyebrow">${escapeHtml(config.domain)}</span>
            <h1>${escapeHtml(config.title)}</h1>
            <p>${escapeHtml(config.intro)}</p>
            <div class="tv-chip-row">
              ${config.tags.map(tag => `<span class="tv-chip">${escapeHtml(tag)}</span>`).join('')}
            </div>
          </div>
        </article>
        <figure class="tv-hero-card tv-figure-card">
          <div class="tv-figure-frame">
            <img src="${escapeHtml(config.figureSrc)}" alt="${escapeHtml(config.figureAlt)}" class="zoom-img"/>
            <figcaption>${escapeHtml(config.figureCaption)}</figcaption>
          </div>
        </figure>
      </section>
      <section class="tv-panel">
        <div class="tv-panel-head">
          <div>
            <h2>Animated reading of the diagram</h2>
            <p>${escapeHtml(config.stageIntro)}</p>
          </div>
        </div>
        <div class="tv-lens-controls">
          ${lenses.map(([key, lens]) => `<button class="tv-lens-btn${key === defaultLens ? ' active' : ''}" data-lens="${escapeHtml(key)}">${escapeHtml(lens.buttonLabel)}</button>`).join('')}
        </div>
        <div class="tv-stage-wrap">
          <div>
            <div class="tv-stage" id="tvStage"></div>
            <div class="tv-legend">
              ${config.legend.map(item => `<span><i style="background:${escapeHtml(item.swatch)}"></i>${escapeHtml(item.label)}</span>`).join('')}
            </div>
          </div>
          <aside class="tv-side">
            <div class="tv-side-card">
              <h3 id="tvLensTitle"></h3>
              <p id="tvLensSummary"></p>
            </div>
            <div class="tv-side-card">
              <h4>Threat-model questions</h4>
              <ul id="tvThreatQuestions"></ul>
            </div>
            <div class="tv-side-card">
              <h4>Defense placement</h4>
              <ul id="tvDefensePoints"></ul>
            </div>
          </aside>
        </div>
      </section>
      <section class="tv-grid-wrap">
        ${config.metrics.map(metric => `
          <article class="tv-card">
            <div class="k">${escapeHtml(metric.label)}</div>
            <div class="v">${escapeHtml(metric.value)}</div>
            <p>${escapeHtml(metric.detail)}</p>
          </article>`).join('')}
      </section>
      <section class="tv-panel">
        <div class="tv-panel-head">
          <div>
            <h2>Surface, asset, and control mapping</h2>
            <p>${escapeHtml(config.tableIntro)}</p>
          </div>
        </div>
        <table class="tv-table">
          <thead>
            <tr>
              <th>Surface</th>
              <th>Primary risk</th>
              <th>Exposed asset</th>
              <th>Control priority</th>
            </tr>
          </thead>
          <tbody>
            ${config.table.map(row => `
              <tr>
                <td>${escapeHtml(row.surface)}</td>
                <td>${escapeHtml(row.risk)}</td>
                <td>${escapeHtml(row.asset)}</td>
                <td>${escapeHtml(row.control)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </section>
      <section class="tv-panel">
        <div class="tv-panel-head">
          <div>
            <h2>Research questions opened by this figure</h2>
            <p>${escapeHtml(config.researchIntro)}</p>
          </div>
        </div>
        <div class="tv-research-list">
          ${config.researchQuestions.map(item => `
            <article class="tv-research-item">
              <strong>${escapeHtml(item.title)}</strong>
              <p>${escapeHtml(item.body)}</p>
            </article>`).join('')}
        </div>
      </section>`;

    const stage = root.querySelector('#tvStage');
    const title = root.querySelector('#tvLensTitle');
    const summary = root.querySelector('#tvLensSummary');
    const threatQuestions = root.querySelector('#tvThreatQuestions');
    const defensePoints = root.querySelector('#tvDefensePoints');
    const buttons = Array.from(root.querySelectorAll('.tv-lens-btn'));

    function syncLens(key){
      const lens = config.lenses[key];
      if (!lens) return;
      buttons.forEach(button => button.classList.toggle('active', button.dataset.lens === key));
      stage.innerHTML = renderStage(config, key);
      title.textContent = lens.title;
      summary.textContent = lens.summary;
      threatQuestions.innerHTML = renderBullets(lens.questions);
      defensePoints.innerHTML = renderBullets(lens.defenses);
    }

    buttons.forEach(button => {
      button.addEventListener('click', () => syncLens(button.dataset.lens));
    });

    syncLens(defaultLens);
  });
})();
