"""
Institutional pricing tiers & revenue mix — business engine (Hafsa Shabbeer, slides 17+).

Complements unit_economics.py (margin/break-even) and risk_cost.py (cost & risk) by modelling the
*price side*: what an institution pays, how tiers stack, and what a mixed customer base yields.

Assumptions match Section 1.8 of the final report — if you change them here, update the report too.
Standard library only

    python pricing_tiers.py
"""

# tier -> (annual licence CAD, seats included, description)
TIERS = {
    "Department": (12_000, 500,  "One department/faculty; core AI assistant + analytics"),
    "Campus":     (45_000, 5_000, "Whole institution; adds SSO/LMS integration"),
    "Enterprise": (90_000, 20_000, "Multi-campus; adds SLA, priority support, custom reporting"),
}

# paid add-ons (annual, CAD) — the "Pro / Institutional" features
ADDONS = {
    "advanced_analytics":  4_000,   # cohort insights, predictive at-risk
    "ai_assessment_suite": 6_000,   # AI test generation + human-in-the-loop grading at scale
    "priority_support":    3_000,
}


def tier_price(tier, addons=()):
    """Annual price for a tier plus any add-ons."""
    if tier not in TIERS:
        raise ValueError(f"unknown tier {tier!r}; choose from {list(TIERS)}")
    base = TIERS[tier][0]
    return base + sum(ADDONS[a] for a in addons)


def cost_per_seat(tier):
    """Headline cost per enrolled seat — the number a procurement officer asks for."""
    price, seats, _ = TIERS[tier]
    return round(price / seats, 2)


def revenue_mix(customers):
    """customers: list of (tier, [addons]). Returns totals and the per-tier breakdown."""
    breakdown, total = {}, 0
    for tier, addons in customers:
        p = tier_price(tier, addons)
        breakdown[tier] = breakdown.get(tier, 0) + p
        total += p
    return {"total_annual": total,
            "mrr": round(total / 12, 2),
            "by_tier": breakdown,
            "customers": len(customers)}


if __name__ == "__main__":
    print("Tier pricing")
    for name, (price, seats, desc) in TIERS.items():
        print(f"  {name:<11} ${price:>7,}/yr  {seats:>6,} seats  "
              f"${cost_per_seat(name):>5}/seat  — {desc}")

    print("\nAdd-ons")
    for name, price in ADDONS.items():
        print(f"  {name:<20} ${price:,}/yr")

    # an illustrative year-one book of business
    book = [
        ("Department", []),
        ("Department", ["advanced_analytics"]),
        ("Campus",     ["advanced_analytics", "ai_assessment_suite"]),
    ]
    mix = revenue_mix(book)
    print(f"\nIllustrative year-one mix ({mix['customers']} customers)")
    for tier, amount in mix["by_tier"].items():
        print(f"  {tier:<11} ${amount:,}")
    print(f"  TOTAL       ${mix['total_annual']:,}/yr   (MRR ${mix['mrr']:,})")
