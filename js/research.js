/**
 * research.js — Renders the Research page.
 *
 * Loads project data from data/projects.json and displays each project
 * as a clickable card in a responsive grid.
 *
 * Clicking a project card navigates to the publications page filtered
 * by that project's slug (e.g., publications.html?tag=utree).
 * This works because publications in publications.json have a "tags"
 * array that includes the project slug.
 *
 * To add a new project, add an entry to data/projects.json with:
 *   title, slug, description, image, link, tags
 */
document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('research-root');

  try {
    const projects = await fetchData('data/projects.json');

    // Each card is an <a> tag linking to publications filtered by project slug
    root.innerHTML = projects.map(p => `
      <a href="publications.html?tag=${encodeURIComponent(p.slug)}" class="card" style="text-decoration:none;color:inherit;display:block;">
        ${p.image
          ? `<img class="card-img" src="${p.image}" alt="${p.title}" onerror="this.style.display='none'">`
          : '<div class="card-img" style="background:#e9ecef;display:flex;align-items:center;justify-content:center;color:#adb5bd;font-size:2rem;">&#9635;</div>'}
        <div class="card-body">
          <h3>${p.title}</h3>
          <p>${p.description}</p>
        </div>
      </a>
    `).join('');
  } catch (e) {
    root.innerHTML = '<p>Failed to load research projects.</p>';
    console.error(e);
  }
});
