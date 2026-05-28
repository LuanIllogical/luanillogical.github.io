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
    console.log(data.languageTexts.length);
    if (data.user && data.user.message === "Not Found") {
      throw new Error(`User "${username}" not found`);
    }
    if (data.backgroundCSS) {
      applyBackgroundCSS(data.backgroundCSS);
    } else {
      document.body.style.background = "#050505";
      document.body.style.backgroundAttachment = "";
    }

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
  renderCharts();
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
    section.className = "collapsible-section open";

    section.innerHTML = `
      <button class="section-toggle">
        <span>${groupName} (${repos.length})</span>
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
          ${userProfile.location ? `<div><i class="fa fa-map-marker"></i> ${userProfile.location}</div>` : ""}
          ${userProfile.company ? `<div><i class="fa fa-building-o"></i> ${userProfile.company}</div>` : ""}
          ${userProfile.blog ? `<div><i class="fa fa-link"></i> <a href="${userProfile.blog}" target="_blank">${userProfile.blog}</a></div>` : ""}
          ${userProfile.twitter_username ? `<div>X <a href="https://twitter.com/${userProfile.twitter_username}" target="_blank">@${userProfile.twitter_username}</a></div>` : ""}
        </div>
      </div>
      <div class="readme-card"></div>
    </div>
  `;

  const readmeContainer = document.querySelector(".readme-card");
  if (readmeContainer && window.languageTexts && Object.keys(window.languageTexts).length > 0) {
    const langCodes = Object.keys(window.languageTexts);
    const showDropdown = langCodes.length > 1 || (langCodes.length === 1 && langCodes[0] !== 'README');

    if (showDropdown) {
      if (!currentLanguage) {
        currentLanguage = langCodes[0];
      }
      buildLanguageSwitcher(window.languageTexts);
      displayLanguage(currentLanguage);
    } else if (langCodes.length === 1) {
      displayLanguage(langCodes[0]);
    }
  } else if (readmeContainer && readmeHTML) {
    readmeContainer.innerHTML = `<div class="readme-content">${readmeHTML}</div>`;
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
  const readmeCard = document.querySelector(".readme-card");
  if (!readmeCard) return;

  const existingSelector = readmeCard.querySelector(".lang-selector-wrapper");
  if (existingSelector) existingSelector.remove();

  const langCodes = Object.keys(languageTexts);
  if (langCodes.length === 0 || (langCodes.length === 1 && langCodes[0] === 'README')) return;

  const langWrapper = document.createElement("div");
  langWrapper.className = "lang-selector-wrapper";

  langWrapper.innerHTML = `
    <div class="dropdown lang-selector-dropdown">
      <button class="dropdown-btn" id="languageDropdownBtn">
        <span id="selectedLanguage">${currentLanguage || langCodes[0]}</span>
        <i class="fa fa-angle-down"></i>
      </button>
      <div class="dropdown-menu" id="languageDropdownMenu"></div>
    </div>
  `;

  readmeCard.insertBefore(langWrapper, readmeCard.firstChild);

  const dropdownMenu = document.getElementById("languageDropdownMenu");
  const selectedLanguageSpan = document.getElementById("selectedLanguage");
  const dropdown = document.querySelector(".lang-selector-dropdown");

  langCodes.forEach(code => {
    const item = document.createElement('div');
    item.className = `dropdown-item ${currentLanguage === code ? 'active' : ''}`;
    item.setAttribute('data-lang', code);
    item.innerHTML = code;

    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const lang = item.getAttribute('data-lang');
      if (languageTexts[lang]) {
        currentLanguage = lang;

        const contentContainer = document.querySelector(".readme-content");
        if (contentContainer) {
          contentContainer.innerHTML = languageTexts[lang];
        }

        selectedLanguageSpan.innerHTML = lang;

        document.querySelectorAll('#languageDropdownMenu .dropdown-item').forEach(i => {
          i.classList.remove('active');
        });
        item.classList.add('active');

        dropdown.classList.remove('open');
      }
    });

    dropdownMenu.appendChild(item);
  });

  const dropdownBtn = document.getElementById("languageDropdownBtn");
  dropdownBtn.onclick = (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
  };

  document.addEventListener('click', (e) => {
    if (dropdown && !dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });
}

function displayLanguage(langCode) {
  const readmeCard = document.querySelector(".readme-card");
  if (!readmeCard) return;

  const content = window.languageTexts[langCode];
  if (content) {
    let contentContainer = readmeCard.querySelector(".readme-content");
    if (!contentContainer) {
      contentContainer = document.createElement("div");
      contentContainer.className = "readme-content";
      readmeCard.appendChild(contentContainer);
    }
    contentContainer.innerHTML = content;
  }
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

function applyBackgroundCSS(backgroundCSS) {
  if (!backgroundCSS) {
    document.body.style.background = "#050505";
    return;
  }

  document.body.style.background = backgroundCSS;

  if (backgroundCSS.includes('gradient')) {
    document.body.style.minHeight = "100vh";
    document.body.style.backgroundAttachment = "fixed";
  }
}

function renderCharts() {
  renderLanguageChart();
  renderStarsPerLanguageChart();
  renderGroupChart()
  renderStarsPerGroupChart();
}

const languageColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7B731',
  '#E74C3C', '#3498DB', '#2ECC71', '#F39C12'
];

function renderLanguageChart() {
  if (!allRepos || allRepos.length === 0) return;

  const languageCount = {};
  allRepos.forEach(repo => {
    const lang = repo.language || "Unknown";
    languageCount[lang] = (languageCount[lang] || 0) + 1;
  });

  const sortedLanguages = Object.entries(languageCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const languages = sortedLanguages.map(([lang]) => lang);
  const counts = sortedLanguages.map(([, count]) => count);

  const canvas = document.getElementById('languageChart');
  if (!canvas) return;

  let existingChart = Chart.getChart(canvas);
  if (existingChart) {
    existingChart.destroy();
  }

  new Chart(canvas, {
    type: 'pie',
    data: {
      labels: languages,
      datasets: [{
        data: counts,

        backgroundColor: languageColors
          .slice(0, languages.length)
          .map(color => `${color}88`),

        borderColor: languageColors.slice(0, languages.length),

        borderWidth: 2,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      layout: {
        padding: {
          top: 10,
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#ffffff',
            font: {
              size: 12
            },
            padding: 10
          }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} repos (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function renderStarsPerLanguageChart() {
  if (!allRepos || allRepos.length === 0) return;

  const languageStars = {};

  allRepos.forEach(repo => {
    const lang = repo.language || "Unknown";

    if (!languageStars[lang]) {
      languageStars[lang] = 0;
    }

    languageStars[lang] += repo.stargazers_count || 0;
  });

  const sortedLanguages = Object.entries(languageStars)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const languages = sortedLanguages.map(([lang]) => lang);
  const stars = sortedLanguages.map(([, stars]) => stars);

  const canvas = document.getElementById('starsPerLanguageChart');
  if (!canvas) return;

  let existingChart = Chart.getChart(canvas);

  if (existingChart) {
    existingChart.destroy();
  }

  new Chart(canvas, {
    type: 'pie',

    data: {
      labels: languages,

      datasets: [{
        label: 'Stars',

        data: stars,

        backgroundColor: languageColors
          .slice(0, languages.length)
          .map(color => `${color}88`),

        borderColor: languageColors.slice(0, languages.length),

        borderWidth: 2,

        hoverOffset: 12
      }]
    },

    options: {
      responsive: true,
      maintainAspectRatio: true,

      layout: {
        padding: {
          top: 10
        }
      },

      plugins: {
        legend: {
          position: 'bottom',

          labels: {
            color: '#ffffff',

            font: {
              size: 12
            },

            padding: 12
          }
        },

        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || '';
              const value = context.raw || 0;

              const total = context.dataset.data.reduce((a, b) => a + b, 0);

              const percentage = ((value / total) * 100).toFixed(1);

              return `${label}: ${value} stars (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

const groupColors = [
  '#60A5FA',
  '#34D399',
  '#FBBF24',
  '#F472B6',
  '#A78BFA',
  '#FB7185',
  '#22D3EE',
  '#84CC16'
];

function renderGroupChart() {
  if (!allRepos || allRepos.length === 0) return;

  const groupCounts = {};

  allRepos.forEach(repo => {
    const group = repo.customGroup || "Other";

    groupCounts[group] = (groupCounts[group] || 0) + 1;
  });

  const sorted = Object.entries(groupCounts)
    .sort((a, b) => b[1] - a[1]);

  const groups = sorted.map(([g]) => g);
  const counts = sorted.map(([, c]) => c);

  const canvas = document.getElementById("groupChart");
  if (!canvas) return;

  let existing = Chart.getChart(canvas);
  if (existing) existing.destroy();

  new Chart(canvas, {
    type: "pie",

    data: {
      labels: groups,

      datasets: [{
        data: counts,

        backgroundColor: groupColors
          .slice(0, groups.length)
          .map(c => `${c}88`),

        borderColor: groupColors.slice(0, groups.length),

        borderWidth: 2,

        hoverOffset: 10
      }]
    },

    options: {
      responsive: true,

      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#fff",
            font: { size: 12 },
            padding: 12
          }
        },

        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || '';
              const value = context.raw || 0;

              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);

              return `${label}: ${value} repos (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function renderStarsPerGroupChart() {
  if (!allRepos || allRepos.length === 0) return;

  const groupStars = {};

  allRepos.forEach(repo => {
    const group = repo.customGroup || "Other";

    if (!groupStars[group]) {
      groupStars[group] = 0;
    }

    groupStars[group] += repo.stargazers_count || 0;
  });

  const sortedGroups = Object.entries(groupStars)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const groups = sortedGroups.map(([group]) => group);
  const stars = sortedGroups.map(([, stars]) => stars);

  const canvas = document.getElementById('starsPerGroupChart');

  if (!canvas) return;

  let existingChart = Chart.getChart(canvas);

  if (existingChart) {
    existingChart.destroy();
  }

  new Chart(canvas, {
    type: 'pie',

    data: {
      labels: groups,

      datasets: [{
        label: 'Stars',

        data: stars,

        backgroundColor: groupColors
          .slice(0, groupColors.length)
          .map(color => `${color}88`),

        borderColor: groupColors.slice(0, groupColors.length),

        borderWidth: 2,

        hoverOffset: 12
      }]
    },

    options: {
      responsive: true,
      maintainAspectRatio: true,
      layout: {
        padding: {
          top: 10
        }
      },

      plugins: {
        legend: {
          position: 'bottom',

          labels: {
            color: '#ffffff',

            font: {
              size: 12
            },

            padding: 12
          }
        },

        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || '';
              const value = context.raw || 0;

              const total = context.dataset.data.reduce((a, b) => a + b, 0);

              const percentage = ((value / total) * 100).toFixed(1);

              return `${label}: ${value} stars (${percentage}%)`;
            }
          }
        }
      }
    }
  });
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

  document.body.addEventListener("click", (e) => {
    const toggle = e.target.closest('.section-toggle');
    if (toggle) {
      e.stopPropagation();
      const section = toggle.closest('.collapsible-section');
      if (section) {
        section.classList.toggle("open");

        const chevron = toggle.querySelector('.fa-chevron-up');
        if (chevron) {
          if (section.classList.contains('open')) {
            chevron.style.transform = 'rotate(0deg)';
          } else {
            chevron.style.transform = 'rotate(180deg)';
          }
        }
      }
    }
  });
});