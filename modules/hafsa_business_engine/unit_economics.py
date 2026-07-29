"""
Institutional SaaS unit-economics + 12-month forecast (stdlib only).
Model: institutions pay an annual licence; monthly infra + AI cost per institution.
"""

def unit_economics(price_per_institution_year: float, ai_cost_month: float,
                   infra_cost_month: float, institutions: int):
    annual_rev = price_per_institution_year * institutions
    annual_cost = (ai_cost_month + infra_cost_month) * 12 * institutions
    gross = annual_rev - annual_cost
    margin = gross / annual_rev if annual_rev else 0
    return {"annual_revenue": annual_rev, "annual_cost": annual_cost,
            "gross_profit": gross, "gross_margin_pct": round(margin * 100, 1)}


def forecast_12mo(start_institutions: int, monthly_growth: float,
                  price_per_institution_year: float):
    rows, n = [], start_institutions
    for m in range(1, 13):
        mrr = n * price_per_institution_year / 12
        rows.append((m, round(n, 1), round(mrr, 2)))
        n *= (1 + monthly_growth)
    return rows


def customer_lifetime_value(annual_price: float, gross_margin_pct: float, avg_years: float):
    """LTV = annual price x gross margin x expected contract length (years)."""
    return round(annual_price * (gross_margin_pct / 100) * avg_years, 2)


def net_revenue_retention(starting_arr: float, expansion: float, churned: float):
    """NRR = (starting + expansion - churn) / starting, as a percentage. >100% means growth
    from the existing base alone."""
    if starting_arr <= 0:
        return 0.0
    return round((starting_arr + expansion - churned) / starting_arr * 100, 1)


if __name__ == "__main__":
    ue = unit_economics(price_per_institution_year=12000, ai_cost_month=120,
                        infra_cost_month=80, institutions=5)
    print("Unit economics (5 institutions):", ue)
    print("\n12-month forecast (start 2, +15%/mo, $12k/yr):")
    print(" month | institutions | MRR($)")
    for m, inst, mrr in forecast_12mo(2, 0.15, 12000):
        print(f"   {m:>2}   |    {inst:>6}    | {mrr:>9}")
