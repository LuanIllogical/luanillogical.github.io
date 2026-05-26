const API_BASE = "https://gud-api.vercel.app";

let allRepos = [];
let groupedRepos = {};
let currentGroup = "Groups";
let currentSort = "Stars";
let userProfile = null;
let readme = null;
let readmeHTML = null;
let currentLanguage = null;
let languageItems = [];

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
  const userContainer = document.getElementById("user");
  if (userContainer) {
    userContainer.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <div class="loading-text">Loading user profile for ${escapeHtml(username)}...</div>
      </div>
    `;
  }

  const reposContainer = document.getElementById("repos");
  if (reposContainer) {
    reposContainer.innerHTML = `
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

  try {
    const res = await fetch(`${API_BASE}/api/dossier?user=${encodeURIComponent(username)}`);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

    if (data.user && data.user.message === "Not Found") {
      throw new Error(`User "${username}" not found`);
    }

    console.log('Received languageTexts keys:', Object.keys(data.languageTexts || {}));

    const repoData = data.repos;
    userProfile = data.user;
    readmeHTML = data.readme;
    readme = data.readme;
    allRepos = [];

    for (const [groupName, repos] of Object.entries(repoData.grouped || {})) {
      repos.forEach(repo => {
        allRepos.push({
          ...repo,
          customGroup: groupName
        });
      });
    }

    if (repoData.other && Array.isArray(repoData.other)) {
      repoData.other.forEach(repo => {
        allRepos.push({
          ...repo,
          customGroup: "Other"
        });
      });
    }

    window.languageTexts = data.languageTexts || {};

    render();
  } catch (error) {
    console.error('Error loading dossier:', error);
    const container = document.getElementById("user");
    if (container) {
      container.innerHTML = `<div style="background: #ffebe9; padding: 1rem; border-radius: 1rem; color: #d73a49;">
        <strong>⚠️ Error loading user data</strong><br>
        ${escapeHtml(error.message)}<br>
        User "${escapeHtml(username)}" may not exist or GitHub API is rate limited.
      </div>`;
    }
    const reposContainer = document.getElementById("repos");
    if (reposContainer) {
      reposContainer.innerHTML = '';
    }
  }
}

function render() {
  renderUserCard();
  renderRepos();
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
      <div class="user-left">
        <img src="${userProfile.avatar_url}" class="avatar" />
        <div class="user-info">
          <h2>${userProfile.name || userProfile.login}</h2>
          <p class="username">@${userProfile.login}</p>
          <p class="bio">${userProfile.bio || "No bio available"}</p>
        </div>
        <div class="user-stats">
          <div><a href="https://github.com/${userProfile.login}?tab=followers" target="_blank"><strong>${userProfile.followers || 0}</strong> Followers</a></div>
          <div><a href="https://github.com/${userProfile.login}?tab=following" target="_blank"><strong>${userProfile.following || 0}</strong> Following</a></div>
          <div><a href="https://github.com/${userProfile.login}?tab=repositories" target="_blank"><strong>${userProfile.public_repos || 0}</strong> Repos</a></div>
        </div>
        <div class="user-meta">
          ${userProfile.location ? `<div>📍 ${userProfile.location}</div>` : ""}
          ${userProfile.company ? `<div>🏢 ${userProfile.company}</div>` : ""}
          ${userProfile.blog ? `<div>🔗 <a href="${userProfile.blog}" target="_blank">${userProfile.blog}</a></div>` : ""}
          ${userProfile.twitter_username ? `<div>🐦 <a href="https://twitter.com/${userProfile.twitter_username}" target="_blank">@${userProfile.twitter_username}</a></div>` : ""}
        </div>
      </div>
      <div class="readme-card"></div>
    </div>
  `;

  const readmeContainer = document.querySelector(".readme-card");
  if (readmeContainer && window.languageTexts && Object.keys(window.languageTexts).length > 0) {
    const langCodes = Object.keys(window.languageTexts);

    const showSwitcher = langCodes.length > 1 || (langCodes.length === 1 && langCodes[0] !== 'README');

    if (showSwitcher) {
      if (!currentLanguage) {
        currentLanguage = langCodes[0];
      }
      buildLanguageSwitcher(window.languageTexts);
      displayLanguage(currentLanguage);
    } else {
      displayLanguage(langCodes[0]);
    }
  } else if (readmeContainer && readmeHTML) {
    readmeContainer.innerHTML = readmeHTML;
  }
}

function displayLanguage(langCode) {
  const readmeContainer = document.querySelector(".readme-card");
  if (!readmeContainer) return;

  const content = window.languageTexts[langCode];
  if (content) {
    readmeContainer.innerHTML = content;
  }
}

function buildLanguageSwitcher(languageTexts) {
  const userCardDiv = document.getElementById("user");
  if (!userCardDiv) return;

  const existingBar = userCardDiv.querySelector(".lang-switch-bar");
  if (existingBar) existingBar.remove();

  const langCodes = Object.keys(languageTexts);
  if (langCodes.length === 0) return;

  const langBar = document.createElement("div");
  langBar.className = "lang-switch-bar";

  langBar.innerHTML = langCodes.map(code => `
    <button class="lang-btn ${currentLanguage === code ? 'active' : ''}" data-lang="${code}">
      ${code}
    </button>
  `).join('');

  const userLeftDiv = userCardDiv.querySelector(".user-left");
  if (userLeftDiv) {
    userLeftDiv.insertBefore(langBar, userLeftDiv.firstChild);
  }

  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const lang = btn.getAttribute("data-lang");
      if (languageTexts[lang]) {
        currentLanguage = lang;
        displayLanguage(lang);
        document.querySelectorAll(".lang-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      }
    });
  });
}

function getUrlParameter(user) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(user);
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

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("searchForm");
  const input = document.getElementById("username");

  const urlUser = getUrlParameter('user');

  if (urlUser && urlUser.trim()) {
    input.value = urlUser;
    loadDossier(urlUser);
  } else {
    loadDossier("LuanIllogical");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = input.value.trim();
    if (!user) return;

    const submitBtn = form.querySelector('.search-btn');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Loading...';

    const newUrl = `${window.location.pathname}?user=${encodeURIComponent(user)}`;
    window.history.pushState({ user: user }, '', newUrl);

    await loadDossier(user);

    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  });

  window.addEventListener('popstate', (event) => {
    const urlUser = getUrlParameter('user');
    if (urlUser && urlUser.trim()) {
      input.value = urlUser;
      loadDossier(urlUser);
    } else {
      input.value = '';
      loadDossier("LuanIllogical");
    }
  });

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
      btnGroup.children[0].textContent = item.textContent;
      currentGroup = item.textContent;
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
      btnOrder.children[0].textContent = item.textContent;
      currentSort = item.textContent;
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
});