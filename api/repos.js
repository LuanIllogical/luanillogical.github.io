const normalize = (s) => s.toLowerCase();

function extractGroups(readme) {
    const match = readme.match(/gud-repo-groups:\s*([\s\S]*?)-->/i);

    if (!match) return null;

    const block = match[1];

    const groups = {};

    const lines = block
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.includes("="));

    for (const line of lines) {
        const [left, right] = line.split("=");

        if (!left || !right) continue;

        const groupName = left.trim();

        const repos = right
            .split(",")
            .map(r => r.trim())
            .filter(Boolean);

        groups[groupName] = repos;
    }

    export default async function handler(req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*"); //https://luanillogical.github.io
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") return res.status(200).end();

        const user = req.query.user;
        if (!user) return res.status(400).json({ error: "Missing user" });

        try {
            const repoRes = await fetch(
                `https://api.github.com/users/${user}/repos?per_page=100`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                        "User-Agent": "repo-viewer"
                    }
                }
            );

            const repos = await repoRes.json();

            const repoMap = new Map(
                repos.map(r => [
                    r.name,
                    {
                        name: r.name,
                        html_url: r.html_url,
                        description: r.description
                    }
                ])
            );

            const readmeRes = await fetch(
                `https://raw.githubusercontent.com/${user}/${user}/main/README.md`
            );

            const readme = readmeRes.ok ? await readmeRes.text() : "";

            const groupsConfig = extractGroups(readme);

            const grouped = {};
            const used = new Set();

            if (groupsConfig) {
                for (const [groupName, repoList] of Object.entries(groupsConfig)) {
                    grouped[groupName] = [];

                    for (const repoName of repoList) {
                        const match = repos.find(
                            r => normalize(r.name) === normalize(repoName)
                        );

                        if (match) {
                            grouped[groupName].push({
                                name: match.name,
                                html_url: match.html_url,
                                description: match.description
                            });

                            used.add(match.name);
                        }
                    }
                }
            }
            console.log("GROUPS CONFIG:", groupsConfig);
            const other = [];

            for (const repo of repos) {
                if (!used.has(repo.name)) {
                    other.push({
                        name: repo.name,
                        html_url: repo.html_url,
                        description: repo.description
                    });
                }
            }

            return res.status(200).json({
                grouped,
                other
            });

        } catch (err) {
            return res.status(500).json({ error: "Server error" });
        }
    }
}