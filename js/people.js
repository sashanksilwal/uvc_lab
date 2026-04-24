/**
 * people.js — Renders the People page.
 *
 * Loads lab members from data/people.json and displays them in a grid,
 * grouped by category (faculty, PhD, MS, undergrad, alumni).
 *
 * Clicking a person card opens a modal overlay with their full profile:
 * photo, name, role, links (email, Google Scholar, LinkedIn, website, GitHub),
 * and bio. The modal can be closed by clicking the X, clicking outside,
 * or pressing Escape.
 *
 * To add a new person, add an entry to data/people.json with these fields:
 *   name, role, category, photo, bio, email, website, scholar, linkedin, github
 *
 * Valid categories: 'faculty', 'phd', 'ms', 'undergrad', 'alumni'
 */
document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('people-root');
  let allPeople = [];

  try {
    allPeople = await fetchData('data/people.json');

    // Categories displayed in this order; empty categories are skipped
    const categories = [
      { key: 'faculty', label: 'Faculty' },
      { key: 'phd', label: 'PhD Students' },
      { key: 'ms', label: 'MS Students' },
      { key: 'undergrad', label: 'Undergraduate Researchers' },
      { key: 'alumni', label: 'Alumni & Past Members' },
    ];

    // Build the grid HTML for each category
    let html = '';
    for (const cat of categories) {
      const members = allPeople.filter(p => p.category === cat.key);
      if (members.length === 0) continue;

      html += `<div class="people-section"><h2>${cat.label}</h2><div class="people-grid">`;
      for (let i = 0; i < members.length; i++) {
        const m = members[i];
        const idx = allPeople.indexOf(m); // Index into allPeople for modal lookup
        html += `
          <div class="person-card" data-person-idx="${idx}" style="cursor:pointer;">
            <img class="person-photo" src="${m.photo}" alt="${m.name}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 120 120%22><rect fill=%22%23e9ecef%22 width=%22120%22 height=%22120%22/><text fill=%22%23adb5bd%22 font-size=%2240%22 x=%2250%25%22 y=%2255%25%22 text-anchor=%22middle%22>&#128100;</text></svg>'">
            <h3>${m.name}</h3>
          </div>
        `;
      }
      html += '</div></div>';
    }

    // Add the modal overlay (hidden by default, shown on card click)
    html += `
      <div class="modal-overlay" id="person-modal">
        <div class="modal-content">
          <button class="modal-close" id="modal-close">&times;</button>
          <div id="modal-body"></div>
        </div>
      </div>
    `;

    root.innerHTML = html;

    // Attach click handler to each person card to open their modal
    document.querySelectorAll('.person-card[data-person-idx]').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.personIdx);
        openModal(allPeople[idx]);
      });
    });

    // Close modal: X button, click outside, or Escape key
    const modal = document.getElementById('person-modal');
    document.getElementById('modal-close').addEventListener('click', () => {
      modal.classList.remove('open');
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') modal.classList.remove('open');
    });

  } catch (e) {
    root.innerHTML = '<p>Failed to load people data.</p>';
    console.error(e);
  }

  /**
   * Populates and opens the person detail modal.
   * Shows photo, name, role, links (only those with non-empty values),
   * and bio text.
   *
   * @param {Object} person — Person object from people.json
   */
  function openModal(person) {
    const modal = document.getElementById('person-modal');
    const body = document.getElementById('modal-body');

    // Build links array — only show links that have a value
    const links = [];
    if (person.email) links.push(`<a href="mailto:${person.email}">&#9993; Email</a>`);
    if (person.scholar) links.push(`<a href="${person.scholar}" target="_blank">&#127891; Google Scholar</a>`);
    if (person.linkedin) links.push(`<a href="${person.linkedin}" target="_blank">&#128101; LinkedIn</a>`);
    if (person.website) links.push(`<a href="${person.website}" target="_blank">&#127760; Website</a>`);
    if (person.github) links.push(`<a href="${person.github}" target="_blank">&#128187; GitHub</a>`);

    body.innerHTML = `
      <div class="modal-header">
        <img class="modal-photo" src="${person.photo}" alt="${person.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 120 120%22><rect fill=%22%23e9ecef%22 width=%22120%22 height=%22120%22/><text fill=%22%23adb5bd%22 font-size=%2240%22 x=%2250%25%22 y=%2255%25%22 text-anchor=%22middle%22>&#128100;</text></svg>'">
        <div class="modal-header-info">
          <h2>${person.name}</h2>
          <div class="role">${person.role}</div>
        </div>
      </div>
      ${links.length > 0 ? `<div class="modal-links">${links.join('')}</div>` : '<div style="border-bottom:1px solid rgba(255,255,255,0.15);margin-bottom:1.25rem;padding-bottom:1.25rem;"></div>'}
      ${person.bio ? `<div class="modal-bio"><p>${person.bio}</p></div>` : '<div class="modal-bio" style="opacity:0.5;"><p>Bio coming soon.</p></div>'}
    `;

    modal.classList.add('open');
  }
});
