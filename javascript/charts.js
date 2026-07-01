let currentReposData = [];
let chartsInitialized = false;
let chartInstances = {
    languageChart: null,
    starsPerLanguageChart: null,
    groupChart: null,
    starsPerGroupChart: null
};

const defaultLanguageColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7B731',
    '#E74C3C', '#3498DB', '#2ECC71', '#F39C12'
];

const defaultGroupColors = [
    '#60A5FA', '#34D399', '#FBBF24', '#F472B6',
    '#A78BFA', '#FB7185', '#22D3EE', '#84CC16'
];

let languageColorMap = {};
let groupColorMap = {};

function getLanguageColor(language, index) {
    if (languageColorMap[language]) {
        console.log(`Using custom color for language "${language}": ${languageColorMap[language]}`);
        return languageColorMap[language];
    }
    const defaultColor = defaultLanguageColors[index % defaultLanguageColors.length];
    console.log(`Using default color for language "${language}": ${defaultColor}`);
    return defaultColor;
}

function getGroupColor(group, index) {
    if (groupColorMap[group]) {
        console.log(`Using custom color for group "${group}": ${groupColorMap[group]}`);
        return groupColorMap[group];
    }
    const defaultColor = defaultGroupColors[index % defaultGroupColors.length];
    console.log(`Using default color for group "${group}": ${defaultColor}`);
    return defaultColor;
}

export function setChartsLanguageColors(colors) {
    console.log('Setting language colors:', colors);
    if (colors && typeof colors === 'object') {
        languageColorMap = { ...colors };
        console.log('Language color map updated:', languageColorMap);
    } else if (Array.isArray(colors)) {
        defaultLanguageColors.length = 0;
        defaultLanguageColors.push(...colors);
        console.log('Default language colors updated:', defaultLanguageColors);
    }
}

export function setChartsGroupColors(colors) {
    console.log('Setting group colors:', colors);
    if (colors && typeof colors === 'object') {
        groupColorMap = { ...colors };
        console.log('Group color map updated:', groupColorMap);
    } else if (Array.isArray(colors)) {
        defaultGroupColors.length = 0;
        defaultGroupColors.push(...colors);
        console.log('Default group colors updated:', defaultGroupColors);
    }
}

export function renderCharts(repos = null) {
    console.log('renderCharts called with repos:', repos ? repos.length : 'null');
    if (repos !== null) {
        currentReposData = repos;
    }

    if (!currentReposData || currentReposData.length === 0) return;

    const hasGroups = currentReposData.some(r => r.customGroup && r.customGroup !== 'Other');
    const chartsContainer = document.querySelector('.charts');
    if (chartsContainer) chartsContainer.innerHTML = '';

    renderLanguageChart(chartsContainer);
    renderStarsPerLanguageChart(chartsContainer);

    if (hasGroups) {
        renderGroupChart(chartsContainer);
        renderStarsPerGroupChart(chartsContainer);
    }

    chartsInitialized = true;
}

export function renderChartsSkeleton() {
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

function renderLanguageChart(container) {
    if (!currentReposData || currentReposData.length === 0) return;

    const languageCount = {};
    currentReposData.forEach(repo => {
        const lang = repo.language || "Unknown";
        languageCount[lang] = (languageCount[lang] || 0) + 1;
    });

    const sortedLanguages = Object.entries(languageCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    const languages = sortedLanguages.map(([lang]) => lang);
    const counts = sortedLanguages.map(([, count]) => count);

    const colors = languages.map((lang, index) => getLanguageColor(lang, index));

    const section = document.createElement('div');
    section.className = 'chart-section';
    section.innerHTML = '<h2>Language Distribution</h2><canvas id="languageChart" width="350" height="350"></canvas>';
    container.appendChild(section);

    const canvas = document.getElementById('languageChart');
    if (!canvas) return;

    if (chartInstances.languageChart) {
        chartInstances.languageChart.destroy();
    }

    chartInstances.languageChart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: languages,
            datasets: [{
                data: counts,
                backgroundColor: colors.map(color => `${color}88`),
                borderColor: colors,
                borderWidth: 2,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            layout: { padding: { top: 15 } },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#ffffff', font: { size: 12 }, padding: 10 }
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

function renderStarsPerLanguageChart(container) {
    if (!currentReposData || currentReposData.length === 0) return;

    const languageStars = {};

    currentReposData.forEach(repo => {
        const lang = repo.language || "Unknown";
        languageStars[lang] = (languageStars[lang] || 0) + (repo.stargazers_count || 0);
    });

    const sortedLanguages = Object.entries(languageStars)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    const languages = sortedLanguages.map(([lang]) => lang);
    const stars = sortedLanguages.map(([, stars]) => stars);

    const colors = languages.map((lang, index) => getLanguageColor(lang, index));

    const section = document.createElement('div');
    section.className = 'chart-section';
    section.innerHTML = '<h2>Stars Per Language</h2><canvas id="starsPerLanguageChart" width="350" height="350"></canvas>';
    container.appendChild(section);

    const canvas = document.getElementById('starsPerLanguageChart');
    if (!canvas) return;

    if (chartInstances.starsPerLanguageChart) {
        chartInstances.starsPerLanguageChart.destroy();
    }

    chartInstances.starsPerLanguageChart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: languages,
            datasets: [{
                label: 'Stars',
                data: stars,
                backgroundColor: colors.map(color => `${color}88`),
                borderColor: colors,
                borderWidth: 2,
                hoverOffset: 12
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            layout: { padding: { top: 15 } },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#ffffff', font: { size: 12 }, padding: 12 }
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

function renderGroupChart(container) {
    if (!currentReposData || currentReposData.length === 0) return;

    const groupCounts = {};

    currentReposData.forEach(repo => {
        const group = repo.customGroup || "Other";
        groupCounts[group] = (groupCounts[group] || 0) + 1;
    });

    const sorted = Object.entries(groupCounts).sort((a, b) => b[1] - a[1]);
    const groups = sorted.map(([g]) => g);
    const counts = sorted.map(([, c]) => c);

    const colors = groups.map((group, index) => getGroupColor(group, index));

    const section = document.createElement('div');
    section.className = 'chart-section';
    section.innerHTML = '<h2>Group Distribution</h2><canvas id="groupChart" width="350" height="350"></canvas>';
    container.appendChild(section);

    const canvas = document.getElementById("groupChart");
    if (!canvas) return;

    if (chartInstances.groupChart) {
        chartInstances.groupChart.destroy();
    }

    chartInstances.groupChart = new Chart(canvas, {
        type: "pie",
        data: {
            labels: groups,
            datasets: [{
                data: counts,
                backgroundColor: colors.map(color => `${color}88`),
                borderColor: colors,
                borderWidth: 2,
                hoverOffset: 10
            }]
        },
        options: {
            layout: { padding: { top: 15 } },
            responsive: true,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { color: "#fff", font: { size: 12 }, padding: 12 }
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

function renderStarsPerGroupChart(container) {
    if (!currentReposData || currentReposData.length === 0) return;

    const groupStars = {};

    currentReposData.forEach(repo => {
        const group = repo.customGroup || "Other";
        groupStars[group] = (groupStars[group] || 0) + (repo.stargazers_count || 0);
    });

    const sortedGroups = Object.entries(groupStars).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const groups = sortedGroups.map(([group]) => group);
    const stars = sortedGroups.map(([, stars]) => stars);

    const colors = groups.map((group, index) => getGroupColor(group, index));

    const section = document.createElement('div');
    section.className = 'chart-section';
    section.innerHTML = '<h2>Stars Per Group</h2><canvas id="starsPerGroupChart" width="350" height="350"></canvas>';
    container.appendChild(section);

    const canvas = document.getElementById('starsPerGroupChart');
    if (!canvas) return;

    if (chartInstances.starsPerGroupChart) {
        chartInstances.starsPerGroupChart.destroy();
    }

    chartInstances.starsPerGroupChart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: groups,
            datasets: [{
                label: 'Stars',
                data: stars,
                backgroundColor: colors.map(color => `${color}88`),
                borderColor: colors,
                borderWidth: 2,
                hoverOffset: 12
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            layout: { padding: { top: 15 } },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#ffffff', font: { size: 12 }, padding: 12 }
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