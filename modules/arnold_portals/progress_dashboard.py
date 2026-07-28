"""
Student progress dashboard computation — Arnold Babu (Slides 10–12).

The portal dashboards (mastery, trend, weak-topic detection) are computed from quiz
results. This is a runnable, secrets-free version of that logic — it mirrors the
production analytics that feed the Angular student/professor dashboards.

    python progress_dashboard.py
"""


def mastery_by_topic(quiz_rows):
    """quiz_rows: list of {topic, score}. Returns per-topic average mastery + attempts."""
    agg = {}
    for r in quiz_rows:
        a = agg.setdefault(r["topic"], {"sum": 0, "n": 0})
        a["sum"] += r["score"]; a["n"] += 1
    out = [{"topic": t, "mastery": round(a["sum"] / a["n"]), "attempts": a["n"]} for t, a in agg.items()]
    return sorted(out, key=lambda x: x["mastery"], reverse=True)


def weakest_topic(mastery):
    return min(mastery, key=lambda m: m["mastery"]) if mastery else None


def score_distribution(quiz_rows):
    buckets = {"0-49": 0, "50-69": 0, "70-79": 0, "80-89": 0, "90-100": 0}
    for r in quiz_rows:
        s = r["score"]
        k = "0-49" if s < 50 else "50-69" if s < 70 else "70-79" if s < 80 else "80-89" if s < 90 else "90-100"
        buckets[k] += 1
    return buckets


if __name__ == "__main__":
    sample = [
        {"topic": "Recursion", "score": 80}, {"topic": "Recursion", "score": 60},
        {"topic": "Genetic Algorithms", "score": 92}, {"topic": "Sorting", "score": 45},
        {"topic": "Sorting", "score": 55},
    ]
    m = mastery_by_topic(sample)
    print("Mastery by topic:", m)
    print("Weakest (focus area):", weakest_topic(m))
    print("Score distribution:", score_distribution(sample))
