const API_BASE = "https://gud-api.vercel.app";

let allRepos = [];
let groupedRepos = {};
let currentGroup = "Groups";
let currentSort = "Stars";
let userProfile = null;
let readme = null;

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

async function loadDossier(username) {
  const res = await fetch(`${API_BASE}/api/dossier?user=${username}`);
  const data = await res.json();
  const repoData = data.repos;
  userProfile = data.user;
  readme = data.readme;
  allRepos = [];

  for (const [groupName, repos] of Object.entries(repoData.grouped)) {
    repos.forEach(repo => {
      allRepos.push({
        ...repo,
        customGroup: groupName
      });
    });
  }

  repoData.other.forEach(repo => {
    allRepos.push({
      ...repo,
      customGroup: "Other"
    });
  });

  render();
}

function render() {
  renderUserCard();
  renderRepos();
}

function sortRepos(repos) {
  const sorter = sorters[currentSort];

  if (sorter) {
    repos.sort(sorter);
  }

  return repos;
}

function groupBy(repos, keyFn) {
  const groups = {};

  repos.forEach(repo => {
    const key = keyFn(repo);

    if (!groups[key]) {
      groups[key] = [];
    }

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

    case "None":
      return {
        All: sortRepos([...repos])
      };

    default:
      return {
        All: sortRepos([...repos])
      };
  }
}

function buildCustomGroups(repos) {
  const groups = {};

  repos.forEach(repo => {
    const key = repo.customGroup || "Other";

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(repo);
  });

  for (const key in groups) {
    groups[key] = sortRepos([...groups[key]]);
  }

  return groups;
}

function buildLanguageGroups(repos) {
  const grouped = groupBy(
    repos,
    repo => repo.language || "Unknown"
  );

  for (const key in grouped) {
    grouped[key] = sortRepos([...grouped[key]]);
  }

  const sortedEntries = Object.entries(grouped)
    .sort((a, b) => {
      const [langA, reposA] = a;
      const [langB, reposB] = b;

      if (langA === "Unknown") return 1;
      if (langB === "Unknown") return -1;

      return reposB.length - reposA.length;
    });

  return Object.fromEntries(sortedEntries);
}

function renderRepos() {
  const container = document.getElementById("repos");

  container.innerHTML = "";

  const groups = groupRepos(allRepos);

  renderGroups(groups, container);
}

function renderGroups(groups, container) {
  for (const [groupName, repos] of Object.entries(groups)) {
    const section = document.createElement("section");

    section.innerHTML = `
      <h2 class="group-title">${groupName} (${repos.length})</h2>

      <div class="repo-grid">
        ${repos.map(createCard).join("")}
      </div>
    `;

    container.appendChild(section);
  }
}

function renderGrid(repos, container) {
  const grid = document.createElement("div");
  grid.className = "repo-grid";

  grid.innerHTML = repos.map(createCard).join("");

  container.appendChild(grid);
}

function createCard(repo) {
  return `
    <a class="repo-card" href="${repo.html_url}" target="_blank">
      <div class="repo-card-header">
        <h3>${repo.name}</h3>
      </div>

      <p class="repo-description">
        ${repo.description || "No description"}
      </p>

      <div class="repo-meta">
        <div> ${repo.stargazers_count} <i class="fa fa-star-o"></i></div>
        <div> ${repo.forks_count} <i class="fa fa-code-fork"></i></div>
        <div> ${repo.watchers_count} <i class="fa fa-eye"></i></div>
        <span>${repo.language || "Unknown"}</span>
      </div>

      <div class="repo-updated">
        Updated ${new Date(repo.updated_at).toLocaleDateString()}
      </div>
    </a>
  `;
}

function renderUserCard() {
  const container = document.getElementById("user");

  if (!userProfile) return;

  container.innerHTML = `
    <div class="user-card">

      <!-- LEFT SIDE -->
      <div class="user-left">

        <img src="${userProfile.avatar_url}" class="avatar" />

        <div class="user-info">
          <h2>${userProfile.name || userProfile.login}</h2>
          <p class="username">@${userProfile.login}</p>

          <p class="bio">
            ${userProfile.bio || "No bio available"}
          </p>
        </div>

        <div class="user-stats">
          <div><a href="https://github.com/${userProfile.login}?tab=followers" target="_blank"><strong>${userProfile.followers}</strong> Followers</a></div>
          <div><a href="https://github.com/${userProfile.login}?tab=following" target="_blank"><strong>${userProfile.following}</strong> Following</a></div>
          <div><a href="https://github.com/${userProfile.login}?tab=repositories" target="_blank"><strong>${userProfile.public_repos}</strong> Repos</a></div>
        </div>

        <div class="user-meta">
          ${userProfile.location ? `<div>📍 ${userProfile.location}</div>` : ""}
          ${userProfile.company ? `<div>🏢 ${userProfile.company}</div>` : ""}
          ${userProfile.blog ? `<div>🔗 <a href="${userProfile.blog}" target="_blank">${userProfile.blog}</a></div>` : ""}
          ${userProfile.twitter_username ? `<div>🐦 <a href="https://twitter.com/${userProfile.twitter_username}" target="_blank">@${userProfile.twitter_username}</a></div>` : ""}
        </div>

      </div>

      <!-- RIGHT SIDE -->
      <div class="readme-card">
        ${readme ?? ""}
      </div>

    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("searchForm");
  const input = document.getElementById("username");
  loadDossier("LuanIllogical");

  form.addEventListener("submit", e => {
    e.preventDefault();

    const user = input.value.trim();
    if (!user) return;

    loadDossier(user);
  });
});

const dropdownGroup = document.querySelector(".ddGroup");
const btnGroup = document.getElementById("dropdownBtnGroup");

btnGroup.addEventListener("click", () => {
  dropdownGroup.classList.toggle("open");
});

document.querySelectorAll(".ddig").forEach(item => {
  item.addEventListener("click", () => {
    btnGroup.children[0].textContent = item.textContent;

    currentGroup = item.textContent;

    dropdownGroup.classList.remove("open");

    renderRepos();
  });
});

document.addEventListener("click", e => {
  if (!dropdownGroup.contains(e.target)) {
    dropdownGroup.classList.remove("open");
  }
  if (!dropdownOrder.contains(e.target)) {
    dropdownOrder.classList.remove("open");
  }
});

const dropdownOrder = document.querySelector(".ddOrder");
const btnOrder = document.getElementById("dropdownBtnOrder");

btnOrder.addEventListener("click", () => {
  dropdownOrder.classList.toggle("open");
});

document.querySelectorAll(".ddio").forEach(item => {
  item.addEventListener("click", () => {
    btnOrder.children[0].textContent = item.textContent;

    currentSort = item.textContent;

    dropdownOrder.classList.remove("open");

    renderRepos();
  });
});
