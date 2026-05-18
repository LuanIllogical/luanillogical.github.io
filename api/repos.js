export default async function handler(req, res) {
    const username = req.query.user;

    if (!username) {
        return res.status(400).json({
            error: "Missing username"
        });
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

        res.status(200).json(simplified);

    } catch (error) {
        res.status(500).json({
            error: "Server error"
        });
    }
}