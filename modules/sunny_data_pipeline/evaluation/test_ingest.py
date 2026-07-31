"""
Tests for the chunking stage — Surender (Sunny) Dagar (slides 6–9).

`test_grounding.py` covers the fixed-width word windows. This file covers the sentence-aware
chunker, which is the one actually defensible in the report: course material is largely
definitions, and a definition cut in half retrieves badly no matter how good the embedding is.

The properties worth guaranteeing:

  no sentence is ever split across two chunks
  no word is lost between chunks
  consecutive chunks overlap, so a boundary definition appears in both
  bad parameters fail loudly rather than looping forever

    python3 -m unittest test_ingest -v
"""
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path[:0] = [str(ROOT / "chunking")]

from chunk import (  # noqa: E402
    DEFAULT_OVERLAP,
    DEFAULT_SIZE,
    chunk_sentences,
    chunk_words,
    describe,
)

# Twelve short sentences, each individually well under any chunk size we test with.
SENTENCES = [f"Sentence number {i} explains one idea clearly." for i in range(1, 13)]
PROSE = " ".join(SENTENCES)


class TestParameterValidation(unittest.TestCase):
    """Bad parameters must fail immediately — an overlap >= size never advances the window."""

    def test_zero_size_is_rejected(self):
        with self.assertRaises(ValueError):
            chunk_words(PROSE, size=0, overlap=0)

    def test_negative_size_is_rejected(self):
        with self.assertRaises(ValueError):
            chunk_words(PROSE, size=-10, overlap=0)

    def test_overlap_equal_to_size_is_rejected(self):
        """This is the infinite-loop case — it must raise, not hang."""
        with self.assertRaises(ValueError):
            chunk_words(PROSE, size=50, overlap=50)

    def test_overlap_larger_than_size_is_rejected(self):
        with self.assertRaises(ValueError):
            chunk_words(PROSE, size=50, overlap=80)


class TestWordWindows(unittest.TestCase):
    def test_empty_text_produces_no_chunks(self):
        self.assertEqual(chunk_words(""), [])

    def test_whitespace_only_text_produces_no_chunks(self):
        self.assertEqual(chunk_words("   \n\t  "), [])

    def test_zero_overlap_loses_no_words(self):
        words = [str(i) for i in range(100)]
        chunks = chunk_words(" ".join(words), size=30, overlap=0)
        self.assertEqual(" ".join(chunks).split(), words)

    def test_every_word_appears_somewhere(self):
        words = [str(i) for i in range(250)]
        seen = set()
        for c in chunk_words(" ".join(words), size=40, overlap=10):
            seen.update(c.split())
        self.assertEqual(seen, set(words))

    def test_the_last_chunk_reaches_the_end_of_the_text(self):
        words = [str(i) for i in range(250)]
        chunks = chunk_words(" ".join(words), size=40, overlap=10)
        self.assertEqual(chunks[-1].split()[-1], "249")


class TestSentenceAwareChunking(unittest.TestCase):
    """The variant we actually ship — uneven sizes in exchange for intact sentences."""

    def test_no_chunk_ends_mid_sentence(self):
        for chunk in chunk_sentences(PROSE, size=20, overlap=6):
            self.assertTrue(
                chunk.rstrip().endswith((".", "!", "?")),
                f"chunk was cut mid-sentence: {chunk!r}",
            )

    def test_every_sentence_survives_intact(self):
        joined = " ".join(chunk_sentences(PROSE, size=20, overlap=6))
        for sentence in SENTENCES:
            self.assertIn(sentence, joined)

    def test_long_text_produces_several_chunks(self):
        self.assertGreater(len(chunk_sentences(PROSE, size=20, overlap=6)), 1)

    def test_consecutive_chunks_overlap(self):
        """A definition on a boundary must appear in both neighbours."""
        chunks = chunk_sentences(PROSE, size=20, overlap=8)
        for earlier, later in zip(chunks, chunks[1:]):
            shared = set(earlier.split()) & set(later.split())
            self.assertTrue(shared, "consecutive chunks share nothing — overlap was lost")

    def test_text_without_sentence_boundaries_falls_back_to_word_windows(self):
        words = " ".join(str(i) for i in range(300))
        self.assertEqual(
            chunk_sentences(words, size=100, overlap=20),
            chunk_words(words, size=100, overlap=20),
        )

    def test_a_single_sentence_is_one_chunk(self):
        self.assertEqual(chunk_sentences("Just the one sentence here."), ["Just the one sentence here."])

    def test_empty_text_produces_no_chunks(self):
        self.assertEqual(chunk_sentences(""), [])

    def test_a_sentence_longer_than_the_size_is_not_dropped(self):
        """Better an oversized chunk than a lost definition."""
        long_sentence = " ".join(["word"] * 60) + "."
        chunks = chunk_sentences(f"Short one. {long_sentence} Short two.", size=20, overlap=5)
        self.assertIn(long_sentence, " ".join(chunks))


class TestDescribe(unittest.TestCase):
    """describe() is what chunk_tuning.py reports on — the numbers must be trustworthy."""

    def test_no_chunks_reports_zero(self):
        self.assertEqual(describe([]), {"chunks": 0})

    def test_counts_and_bounds_are_correct(self):
        stats = describe(["one two three", "four five", "six"])
        self.assertEqual(stats["chunks"], 3)
        self.assertEqual(stats["min_words"], 1)
        self.assertEqual(stats["max_words"], 3)
        self.assertEqual(stats["total_words"], 6)
        self.assertEqual(stats["avg_words"], 2.0)

    def test_no_chunk_exceeds_the_requested_size(self):
        stats = describe(chunk_words(PROSE, size=15, overlap=4))
        self.assertLessEqual(stats["max_words"], 15)


class TestDefaults(unittest.TestCase):
    def test_the_documented_defaults_are_what_the_code_uses(self):
        """400/50 is the figure defended in the README and the report."""
        self.assertEqual(DEFAULT_SIZE, 400)
        self.assertEqual(DEFAULT_OVERLAP, 50)

    def test_the_default_overlap_is_smaller_than_the_default_size(self):
        self.assertLess(DEFAULT_OVERLAP, DEFAULT_SIZE)


if __name__ == "__main__":
    unittest.main(verbosity=2)
