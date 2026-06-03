let allRepos = [];
let groupedRepos = {};
let currentGroup = "Groups";
let currentSort = "Stars";

const sorters = {
    "Last Updated": (a, b) =>
        new Date(b.updated_at || 0) -
        new Date(a.updated_at || 0),

    "Name": (a, b) =>
        (a.name || "").localeCompare(b.name || ""),

    "Stars": (a, b) =>
        (b.stargazers_count || 0) -
        (a.stargazers_count || 0),
};

export function setReposData(repos) {
    allRepos = repos;
    groupedRepos = groupRepos(allRepos);
}

export function getReposData() {
    return allRepos;
}

export function setCurrentGroup(group) {
    currentGroup = group;
    groupedRepos = groupRepos(allRepos);
}

export function getCurrentGroup() {
    return currentGroup;
}

export function setCurrentSort(sort) {
    currentSort = sort;
    groupedRepos = groupRepos(allRepos);
}

export function getCurrentSort() {
    return currentSort;
}
export function renderRepos() {
    const container = document.getElementById("repos");
    if (!container) return;

    container.innerHTML = "";
    const groups = groupRepos(allRepos);
    renderGroups(groups, container);
}

export function updateAndRenderRepos(repos) {
    allRepos = repos;
    groupedRepos = groupRepos(allRepos);
    renderRepos();
}

export function renderReposSkeleton() {
    const container = document.getElementById("repos");
    if (container) {
        container.innerHTML = `
      <div class="repo-grid">
        ${Array(6).fill(0).map(() => `
          <div class="repo-skeleton">
            <div class="skeleton-title"></div>
            <div class="skeleton-description"></div>
            <div class="skeleton-meta"></div>
          </div>
        `).join('')}
      </div>
    `;
    }
}

function sortRepos(repos) {
    const sorter = sorters[currentSort];
    if (sorter) repos.sort(sorter);
    return repos;
}

function groupBy(repos, keyFn) {
    const groups = {};
    repos.forEach(repo => {
        const key = keyFn(repo);
        if (!groups[key]) groups[key] = [];
        groups[key].push(repo);
    });
    return groups;
}

function groupRepos(repos) {
    switch (currentGroup) {
        case "Groups":
            return buildCustomGroups(repos);
        case "Main Language":
            return buildLanguageGroups(repos);
        default:
            return { All: sortRepos([...repos]) };
    }
}

function buildCustomGroups(repos) {
    const groups = {};
    repos.forEach(repo => {
        const key = repo.customGroup || "Other";
        if (!groups[key]) groups[key] = [];
        groups[key].push(repo);
    });
    for (const key in groups) {
        groups[key] = sortRepos([...groups[key]]);
    }
    return groups;
}

function buildLanguageGroups(repos) {
    const grouped = groupBy(repos, repo => repo.language || "Unknown");
    for (const key in grouped) {
        grouped[key] = sortRepos([...grouped[key]]);
    }
    const sortedEntries = Object.entries(grouped).sort((a, b) => {
        const [langA, reposA] = a;
        const [langB, reposB] = b;
        if (langA === "Unknown") return 1;
        if (langB === "Unknown") return -1;
        return reposB.length - reposA.length;
    });
    return Object.fromEntries(sortedEntries);
}

function renderGroups(groups, container) {
    for (const [groupName, repos] of Object.entries(groups)) {
        const section = document.createElement("section");
        section.className = "collapsible-section open";

        section.innerHTML = `
      <button class="section-toggle">
        <span>${escapeHtml(groupName)} (${repos.length})</span>
        <i class="fa fa-chevron-up"></i>
      </button>

      <div class="section-content">
        <div class="repo-grid">
          ${repos.map(createCard).join("")}
        </div>
      </div>
    `;

        container.appendChild(section);
    }

    attachToggleListeners();
}

function createCard(repo) {
    return `
    <a class="repo-card" href="${repo.html_url}" target="_blank">
      <div class="repo-card-header">
        <h3>${escapeHtml(repo.name)}</h3>
      </div>
      <p class="repo-description">
        ${escapeHtml(repo.description || "No description")}
      </p>
      <div class="repo-meta">
        <div> ${repo.stargazers_count || 0} <i class="fa fa-star-o"></i></div>
        <div> ${repo.forks_count || 0} <i class="fa fa-code-fork"></i></div>
        <div> ${repo.watchers_count || 0} <i class="fa fa-eye"></i></div>
        <span>${escapeHtml(repo.language || "Unknown")}</span>
      </div>
      <div class="repo-updated">
        Updated ${new Date(repo.updated_at).toLocaleDateString()}
      </div>
    </a>
  `;
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function attachToggleListeners() {
    document.querySelectorAll('.section-toggle').forEach(toggle => {
        toggle.removeEventListener('click', toggleClickHandler);
        toggle.addEventListener('click', toggleClickHandler);
    });
}

function toggleClickHandler(e) {
    e.stopPropagation();
    const section = e.currentTarget.closest('.collapsible-section');
    if (section) {
        section.classList.toggle('open');
        const chevron = e.currentTarget.querySelector('.fa-chevron-up');
        if (chevron) {
            chevron.style.transform = section.classList.contains('open') ? 'rotate(0deg)' : 'rotate(180deg)';
        }
    }
}

export function attachReposEventListeners() {
    const dropdownGroup = document.querySelector(".ddGroup");
    const btnGroup = document.getElementById("dropdownBtnGroup");
    const dropdownOrder = document.querySelector(".ddOrder");
    const btnOrder = document.getElementById("dropdownBtnOrder");

    if (btnGroup) {
        btnGroup.addEventListener("click", () => {
            dropdownGroup.classList.toggle("open");
        });
    }

    document.querySelectorAll(".ddig").forEach(item => {
        item.addEventListener("click", () => {
            if (btnGroup && btnGroup.children[0]) {
                btnGroup.children[0].textContent = item.textContent;
            }
            setCurrentGroup(item.textContent);
            dropdownGroup.classList.remove("open");
            renderRepos();
        });
    });

    if (btnOrder) {
        btnOrder.addEventListener("click", () => {
            dropdownOrder.classList.toggle("open");
        });
    }

    document.querySelectorAll(".ddio").forEach(item => {
        item.addEventListener("click", () => {
            if (btnOrder && btnOrder.children[0]) {
                btnOrder.children[0].textContent = item.textContent;
            }
            setCurrentSort(item.textContent);
            dropdownOrder.classList.remove("open");
            renderRepos();
        });
    });

    document.addEventListener("click", e => {
        if (dropdownGroup && !dropdownGroup.contains(e.target)) {
            dropdownGroup.classList.remove("open");
        }
        if (dropdownOrder && !dropdownOrder.contains(e.target)) {
            dropdownOrder.classList.remove("open");
        }
    });
}