import { renderCharts, setChartsLanguageColors, setChartsGroupColors } from "./charts.js";
import {
  setReposData,
  updateAndRenderRepos,
  renderRepos,
  attachReposEventListeners,
  setCurrentGroup,
  setCurrentSort,
  getReposData,
  renderReposSkeleton,
  setVideoPreviews
} from "./repos.js";
import {
  setContributionsData,
  renderContributions,
  renderContributionsSkeleton,
  setContributionsDetailColors
} from "./contribution.js";
import {
  setActivityData,
  renderActivity,
  setUserProfileForActivity,
  renderActivitySkeleton
} from "./activity.js";
import {
  setUserProfile,
  setReadmeHTML,
  renderUserCard,
  renderUserSkeleton,
  setCurrentLanguage,
  getCurrentLanguage
} from "./userCard.js";
import {
  setBackgroundCSS,
  setDetailColors
} from "./colors.js"

const API_BASE = "https://gud-api.vercel.app";

let currentLanguage = null;

async function loadDossier(username) {
  renderUserSkeleton();
  renderReposSkeleton();
  renderChartsSkeleton();
  renderContributionsSkeleton();
  renderActivitySkeleton();

  try {
    const res = await fetch(`${API_BASE}/api/dossier?user=${encodeURIComponent(username)}`);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

    if (data.user && data.user.message === "Not Found") {
      throw new Error(`User "${username}" not found`);
    }
    const repoData = data.repos;

    setUserProfile(data.user);
    setReadmeHTML(data.readme);
    setContributionsData(data.contributions || null);
    setActivityData(data.recentActivity || []);
    setUserProfileForActivity(data.user);

    let allRepos = [];

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

    const hasGroups = allRepos.some(r => r.customGroup && r.customGroup !== 'Other');
    if (!hasGroups) {
      setCurrentGroup("All");
      const btnGroup = document.getElementById("dropdownBtnGroup");
      if (btnGroup && btnGroup.children[0]) {
        btnGroup.children[0].textContent = "All";
      }
    }

    setReposData(allRepos);

    if (data.videoPreviews) {
      setVideoPreviews(data.videoPreviews);
    }
    const detailColors = data.customDetailColors || null;
    setDetailColors(detailColors);
    const backgroundCSS = data.backgroundCSS || null;
    setBackgroundCSS(backgroundCSS);
    const chartGroupColors = data.chartGroupColors || null;
    if (chartGroupColors) {
      setChartsGroupColors(chartGroupColors);
    }
    const chartLanguageColors = data.chartLanguageColors || null;
    if (chartLanguageColors) {
      setChartsLanguageColors(chartLanguageColors);
    }

    render();
  } catch (error) {
    console.error('Error loading dossier:', error);
    const container = document.getElementById("user");
    if (container) {
      container.innerHTML = `<div style="background: #ffebe9; padding: 1rem; border-radius: 1rem; color: #d73a49; margin-bottom: 2rem;">
        <strong>Error loading user data</strong><br>
        ${escapeHtml(error.message)}<br>
        User "${escapeHtml(username)}" may not exist or GitHub API is rate limited.
      </div>`;
    }
    const reposContainer = document.getElementById("repos");
    if (reposContainer) {
      reposContainer.innerHTML = '';
    }
    const contribContainer = document.getElementById("contributionsContent");
    if (contribContainer) {
      contribContainer.innerHTML = '<div class="empty-activity">Failed to load contribution data</div>';
    }
    const activityContainer = document.getElementById("activityContent");
    if (activityContainer) {
      activityContainer.innerHTML = '<div class="empty-activity">Failed to load activity data</div>';
    }
  }
}

function render() {
  renderUserCard();
  renderRepos();
  renderCharts(getReposData());
  renderContributions();
  renderActivity();
}

function renderChartsSkeleton() {
  const chartsContainer = document.querySelector(".charts");
  if (chartsContainer) {
    chartsContainer.innerHTML = `
    ${Array(4).fill(0).map(() => `
      <div class="chart-section">
        <div class="repo-skeleton" style="height: 300px; width: 300px; margin: 0 auto; border-radius: 50%;">
          <div style="width:100%; height:100%; border-radius:50%;"></div>
        </div>
      </div>
    `).join('')}
  `;
  }
}

function getUrlParameter(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
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

  attachReposEventListeners();
});