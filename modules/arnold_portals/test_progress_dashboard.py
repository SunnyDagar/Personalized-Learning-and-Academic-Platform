"""
Unit tests for student progress dashboard analytics — Arnold Babu (Day 2).
Run via: python test_progress_dashboard.py
"""

from progress_dashboard import (
    mastery_by_topic,
    weakest_topic,
    score_distribution,
)


def run_dashboard_tests():
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

    # Test 4: Edge Case — Zero Quizzes (New Student with no data)
    assert mastery_by_topic([]) == []
    assert weakest_topic([]) is None
    assert sum(score_distribution([]).values()) == 0
    print("PASSED: Zero quizzes (new student) handling")

    # Test 5: Edge Case — Single Topic
    single_sample = [{"topic": "Arrays", "score": 88}]
    m_single = mastery_by_topic(single_sample)
    assert len(m_single) == 1 and m_single[0]["topic"] == "Arrays"
    assert weakest_topic(m_single)["topic"] == "Arrays"
    print("PASSED: Single topic edge case")

    # Test 6: Edge Case — All-Equal Scores
    equal_sample = [
        {"topic": "Trees", "score": 75},
        {"topic": "Graphs", "score": 75},
    ]
    m_equal = mastery_by_topic(equal_sample)
    assert len(m_equal) == 2
    assert m_equal[0]["mastery"] == 75.0 and m_equal[1]["mastery"] == 75.0
    print("PASSED: All-equal scores handling")

    # Test 7: Out of bounds score clamping
    clamped_sample = [{"topic": "Bounds", "score": 150}, {"topic": "Bounds", "score": -20}]
    clamped_m = mastery_by_topic(clamped_sample)
    assert clamped_m[0]["mastery"] == 50.0
    print("PASSED: Out-of-bounds score clamping")

    print("--- All Progress Dashboard Tests Passed Successfully! ---")


if __name__ == "__main__":
    run_dashboard_tests()