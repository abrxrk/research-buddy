export type SourceInfo = { key: string; label: string; logo?: string };

const ARXIV_ID = /^(arxiv:)?(\d{4}\.\d{4,5}(v\d+)?|[a-z-]+(\.[A-Z]{2})?\/\d{7}(v\d+)?)$/i;
const DOI = /^10\.\d{4,9}\/\S+$/;

export const SOURCES: Record<string, SourceInfo> = {
  arxiv: { key: "arxiv", label: "arXiv", logo: "/logos/sources/arxiv.svg" },
  doi: { key: "doi", label: "DOI", logo: "/logos/sources/doi.svg" },
  openreview: { key: "openreview", label: "OpenReview" },
  acl: { key: "acl", label: "ACL Anthology" },
  pdf: { key: "pdf", label: "Direct PDF" },
  web: { key: "web", label: "Web page" },
  upload: { key: "upload", label: "Upload" },
};

/** Best guess at where a pasted link points (mirrors backend PaperDownloader.resolve). */
export function detectSource(input: string): SourceInfo | null {
  const s = input.trim();
  if (!s) return null;
  if (DOI.test(s)) return SOURCES.doi;
  if (ARXIV_ID.test(s)) return SOURCES.arxiv;
  let host = "";
  let path = "";
  try {
    const u = new URL(/^https?:\/\//.test(s) ? s : `https://${s}`);
    host = u.hostname.replace(/^www\./, "");
    path = u.pathname.toLowerCase();
  } catch {
    return null;
  }
  if (!host.includes(".")) return null;
  if (host.endsWith("arxiv.org")) return SOURCES.arxiv;
  if (host === "openreview.net") return SOURCES.openreview;
  if (host === "doi.org" || host === "dx.doi.org") return SOURCES.doi;
  if (host === "aclanthology.org") return SOURCES.acl;
  if (path.endsWith(".pdf")) return SOURCES.pdf;
  return SOURCES.web;
}

export const sourceInfo = (key: string): SourceInfo => SOURCES[key] ?? { key, label: key };
