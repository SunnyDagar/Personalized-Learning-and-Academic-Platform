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


def customer_lifetime_value(annual_revenue_per_inst: float, gross_margin_pct: float,
                            annual_churn_pct: float):
    """LTV = (annual revenue x gross margin) / annual churn rate.

    Ties the canvas's 'Net revenue retention' target to a single per-institution number.
    Returns None when churn is 0 (undefined — an institution that never churns has infinite LTV).
    """
    if annual_churn_pct <= 0:
        return None
    return round(annual_revenue_per_inst * (gross_margin_pct / 100) / (annual_churn_pct / 100), 2)


def net_revenue_retention(start_of_year_revenue: float, expansion_revenue: float,
                          churned_revenue: float):
    """NRR% = (start + expansion - churn) / start. >100% means expansion outpaces churn."""
    if start_of_year_revenue <= 0:
        return None
    nrr = (start_of_year_revenue + expansion_revenue - churned_revenue) / start_of_year_revenue
    return round(nrr * 100, 1)


if __name__ == "__main__":
    ue = unit_economics(price_per_institution_year=12000, ai_cost_month=120,
                        infra_cost_month=80, institutions=5)
    print("Unit economics (5 institutions):", ue)
    print("\n12-month forecast (start 2, +15%/mo, $12k/yr):")
    print(" month | institutions | MRR($)")
    for m, inst, mrr in forecast_12mo(2, 0.15, 12000):
        print(f"   {m:>2}   |    {inst:>6}    | {mrr:>9}")

    # canvas assumption: ~90% annual retention -> 10% churn; Department tier, 80% margin
    ltv = customer_lifetime_value(annual_revenue_per_inst=12000, gross_margin_pct=80,
                                  annual_churn_pct=10)
    print(f"\nCustomer LTV (Department tier, 80% margin, 10% annual churn): ${ltv:,}")

    # Year-2 book ($240k) with ~40% add-on attach expanding existing accounts, 10% churned
    nrr = net_revenue_retention(start_of_year_revenue=83000, expansion_revenue=25000,
                                churned_revenue=8300)
    print(f"Net revenue retention (Year 1 -> Year 2 base): {nrr}%")
