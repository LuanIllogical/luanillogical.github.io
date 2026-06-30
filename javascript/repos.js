let allRepos = [];
let groupedRepos = {};
let currentGroup = "Groups";
let currentSort = "Stars";

let videoPreviews = {};
let videoCache = new Map();
let hoverTimeout = null;
let currentPreview = null;
let previewTimeout = null;

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

export function setCurrentSort(sort) {
    currentSort = sort;
    groupedRepos = groupRepos(allRepos);
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
        <i class="fa fa-chevron-down"></i>
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

    requestAnimationFrame(() => {
        setTimeout(attachVideoPreviews, 10);
    });
}

function createCard(repo) {
    const hasPreview = videoPreviews[repo.name] !== undefined;
    const username = new URLSearchParams(window.location.search).get('user') || 'LuanIllogical';
    const videoUrl = hasPreview ?
        `https://raw.githubusercontent.com/${username}/${username}/master/${videoPreviews[repo.name]}` :
        '';

    if (hasPreview) {
        return `
        <div class="repo-card-wrapper" data-has-preview="true" data-video-url="${videoUrl}">
            <a class="repo-card" href="${repo.html_url}" target="_blank" data-repo="${repo.name}">
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
            <div class="repo-preview">
                <video muted loop playsinline>
                    <source src="${videoUrl}" type="video/webm">
                </video>
                <div class="preview-loading">Loading preview...</div>
            </div>
        </div>
        `;
    } else {
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
        const chevron = e.currentTarget.querySelector('.fa-chevron-down');
        if (chevron) {
            chevron.style.transform = section.classList.contains('open') ? 'rotate(0deg)' : 'rotate(-90deg)';
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

export function setVideoPreviews(previews) {
    videoPreviews = previews || {};
    setTimeout(attachVideoPreviews, 50);
}

function handleMouseEnter(e) {
    const wrapper = e.currentTarget.closest('.repo-card-wrapper');
    const videoUrl = wrapper?.dataset.videoUrl;

    if (!videoUrl) return;

    if (previewTimeout) {
        clearTimeout(previewTimeout);
        previewTimeout = null;
    }

    let preview = document.getElementById('floating-preview');
    if (!preview) {
        preview = document.createElement('div');
        preview.id = 'floating-preview';
        preview.className = 'repo-preview';
        preview.innerHTML = `
            <video muted loop playsinline></video>
            <div class="preview-loading">Loading preview...</div>
            <button class="preview-close">✕</button>
        `;
        document.body.appendChild(preview);

        const closeBtn = preview.querySelector('.preview-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            hidePreview();
        });
    }

    const video = preview.querySelector('video');
    const loadingIndicator = preview.querySelector('.preview-loading');
    const errorMsg = preview.querySelector('.preview-error');
    if (errorMsg) errorMsg.remove();

    const mouseX = e.clientX;
    const windowWidth = window.innerWidth;
    const previewWidth = Math.min(windowWidth * 0.4, 500);

    if (mouseX > windowWidth / 2) {
        preview.style.left = '30px';
        preview.style.right = 'auto';
    } else {
        preview.style.left = 'auto';
        preview.style.right = '30px';
    }

    loadingIndicator.style.display = 'block';
    preview.classList.add('visible');

    if (videoCache.has(videoUrl)) {
        const cachedBlob = videoCache.get(videoUrl);
        video.src = URL.createObjectURL(cachedBlob);
        video.load();
        loadingIndicator.style.display = 'none';
        video.play().catch(() => { });
        return;
    }

    fetch(videoUrl, {
        headers: { 'Accept': 'video/webm' }
    })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.blob();
        })
        .then(blob => {
            videoCache.set(videoUrl, blob);
            const videoUrl_ = URL.createObjectURL(blob);
            video.src = videoUrl_;
            video.load();
            loadingIndicator.style.display = 'none';
            video.play().catch(() => { });
        })
        .catch(error => {
            console.log(`Failed to load preview:`, error);
            const errorMsg = document.createElement('div');
            errorMsg.className = 'preview-error';
            errorMsg.textContent = 'Preview unavailable';
            preview.appendChild(errorMsg);
            loadingIndicator.style.display = 'none';
        });
}

function handleMouseLeave(e) {
    if (previewTimeout) {
        clearTimeout(previewTimeout);
    }
    previewTimeout = setTimeout(() => {
        const preview = document.getElementById('floating-preview');
        if (preview && !preview.matches(':hover')) {
            hidePreview();
        }
    }, 300);
}

function hidePreview() {
    const preview = document.getElementById('floating-preview');
    if (preview) {
        preview.classList.remove('visible');
        const video = preview.querySelector('video');
        if (video) {
            video.pause();
        }
    }
    if (previewTimeout) {
        clearTimeout(previewTimeout);
        previewTimeout = null;
    }
}

function handlePreviewMouseEnter() {
    if (previewTimeout) {
        clearTimeout(previewTimeout);
        previewTimeout = null;
    }
}

function handlePreviewMouseLeave() {
    previewTimeout = setTimeout(() => {
        hidePreview();
    }, 300);
}

function attachVideoPreviews() {
    const wrappers = document.querySelectorAll('.repo-card-wrapper[data-has-preview="true"]');

    wrappers.forEach(wrapper => {
        const card = wrapper.querySelector('.repo-card');
        if (!card) return;

        card.removeEventListener('mouseenter', handleMouseEnter);
        card.removeEventListener('mouseleave', handleMouseLeave);
        card.removeEventListener('click', handleCardClick);

        card.addEventListener('mouseenter', handleMouseEnter);
        card.addEventListener('mouseleave', handleMouseLeave);

        card.addEventListener('click', handleCardClick);
    });

    const preview = document.getElementById('floating-preview');
    if (preview) {
        preview.removeEventListener('mouseenter', handlePreviewMouseEnter);
        preview.removeEventListener('mouseleave', handlePreviewMouseLeave);
        preview.addEventListener('mouseenter', handlePreviewMouseEnter);
        preview.addEventListener('mouseleave', handlePreviewMouseLeave);
    }
}

function handleCardClick(e) {
    const wrapper = e.currentTarget.closest('.repo-card-wrapper');
    const preview = document.getElementById('floating-preview');
    if (!preview) return;

    if (preview.classList.contains('visible')) {
        hidePreview();
    } else {
        handleMouseEnter(e);
    }
}

function handleVideoLoaded(e) {
    const video = e.currentTarget;
    const preview = video.closest('.repo-preview');
    const loadingIndicator = preview?.querySelector('.preview-loading');
    if (loadingIndicator) loadingIndicator.style.display = 'none';
}

function handleVideoError(e) {
    const video = e.currentTarget;
    const preview = video.closest('.repo-preview');
    const loadingIndicator = preview?.querySelector('.preview-loading');
    if (loadingIndicator) loadingIndicator.style.display = 'none';
}

window.addEventListener('resize', () => {
    const preview = document.getElementById('floating-preview');
    if (preview && preview.classList.contains('visible')) {
        const mouseX = window.lastMouseX || window.innerWidth / 2;
        const windowWidth = window.innerWidth;

        if (mouseX > windowWidth / 2) {
            preview.style.left = '20px';
            preview.style.right = 'auto';
        } else {
            preview.style.left = 'auto';
            preview.style.right = '20px';
        }
    }
});

document.addEventListener('mousemove', (e) => {
    window.lastMouseX = e.clientX;
});