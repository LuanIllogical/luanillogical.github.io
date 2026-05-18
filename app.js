document.getElementById("loadBtn").addEventListener("click", loadRepos);

async function loadRepos() {
    const username = document.getElementById("username").value;
    const repoList = document.getElementById("repoList");

    repoList.innerHTML = "Loading...";

    try {
        const response = await fetch(`https://luanillogical-github-io.vercel.app/api/repos?user=${username}`);

        if (!response.ok) {
            throw new Error("Failed to fetch repos");
        }

        const repos = await response.json();

        repoList.innerHTML = "";

        repos.forEach(repo => {
            const li = document.createElement("li");

            li.innerHTML = `
        <a href="${repo.html_url}" target="_blank">
          ${repo.name}
        </a>
      `;

            repoList.appendChild(li);
        });

    } catch (err) {
        repoList.innerHTML = err.message;
    }
}