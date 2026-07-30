"""
Text extraction — Surender (Sunny) Dagar (slides 6–9).

Stage 1 of the retrieval pipeline. Course material arrives as PDF, DOCX, Markdown or plain text;
everything downstream (chunking, embedding, retrieval) needs clean, normalised text. Extraction
quality matters more than it sounds: hyphenation across line breaks, repeated page headers and
inconsistent whitespace all pollute the embeddings and quietly degrade retrieval.

Standard library only — no external dependencies, so it runs anywhere.

    python3 extract.py <file>
"""
import re
import sys
import zipfile
from pathlib import Path


def normalise(text: str) -> str:
    """Collapse whitespace, repair hyphenation, and strip artefacts that pollute embeddings."""
    # words split across a line break: "recur-\nsion" -> "recursion"
    text = re.sub(r"(\w)-\s*\n\s*(\w)", r"\1\2", text)
    # normalise line endings and unicode spaces
    text = text.replace("\r\n", "\n").replace("\r", "\n").replace(" ", " ")
    # drop control characters that survive PDF extraction
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", " ", text)
    # collapse runs of whitespace
    return re.sub(r"\s+", " ", text).strip()


def drop_repeated_lines(text: str, min_repeats: int = 3) -> str:
    """Remove page headers/footers — short lines that recur on most pages of a document."""
    lines = [l.strip() for l in text.split("\n")]
    counts: dict[str, int] = {}
    for l in lines:
        if 0 < len(l) < 80:
            counts[l] = counts.get(l, 0) + 1
    boilerplate = {l for l, n in counts.items() if n >= min_repeats}
    return "\n".join(l for l in lines if l not in boilerplate)


def from_txt(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def from_markdown(path: Path) -> str:
    """Strip the markup so headings and emphasis don't distort the embedding."""
    t = path.read_text(encoding="utf-8", errors="ignore")
    t = re.sub(r"```.*?```", " ", t, flags=re.S)      # fenced code
    t = re.sub(r"!?\[([^\]]*)\]\([^)]*\)", r"\1", t)  # links / images -> label
    t = re.sub(r"^#{1,6}\s*", "", t, flags=re.M)      # headings
    t = re.sub(r"[*_`>|]", " ", t)                    # emphasis, quotes, tables
    return t


def extract(path: str | Path) -> str:
    """Dispatch on file type and return normalised text. Raises on unsupported types."""
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(p)
    suffix = p.suffix.lower()
    if suffix in {".txt", ""}:
        raw = from_txt(p)
    elif suffix in {".md", ".markdown"}:
        raw = from_markdown(p)
    else:
        raise ValueError(
            f"unsupported file type '{suffix}' — PDF and DOCX support land next"
        )
    return normalise(drop_repeated_lines(raw))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    text = extract(sys.argv[1])
    print(f"{len(text.split())} words extracted\n")
    print(text[:600] + ("…" if len(text) > 600 else ""))
