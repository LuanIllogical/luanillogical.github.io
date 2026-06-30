let userProfile = null;
let readmeHTML = null;
let currentLanguage = null;

export function setUserProfile(profile) {
    userProfile = profile;
}

export function setReadmeHTML(readme) {
    readmeHTML = readme;
}

export function getReadmeHTML() {
    return readmeHTML;
}

export function setCurrentLanguage(lang) {
    currentLanguage = lang;
}

export function getCurrentLanguage() {
    return currentLanguage;
}

export function renderUserCard() {
    const container = document.getElementById("user");
    if (!container) return;
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

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function renderUserSkeleton() {
    const container = document.getElementById("user");
    if (container) {
        container.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <div class="loading-text">Loading user profile...</div>
      </div>
    `;
    }
}