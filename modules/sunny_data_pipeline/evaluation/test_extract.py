"""
Tests for the extraction stage — Surender (Sunny) Dagar (slides 6–9).

Extraction is where silent damage happens: a hyphen left in the middle of a word, a page header
repeated forty times, or a PDF that quietly yields nothing all degrade retrieval without ever
raising an error. These tests build real DOCX and PDF files on the fly — no fixtures to check in,
no network, no third-party libraries — and assert the text that comes back out.

    python3 -m unittest test_extract -v
"""
import sys
import tempfile
import unittest
import zipfile
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path[:0] = [str(ROOT / "extraction")]

from extract import (  # noqa: E402
    drop_repeated_lines,
    extract,
    from_docx,
    from_markdown,
    from_pdf,
    normalise,
)


# --------------------------------------------------------------------------------------
# fixture builders — real files, written to a temp directory
# --------------------------------------------------------------------------------------

DOCX_XML = """<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Recursion needs a base case.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Without one</w:t></w:r><w:r><w:t> it never terminates.</w:t></w:r></w:p>
    <w:p/>
  </w:body>
</w:document>
"""


def write_docx(path: Path, xml: str = DOCX_XML) -> Path:
    with zipfile.ZipFile(path, "w") as archive:
        archive.writestr("word/document.xml", xml)
    return path


def write_pdf(path: Path, content: bytes, compress: bool = False, extra: bytes = b"") -> Path:
    """Build a single-object PDF whose content stream is `content`."""
    body = zlib.compress(content) if compress else content
    path.write_bytes(
        b"%PDF-1.4\n" + extra + b"1 0 obj\n<< /Length "
        + str(len(body)).encode() + b" >>\nstream\n" + body + b"\nendstream\nendobj\n%%EOF\n"
    )
    return path


class Fixtures(unittest.TestCase):
    """Gives every test a private temp directory."""

    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.tmp = Path(self._tmp.name)
        self.addCleanup(self._tmp.cleanup)


# --------------------------------------------------------------------------------------


class TestNormalise(unittest.TestCase):
    def test_repairs_words_split_across_a_line_break(self):
        """'recur-\\nsion' must become one token, or it never matches the query 'recursion'."""
        self.assertEqual(normalise("recur-\nsion is useful"), "recursion is useful")

    def test_keeps_genuine_hyphens(self):
        self.assertEqual(normalise("well-formed input"), "well-formed input")

    def test_strips_control_characters(self):
        self.assertEqual(normalise("a\x00b\x07c"), "a b c")

    def test_normalises_non_breaking_spaces(self):
        self.assertEqual(normalise("a b"), "a b")

    def test_normalises_windows_line_endings(self):
        self.assertEqual(normalise("a\r\nb"), "a b")


class TestDropRepeatedLines(unittest.TestCase):
    def test_removes_a_repeated_page_header(self):
        text = "\n".join(["AIDI 2005 — Week 3"] * 4 + ["real content here"])
        self.assertNotIn("AIDI 2005", drop_repeated_lines(text))
        self.assertIn("real content here", drop_repeated_lines(text))

    def test_keeps_lines_below_the_repeat_threshold(self):
        text = "seen twice\nseen twice\nother"
        self.assertIn("seen twice", drop_repeated_lines(text))

    def test_keeps_long_repeated_lines(self):
        """A repeated *paragraph* is content, not page furniture — only short lines are stripped."""
        long_line = "x" * 100
        text = "\n".join([long_line] * 5)
        self.assertIn(long_line, drop_repeated_lines(text))


class TestMarkdown(Fixtures):
    def test_strips_headings_and_emphasis(self):
        path = self.tmp / "notes.md"
        path.write_text("# Title\n\nSome **bold** and `code` text.")
        out = normalise(from_markdown(path))
        self.assertNotIn("#", out)
        self.assertNotIn("**", out)
        self.assertIn("Some bold and code text.", out)

    def test_drops_fenced_code_blocks(self):
        path = self.tmp / "notes.md"
        path.write_text("before\n```python\nsecret_token = 1\n```\nafter")
        out = normalise(from_markdown(path))
        self.assertNotIn("secret_token", out)
        self.assertIn("before", out)
        self.assertIn("after", out)

    def test_keeps_link_text_and_drops_the_url(self):
        path = self.tmp / "notes.md"
        path.write_text("see [the syllabus](https://example.com/x.pdf) for details")
        out = normalise(from_markdown(path))
        self.assertIn("the syllabus", out)
        self.assertNotIn("example.com", out)


class TestDocx(Fixtures):
    def test_extracts_paragraphs(self):
        out = from_docx(write_docx(self.tmp / "a.docx"))
        self.assertIn("Recursion needs a base case.", out)

    def test_joins_runs_within_one_paragraph(self):
        """Word splits a sentence across runs; if we don't join them the sentence is broken."""
        out = from_docx(write_docx(self.tmp / "a.docx"))
        self.assertIn("Without one it never terminates.", out)

    def test_paragraphs_are_separate_lines(self):
        lines = [l for l in from_docx(write_docx(self.tmp / "a.docx")).split("\n") if l]
        self.assertEqual(len(lines), 2)

    def test_empty_paragraphs_are_dropped(self):
        self.assertNotIn("\n\n", from_docx(write_docx(self.tmp / "a.docx")))

    def test_a_non_docx_zip_is_rejected_clearly(self):
        path = self.tmp / "b.docx"
        with zipfile.ZipFile(path, "w") as archive:
            archive.writestr("hello.txt", "not a word file")
        with self.assertRaisesRegex(ValueError, "word/document.xml"):
            from_docx(path)

    def test_the_old_doc_format_is_rejected_clearly(self):
        path = self.tmp / "c.docx"
        path.write_bytes(b"\xd0\xcf\x11\xe0not a zip")
        with self.assertRaisesRegex(ValueError, r"\.doc format"):
            from_docx(path)


class TestPdf(Fixtures):
    def test_extracts_text_from_an_uncompressed_stream(self):
        pdf = write_pdf(self.tmp / "a.pdf", b"BT /F1 12 Tf (Recursion needs a base case.) Tj ET")
        self.assertIn("Recursion needs a base case.", from_pdf(pdf))

    def test_extracts_text_from_a_flate_compressed_stream(self):
        """Real PDFs compress their content streams — this is the path that actually runs."""
        pdf = write_pdf(self.tmp / "b.pdf", b"BT (compressed text) Tj ET", compress=True)
        self.assertIn("compressed text", from_pdf(pdf))

    def test_tj_array_word_gaps_become_spaces(self):
        """Kerned text draws 'Hello' and 'World' separately — the space is a displacement."""
        pdf = write_pdf(self.tmp / "c.pdf", b"BT [(Hello)-400(World)] TJ ET")
        self.assertIn("Hello World", from_pdf(pdf))

    def test_small_kerning_does_not_become_a_space(self):
        pdf = write_pdf(self.tmp / "d.pdf", b"BT [(Va)-5(lue)] TJ ET")
        self.assertIn("Value", from_pdf(pdf))

    def test_hex_strings_are_decoded(self):
        pdf = write_pdf(self.tmp / "e.pdf", b"BT <48656C6C6F> Tj ET")
        self.assertIn("Hello", from_pdf(pdf))

    def test_octal_and_backslash_escapes_are_decoded(self):
        pdf = write_pdf(self.tmp / "f.pdf", rb"BT (A\102C \(x\)) Tj ET")
        text = from_pdf(pdf)
        self.assertIn("ABC", text)
        self.assertIn("(x)", text)

    def test_text_outside_bt_et_is_ignored(self):
        """Only text-showing operators count; stray strings elsewhere are not page content."""
        pdf = write_pdf(self.tmp / "g.pdf", b"(should not appear) BT (real) Tj ET")
        text = from_pdf(pdf)
        self.assertIn("real", text)
        self.assertNotIn("should not appear", text)

    def test_a_scanned_pdf_says_it_needs_ocr(self):
        """An image-only PDF has no text operators — say so rather than return an empty string."""
        pdf = write_pdf(self.tmp / "h.pdf", b"\x89PNG image bytes with no text operators")
        with self.assertRaisesRegex(ValueError, "OCR"):
            from_pdf(pdf)

    def test_an_encrypted_pdf_is_reported(self):
        pdf = write_pdf(self.tmp / "i.pdf", b"BT (x) Tj ET", extra=b"/Encrypt 9 0 R\n")
        with self.assertRaisesRegex(ValueError, "password-protected"):
            from_pdf(pdf)

    def test_a_file_that_is_not_a_pdf_is_reported(self):
        path = self.tmp / "j.pdf"
        path.write_bytes(b"just some text")
        with self.assertRaisesRegex(ValueError, "not a PDF"):
            from_pdf(path)


class TestPdfPositioning(Fixtures):
    """Where naive PDF extractors break: every glyph is positioned, but only some start a line."""

    def text(self, name: str, content: bytes) -> str:
        return normalise(from_pdf(write_pdf(self.tmp / name, content)))

    def test_horizontal_move_does_not_split_a_word(self):
        """A browser positions each glyph with its own Td — 'PROJECTS' must not become 8 words."""
        out = self.text("a.pdf", b"BT (PROJ) Tj 12 0 Td (ECTS) Tj ET")
        self.assertEqual(out, "PROJECTS")

    def test_vertical_move_starts_a_new_line(self):
        out = self.text("b.pdf", b"BT (first) Tj 0 -14 Td (second) Tj ET")
        self.assertEqual(out, "first second")

    def test_text_matrix_at_the_same_height_does_not_split(self):
        out = self.text("c.pdf", b"BT 1 0 0 1 72 700 Tm (PRO) Tj 1 0 0 1 120 700 Tm (JECTS) Tj ET")
        self.assertEqual(out, "PROJECTS")

    def test_text_matrix_at_a_new_height_starts_a_new_line(self):
        out = self.text("d.pdf", b"BT 1 0 0 1 72 700 Tm (first) Tj 1 0 0 1 72 686 Tm (second) Tj ET")
        self.assertEqual(out, "first second")


CMAP = b"""/CIDInit /ProcSet findresource begin
begincmap
1 begincodespacerange
<00> <FF>
endcodespacerange
2 beginbfchar
<01> <0048>
<02> <0069>
endbfchar
1 beginbfrange
<10> <12> <0041>
endbfrange
endcmap
"""


def write_pdf_with_font(path: Path, content: bytes, cmap: bytes = CMAP) -> Path:
    """A PDF whose font carries a /ToUnicode map, as any embedded subset font does."""
    def obj(num: int, body: bytes) -> bytes:
        return b"%d 0 obj\n%s\nendobj\n" % (num, body)

    def stream_obj(num: int, payload: bytes) -> bytes:
        return obj(num, b"<< /Length %d >>\nstream\n%s\nendstream" % (len(payload), payload))

    path.write_bytes(
        b"%PDF-1.4\n"
        + obj(1, b"<< /Font << /F1 2 0 R >> >>")
        + obj(2, b"<< /Type /Font /Subtype /Type0 /ToUnicode 3 0 R >>")
        + stream_obj(3, cmap)
        + stream_obj(4, content)
        + b"%%EOF\n"
    )
    return path


class TestPdfFontEncoding(Fixtures):
    """Glyph codes in an embedded subset font are arbitrary — /ToUnicode is the only translation."""

    def test_glyph_codes_are_mapped_through_tounicode(self):
        pdf = write_pdf_with_font(self.tmp / "a.pdf", b"BT /F1 12 Tf <0102> Tj ET")
        self.assertEqual(normalise(from_pdf(pdf)), "Hi")

    def test_bfrange_maps_consecutive_codes(self):
        pdf = write_pdf_with_font(self.tmp / "b.pdf", b"BT /F1 12 Tf <101112> Tj ET")
        self.assertEqual(normalise(from_pdf(pdf)), "ABC")

    def test_without_the_map_the_same_bytes_are_unreadable(self):
        """Guards the regression this fixes: raw codes read as Latin-1 are control characters."""
        pdf = write_pdf(self.tmp / "c.pdf", b"BT /F1 12 Tf <0102> Tj ET")  # no font object
        self.assertEqual(normalise(from_pdf(pdf)), "")


class TestDispatcher(Fixtures):
    def test_routes_by_extension_and_normalises(self):
        pdf = write_pdf(self.tmp / "a.pdf", b"BT (from  the   pdf) Tj ET")
        self.assertEqual(extract(pdf), "from the pdf")

    def test_routes_docx(self):
        self.assertIn("base case", extract(write_docx(self.tmp / "a.docx")))

    def test_extension_matching_is_case_insensitive(self):
        self.assertIn("base case", extract(write_docx(self.tmp / "A.DOCX")))

    def test_a_missing_file_raises_file_not_found(self):
        with self.assertRaises(FileNotFoundError):
            extract(self.tmp / "nope.pdf")

    def test_an_unsupported_type_lists_what_is_supported(self):
        path = self.tmp / "slides.pptx"
        path.write_text("x")
        with self.assertRaisesRegex(ValueError, r"\.pdf"):
            extract(path)


if __name__ == "__main__":
    unittest.main(verbosity=2)
