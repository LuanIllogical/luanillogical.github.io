let contributionsData = null;
let currentTooltip = null;
let weekChartInstance = null;
let monthChartInstance = null;
let yearChartInstance = null;
let colors = [];
let borderColors = [];

export function setContributionsData(data) {
    contributionsData = data;
}

export function setContributionsDetailColors(colors) {
    detailColors = colors;
}

export function renderContributions() {
    const container = document.getElementById("contributionsContent");
    if (!container) return;

    if (!contributionsData || !contributionsData.contributions || contributionsData.contributions.length === 0) {
        container.innerHTML = '<div class="empty-activity"><i class="fa fa-info-circle"></i> No contribution data available</div>';
        return;
    }
    populateChartColors();

    const totalContributions = contributionsData.total || contributionsData.contributions.reduce((sum, c) => sum + c.count, 0);

    const weeklyData = getWeeklyContributionData();
    const monthlyData = getMonthlyContributionData();
    const yearlyData = getYearlyContributionData();

    const html = `
    <div class="contribution-dashboard">
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
        
        <div class="charts-row">
            <div class="chart-container">
                <h3>Last 7 Days</h3>
                <canvas id="weeklyLineChart" width="400" height="235"></canvas>
            </div>
            <div class="chart-container">
                <h3>Last 30 Days</h3>
                <canvas id="monthlyLineChart" width="400" height="235"></canvas>
            </div>
            <div class="chart-container">
                <h3>Last Year (Weekly)</h3>
                <canvas id="yearlyLineChart" width="400" height="235"></canvas>
            </div>
        </div>
    </div>
    `;

    container.innerHTML = html;
    addContributionTooltips();

    setTimeout(() => {
        renderWeeklyLineChart(weeklyData);
        renderMonthlyLineChart(monthlyData);
        renderYearlyLineChart(yearlyData);
    }, 100);
}

function populateChartColors() {
    colors = [];
    borderColors = [];

    const defaultFills = [
        'rgba(255, 255, 255, 0.06)',
        'rgba(14, 68, 41, 0.55)',
        'rgba(0, 109, 50, 0.65)',
        'rgba(38, 166, 65, 0.72)',
        'rgba(57, 211, 83, 0.80)'
    ];

    const defaultBorders = [
        'rgba(255, 255, 255, 0.10)',
        'rgba(14, 68, 41, 0.65)',
        'rgba(0, 109, 50, 0.75)',
        'rgba(38, 166, 65, 0.82)',
        'rgba(57, 211, 83, 0.90)'
    ];

    for (let i = 0; i <= 4; i++) {
        const fillColor = getComputedStyle(document.documentElement)
            .getPropertyValue(`--detail-color-${i}`).trim();
        colors.push(fillColor || defaultFills[i]);

        const borderColor = getComputedStyle(document.documentElement)
            .getPropertyValue(`--accent-color-${i}`).trim();
        borderColors.push(borderColor || defaultBorders[i]);
    }
}

export function renderContributionsSkeleton() {
    const container = document.getElementById("contributionsContent");
    if (container) {
        container.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:20px;">
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
            <div style="display:flex; gap:20px; justify-content:space-between;">
                <div class="repo-skeleton" style="height: 220px; flex: 1; border-radius: 12px;"></div>
                <div class="repo-skeleton" style="height: 220px; flex: 1; border-radius: 12px;"></div>
                <div class="repo-skeleton" style="height: 220px; flex: 1; border-radius: 12px;"></div>
            </div>
        </div>
        `;
    }
}

function getWeeklyContributionData() {
    if (!contributionsData || !contributionsData.contributions || contributionsData.contributions.length === 0) {
        return { labels: [], counts: [], rawData: [] };
    }

    const sorted = [...contributionsData.contributions].sort((a, b) => new Date(a.date) - new Date(b.date));

    const dailyMap = new Map();
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    sorted.forEach(day => {
        const date = new Date(day.date);
        if (date >= sevenDaysAgo && date <= today) {
            dailyMap.set(day.date, day.count);
        }
    });

    const dailyArray = [];
    const currentDate = new Date(sevenDaysAgo);

    for (let i = 0; i <= 7; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const count = dailyMap.get(dateStr) || 0;
        dailyArray.push({
            date: dateStr,
            count: count
        });
        currentDate.setDate(currentDate.getDate() + 1);
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const labels = dailyArray.map(day => {
        const date = new Date(day.date);
        return dayNames[date.getDay()];
    });

    return {
        labels: labels,
        counts: dailyArray.map(d => d.count),
        rawData: dailyArray
    };
}

function getMonthlyContributionData() {
    if (!contributionsData || !contributionsData.contributions || contributionsData.contributions.length === 0) {
        return { labels: [], counts: [], rawData: [] };
    }

    const sorted = [...contributionsData.contributions].sort((a, b) => new Date(a.date) - new Date(b.date));

    const dailyMap = new Map();
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    sorted.forEach(day => {
        const date = new Date(day.date);
        if (date >= thirtyDaysAgo && date <= today) {
            dailyMap.set(day.date, day.count);
        }
    });

    const dailyArray = [];
    const currentDate = new Date(thirtyDaysAgo);

    for (let i = 0; i <= 30; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const count = dailyMap.get(dateStr) || 0;
        dailyArray.push({
            date: dateStr,
            count: count
        });
        currentDate.setDate(currentDate.getDate() + 1);
    }

    const labels = dailyArray.map((day, index) => {
        if (index % 5 === 0 || index === dailyArray.length - 1) {
            const date = new Date(day.date);
            const dayNum = date.getDate();
            const month = date.getMonth() + 1;
            return `${dayNum}/${month}`;
        }
        return '';
    });

    return {
        labels: labels,
        counts: dailyArray.map(d => d.count),
        rawData: dailyArray
    };
}

function getYearlyContributionData() {
    if (!contributionsData || !contributionsData.contributions || contributionsData.contributions.length === 0) {
        return { labels: [], counts: [], rawData: [] };
    }

    const sorted = [...contributionsData.contributions].sort((a, b) => new Date(a.date) - new Date(b.date));

    const weeklyMap = new Map();
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setDate(today.getDate() - 365);

    sorted.forEach(day => {
        const date = new Date(day.date);
        if (date >= oneYearAgo && date <= today) {
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            const weekKey = weekStart.toISOString().split('T')[0];

            if (!weeklyMap.has(weekKey)) {
                weeklyMap.set(weekKey, { weekStart: weekKey, count: 0 });
            }
            weeklyMap.get(weekKey).count += day.count;
        }
    });

    let weeklyArray = Array.from(weeklyMap.values())
        .sort((a, b) => new Date(a.weekStart) - new Date(b.weekStart))
        .slice(-52);

    const labels = weeklyArray.map((week, index) => {
        if (index % 4 === 0 || index === weeklyArray.length - 1) {
            const date = new Date(week.weekStart);
            const dayNum = date.getDate();
            const month = date.getMonth() + 1;
            return `${dayNum}/${month}`;
        }
        return '';
    });

    return {
        labels: labels,
        counts: weeklyArray.map(w => w.count),
        rawData: weeklyArray
    };
}

function renderWeeklyLineChart(data) {
    const canvas = document.getElementById('weeklyLineChart');
    if (!canvas) return;

    if (weekChartInstance) {
        weekChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');

    weekChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Daily Contributions',
                data: data.counts,
                borderColor: borderColors[4],
                backgroundColor: colors[2],
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointRadius: 2.5,
                pointHoverRadius: 5,
                pointBackgroundColor: borderColors[3],
                pointBorderColor: 'transparent',
                pointBorderWidth: 0,
                pointHoverBackgroundColor: borderColors[3],
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 1.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: borderColors[3],
                    borderWidth: 1,
                    callbacks: {
                        label: function (context) {
                            return `Contributions: ${context.raw.toLocaleString()}`;
                        },
                        title: function (context) {
                            const index = context[0].dataIndex;
                            const date = data.rawData[index]?.date;
                            if (date) {
                                const d = new Date(date);
                                const day = d.getDate();
                                const month = d.getMonth() + 1;
                                return `${day}/${month} (${data.labels[index]})`;
                            }
                            return context[0].label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: 'rgba(255,255,255,0.5)',
                        font: { size: 10 }
                    },
                    grid: {
                        color: 'rgba(255,255,255,0.05)',
                        lineWidth: 0.5
                    }
                },
                y: {
                    ticks: {
                        color: 'rgba(255,255,255,0.5)',
                        font: { size: 10 },
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(255,255,255,0.05)',
                        lineWidth: 0.5
                    },
                    beginAtZero: true
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            elements: {
                line: {
                    borderJoin: 'round'
                },
                point: {
                    hoverRadius: 5,
                    hitRadius: 10
                }
            }
        }
    });
}

function renderMonthlyLineChart(data) {
    const canvas = document.getElementById('monthlyLineChart');
    if (!canvas) return;

    if (monthChartInstance) {
        monthChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');

    monthChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Daily Contributions',
                data: data.counts,
                borderColor: borderColors[4],
                backgroundColor: colors[2],
                borderWidth: 1.5,
                fill: true,
                tension: 0.3,
                pointRadius: 1.5,
                pointHoverRadius: 4,
                pointBackgroundColor: borderColors[3],
                pointBorderColor: 'transparent',
                pointBorderWidth: 0,
                pointHoverBackgroundColor: borderColors[3],
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 1.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: borderColors[3],
                    borderWidth: 1,
                    callbacks: {
                        label: function (context) {
                            return `Contributions: ${context.raw.toLocaleString()}`;
                        },
                        title: function (context) {
                            const index = context[0].dataIndex;
                            const date = data.rawData[index]?.date;
                            if (date) {
                                const d = new Date(date);
                                const day = d.getDate();
                                const month = d.getMonth() + 1;
                                return `${day}/${month}/${d.getFullYear()}`;
                            }
                            return context[0].label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: 'rgba(255,255,255,0.5)',
                        font: { size: 9 },
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 8
                    },
                    grid: {
                        color: 'rgba(255,255,255,0.05)',
                        lineWidth: 0.5
                    }
                },
                y: {
                    ticks: {
                        color: 'rgba(255,255,255,0.5)',
                        font: { size: 9 }
                    },
                    grid: {
                        color: 'rgba(255,255,255,0.05)',
                        lineWidth: 0.5
                    },
                    beginAtZero: true
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            elements: {
                line: {
                    borderJoin: 'round'
                },
                point: {
                    hoverRadius: 4,
                    hitRadius: 8
                }
            }
        }
    });
}

function renderYearlyLineChart(data) {
    const canvas = document.getElementById('yearlyLineChart');
    if (!canvas) return;

    if (yearChartInstance) {
        yearChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');

    yearChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Weekly Contributions',
                data: data.counts,
                borderColor: borderColors[4],
                backgroundColor: colors[2],
                borderWidth: 1.5,
                fill: true,
                tension: 0.3,
                pointRadius: 1,
                pointHoverRadius: 3.5,
                pointBackgroundColor: borderColors[3],
                pointBorderColor: 'transparent',
                pointBorderWidth: 0,
                pointHoverBackgroundColor: borderColors[3],
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 1.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: borderColors[3],
                    borderWidth: 1,
                    callbacks: {
                        label: function (context) {
                            return `Contributions: ${context.raw.toLocaleString()}`;
                        },
                        title: function (context) {
                            const index = context[0].dataIndex;
                            const week = data.rawData[index];
                            if (week && week.weekStart) {
                                const startDate = new Date(week.weekStart);
                                const endDate = new Date(startDate);
                                endDate.setDate(startDate.getDate() + 6);
                                const startDay = startDate.getDate();
                                const startMonth = startDate.getMonth() + 1;
                                const endDay = endDate.getDate();
                                const endMonth = endDate.getMonth() + 1;
                                return `${startDay}/${startMonth} - ${endDay}/${endMonth}`;
                            }
                            return context[0].label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: 'rgba(255,255,255,0.5)',
                        font: { size: 9 },
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 8
                    },
                    grid: {
                        color: 'rgba(255,255,255,0.05)',
                        lineWidth: 0.5
                    }
                },
                y: {
                    ticks: {
                        color: 'rgba(255,255,255,0.5)',
                        font: { size: 9 }
                    },
                    grid: {
                        color: 'rgba(255,255,255,0.05)',
                        lineWidth: 0.5
                    },
                    beginAtZero: true
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            elements: {
                line: {
                    borderJoin: 'round'
                },
                point: {
                    hoverRadius: 4,
                    hitRadius: 8
                }
            }
        }
    });
}

function renderContributionGrid() {
    if (!contributionsData || !contributionsData.contributions || contributionsData.contributions.length === 0) {
        return '<div class="empty-activity"><i class="fa fa-info-circle"></i> No contribution data available</div>';
    }

    const sorted = [...contributionsData.contributions].sort((a, b) => new Date(a.date) - new Date(b.date));

    const weeks = [];
    let currentWeek = [];

    const firstDate = new Date(sorted[0].date);
    const firstDayOfWeek = firstDate.getDay();
    const startDate = new Date(firstDate);
    startDate.setDate(firstDate.getDate() - firstDayOfWeek);

    const contribMap = new Map();
    sorted.forEach(c => contribMap.set(c.date, c));

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

        if (currentWeek.length === 7) {
            weeks.push([...currentWeek]);
            currentWeek = [];
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
            currentWeek.push({ date: null, count: 0, level: 0 });
        }
        weeks.push(currentWeek);
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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