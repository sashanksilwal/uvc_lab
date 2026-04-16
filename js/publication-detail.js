/**
 * publication-detail.js — Renders a single publication's detail page.
 *
 * Reads the publication slug from the URL parameter ?id=<slug>,
 * finds the matching entry in data/publications.json, and renders:
 *   - Title, authors, venue/year
 *   - Action buttons (PDF, DOI, BibTeX toggle, Video, Code)
 *   - Collapsible BibTeX block with copy-to-clipboard
 *   - Thumbnail/figure image
 *   - Abstract text
 *   - Embedded PDF viewer (if PDF path is provided)
 *
 * Example URL: publication.html?id=firoze2026-city-trees
 */
document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('pub-detail-root');
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('id');

  // No slug provided — show fallback message
  if (!slug) {
    root.innerHTML = '<p>No publication specified. <a href="publications.html">Browse all publications</a>.</p>';
    return;
  }

  try {
    // Load all publications and find the one matching the slug
    const pubs = await fetchData('data/publications.json');
    const pub = pubs.find(p => p.slug === slug);

    if (!pub) {
      root.innerHTML = '<p>Publication not found. <a href="publications.html">Browse all publications</a>.</p>';
      return;
    }

    // Update browser tab title to show publication name
    document.title = `${pub.title} — UVC Lab`;

    // Build the page HTML
    let html = `<h1>${pub.title}</h1>`;
    html += `<p class="authors">${pub.authors}</p>`;
    const venueLine = pub.venue
      ? `<em>${pub.venue}</em>${pub.venueDetails ? ', ' + pub.venueDetails : ''} `
      : (pub.venueDetails ? `${pub.venueDetails} ` : '');
    html += `<p class="venue">${venueLine}(${pub.year})</p>`;

    // Action buttons row (PDF, DOI, BibTeX, Video, Code)
    html += '<div class="pub-buttons">';
    if (pub.pdf) html += `<a class="pub-btn" href="${pub.pdf}" target="_blank">PDF</a>`;
    if (pub.doi) html += `<a class="pub-btn" href="${pub.doi}" target="_blank">DOI</a>`;
    if (pub.bibtex) html += `<button class="pub-btn" id="bibtex-btn">BibTeX</button>`;
    if (pub.video) html += `<a class="pub-btn" href="${pub.video}" target="_blank">Video</a>`;
    if (pub.code) html += `<a class="pub-btn" href="${pub.code}" target="_blank">Code</a>`;
    html += '</div>';

    // Collapsible BibTeX block (hidden by default, toggled by BibTeX button)
    if (pub.bibtex) {
      html += `<div class="bibtex-block" id="bibtex-block">
        <pre>${escapeHtml(pub.bibtex)}</pre>
        <button id="copy-bibtex">Copy to clipboard</button>
      </div>`;
    }

    // Thumbnail / figure image
    if (pub.thumbnail) {
      html += `<img class="pub-figure" src="${pub.thumbnail}" alt="${pub.title}" onerror="this.style.display='none'">`;
    }

    // Abstract section
    if (pub.abstract) {
      html += `<div class="abstract"><h2>Abstract</h2><p>${pub.abstract}</p></div>`;
    }

    // Embedded PDF viewer (renders the PDF inline if path is provided)
    if (pub.pdf) {
      html += `<div style="margin-top:1.5rem;">
        <h2 style="font-size:1.2rem;color:var(--color-primary);margin-bottom:0.75rem;">Paper</h2>
        <iframe src="${pub.pdf}" width="100%" height="600" style="border:1px solid var(--color-border);border-radius:8px;"></iframe>
      </div>`;
    }

    // Back link
    html += `<div style="margin-top:2rem;"><a href="publications.html">&larr; Back to all publications</a></div>`;

    root.innerHTML = html;

    // Wire up BibTeX toggle button
    const bibtexBtn = document.getElementById('bibtex-btn');
    const bibtexBlock = document.getElementById('bibtex-block');
    if (bibtexBtn && bibtexBlock) {
      bibtexBtn.addEventListener('click', () => {
        bibtexBlock.classList.toggle('visible');
      });
    }

    // Wire up copy-to-clipboard button inside BibTeX block
    const copyBtn = document.getElementById('copy-bibtex');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(pub.bibtex);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => copyBtn.textContent = 'Copy to clipboard', 2000);
      });
    }
  } catch (e) {
    root.innerHTML = '<p>Failed to load publication. <a href="publications.html">Browse all publications</a>.</p>';
    console.error(e);
  }

  /** Escapes HTML special characters for safe rendering. */
  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
});
