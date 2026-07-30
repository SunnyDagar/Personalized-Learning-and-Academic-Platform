"""
Tests for the retrieval and grounding layer — Surender (Sunny) Dagar (slides 6–9).

These cover the maths and the decision logic, not the network: no API key is needed and no calls
are made. Vectors are supplied directly so the similarity and threshold behaviour can be asserted
deterministically.

    python3 -m unittest test_grounding -v
"""
import math
import unittest

from ingest_embed import cosine, clean_text, chunk_text
from grounding import MIN_SIM


class TestCosineSimilarity(unittest.TestCase):
    """cosine() is the measure the whole scope gate depends on."""

    def test_identical_vectors_score_one(self):
        v = [0.3, 0.5, 0.81]
        self.assertAlmostEqual(cosine(v, v), 1.0, places=6)

    def test_orthogonal_vectors_score_zero(self):
        self.assertAlmostEqual(cosine([1.0, 0.0], [0.0, 1.0]), 0.0, places=6)

    def test_opposite_vectors_score_minus_one(self):
        self.assertAlmostEqual(cosine([1.0, 0.0], [-1.0, 0.0]), -1.0, places=6)

    def test_magnitude_does_not_affect_score(self):
        """Direction is what carries meaning — a longer vector is not 'more similar'."""
        a, b = [1.0, 2.0], [10.0, 20.0]
        self.assertAlmostEqual(cosine(a, b), 1.0, places=6)

    def test_zero_vector_does_not_raise(self):
        """An empty embedding must degrade to 0.0, never a ZeroDivisionError."""
        self.assertEqual(cosine([0.0, 0.0], [1.0, 1.0]), 0.0)

    def test_score_is_symmetric(self):
        a, b = [0.2, 0.9, 0.4], [0.7, 0.1, 0.6]
        self.assertAlmostEqual(cosine(a, b), cosine(b, a), places=9)


class TestThreshold(unittest.TestCase):
    """The gate constant itself — the single number that decides answer vs. refuse."""

    def test_threshold_sits_between_related_and_unrelated(self):
        """Measured on these embeddings: same-topic ≈ 0.70+, unrelated ≈ 0.55-."""
        self.assertGreater(MIN_SIM, 0.55, "must reject unrelated content")
        self.assertLess(MIN_SIM, 0.70, "must not reject genuinely on-topic content")

    def test_threshold_is_the_documented_value(self):
        self.assertAlmostEqual(MIN_SIM, 0.62, places=2)


class TestCleanText(unittest.TestCase):
    def test_collapses_whitespace(self):
        self.assertEqual(clean_text("a   b\n\n\tc"), "a b c")

    def test_strips_leading_and_trailing_space(self):
        self.assertEqual(clean_text("   padded   "), "padded")

    def test_empty_input_returns_empty(self):
        self.assertEqual(clean_text("   \n\t "), "")


class TestChunking(unittest.TestCase):
    def test_short_text_is_a_single_chunk(self):
        self.assertEqual(len(chunk_text("one two three", size=400, overlap=50)), 1)

    def test_long_text_splits_into_multiple_chunks(self):
        words = " ".join(str(i) for i in range(1000))
        self.assertGreater(len(chunk_text(words, size=400, overlap=50)), 1)

    def test_chunks_respect_the_size_limit(self):
        words = " ".join(str(i) for i in range(1000))
        for c in chunk_text(words, size=400, overlap=50):
            self.assertLessEqual(len(c.split()), 400)

    def test_consecutive_chunks_overlap(self):
        """Overlap is what stops a sentence being cut in half between chunks."""
        words = " ".join(str(i) for i in range(1000))
        chunks = chunk_text(words, size=400, overlap=50)
        first_tail = chunks[0].split()[-50:]
        second_head = chunks[1].split()[:50]
        self.assertEqual(first_tail, second_head)

    def test_no_chunk_is_empty(self):
        words = " ".join(str(i) for i in range(1000))
        self.assertTrue(all(c.strip() for c in chunk_text(words)))


if __name__ == "__main__":
    unittest.main(verbosity=2)
