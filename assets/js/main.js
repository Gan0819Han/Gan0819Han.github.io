(function () {
  const data = window.siteData;

  if (!data) {
    return;
  }

  const featuredContainer = document.querySelector("#featured-projects");
  const repoContainer = document.querySelector("#repo-overview");
  const yearNode = document.querySelector("#current-year");
  const sidebarLinks = Array.from(document.querySelectorAll("[data-section-link]"));
  const trackedSections = sidebarLinks
    .map((link) => document.querySelector(`#${link.dataset.sectionLink}`))
    .filter(Boolean);

  if (featuredContainer) {
    featuredContainer.innerHTML = data.featuredProjects.map(renderFeaturedProject).join("");
  }

  if (repoContainer) {
    repoContainer.innerHTML = data.repositories.map(renderRepository).join("");
  }

  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }

  if (sidebarLinks.length && trackedSections.length) {
    syncActiveSidebarLink();
    window.addEventListener("scroll", syncActiveSidebarLink, { passive: true });
  }

  function renderFeaturedProject(project) {
    const meta = project.meta.map((item) => `<span class="meta-pill">${item}</span>`).join("");
    return `
      <article class="card ${project.accentClass}">
        <span class="card-label">${project.label}</span>
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        <div class="project-meta">${meta}</div>
        <a class="text-link" href="${project.url}">查看仓库</a>
      </article>
    `;
  }

  function renderRepository(repo) {
    return `
      <article class="repo-row">
        <div>
          <h3><a href="${repo.url}">${repo.title}</a></h3>
          <p>${repo.description}</p>
        </div>
        <p class="repo-side">${repo.side}</p>
        <p class="repo-time">${repo.updated}</p>
      </article>
    `;
  }

  function syncActiveSidebarLink() {
    const activeSection = trackedSections.findLast((section) => {
      const rect = section.getBoundingClientRect();
      return rect.top <= 160;
    }) || trackedSections[0];

    if (!activeSection) {
      return;
    }

    sidebarLinks.forEach((link) => {
      link.classList.toggle("is-active", link.dataset.sectionLink === activeSection.id);
    });
  }
})();
