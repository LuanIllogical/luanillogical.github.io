let activityData = [];
let userProfile = null;

export function setActivityData(data) {
    activityData = data;
}

export function getActivityData() {
    return activityData;
}

export function setUserProfileForActivity(profile) {
    userProfile = profile;
}

export function renderActivity() {
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

export function renderActivitySkeleton() {
    const container = document.getElementById("activityContent");
    if (container) {
        container.innerHTML = `
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

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}