export function renderCharts(allRepos) {
    const hasGroups = allRepos.some(r => r.customGroup && r.customGroup !== 'Other');
    const chartsContainer = document.querySelector('.charts');
    if (chartsContainer) chartsContainer.innerHTML = '';

    renderLanguageChart(chartsContainer, allRepos);
    renderStarsPerLanguageChart(chartsContainer, allRepos);
    if (hasGroups) {
        renderGroupChart(chartsContainer, allRepos);
        renderStarsPerGroupChart(chartsContainer, allRepos);
    }
}

const languageColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7B731',
    '#E74C3C', '#3498DB', '#2ECC71', '#F39C12'
];

function renderLanguageChart(chartsContainer, allRepos) {
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

    const section = document.createElement('div');
    section.className = 'chart-section';
    section.innerHTML = '<h2>Language Distribution</h2><canvas id="languageChart" width="350" height="350"></canvas>';
    chartsContainer.appendChild(section);

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
                backgroundColor: languageColors.slice(0, languages.length).map(color => `${color}88`),
                borderColor: languageColors.slice(0, languages.length),
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

function renderStarsPerLanguageChart(chartsContainer, allRepos) {
    if (!allRepos || allRepos.length === 0) return;

    const languageStars = {};

    allRepos.forEach(repo => {
        const lang = repo.language || "Unknown";
        languageStars[lang] = (languageStars[lang] || 0) + (repo.stargazers_count || 0);
    });

    const sortedLanguages = Object.entries(languageStars)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    const languages = sortedLanguages.map(([lang]) => lang);
    const stars = sortedLanguages.map(([, stars]) => stars);

    const section = document.createElement('div');
    section.className = 'chart-section';
    section.innerHTML = '<h2>Stars Per Language</h2><canvas id="starsPerLanguageChart" width="350" height="350"></canvas>';
    chartsContainer.appendChild(section);

    const canvas = document.getElementById('starsPerLanguageChart');
    if (!canvas) return;

    let existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();

    new Chart(canvas, {
        type: 'pie',
        data: {
            labels: languages,
            datasets: [{
                label: 'Stars',
                data: stars,
                backgroundColor: languageColors.slice(0, languages.length).map(color => `${color}88`),
                borderColor: languageColors.slice(0, languages.length),
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

const groupColors = [
    '#60A5FA', '#34D399', '#FBBF24', '#F472B6',
    '#A78BFA', '#FB7185', '#22D3EE', '#84CC16'
];

function renderGroupChart(chartsContainer, allRepos) {
    if (!allRepos || allRepos.length === 0) return;

    const groupCounts = {};

    allRepos.forEach(repo => {
        const group = repo.customGroup || "Other";
        groupCounts[group] = (groupCounts[group] || 0) + 1;
    });

    const sorted = Object.entries(groupCounts).sort((a, b) => b[1] - a[1]);
    const groups = sorted.map(([g]) => g);
    const counts = sorted.map(([, c]) => c);

    const section = document.createElement('div');
    section.className = 'chart-section';
    section.innerHTML = '<h2>Group Distribution</h2><canvas id="groupChart" width="350" height="350"></canvas>';
    chartsContainer.appendChild(section);

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
                backgroundColor: groupColors.slice(0, groups.length).map(c => `${c}88`),
                borderColor: groupColors.slice(0, groups.length),
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

function renderStarsPerGroupChart(chartsContainer, allRepos) {
    if (!allRepos || allRepos.length === 0) return;

    const groupStars = {};

    allRepos.forEach(repo => {
        const group = repo.customGroup || "Other";
        groupStars[group] = (groupStars[group] || 0) + (repo.stargazers_count || 0);
    });

    const sortedGroups = Object.entries(groupStars).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const groups = sortedGroups.map(([group]) => group);
    const stars = sortedGroups.map(([, stars]) => stars);

    const section = document.createElement('div');
    section.className = 'chart-section';
    section.innerHTML = '<h2>Stars Per Group</h2><canvas id="starsPerGroupChart" width="350" height="350"></canvas>';
    chartsContainer.appendChild(section);

    const canvas = document.getElementById('starsPerGroupChart');
    if (!canvas) return;

    let existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();

    new Chart(canvas, {
        type: 'pie',
        data: {
            labels: groups,
            datasets: [{
                label: 'Stars',
                data: stars,
                backgroundColor: groupColors.slice(0, groups.length).map(color => `${color}88`),
                borderColor: groupColors.slice(0, groups.length),
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