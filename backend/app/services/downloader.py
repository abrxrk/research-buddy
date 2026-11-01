"""Figure out where a paper link points and download its PDF."""
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, urljoin, urlparse

import httpx

MAX_BYTES = 50 * 1024 * 1024
ARXIV_ID = re.compile(r"(\d{4}\.\d{4,5}(v\d+)?|[a-z\-]+(\.[A-Z]{2})?/\d{7}(v\d+)?)")
DOI = re.compile(r"^10\.\d{4,9}/\S+$")
HEADERS = {"User-Agent": "Mozilla/5.0 (ResearchBuddy paper fetcher)"}


class DownloadError(Exception):
    pass


class _PdfLinkParser(HTMLParser):
    """Collects <meta name=citation_pdf_url> and the first <a href=*.pdf>."""

    def __init__(self):
        super().__init__()
        self.meta = self.anchor = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "meta" and (a.get("name") or "").lower() == "citation_pdf_url":
            self.meta = self.meta or a.get("content")
        elif tag == "a" and not self.anchor and (a.get("href") or "").lower().endswith(".pdf"):
            self.anchor = a["href"]


class PaperDownloader:
    @staticmethod
    def resolve(link: str) -> tuple[str, str]:
        """Return (source, url_to_fetch). url may be an HTML page that needs a second hop."""
        link = link.strip()
        if DOI.match(link):
            return "doi", f"https://doi.org/{link}"
        if not link.startswith(("http://", "https://")):
            if ARXIV_ID.fullmatch(link.removeprefix("arXiv:")):
                return "arxiv", f"https://arxiv.org/pdf/{link.removeprefix('arXiv:')}"
            link = "https://" + link
        u = urlparse(link)
        host = u.netloc.lower().removeprefix("www.")
        if host.endswith("arxiv.org"):
            m = re.match(r"/(?:abs|pdf|html)/(.+?)(?:\.pdf)?/?$", u.path)
            if m:
                return "arxiv", f"https://arxiv.org/pdf/{m.group(1)}"
        if host == "openreview.net":
            pid = parse_qs(u.query).get("id")
            if pid:
                return "openreview", f"https://openreview.net/pdf?id={pid[0]}"
        if host in ("doi.org", "dx.doi.org"):
            return "doi", link
        if u.path.lower().endswith(".pdf"):
            return "pdf", link
        return "web", link

    async def download(self, link: str, dest: Path) -> str:
        source, url = self.resolve(link)
        async with httpx.AsyncClient(follow_redirects=True, timeout=60, headers=HEADERS) as client:
            data, final_url = await self._fetch(client, url)
            if not data.startswith(b"%PDF"):
                pdf_url = self._find_pdf_link(data.decode("utf-8", "ignore"), final_url)
                if not pdf_url:
                    raise DownloadError("Could not find a PDF at this link. Try uploading the file instead.")
                data, _ = await self._fetch(client, pdf_url)
                if not data.startswith(b"%PDF"):
                    raise DownloadError("Link did not return a PDF (it may be paywalled).")
        dest.write_bytes(data)
        return source

    @staticmethod
    async def _fetch(client: httpx.AsyncClient, url: str) -> tuple[bytes, str]:
        async with client.stream("GET", url) as r:
            if r.status_code >= 400:
                raise DownloadError(f"Download failed with HTTP {r.status_code}")
            buf = bytearray()
            async for chunk in r.aiter_bytes():
                buf += chunk
                if len(buf) > MAX_BYTES:
                    raise DownloadError("PDF is larger than 50MB")
            return bytes(buf), str(r.url)

    @staticmethod
    def _find_pdf_link(html: str, base: str) -> str | None:
        p = _PdfLinkParser()
        p.feed(html)
        link = p.meta or p.anchor
        return urljoin(base, link) if link else None


if __name__ == "__main__":
    r = PaperDownloader.resolve
    assert r("https://arxiv.org/abs/1706.03762") == ("arxiv", "https://arxiv.org/pdf/1706.03762")
    assert r("arxiv.org/pdf/1706.03762v7.pdf") == ("arxiv", "https://arxiv.org/pdf/1706.03762v7")
    assert r("2401.00001") == ("arxiv", "https://arxiv.org/pdf/2401.00001")
    assert r("arXiv:hep-th/9901001") == ("arxiv", "https://arxiv.org/pdf/hep-th/9901001")
    assert r("https://openreview.net/forum?id=abc123") == ("openreview", "https://openreview.net/pdf?id=abc123")
    assert r("10.1145/3292500.3330701") == ("doi", "https://doi.org/10.1145/3292500.3330701")
    assert r("https://x.org/paper.PDF")[0] == "pdf"
    assert r("https://aclanthology.org/2020.acl-main.1/")[0] == "web"
    html = '<meta name="citation_pdf_url" content="/p.pdf">'
    assert PaperDownloader._find_pdf_link(html, "https://a.com/x/") == "https://a.com/p.pdf"
    assert PaperDownloader._find_pdf_link("<meta content=https://a.com/q.pdf name=citation_pdf_url>", "https://a.com") == "https://a.com/q.pdf"
    assert PaperDownloader._find_pdf_link('<a href="f.pdf">pdf</a>', "https://a.com/x/") == "https://a.com/x/f.pdf"
    print("downloader ok")
