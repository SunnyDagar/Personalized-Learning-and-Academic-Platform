"""
rag_scope_gate.py

Strict course-scope grounding gate for the RAG study assistant.

Sits between retrieval and generation:
  1. Drops any retrieved chunk that doesn't belong to the student's
     current course (per-tenant / per-course data isolation).
  2. Checks that at least one remaining chunk is similar enough to the
     query to actually support an answer.
  3. If either check fails, the generator is never called — the system
     returns a fixed refusal instead of letting the model improvise,
     which is the platform's primary defence against hallucination.

Drop this module into the pipeline service (next to the chunking /
embedding code) and call `RAGScopeGate.evaluate(...)` right before you
build the prompt for the generator.
"""

from dataclasses import dataclass, field
from typing import List, Optional


REFUSAL_MESSAGE = (
    "I am sorry, but I cannot find that in the provided course materials."
)


@dataclass
class RetrievedChunk:
    """One result coming back from the vector store (e.g. ChromaDB)."""
    chunk_id: str
    course_id: str
    text: str
    similarity: float  # cosine similarity to the query, 0.0-1.0


@dataclass
class GateResult:
    allowed: bool
    reason: str
    grounded_chunks: List[RetrievedChunk] = field(default_factory=list)
    best_similarity: Optional[float] = None

    @property
    def refusal_message(self) -> str:
        return REFUSAL_MESSAGE


class RAGScopeGate:
    """
    Strict-scope gate for the RAG assistant.

    similarity_threshold: minimum cosine similarity a chunk needs to
        count as "supporting" an answer. Tune against real query/answer
        pairs — too low lets weak matches through, too high causes
        false refusals on legitimate questions.
    min_supporting_chunks: how many chunks above the threshold are
        required before the generator is allowed to answer.
    """

    def __init__(
        self,
        similarity_threshold: float = 0.55,
        min_supporting_chunks: int = 1,
    ) -> None:
        if not 0.0 <= similarity_threshold <= 1.0:
            raise ValueError("similarity_threshold must be between 0 and 1")
        if min_supporting_chunks < 1:
            raise ValueError("min_supporting_chunks must be at least 1")

        self.similarity_threshold = similarity_threshold
        self.min_supporting_chunks = min_supporting_chunks

    def _filter_by_course(
        self, chunks: List[RetrievedChunk], course_id: str
    ) -> List[RetrievedChunk]:
        """Per-course data isolation: never let another course's
        content leak into this answer, even if it scored well."""
        return [c for c in chunks if c.course_id == course_id]

    def evaluate(
        self, retrieved_chunks: List[RetrievedChunk], course_id: str
    ) -> GateResult:
        """
        Decide whether the generator is allowed to answer.

        Returns a GateResult. If `allowed` is False, the caller must
        show `result.refusal_message` to the student instead of
        invoking the LLM.
        """
        in_scope = self._filter_by_course(retrieved_chunks, course_id)

        if not in_scope:
            return GateResult(
                allowed=False,
                reason="no_chunks_in_course_scope",
            )

        supporting = [
            c for c in in_scope if c.similarity >= self.similarity_threshold
        ]
        best = max((c.similarity for c in in_scope), default=None)

        if len(supporting) < self.min_supporting_chunks:
            return GateResult(
                allowed=False,
                reason="below_similarity_threshold",
                best_similarity=best,
            )

        supporting.sort(key=lambda c: c.similarity, reverse=True)
        return GateResult(
            allowed=True,
            reason="grounded",
            grounded_chunks=supporting,
            best_similarity=best,
        )


def build_prompt(query: str, grounded_chunks: List[RetrievedChunk]) -> str:
    """Only call this with chunks from an `allowed=True` GateResult."""
    context = "\n\n".join(f"- {c.text}" for c in grounded_chunks)
    return (
        "Answer the student's question using ONLY the context below. "
        f"\n\nContext:\n{context}\n\nQuestion: {query}\nAnswer:"
    )


if __name__ == "__main__":
    gate = RAGScopeGate(similarity_threshold=0.55, min_supporting_chunks=1)

    query = "What is the time complexity of binary search?"
    student_course_id = "CS101"

    retrieved = [
        RetrievedChunk("c1", "CS101", "Binary search runs in O(log n).", 0.81),
        RetrievedChunk("c2", "CS101", "Linear search runs in O(n).", 0.40),
        RetrievedChunk("c3", "CS204", "Binary trees are O(log n) balanced.", 0.90),
    ]

    result = gate.evaluate(retrieved, course_id=student_course_id)

    if result.allowed:
        prompt = build_prompt(query, result.grounded_chunks)
        print("GENERATOR PROMPT:\n", prompt)
    else:
        print(f"BLOCKED ({result.reason}) -> {result.refusal_message}")
