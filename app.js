const API_BASE = "https://luanillogical-github-io.vercel.app";

let otherRepos = [];
let currentPage = 0;
const pageSize = 6;

document.getElementById("loadBtn").addEventListener("click", loadRepos);

async function loadRepos() {
    const user = document.getElementById("username").value;

    const res = await fetch(`${API_BASE}/api/repos?user=${user}`);
    const data = await res.json();
    console.log(data);
    renderGroups(data.grouped);

    otherRepos = data.other;
    currentPage = 0;

    renderOther();
}

function renderGroups(groups) {
    const container = document.getElementById("grouped");
    container.innerHTML = "";

    for (const [groupName, repos] of Object.entries(groups)) {
        const section = document.createElement("div");

        section.innerHTML = `<h2>${groupName}</h2>`;

        repos.forEach(repo => {
            section.innerHTML += `
        <p>
          <a href="${repo.html_url}" target="_blank">
            ${repo.name}
          </a>
        </p>
      `;
        });

        container.appendChild(section);
    }
}

function renderOther() {
    const container = document.getElementById("other");

    container.innerHTML = "";

    const start = currentPage * pageSize;
    const end = start + pageSize;

    const slice = otherRepos.slice(start, end);

    slice.forEach(repo => {
        container.innerHTML += `
      <p>
        <a href="${repo.html_url}" target="_blank">
          ${repo.name}
        </a>
      </p>
    `;
    });

    container.innerHTML += `
    <button onclick="nextPage()">Next</button>
  `;
}

function nextPage() {
    if ((currentPage + 1) * pageSize < otherRepos.length) {
        currentPage++;
        renderOther();
    }
}