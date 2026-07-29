"""
Business engine — one-shot summary report (Hafsa Shabbeer, slides 17+).

Ties pricing_tiers.py (price side), risk_cost.py (cost/risk side), and unit_economics.py
(margin/LTV side) into the single "Numbers at a glance" report used for the demo and to
sanity-check business_model_canvas.md against the live code. Standard library only.

    python3 business_summary.py
"""
from pricing_tiers import TIERS, cost_per_seat, revenue_mix
from risk_cost import monthly_cost, break_even, risk_weighted_value
from unit_economics import unit_economics, customer_lifetime_value, net_revenue_retention

YEAR1_BOOK = [
    ("Department", []),
    ("Department", ["advanced_analytics"]),
    ("Campus", ["advanced_analytics", "ai_assessment_suite"]),
]

# colour-factor risks from the prof feedback: LMS overlap, faculty resistance, privacy, IP
RISKS = [(0.30, 0.10), (0.25, 0.08), (0.20, 0.12), (0.15, 0.05)]


def build_summary():
    mix = revenue_mix(YEAR1_BOOK)
    ue = unit_economics(price_per_institution_year=12000, ai_cost_month=120,
                        infra_cost_month=80, institutions=mix["customers"])
    return {
        "tiers": {name: {"price": price, "seats": seats, "per_seat": cost_per_seat(name)}
                 for name, (price, seats, _) in TIERS.items()},
        "year1_mix": mix,
        "unit_economics": ue,
        "monthly_cost_per_tenant": monthly_cost(1),
        "break_even_institutions": break_even(12000, 60000, 3000),
        "risk_weighted_value": risk_weighted_value(60000, RISKS),
        "ltv_department": customer_lifetime_value(12000, ue["gross_margin_pct"], 10),
        "nrr_year1_to_year2": net_revenue_retention(83000, 25000, 8300),
    }


def print_summary(s):
    print("=== Numbers at a glance (live from code) ===\n")
    print("Tier pricing")
    for name, t in s["tiers"].items():
        print(f"  {name:<11} ${t['price']:>7,}/yr  {t['seats']:>6,} seats  ${t['per_seat']:>5}/seat")

    print(f"\nYear-1 book of business ({s['year1_mix']['customers']} customers)")
    for tier, amount in s["year1_mix"]["by_tier"].items():
        print(f"  {tier:<11} ${amount:,}")
    print(f"  TOTAL       ${s['year1_mix']['total_annual']:,}/yr")

    print(f"\nGross margin @ Year-1 scale: {s['unit_economics']['gross_margin_pct']}%")
    print(f"Operating cost: ${s['monthly_cost_per_tenant']}/tenant/month")
    print(f"Break-even: ~{s['break_even_institutions']} institutions")
    print(f"Risk-weighted value (base $60k): ${s['risk_weighted_value']:,}")
    print(f"Department-tier customer LTV (10% churn): ${s['ltv_department']:,}")
    print(f"Net revenue retention (Year 1 -> Year 2 base): {s['nrr_year1_to_year2']}%")


if __name__ == "__main__":
    print_summary(build_summary())
