export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*"); // https://luanillogical.github.io
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    const username = req.query.user;

    if (!username) {
        return res.status(400).json({ error: "Missing username" });
    }

    try {
        const githubResponse = await fetch(
            `https://api.github.com/users/${username}/repos`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                    "User-Agent": "github-viewer"
                }
            }
        );

        if (!githubResponse.ok) {
            return res.status(githubResponse.status).json({
                error: "GitHub API error"
            });
        }

        const repos = await githubResponse.json();

        const simplified = repos.map(repo => ({
            name: repo.name,
            html_url: repo.html_url
        }));

        return res.status(200).json(simplified);

    } catch (error) {
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}