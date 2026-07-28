"""
Risk & cost analytics — Hafsa Shabbeer (Slides 17+).

Complements unit_economics.py with a simple risk-weighted cost model and a break-even
calculator for the institutional-SaaS business case. Standard library only, no secrets.

    python risk_cost.py
"""


def monthly_cost(institutions, ai_cost=120, infra_cost=80, support_cost=50):
    """Per-month operating cost that scales with the number of institutions served."""
    return institutions * (ai_cost + infra_cost + support_cost)


def break_even(price_per_year, fixed_cost_year, variable_cost_year_per_inst):
    """Institutions needed per year to cover fixed + variable cost."""
    margin = price_per_year - variable_cost_year_per_inst
    return None if margin <= 0 else round(fixed_cost_year / margin, 1)


def risk_weighted_value(base_value, risks):
    """risks: list of (probability, impact_fraction). Returns value after expected loss."""
    expected_loss = sum(p * impact for p, impact in risks) * base_value
    return round(base_value - expected_loss, 2)


if __name__ == "__main__":
    print("Monthly cost @ 5 institutions:", monthly_cost(5))
    print("Break-even institutions ($12k/yr, $60k fixed, $3k var):",
          break_even(12000, 60000, 3000))
    # colour-factor risks from the prof feedback (LMS overlap, faculty resistance, privacy, IP)
    risks = [(0.30, 0.10), (0.25, 0.08), (0.20, 0.12), (0.15, 0.05)]
    print("Risk-weighted annual value (base $60k):", risk_weighted_value(60000, risks))
