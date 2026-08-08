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

    return sorted(out, key=lambda x: (-x["mastery"], x["topic"]))


def weakest_topic(mastery: List[MasteryTopic]) -> Optional[MasteryTopic]:
    """Returns the topic with the lowest mastery score, or None if list is empty."""
    if not mastery:
        return None
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


if __name__ == "__main__":
    sample = [
        {"topic": "Recursion", "score": 80},
        {"topic": "Recursion", "score": 60},
        {"topic": "Genetic Algorithms", "score": 92},
        {"topic": "Sorting", "score": 45},
        {"topic": "Sorting", "score": 55},
    ]
    m = mastery_by_topic(sample)
    print("Mastery by topic:", m)
    print("Weakest (focus area):", weakest_topic(m))
    print("Score distribution:", score_distribution(sample))