from risk_cost import break_even


def sensitivity_analysis(
    base_price_per_year: float,
    fixed_cost_year: float,
    base_variable_cost_year: float,
) -> list[dict]:
    """Calculate break-even values for ±20% price and cost changes."""

    scenarios = [
        ("Price -20%", base_price_per_year * 0.80, base_variable_cost_year),
        ("Base case", base_price_per_year, base_variable_cost_year),
        ("Price +20%", base_price_per_year * 1.20, base_variable_cost_year),
        ("Cost -20%", base_price_per_year, base_variable_cost_year * 0.80),
        ("Cost +20%", base_price_per_year, base_variable_cost_year * 1.20),
    ]

    results = []

    for scenario, price, variable_cost in scenarios:
        break_even_value = break_even(
            price_per_year=price,
            fixed_cost_year=fixed_cost_year,
            variable_cost_year_per_inst=variable_cost,
        )

        results.append(
            {
                "scenario": scenario,
                "price": round(price, 2),
                "variable_cost": round(variable_cost, 2),
                "break_even": break_even_value,
            }
        )

    return results


def print_sensitivity_table(results: list[dict]) -> None:
    """Print sensitivity results as a small table."""

    print("\nBreak-Even Sensitivity Analysis")
    print("-" * 70)
    print(
        f"{'Scenario':<15}"
        f"{'Annual Price':>15}"
        f"{'Variable Cost':>18}"
        f"{'Break-Even':>15}"
    )
    print("-" * 70)

    for row in results:
        print(
            f"{row['scenario']:<15}"
            f"${row['price']:>14,.2f}"
            f"${row['variable_cost']:>17,.2f}"
            f"{row['break_even']:>15.1f}"
        )

    print("-" * 70)


if __name__ == "__main__":
    sensitivity_results = sensitivity_analysis(
        base_price_per_year=12000,
        fixed_cost_year=60000,
        base_variable_cost_year=3000,
    )

    print_sensitivity_table(sensitivity_results)