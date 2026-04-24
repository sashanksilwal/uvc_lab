/**
 * publications.js — Renders the publications listing page.
 *
 * Features:
 *   - Loads all publications from data/publications.json
 *   - Search/filter by title, author, or venue via the search bar
 *   - Filter by tag via URL param (e.g., ?tag=utree) — used when
 *     clicking a research project card on the research page
 *   - Groups publications by year (newest first)
 *   - Pagination (25 per page)
 *   - BibTeX toggle and copy-to-clipboard for each entry
 *
 * URL parameters supported:
 *   ?tag=<slug>     — filter by project tag (matches publication tags array)
 *   ?q=<query>      — pre-fill search box and filter
 *   ?search=<query> — same as ?q
 */
document.addEventListener('DOMContentLoaded', async () => {
  // DOM references
  const root = document.getElementById('pubs-root');
  const paginationEl = document.getElementById('pagination');
  const searchInput = document.getElementById('pub-search');
  const fieldSelect = document.getElementById('pub-field');
  const matchCount = document.getElementById('match-count');

  const PER_PAGE = 25; // Number of publications shown per page
  let allPubs = [];     // All publications (unfiltered)
  let filtered = [];    // Currently filtered/visible publications
  let currentPage = 1;

  // Parse URL parameters for tag or search query filtering
  const params = new URLSearchParams(window.location.search);
  let activeTag = params.get('tag') || '';

  // Load publications data
  try {
    allPubs = await fetchData('data/publications.json');
    allPubs.sort((a, b) => b.year - a.year); // Sort newest first
    filtered = [...allPubs];
    applyFilter(); // Initial render (applies tag filter if present)
  } catch (e) {
    root.innerHTML = '<p>Failed to load publications.</p>';
    console.error(e);
    return;
  }

  // If a search query was passed via URL, apply it
  if (params.get('q') || params.get('search')) {
    searchInput.value = params.get('q') || params.get('search');
    applyFilter();
  }

  // Re-filter on user input (search box or field selector change)
  searchInput.addEventListener('input', () => { currentPage = 1; applyFilter(); });
  fieldSelect.addEventListener('change', () => { currentPage = 1; applyFilter(); });

  /**
   * Filters publications based on the active tag and search query,
   * then re-renders the list.
   */
  function applyFilter() {
    const query = searchInput.value.trim().toLowerCase();
    const field = fieldSelect.value; // 'title', 'authors', or 'venue'

    filtered = [...allPubs];

    // Filter by tag (set via ?tag= URL param, e.g., from research page)
    if (activeTag) {
      filtered = filtered.filter(p =>
        (p.tags || []).some(t => t.toLowerCase() === activeTag.toLowerCase())
      );
    }

    // Filter by search query against the selected field
    if (query) {
      filtered = filtered.filter(p => {
        const val = (p[field] || '').toLowerCase();
        return val.includes(query);
      });
    }

    render();
  }

  /**
   * Renders the filtered publications list grouped by year,
   * with pagination and match count display.
   */
  function render() {
    // Show match count (and active tag filter with clear link)
    let countText = `Matched ${filtered.length} of ${allPubs.length} publications`;
    if (activeTag) countText += ` (filtered by: "${activeTag}" — <a href="publications.html" style="color:var(--color-highlight)">clear filter</a>)`;
    matchCount.innerHTML = countText;

    // Calculate pagination
    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const start = (currentPage - 1) * PER_PAGE;
    const pagePubs = filtered.slice(start, start + PER_PAGE);

    // Group current page's publications by year
    const byYear = {};
    for (const p of pagePubs) {
      if (!byYear[p.year]) byYear[p.year] = [];
      byYear[p.year].push(p);
    }
    const years = Object.keys(byYear).sort((a, b) => b - a);

    // Build HTML: year headings with publication cards underneath
    let html = '';
    for (const year of years) {
      html += `<div class="pub-year-group"><h2>${year}</h2>`;
      for (const p of byYear[year]) {
        html += renderPubCard(p);
      }
      html += '</div>';
    }

    root.innerHTML = html || '<p style="color:#666;">No publications found.</p>';

    // Render pagination controls (only if multiple pages)
    if (totalPages > 1) {
      paginationEl.innerHTML = `
        <button ${currentPage <= 1 ? 'disabled' : ''} onclick="window.__pubPageNav(${currentPage - 1})">&laquo; Prev</button>
        <span class="page-info">Page ${currentPage} of ${totalPages}</span>
        <button ${currentPage >= totalPages ? 'disabled' : ''} onclick="window.__pubPageNav(${currentPage + 1})">Next &raquo;</button>
      `;
    } else {
      paginationEl.innerHTML = '';
    }

    // Attach click handlers: toggle BibTeX visibility
    document.querySelectorAll('.bibtex-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const slug = btn.dataset.slug;
        const block = document.getElementById('bibtex-' + slug);
        if (block) block.classList.toggle('visible');
      });
    });

    // Attach click handlers: copy BibTeX to clipboard
    document.querySelectorAll('.copy-bibtex-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const slug = btn.dataset.slug;
        const pub = allPubs.find(p => p.slug === slug);
        if (pub && pub.bibtex) {
          navigator.clipboard.writeText(pub.bibtex);
          btn.textContent = 'Copied!';
          setTimeout(() => btn.textContent = 'Copy', 2000);
        }
      });
    });
  }

  /**
   * Global page navigation handler (called from pagination button onclick).
   * Scrolls to top after page change.
   */
  window.__pubPageNav = function(page) {
    currentPage = page;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Builds the HTML for a single publication card.
   * Shows: thumbnail, title (links to detail page), citation, and action buttons.
   *
   * @param {Object} p — Publication object from publications.json
   * @returns {string} — HTML string for the card
   */
  function renderPubCard(p) {
    // Thumbnail: use image if available, otherwise show a placeholder icon
    const thumb = p.thumbnail
      ? `<img class="pub-thumb" src="${p.thumbnail}" alt="${p.title}" loading="lazy" onerror="this.style.display='none'">`
      : `<div class="pub-thumb" style="display:flex;align-items:center;justify-content:center;background:#e9ecef;color:#adb5bd;font-size:1.5rem;">&#128196;</div>`;

    // Formatted citation string (APA-ish style). Venue + details are optional.
    const venuePart = p.venue
      ? ` <em>${p.venue}</em>${p.venueDetails ? ', ' + p.venueDetails : ''}.`
      : (p.venueDetails ? ` ${p.venueDetails}.` : '');
    const citation = `${p.authors} (${p.year}). ${p.title}.${venuePart}${p.doi ? ' ' + p.doi : ''}`;

    return `
      <div class="pub-card">
        ${thumb}
        <div class="pub-info">
          <h3><a href="publication.html?id=${p.slug}">${p.title}</a></h3>
          <p class="pub-citation">${citation}</p>
          <div class="pub-buttons">
            ${p.bibtex ? `<button class="pub-btn bibtex-toggle" data-slug="${p.slug}">BibTeX</button>` : ''}
            ${p.doi ? `<a class="pub-btn" href="${p.doi}" target="_blank">DOI</a>` : ''}
            ${p.pdf ? `<a class="pub-btn" href="${p.pdf}" target="_blank">PDF</a>` : ''}
            ${p.video ? `<a class="pub-btn" href="${p.video}" target="_blank">Video</a>` : ''}
            ${p.code ? `<a class="pub-btn" href="${p.code}" target="_blank">Code</a>` : ''}
          </div>
          ${p.bibtex ? `<div class="pub-detail"><div class="bibtex-block" id="bibtex-${p.slug}"><pre>${escapeHtml(p.bibtex)}</pre><button class="copy-bibtex-btn" data-slug="${p.slug}">Copy</button></div></div>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Escapes HTML special characters to prevent XSS when
   * rendering user-provided content (e.g., BibTeX strings).
   */
  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
});
