import { renderCharts } from "./charts.js";

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
let contributionsData = null;
let activityData = [];

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

  const contribContainer = document.getElementById("contributionsContent");
  if (contribContainer) {
    contribContainer.innerHTML = `
    <div style="display:flex; justify-content:center;">
      <div class="repo-skeleton" style="padding: 1.5rem; border-radius: 16px; display: inline-flex; flex-direction: column; gap: 8px;">
        <div style="display:flex; gap:3px; margin-bottom:6px;">
          ${Array(53).fill(0).map(() => `<div style="width:12px; height:10px; background:rgba(255,255,255,0.06); border-radius:2px;"></div>`).join('')}
        </div>
        ${Array(7).fill(0).map(() => `
          <div style="display:flex; gap:3px;">
            ${Array(53).fill(0).map((_, i) => `<div style="width:12px; height:12px; background:rgba(255,255,255,${0.03 + Math.random() * 0.06}); border-radius:2px;"></div>`).join('')}
          </div>
        `).join('')}
      </div>
    </div>
  `;
  }

  const activityContainer = document.getElementById("activityContent");
  if (activityContainer) {
    activityContainer.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:0.75rem;">
      ${Array(6).fill(0).map(() => `
        <div class="repo-skeleton" style="border-radius:12px; padding:0.9rem 1rem; border-left: 3px solid rgba(88,166,255,0.2);">
          <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
            <div style="width:24px; height:14px; background:rgba(255,255,255,0.06); border-radius:4px;"></div>
            <div style="width:80px; height:14px; background:rgba(255,255,255,0.06); border-radius:4px;"></div>
            <div style="width:120px; height:14px; background:rgba(255,255,255,0.06); border-radius:4px;"></div>
            <div style="width:40px; height:12px; background:rgba(255,255,255,0.04); border-radius:4px; margin-left:auto;"></div>
          </div>
          <div style="padding-left:1.8rem;">
            <div style="width:60%; height:12px; background:rgba(255,255,255,0.04); border-radius:4px;"></div>
          </div>
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
    contributionsData = data.contributions || null;
    activityData = data.recentActivity || [];
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

    const hasGroups = allRepos.some(r => r.customGroup && r.customGroup !== 'Other');
    if (!hasGroups) {
      currentGroup = "All"
      document.getElementById("dropdownBtnGroup").children[0].textContent = "All";
    }
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
  renderCharts(allRepos);
  renderContributions();
  renderActivity();
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

function renderUserCard() {
  const container = document.getElementById("user");

  if (!userProfile) return;

  container.innerHTML = `
    <div class="user-card">
      <div class="user-left">
        <img src="${userProfile.avatar_url}" class="avatar" />
        <div class="user-info">
          <h2>${escapeHtml(userProfile.name || userProfile.login)}</h2>
          <p class="username">@${escapeHtml(userProfile.login)}</p>
          <p class="bio">${escapeHtml(userProfile.bio || "No bio available")}</p>
        </div>
        <div class="user-stats">
          <div><a href="https://github.com/${userProfile.login}?tab=followers" target="_blank"><strong>${userProfile.followers || 0}</strong> Followers</a></div>
          <div><a href="https://github.com/${userProfile.login}?tab=following" target="_blank"><strong>${userProfile.following || 0}</strong> Following</a></div>
          <div><a href="https://github.com/${userProfile.login}?tab=repositories" target="_blank"><strong>${userProfile.public_repos || 0}</strong> Repos</a></div>
        </div>
        <div class="user-meta">
          ${userProfile.location ? `<div><i class="fa fa-map-marker"></i> ${escapeHtml(userProfile.location)}</div>` : ""}
          ${userProfile.company ? `<div><i class="fa fa-building-o"></i> ${escapeHtml(userProfile.company)}</div>` : ""}
          ${userProfile.blog ? `<div><i class="fa fa-link"></i> <a href="${escapeHtml(userProfile.blog)}" target="_blank">${escapeHtml(userProfile.blog)}</a></div>` : ""}
          ${userProfile.twitter_username ? `<div><i class="fa fa-twitter"></i> <a href="https://twitter.com/${userProfile.twitter_username}" target="_blank">@${escapeHtml(userProfile.twitter_username)}</a></div>` : ""}
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

function renderContributions() {
  if (!contributionsData?.colorScheme && !contributionsData?.customColorScheme) {
    const styleElement = document.getElementById('contrib-color-scheme');
    if (styleElement) styleElement.remove();
  }
  const container = document.getElementById("contributionsContent");
  if (!container) return;

  if (!contributionsData || !contributionsData.contributions || contributionsData.contributions.length === 0) {
    container.innerHTML = '<div class="empty-activity"><i class="fa fa-info-circle"></i> No contribution data available</div>';
    return;
  }

  if (contributionsData.colorScheme) {
    const { fills, borders } = contributionsData.colorScheme;
    let styleElement = document.getElementById('contrib-color-scheme');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'contrib-color-scheme';
      document.head.appendChild(styleElement);
    }
    let css = ':root {\n';
    fills.forEach((f, i) => css += `  --contrib-fill-${i}: ${f};\n`);
    borders.forEach((b, i) => css += `  --contrib-border-${i}: ${b};\n`);
    css += '}\n';
    styleElement.textContent = css;
  }

  const totalContributions = contributionsData.total || contributionsData.contributions.reduce((sum, c) => sum + c.count, 0);

  const html = `
  <div class="contribution-grid-wrapper">
    <div class="contribution-grid">  
    <div class="contribution-header">
    <div class="contribution-stats">
        <span><strong>${totalContributions.toLocaleString()}</strong> contributions in the last year</span>
      </div>
      <div class="contribution-legend">
        <span>Less</span>
        <div class="legend-colors">
          <div class="legend-color level-0"></div>
          <div class="legend-color level-1"></div>
          <div class="legend-color level-2"></div>
          <div class="legend-color level-3"></div>
          <div class="legend-color level-4"></div>
        </div>
        <span>More</span>
      </div>
      </div>
      ${renderContributionGrid()}
      
    </div>
    </div>
  `;

  container.innerHTML = html;
  addContributionTooltips();
}

function renderContributionGrid() {
  if (!contributionsData || !contributionsData.contributions || contributionsData.contributions.length === 0) {
    return '<div class="empty-activity"><i class="fa fa-info-circle"></i> No contribution data available</div>';
  }

  const sorted = [...contributionsData.contributions].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Group by weeks (each week = 7 days, starting from Sunday)
  const weeks = [];
  let currentWeek = [];

  // Find the first Sunday
  const firstDate = new Date(sorted[0].date);
  const firstDayOfWeek = firstDate.getDay(); // 0 = Sunday
  const startDate = new Date(firstDate);
  startDate.setDate(firstDate.getDate() - firstDayOfWeek);

  // Create a map for quick lookup
  const contribMap = new Map();
  sorted.forEach(c => contribMap.set(c.date, c));

  // Generate all dates from startDate to today
  const today = new Date();
  const currentDate = new Date(startDate);

  while (currentDate <= today) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const contrib = contribMap.get(dateStr);
    const count = contrib ? contrib.count : 0;
    const level = contrib ? contrib.level : 0;

    currentWeek.push({
      date: dateStr,
      count: count,
      level: level
    });

    // End of week (Saturday)
    if (currentWeek.length === 7) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Add last week if incomplete
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: null, count: 0, level: 0 });
    }
    weeks.push(currentWeek);
  }

  // Calculate month positions for labels
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // REPLACE the monthPositions building block with:
  const monthPositions = [];
  let lastMonth = -1;
  let lastLabelWeek = -4;

  weeks.forEach((week, weekIdx) => {
    for (let dayIdx = 0; dayIdx < week.length; dayIdx++) {
      const day = week[dayIdx];
      if (day && day.date) {
        const date = new Date(day.date);
        const m = date.getMonth();
        if (m !== lastMonth && (weekIdx - lastLabelWeek) >= 4) {
          monthPositions[weekIdx] = monthNames[m];
          lastMonth = m;
          lastLabelWeek = weekIdx;
        }
        break;
      }
    }
  });

  // Combine everything
  return `
  <div style="display:flex; justify-content:center;">
    <div style="display:flex; align-items:flex-start; gap:4px;">

      <div style="display:flex; flex-direction:column; gap:3px; padding-top:18px; flex-shrink:0;">
        <div style="height:12px; font-size:10px; color:rgba(255,255,255,0.4); line-height:12px;"></div>
        <div style="height:12px; font-size:10px; color:rgba(255,255,255,0.4); line-height:12px;">Mon</div>
        <div style="height:12px;"></div>
        <div style="height:12px; font-size:10px; color:rgba(255,255,255,0.4); line-height:12px;">Wed</div>
        <div style="height:12px;"></div>
        <div style="height:12px; font-size:10px; color:rgba(255,255,255,0.4); line-height:12px;">Fri</div>
        <div style="height:12px;"></div>
      </div>

      <div style="overflow-x:auto;">
        <div style="display:flex; flex-direction:row; gap:3px; margin-bottom:6px; min-width:max-content;">
          ${weeks.map((_, i) => {
    const monthLabel = monthPositions[i] || '';
    return `<div style="width:12px; font-size:10px; color:rgba(255,255,255,0.5); white-space:nowrap; overflow:visible;">${monthLabel}</div>`;
  }).join('')}
        </div>
        <div class="contribution-calendar">
          ${weeks.map(week => `
            <div class="contribution-week">
              ${week.map(day => {
    const level = day?.level || 0;
    const count = day?.count || 0;
    const date = day?.date || '';
    return `<div class="contribution-day level-${level}" data-count="${count}" data-date="${date}"></div>`;
  }).join('')}
            </div>
          `).join('')}
        </div>
      </div>

    </div>
  </div>
`;
}

function addContributionTooltips() {
  setTimeout(() => {
    document.querySelectorAll('.contribution-day').forEach(day => {
      day.removeEventListener('mouseenter', handleTooltipEnter);
      day.removeEventListener('mouseleave', handleTooltipLeave);
      day.removeEventListener('mousemove', handleTooltipMove);

      day.addEventListener('mouseenter', handleTooltipEnter);
      day.addEventListener('mouseleave', handleTooltipLeave);
      day.addEventListener('mousemove', handleTooltipMove);
    });
  }, 100);
}

let currentTooltip = null;



function handleTooltipEnter(e) {
  const count = e.target.dataset.count;
  const date = e.target.dataset.date;
  if (date) {
    currentTooltip = document.createElement('div');
    currentTooltip.className = 'contribution-tooltip';
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    currentTooltip.innerText = `${count} contribution${count != 1 ? 's' : ''} on ${formattedDate}`;
    document.body.appendChild(currentTooltip);
    currentTooltip.style.left = e.clientX + 15 + 'px';
    currentTooltip.style.top = e.clientY - 30 + 'px';
  }
}

function handleTooltipLeave(e) {
  if (currentTooltip) {
    currentTooltip.remove();
    currentTooltip = null;
  }
}

function handleTooltipMove(e) {
  if (currentTooltip) {
    currentTooltip.style.left = e.clientX + 15 + 'px';
    currentTooltip.style.top = e.clientY - 30 + 'px';
  }
}

function renderActivity() {
  const container = document.getElementById("activityContent");
  if (!container) return;

  if (!activityData || activityData.length === 0) {
    container.innerHTML = '<div class="empty-activity"><i class="fa fa-info-circle"></i> No recent public activity found</div>';
    return;
  }

  const eventIcons = {
    'PushEvent': '<i class="fa fa-code-fork"></i>',
    'CreateEvent': '<i class="fa fa-plus-circle"></i>',
    'DeleteEvent': '<i class="fa fa-trash-o"></i>',
    'IssuesEvent': '<i class="fa fa-exclamation-circle"></i>',
    'IssueCommentEvent': '<i class="fa fa-comment"></i>',
    'PullRequestEvent': '<i class="fa fa-git-pull-request"></i>',
    'WatchEvent': '<i class="fa fa-star"></i>',
    'ForkEvent': '<i class="fa fa-code-fork"></i>',
    'PublicEvent': '<i class="fa fa-globe"></i>'
  };

  const eventTypeNames = {
    'PushEvent': 'Pushed commits',
    'CreateEvent': 'Created',
    'DeleteEvent': 'Deleted',
    'IssuesEvent': 'Issue',
    'IssueCommentEvent': 'Commented on issue',
    'PullRequestEvent': 'Pull request',
    'WatchEvent': 'Starred',
    'ForkEvent': 'Forked',
    'PublicEvent': 'Made public'
  };

  let html = '<div class="activity-list">';

  activityData.slice(0, 30).forEach(event => {
    const eventType = event.type;
    const repoName = event.repo?.name || 'Unknown';
    const repoUrl = event.repo?.url || `https://github.com/${repoName}`;
    const createdAt = new Date(event.created_at);
    const timeAgo = getTimeAgo(createdAt);
    const icon = eventIcons[eventType] || '<i class="fa fa-code"></i>';
    const typeName = eventTypeNames[eventType] || eventType.replace('Event', '');

    let details = '';

    if (eventType === 'PushEvent') {
      const commitCount = event.payload.distinct_size || event.payload.size || event.payload.commits?.length || 0;
      const branch = event.payload.ref;

      if (commitCount > 0 || event.payload.commits?.length > 0) {
        details = `<div class="activity-details">
      <i class="fa fa-code"></i> ${commitCount} commit${commitCount !== 1 ? 's' : ''}
      ${branch ? ` to <span class="activity-branch">${escapeHtml(branch)}</span>` : ''}
    </div>`;
        if (event.payload.commits?.[0]) {
          const commitMsg = event.payload.commits[0].message.length > 60
            ? event.payload.commits[0].message.substring(0, 57) + '...'
            : event.payload.commits[0].message;
          details += `<div class="activity-commit-msg"><i class="fa fa-code-fork"></i> ${escapeHtml(commitMsg)}</div>`;
        }
      } else if (branch) {
        details = `<div class="activity-details">
      <i class="fa fa-code"></i> Pushed to <span class="activity-branch">${escapeHtml(branch)}</span>
    </div>`;
      }
    } else if (eventType === 'CreateEvent') {
      const refType = event.payload?.ref_type || 'repository';
      const refName = event.payload?.ref || '';
      details = `<div class="activity-details"><i class="fa fa-plus-circle"></i> Created ${refType}${refName ? `: ${escapeHtml(refName)}` : ''}</div>`;
    } else if (eventType === 'IssuesEvent' && event.payload?.issue) {
      const action = event.payload.action || 'opened';
      const title = event.payload.issue.title || '';
      const truncatedTitle = title.length > 50 ? title.substring(0, 47) + '...' : title;
      details = `<div class="activity-details"><i class="fa fa-exclamation-circle"></i> ${action} issue #${event.payload.issue.number}: "${escapeHtml(truncatedTitle)}"</div>`;
    } else if (eventType === 'PullRequestEvent' && event.payload?.pr) {
      const action = event.payload.action || 'opened';
      const title = event.payload.pr.title || '';
      const truncatedTitle = title.length > 50 ? title.substring(0, 47) + '...' : title;
      details = `<div class="activity-details"><i class="fa fa-git-pull-request"></i> ${action} PR #${event.payload.pr.number}: "${escapeHtml(truncatedTitle)}"</div>`;
    } else if (eventType === 'WatchEvent') {
      details = `<div class="activity-details"><i class="fa fa-star"></i> Starred this repository</div>`;
    } else if (eventType === 'ForkEvent' && event.payload?.forkee) {
      const forkeeName = event.payload.forkee.full_name || '';
      details = `<div class="activity-details"><i class="fa fa-code-fork"></i> Forked to ${escapeHtml(forkeeName)}</div>`;
    } else if (eventType === 'IssueCommentEvent' && event.payload?.body) {
      const body = event.payload.body || '';
      const truncatedBody = body.length > 80 ? body.substring(0, 77) + '...' : body;
      details = `<div class="activity-details"><i class="fa fa-comment"></i> "${escapeHtml(truncatedBody)}"</div>`;
    }

    html += `
      <div class="activity-item">
        <div class="activity-header-row">
          <span class="activity-event-icon">${icon}</span>
          <span class="activity-event-type">${escapeHtml(typeName)}</span>
          <a href="${repoUrl}" target="_blank" class="activity-repo">${escapeHtml(repoName)}</a>
          <span class="activity-time"><i class="fa fa-clock-o"></i> ${timeAgo}</span>
        </div>
        ${details}
      </div>
    `;
  });

  html += '</div>';

  if (activityData.length > 30) {
    html += `<div class="activity-footer"><a href="https://github.com/${userProfile?.login}?tab=overview" target="_blank">View more activity on GitHub <i class="fa fa-external-link"></i></a></div>`;
  }

  container.innerHTML = html;
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + 'y';

  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + 'mo';

  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + 'd';

  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + 'h';

  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + 'm';

  return 'just now';
}

function displayLanguage(langCode) {
  const readmeContainer = document.querySelector(".readme-card");
  if (!readmeContainer) return;

  const content = window.languageTexts[langCode];
  if (content) {
    let contentContainer = readmeContainer.querySelector(".readme-content");
    if (!contentContainer) {
      contentContainer = document.createElement("div");
      contentContainer.className = "readme-content";
      readmeContainer.appendChild(contentContainer);
    }
    contentContainer.innerHTML = content;
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
    item.innerHTML = escapeHtml(code);

    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const lang = item.getAttribute('data-lang');
      if (languageTexts[lang]) {
        currentLanguage = lang;

        const contentContainer = document.querySelector(".readme-content");
        if (contentContainer) {
          contentContainer.innerHTML = languageTexts[lang];
        }

        selectedLanguageSpan.innerHTML = escapeHtml(lang);

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

function applyBackgroundCSS(backgroundCSS) {
  if (!backgroundCSS) {
    document.body.style.background = "#050505";
    document.body.style.backgroundAttachment = "";
    const styleElement = document.getElementById('contrib-color-scheme');
    if (styleElement) styleElement.remove();
    return;
  }

  document.body.style.background = backgroundCSS;

  if (backgroundCSS.includes('gradient')) {
    document.body.style.minHeight = "100vh";
    document.body.style.backgroundAttachment = "fixed";
  }
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
      if (btnOrder && btnOrder.children[0]) {
        btnOrder.children[0].textContent = item.textContent;
      }
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

  attachToggleListeners();
});