"""
Student progress dashboard computation — Arnold Babu (Slides 10–12).

The portal dashboards (mastery, trend, weak-topic detection) are computed from quiz
results. This is a runnable, secrets-free version of that logic — it mirrors the
production analytics that feed the Angular student/professor dashboards.

    python progress_dashboard.py
"""

from typing import Dict, List, Optional, Union

QuizRow = Dict[str, Union[str, float, int]]
MasteryTopic = Dict[str, Union[str, float, int]]


def clamp_score(score: float) -> float:
    """Clamps quiz scores to the valid range of 0.0 - 100.0."""
    return max(0.0, min(100.0, float(score)))


def mastery_by_topic(quiz_rows: List[QuizRow]) -> List[MasteryTopic]:
    """
    Computes per-topic average mastery percentage and total attempts.
    Returns topics sorted by highest mastery first, using topic name as tie-breaker.
    """
    if not quiz_rows:
        return []

    agg: Dict[str, Dict[str, float]] = {}
    for r in quiz_rows:
        topic = str(r.get("topic", "Uncategorized"))
        score = clamp_score(r.get("score", 0))

        a = agg.setdefault(topic, {"sum": 0.0, "n": 0})
        a["sum"] += score
        a["n"] += 1

    out: List[MasteryTopic] = [
        {
            "topic": t,
            "mastery": round(a["sum"] / a["n"], 2),
            "attempts": int(a["n"]),
        }
        for t, a in agg.items()
    ]

    # Primary sort by mastery descending, secondary sort by topic name ascending
    return sorted(out, key=lambda x: (-x["mastery"], x["topic"]))


def weakest_topic(mastery: List[MasteryTopic]) -> Optional[MasteryTopic]:
    """Returns the topic with the lowest mastery score, or None if list is empty."""
    if not mastery:
        return None
    # Ties favor topic with lowest attempts or alphabetical name
    return min(mastery, key=lambda m: (m["mastery"], m["attempts"], m["topic"]))


def score_distribution(quiz_rows: List[QuizRow]) -> Dict[str, int]:
    """Generates distribution buckets for quiz scores."""
    buckets = {"0-49": 0, "50-69": 0, "70-79": 0, "80-89": 0, "90-100": 0}
    for r in quiz_rows:
        s = clamp_score(r.get("score", 0))
        if s < 50:
            k = "0-49"
        elif s < 70:
            k = "50-69"
        elif s < 80:
            k = "70-79"
        elif s < 90:
            k = "80-89"
        else:
            k = "90-100"
        buckets[k] += 1
    return buckets


def run_tests():
    """Unit test suite for progress dashboard analytics."""
    print("--- Running Progress Dashboard Analytics Tests ---")

    # Test 1: Standard sample execution
    sample = [
        {"topic": "Recursion", "score": 80},
        {"topic": "Recursion", "score": 60},
        {"topic": "Genetic Algorithms", "score": 92},
        {"topic": "Sorting", "score": 45},
        {"topic": "Sorting", "score": 55},
    ]
    m = mastery_by_topic(sample)
    assert len(m) == 3, f"Expected 3 topics, got {len(m)}"
    assert m[0]["topic"] == "Genetic Algorithms" and m[0]["mastery"] == 92.0
    assert m[1]["topic"] == "Recursion" and m[1]["mastery"] == 70.0
    assert m[2]["topic"] == "Sorting" and m[2]["mastery"] == 50.0
    print("PASSED: Mastery aggregation & precision check")

    # Test 2: Weakest topic identification
    weakest = weakest_topic(m)
    assert weakest is not None and weakest["topic"] == "Sorting"
    print("PASSED: Weakest topic detection")

    # Test 3: Score distribution bucketing
    dist = score_distribution(sample)
    assert dist == {"0-49": 1, "50-69": 2, "70-79": 0, "80-89": 1, "90-100": 1}
    print("PASSED: Score distribution bucketing")

    # Test 4: Empty input handling
    assert mastery_by_topic([]) == []
    assert weakest_topic([]) is None
    assert sum(score_distribution([]).values()) == 0
    print("PASSED: Edge case empty inputs")

    # Test 5: Out of bounds score clamping
    clamped_sample = [{"topic": "Bounds", "score": 150}, {"topic": "Bounds", "score": -20}]
    clamped_m = mastery_by_topic(clamped_sample)
    assert clamped_m[0]["mastery"] == 50.0  # (100 + 0) / 2
    print("PASSED: Out-of-bounds score clamping")

    print("--- All Progress Dashboard Tests Passed Successfully! ---")


if __name__ == "__main__":
    run_tests()