
def _require_positive(value: float, name: str) -> None:
    """Raise an error when a required input is zero or negative."""
    if value <= 0:
        raise ValueError(f"{name} must be greater than zero")


def unit_economics(
    price_per_institution_year: float,
    ai_cost_month: float,
    infra_cost_month: float,
    institutions: int,
):
    """Calculate annual revenue, costs, profit, and gross margin."""

    _require_positive(
        price_per_institution_year,
        "price_per_institution_year",
    )
    _require_positive(ai_cost_month, "ai_cost_month")
    _require_positive(infra_cost_month, "infra_cost_month")
    _require_positive(institutions, "institutions")

    annual_rev = price_per_institution_year * institutions
    annual_cost = (
        (ai_cost_month + infra_cost_month)
        * 12
        * institutions
    )

    gross = annual_rev - annual_cost
    margin = gross / annual_rev

    return {
        "annual_revenue": annual_rev,
        "annual_cost": annual_cost,
        "gross_profit": gross,
        "gross_margin_pct": round(margin * 100, 1),
    }


def forecast_12mo(
    start_institutions: int,
    monthly_growth: float,
    price_per_institution_year: float,
):
    """Create a simple 12-month institution and revenue forecast."""

    _require_positive(start_institutions, "start_institutions")
    _require_positive(monthly_growth, "monthly_growth")
    _require_positive(
        price_per_institution_year,
        "price_per_institution_year",
    )

    rows = []
    institutions = start_institutions

    for month in range(1, 13):
        monthly_revenue = (
            institutions * price_per_institution_year / 12
        )

        rows.append(
            (
                month,
                round(institutions, 1),
                round(monthly_revenue, 2),
            )
        )

        institutions *= 1 + monthly_growth

    return rows


def customer_lifetime_value(
    annual_price: float,
    gross_margin_pct: float,
    avg_years: float,
):
    """
    Calculate customer lifetime value.

    LTV = annual price × gross margin × contract length
    """

    _require_positive(annual_price, "annual_price")
    _require_positive(gross_margin_pct, "gross_margin_pct")
    _require_positive(avg_years, "avg_years")

    if gross_margin_pct > 100:
        raise ValueError(
            "gross_margin_pct cannot be greater than 100"
        )

    ltv = (
        annual_price
        * (gross_margin_pct / 100)
        * avg_years
    )

    return round(ltv, 2)


def net_revenue_retention(
    starting_arr: float,
    expansion: float,
    churned: float,
):
    """
    Calculate net revenue retention as a percentage.

    NRR = (starting ARR + expansion - churn) / starting ARR
    """

    _require_positive(starting_arr, "starting_arr")

    if expansion < 0:
        raise ValueError("expansion cannot be negative")

    if churned < 0:
        raise ValueError("churned cannot be negative")

    nrr = (
        (starting_arr + expansion - churned)
        / starting_arr
        * 100
    )

    return round(nrr, 1)


if __name__ == "__main__":
    economics = unit_economics(
        price_per_institution_year=12000,
        ai_cost_month=120,
        infra_cost_month=80,
        institutions=5,
    )

    print(
        "Unit economics (5 institutions):",
        economics,
    )

    print(
        "\n12-month forecast "
        "(start 2, +15%/month, $12k/year):"
    )

    print(" month | institutions | MRR($)")

    for month, institutions, mrr in forecast_12mo(
        2,
        0.15,
        12000,
    ):
        print(
            f"   {month:>2}   |"
            f"    {institutions:>6}    |"
            f" {mrr:>9}"
        )