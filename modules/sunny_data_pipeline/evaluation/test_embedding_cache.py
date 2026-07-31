"""
Tests for the embedding cache — Surender (Sunny) Dagar (slides 6–9).

Embedding is the only step that costs money: one API call per chunk, billed per token. The cache
is what stops a re-ingest paying for work already done, so its correctness is a cost question as
much as a code question. Two properties matter most and are asserted here:

  a hit must not call the API at all      — otherwise the cache saves nothing
  a model change must invalidate everything — otherwise old vectors are compared against new ones,
                                              which is silently wrong rather than loudly broken

Every test redirects CACHE_DIR into a temp folder, so running the suite never touches the real
cache in ~/.cache/learnify_embeddings.

    python3 -m unittest test_embedding_cache -v
"""
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path[:0] = [str(ROOT / "embedding")]

import embedding_cache  # noqa: E402
from embedding_cache import _key, embed_cached, get, put, stats  # noqa: E402

MODEL = "gemini-embedding-001"
TEXT = "A base case is what stops the recursion."


class CacheFixture(unittest.TestCase):
    """Redirects the cache to a temp directory and counts calls to the embedder."""

    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self._real_dir = embedding_cache.CACHE_DIR
        embedding_cache.CACHE_DIR = Path(self._tmp.name) / "cache"
        self.addCleanup(setattr, embedding_cache, "CACHE_DIR", self._real_dir)
        self.calls = []

    def embedder(self, text: str) -> list[float]:
        """Stand-in for the Gemini call — records every invocation."""
        self.calls.append(text)
        return [float(len(text)), 0.5, -0.25]


class TestKey(CacheFixture):
    def test_same_text_and_model_give_the_same_key(self):
        self.assertEqual(_key(TEXT, MODEL), _key(TEXT, MODEL))

    def test_different_text_gives_a_different_key(self):
        self.assertNotEqual(_key(TEXT, MODEL), _key(TEXT + " ", MODEL))

    def test_changing_the_model_invalidates_the_entry(self):
        """Vectors from two models are not comparable — the key must include the model."""
        self.assertNotEqual(_key(TEXT, MODEL), _key(TEXT, "some-other-model"))

    def test_the_separator_cannot_be_forged(self):
        """('ab', 'c') and ('a', 'bc') must not collide into one cache entry."""
        self.assertNotEqual(_key("b", "a"), _key("", "ab"))

    def test_the_key_is_a_hex_digest(self):
        key = _key(TEXT, MODEL)
        self.assertEqual(len(key), 64)
        self.assertTrue(all(c in "0123456789abcdef" for c in key))


class TestGetPut(CacheFixture):
    def test_a_miss_returns_none(self):
        self.assertIsNone(get(TEXT, MODEL))

    def test_a_stored_vector_comes_back_unchanged(self):
        vector = [0.1, -0.2, 0.30000000001]
        put(TEXT, MODEL, vector)
        self.assertEqual(get(TEXT, MODEL), vector)

    def test_put_creates_the_cache_directory(self):
        self.assertFalse(embedding_cache.CACHE_DIR.exists())
        put(TEXT, MODEL, [1.0])
        self.assertTrue(embedding_cache.CACHE_DIR.exists())

    def test_a_corrupt_entry_is_a_miss_not_a_crash(self):
        """A half-written file must degrade to a re-embed, never take the pipeline down."""
        put(TEXT, MODEL, [1.0, 2.0])
        (embedding_cache.CACHE_DIR / f"{_key(TEXT, MODEL)}.json").write_text("{not json")
        self.assertIsNone(get(TEXT, MODEL))

    def test_a_stored_vector_is_readable_as_plain_json(self):
        """The format is deliberately boring — inspectable without this module."""
        put(TEXT, MODEL, [1.5, 2.5])
        raw = (embedding_cache.CACHE_DIR / f"{_key(TEXT, MODEL)}.json").read_text()
        self.assertEqual(json.loads(raw), [1.5, 2.5])


class TestEmbedCached(CacheFixture):
    def test_the_first_call_is_a_miss_and_calls_the_api(self):
        vector, cached = embed_cached(TEXT, MODEL, self.embedder)
        self.assertFalse(cached)
        self.assertEqual(len(self.calls), 1)
        self.assertEqual(vector, [float(len(TEXT)), 0.5, -0.25])

    def test_the_second_call_is_a_hit_and_does_not_call_the_api(self):
        """This is the whole point of the cache — a hit must cost nothing."""
        embed_cached(TEXT, MODEL, self.embedder)
        vector, cached = embed_cached(TEXT, MODEL, self.embedder)
        self.assertTrue(cached)
        self.assertEqual(len(self.calls), 1, "a cache hit must not reach the API")
        self.assertEqual(vector, [float(len(TEXT)), 0.5, -0.25])

    def test_re_ingesting_a_document_only_embeds_what_changed(self):
        """A professor edits one paragraph: the untouched chunks must all hit the cache."""
        original = ["chunk one", "chunk two", "chunk three"]
        for chunk in original:
            embed_cached(chunk, MODEL, self.embedder)
        self.assertEqual(len(self.calls), 3)

        edited = ["chunk one", "chunk two EDITED", "chunk three"]
        results = [embed_cached(c, MODEL, self.embedder) for c in edited]

        self.assertEqual([cached for _, cached in results], [True, False, True])
        self.assertEqual(len(self.calls), 4, "only the edited chunk should be re-embedded")

    def test_changing_the_model_re_embeds_everything(self):
        embed_cached(TEXT, MODEL, self.embedder)
        _, cached = embed_cached(TEXT, "gemini-embedding-002", self.embedder)
        self.assertFalse(cached)
        self.assertEqual(len(self.calls), 2)

    def test_distinct_texts_do_not_share_an_entry(self):
        embed_cached("first", MODEL, self.embedder)
        _, cached = embed_cached("second", MODEL, self.embedder)
        self.assertFalse(cached)


class TestStats(CacheFixture):
    def test_an_absent_cache_reports_zero(self):
        self.assertEqual(stats(), {"entries": 0, "bytes": 0})

    def test_entries_are_counted(self):
        put("a", MODEL, [1.0])
        put("b", MODEL, [2.0])
        self.assertEqual(stats()["entries"], 2)

    def test_storing_the_same_text_twice_stores_one_entry(self):
        put(TEXT, MODEL, [1.0])
        put(TEXT, MODEL, [1.0])
        self.assertEqual(stats()["entries"], 1)

    def test_bytes_are_reported(self):
        put(TEXT, MODEL, [1.0, 2.0, 3.0])
        self.assertGreater(stats()["bytes"], 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
