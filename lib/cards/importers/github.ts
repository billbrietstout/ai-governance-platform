/**
 * GitHub – fetch MODEL_CARD.md, DATASHEET.md, AGENT_CARD.md from repo.
 */

const GITHUB_RAW = "https://raw.githubusercontent.com";

export type RepoCard = {
  type: "MODEL_CARD" | "DATASHEET" | "AGENT_CARD";
  content: string;
  path: string;
};

const CARD_FILES = ["MODEL_CARD.md", "DATASHEET.md", "AGENT_CARD.md"] as const;

export async function fetchRepoCards(repoUrl: string): Promise<RepoCard[]> {
  const repo = parseRepoUrl(repoUrl);
  if (!repo) throw new Error(`Invalid GitHub repo URL: ${repoUrl}`);

  const results: RepoCard[] = [];
  const branch = repo.branch || "main";

  for (const file of CARD_FILES) {
    const rawUrl = `${GITHUB_RAW}/${repo.owner}/${repo.repo}/${branch}/${file}`;
    try {
      const res = await fetch(rawUrl, { next: { revalidate: 300 } });
      if (res.ok) {
        const content = await res.text();
        const type =
          file === "MODEL_CARD.md"
            ? "MODEL_CARD"
            : file === "DATASHEET.md"
              ? "DATASHEET"
              : "AGENT_CARD";
        results.push({ type, content, path: file });
      }
    } catch {
      // Skip missing files
    }
  }

  return results;
}

function parseRepoUrl(url: string): { owner: string; repo: string; branch?: string } | null {
  const patterns = [
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\/tree\/([^/]+))?(?:\/|\.git)?$/,
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/blob\/([^/]+)\/(.+))?$/,
    /^([^/]+)\/([^/]+)$/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) {
      return { owner: m[1], repo: m[2].replace(/\.git$/, ""), branch: m[3] };
    }
  }
  return null;
}
