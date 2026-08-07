"""
Text extraction — Surender (Sunny) Dagar (slides 6–9).

Stage 1 of the retrieval pipeline. Course material arrives as PDF, DOCX, Markdown or plain text;
everything downstream (chunking, embedding, retrieval) needs clean, normalised text. Extraction
quality matters more than it sounds: hyphenation across line breaks, repeated page headers and
inconsistent whitespace all pollute the embeddings and quietly degrade retrieval.

Standard library only — no external dependencies, so it runs anywhere. DOCX is a ZIP of XML, and
PDF text lives in Flate-compressed content streams, so both are readable with `zipfile` and `zlib`.

    python3 extract.py <file>
"""
import re
import sys
import zipfile
import zlib
from pathlib import Path
from xml.etree import ElementTree

SUPPORTED = {".txt", ".md", ".markdown", ".pdf", ".docx"}


def normalise(text: str) -> str:
    """Collapse whitespace, repair hyphenation, and strip artefacts that pollute embeddings."""
    # words split across a line break: "recur-\nsion" -> "recursion"
    text = re.sub(r"(\w)-\s*\n\s*(\w)", r"\1\2", text)
    # normalise line endings and unicode spaces (escaped, so an editor cannot silently eat it)
    text = text.replace("\r\n", "\n").replace("\r", "\n").replace(" ", " ")
    # drop control characters that survive PDF extraction
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", " ", text)
    # collapse runs of whitespace
    return re.sub(r"\s+", " ", text).strip()


def drop_repeated_lines(text: str, min_repeats: int = 3, min_chars: int = 12) -> str:
    """Remove page headers/footers — short lines that recur on most pages of a document.

    `min_chars` is the guard that makes this safe. A PDF positions each emphasised run separately,
    so an inline bold word arrives as a line of its own; without a lower bound, any short word
    appearing three times — "not", "and", a surname — is indistinguishable from a running header and
    gets deleted. Removing a "not" leaves a fluent sentence asserting the opposite of the document,
    which is the worst possible failure for a tool feeding a retrieval index. Real page furniture
    ("AIDI 2005 — Week 3", "Confidential — do not distribute") comfortably clears twelve characters.
    """
    lines = [l.strip() for l in text.split("\n")]
    counts: dict[str, int] = {}
    for l in lines:
        if min_chars <= len(l) < 80:
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


# ---------------------------------------------------------------------------------------
# DOCX
# ---------------------------------------------------------------------------------------
# A .docx is a ZIP archive; body text lives in word/document.xml as <w:t> runs grouped into
# <w:p> paragraphs. Headers and footers sit in separate parts, which we deliberately skip —
# they are exactly the page furniture drop_repeated_lines() exists to remove.

_W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def from_docx(path: Path) -> str:
    """Pull paragraph text out of a Word document, one paragraph per line."""
    try:
        with zipfile.ZipFile(path) as archive:
            xml = archive.read("word/document.xml")
    except KeyError as exc:
        raise ValueError(f"{path.name} has no word/document.xml — not a Word document") from exc
    except zipfile.BadZipFile as exc:
        raise ValueError(
            f"{path.name} is not readable as DOCX — the older .doc format is not supported"
        ) from exc

    paragraphs = []
    for para in ElementTree.fromstring(xml).iter(f"{_W}p"):
        parts = []
        for node in para.iter():
            if node.tag == f"{_W}t":
                parts.append(node.text or "")
            elif node.tag == f"{_W}tab":
                parts.append(" ")
            elif node.tag in (f"{_W}br", f"{_W}cr"):
                parts.append("\n")
        line = "".join(parts).strip()
        if line:
            paragraphs.append(line)
    return "\n".join(paragraphs)


# ---------------------------------------------------------------------------------------
# PDF
# ---------------------------------------------------------------------------------------
# Text is drawn by operators inside BT/ET blocks in a page content stream, which is nearly
# always Flate-compressed. We decompress every stream, keep the ones that actually draw text,
# and walk the operators. That covers the digital PDFs course material ships as; a scanned PDF
# holds images rather than text operators and needs OCR — detected and reported, not guessed at.
#
# The catch is that a string in a content stream holds *glyph codes*, not characters. When a PDF
# embeds a subset font — which anything exported from a browser or Word does — those codes are
# arbitrary, and reading them as Latin-1 yields nonsense. The font's /ToUnicode CMap is the
# translation table, so we parse it and map codes back to real characters.

_PDF_TOKEN = re.compile(
    rb"\((?:\\.|[^\\()])*\)"      # literal string
    rb"|<[0-9A-Fa-f\s]*>"         # hex string
    rb"|/[^\s/<>\[\]()]+"         # name, e.g. /F1
    rb"|\[|\]"                    # array delimiters (TJ kerning)
    rb"|[-+]?[0-9]*\.?[0-9]+"     # number
    rb"|TJ|Tj|Tf|Tm|T\*|Td|TD|BT|ET|'|\"",
    re.S,
)

_NUMBER = re.compile(rb"[-+]?[0-9]*\.?[0-9]+")

_ESCAPES = {0x6E: 10, 0x72: 13, 0x74: 9, 0x62: 8, 0x66: 12}  # \n \r \t \b \f

# A TJ array displacement more negative than this is a word gap, not kerning.
_WORD_GAP = -100.0


def _string_bytes(token: bytes) -> bytes:
    """Unwrap a PDF literal `(...)` or hex `<...>` string token to its raw bytes."""
    if token.startswith(b"<"):
        digits = re.sub(rb"[^0-9A-Fa-f]", b"", token[1:-1])
        if len(digits) % 2:
            digits += b"0"
        raw = bytes.fromhex(digits.decode("ascii"))
    else:
        src, out, i = token[1:-1], bytearray(), 0
        while i < len(src):
            char = src[i]
            if char != 0x5C:  # not a backslash
                out.append(char)
                i += 1
                continue
            i += 1
            if i >= len(src):
                break
            esc = src[i]
            if esc in _ESCAPES:
                out.append(_ESCAPES[esc])
                i += 1
            elif 0x30 <= esc <= 0x37:  # octal escape, up to three digits
                octal = bytearray()
                while i < len(src) and len(octal) < 3 and 0x30 <= src[i] <= 0x37:
                    octal.append(src[i])
                    i += 1
                out.append(int(octal.decode("ascii"), 8) & 0xFF)
            elif esc == 0x0A:  # backslash-newline is a line continuation
                i += 1
            else:  # \( \) \\ and anything else stands for itself
                out.append(esc)
                i += 1
        raw = bytes(out)
    return raw


def _decode_pdf_string(token: bytes, font: tuple[int, dict[int, str]] | None = None,
                       fallback: dict[int, str] | None = None) -> str:
    """Turn a string token into text, via the font's /ToUnicode map when we have one.

    A code missing from the selected font's table is looked up in `fallback`, a union of every
    /ToUnicode map in the document, before being given up on. Resource names like /F3 are page-local
    and are freely reused for different fonts, so the map chosen by name can be the wrong one — most
    often for a bold or italic run, which is a *subset* font of its own. Dropping those characters
    silently deletes words: a short emphasised word such as "not" disappears and the sentence still
    reads as fluent English while meaning the opposite. Guessing from a neighbouring map is far less
    damaging than that, because a wrong glyph is visible whereas a missing one is not.
    """
    raw = _string_bytes(token)
    if font:
        width, table = font
        usable = len(raw) - (len(raw) % width)
        chars = []
        for i in range(0, usable, width):
            code = int.from_bytes(raw[i:i + width], "big")
            if code in table:
                chars.append(table[code])
            elif fallback and code in fallback:
                chars.append(fallback[code])
            elif width == 1 and 0x20 <= code < 0x7F:
                chars.append(chr(code))  # unmapped but plausibly ASCII
        return "".join(chars)
    if raw[:2] == b"\xfe\xff":
        return raw.decode("utf-16-be", errors="ignore").lstrip("﻿")
    return raw.decode("latin-1", errors="ignore")


def _text_from_content_stream(content: bytes, fonts: dict[bytes, tuple] | None = None,
                              fallback: dict[int, str] | None = None) -> str:
    """Walk the text-showing operators of a single content stream.

    Positioning operators are where naive extractors go wrong. A browser-exported PDF places
    almost every glyph with its own Td/Tm, so treating each one as a line break turns "PROJECTS"
    into eight separate words and destroys the chunking downstream. A line break is a *vertical*
    move, so we read the operands and only break when the y coordinate actually changes.
    """
    fonts = fonts or {}
    out: list[str] = []
    in_text, depth = False, 0
    font: tuple | None = None
    pending_name: bytes | None = None
    operands: list[float] = []
    last_y: float | None = None

    for match in _PDF_TOKEN.finditer(content):
        token = match.group(0)

        if token == b"BT":
            in_text, last_y = True, None
            operands.clear()
            continue
        if not in_text:
            continue
        if token == b"ET":
            in_text, depth = False, 0
            out.append("\n")
            operands.clear()
            continue
        if token == b"[":
            depth += 1
            continue
        if token == b"]":
            depth = max(0, depth - 1)
            continue
        if token[:1] in (b"(", b"<"):
            out.append(_decode_pdf_string(token, font, fallback))
            continue
        if token.startswith(b"/"):
            pending_name = token[1:]
            continue
        if _NUMBER.fullmatch(token):
            value = float(token)
            if depth:
                # inside a TJ array, a large negative displacement is a space the font never drew
                if value <= _WORD_GAP:
                    out.append(" ")
            else:
                operands.append(value)
            continue

        # anything left is an operator
        if token == b"Tf":
            font = fonts.get(pending_name) if pending_name else None
        elif token in (b"Td", b"TD"):
            # operands are (tx, ty), a displacement relative to the current line
            if len(operands) >= 2 and operands[-1] != 0:
                out.append("\n")
        elif token == b"Tm":
            # operands are (a, b, c, d, tx, ty) — ty is an absolute position
            if len(operands) >= 6:
                if last_y is not None and operands[-1] != last_y:
                    out.append("\n")
                last_y = operands[-1]
        elif token in (b"T*", b"'", b'"'):
            out.append("\n")
        operands.clear()

    return "".join(out)


def _parse_cmap(cmap: bytes) -> tuple[int, dict[int, str]] | None:
    """Parse a /ToUnicode CMap into (code width in bytes, {glyph code: text})."""

    def utf16(hex_digits: bytes) -> str:
        raw = bytes.fromhex(hex_digits.decode("ascii"))
        return raw.decode("utf-16-be", errors="ignore")

    width, table = 1, {}
    space = re.search(rb"begincodespacerange(.*?)endcodespacerange", cmap, re.S)
    if space:
        first = re.search(rb"<([0-9A-Fa-f]+)>", space.group(1))
        if first:
            width = max(1, len(first.group(1)) // 2)

    for block in re.findall(rb"beginbfchar(.*?)endbfchar", cmap, re.S):
        for src, dst in re.findall(rb"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>", block):
            table[int(src, 16)] = utf16(dst)
            width = max(width, len(src) // 2)

    for block in re.findall(rb"beginbfrange(.*?)endbfrange", cmap, re.S):
        # <lo> <hi> <dst> — consecutive codes map to consecutive characters
        for lo, hi, dst in re.findall(
            rb"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>", block
        ):
            start = int(dst, 16)
            for offset, code in enumerate(range(int(lo, 16), int(hi, 16) + 1)):
                table[code] = chr(start + offset)
            width = max(width, len(lo) // 2)
        # <lo> <hi> [ <d1> <d2> … ] — an explicit character for each code
        for lo, hi, array in re.findall(
            rb"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[(.*?)\]", block, re.S
        ):
            targets = re.findall(rb"<([0-9A-Fa-f]+)>", array)
            for offset, code in enumerate(range(int(lo, 16), int(hi, 16) + 1)):
                if offset < len(targets):
                    table[code] = utf16(targets[offset])
            width = max(width, len(lo) // 2)

    return (width, table) if table else None


def _font_cmaps(data: bytes, streams: list[bytes]) -> dict[bytes, tuple[int, dict[int, str]]]:
    """Map each font resource name (F1, F2 …) to its /ToUnicode table.

    Resource dictionaries may sit in the raw file or inside a compressed object stream, so we
    search both. Stream objects themselves are never compressed into an object stream, so the
    CMaps are always resolvable from the raw bytes.
    """
    objects = {
        int(m.group(1)): m.group(2)
        for m in re.finditer(rb"(\d+)\s+0\s+obj\b(.*?)\bendobj", data, re.S)
    }
    corpus = b"\n".join([data, *streams])
    cache: dict[int, tuple | None] = {}
    fonts: dict[bytes, tuple] = {}

    for resources in re.finditer(rb"/Font\s*<<(.*?)>>", corpus, re.S):
        for name, number in re.findall(
            rb"/([^\s/<>\[\]()]+)\s+(\d+)\s+0\s+R", resources.group(1)
        ):
            font_obj = objects.get(int(number))
            if not font_obj:
                continue
            ref = re.search(rb"/ToUnicode\s+(\d+)\s+0\s+R", font_obj)
            if not ref:
                continue
            cmap_num = int(ref.group(1))
            if cmap_num not in cache:
                body = objects.get(cmap_num, b"")
                stream = re.search(rb"stream\r?\n(.*?)endstream", body, re.S)
                raw = stream.group(1) if stream else b""
                try:
                    raw = zlib.decompress(raw)
                except zlib.error:
                    pass
                cache[cmap_num] = _parse_cmap(raw)
            if cache[cmap_num]:
                fonts.setdefault(name, cache[cmap_num])
    return fonts


def from_pdf(path: Path) -> str:
    """Extract text from a digital PDF. Raises if the file is encrypted or image-only."""
    data = path.read_bytes()
    if not data.startswith(b"%PDF"):
        raise ValueError(f"{path.name} is not a PDF")
    if b"/Encrypt" in data:
        raise ValueError(f"{path.name} is password-protected — remove the protection and retry")

    streams = []
    for match in re.finditer(rb"stream\r?\n(.*?)endstream", data, re.S):
        body = match.group(1)
        try:
            body = zlib.decompress(body)
        except zlib.error:
            pass  # already uncompressed, or an encoding we don't read — try it as-is
        streams.append(body)

    fonts = _font_cmaps(data, streams)
    # Union of every map in the document, used when a font-specific lookup misses.
    fallback: dict[int, str] = {}
    for _width, _table in fonts.values():
        for _code, _ch in _table.items():
            fallback.setdefault(_code, _ch)
    pages = []
    for body in streams:
        if b"BT" not in body:
            continue  # not a text stream: fonts, images, metadata
        text = _text_from_content_stream(body, fonts, fallback)
        if text.strip():
            pages.append(text)

    if not pages:
        raise ValueError(
            f"no text found in {path.name} — it is most likely a scan, which needs OCR"
        )
    return "\n".join(pages)


# ---------------------------------------------------------------------------------------


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
    elif suffix == ".pdf":
        raw = from_pdf(p)
    elif suffix == ".docx":
        raw = from_docx(p)
    else:
        raise ValueError(
            f"unsupported file type '{suffix}' — supported: {', '.join(sorted(SUPPORTED))}"
        )
    return normalise(drop_repeated_lines(raw))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    text = extract(sys.argv[1])
    print(f"{len(text.split())} words extracted\n")
    print(text[:600] + ("…" if len(text) > 600 else ""))
