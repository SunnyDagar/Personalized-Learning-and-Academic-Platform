
def _require_positive(value: float, name: str) -> None:
    """Raise an error when a required input is zero or negative."""
    if value <= 0:
        raise ValueError(f"{name} must be greater than zero")


def monthly_cost(
    institutions: int,
    ai_cost: float = 120,
    infra_cost: float = 80,
    support_cost: float = 50,
):
    """Calculate monthly operating cost."""

    _require_positive(institutions, "institutions")
    _require_positive(ai_cost, "ai_cost")
    _require_positive(infra_cost, "infra_cost")
    _require_positive(support_cost, "support_cost")

    return institutions * (
        ai_cost
        + infra_cost
        + support_cost
    )


def break_even(
    price_per_year: float,
    fixed_cost_year: float,
    variable_cost_year_per_inst: float,
):
    """
    Calculate the number of institutions required to break even.

    Break-even =
    fixed cost / (price per institution - variable cost)
    """

    _require_positive(price_per_year, "price_per_year")
    _require_positive(fixed_cost_year, "fixed_cost_year")
    _require_positive(
        variable_cost_year_per_inst,
        "variable_cost_year_per_inst",
    )

    contribution_margin = (
        price_per_year
        - variable_cost_year_per_inst
    )

    if contribution_margin <= 0:
        raise ValueError(
            "price_per_year must be greater than "
            "variable_cost_year_per_inst"
        )

    return round(
        fixed_cost_year / contribution_margin,
        1,
    )


def risk_weighted_value(
    base_value: float,
    risks: list[tuple[float, float]],
):
    """
    Calculate value after expected risk loss.

    Each risk contains:
    (probability, impact_fraction)
    """

    _require_positive(base_value, "base_value")

    if not risks:
        raise ValueError("risks cannot be empty")

    for probability, impact in risks:
        if probability < 0 or probability > 1:
            raise ValueError(
                "risk probability must be between 0 and 1"
            )

        if impact < 0 or impact > 1:
            raise ValueError(
                "risk impact must be between 0 and 1"
            )

    expected_loss_rate = sum(
        probability * impact
        for probability, impact in risks
    )

    expected_loss = expected_loss_rate * base_value

    return round(base_value - expected_loss, 2)


if __name__ == "__main__":
    print(
        "Monthly cost at 5 institutions:",
        monthly_cost(5),
    )

    print(
        "Break-even institutions:",
        break_even(
            price_per_year=12000,
            fixed_cost_year=60000,
            variable_cost_year_per_inst=3000,
        ),
    )

    risks = [
        (0.30, 0.10),
        (0.25, 0.08),
        (0.20, 0.12),
        (0.15, 0.05),
    ]

    print(
        "Risk-weighted annual value:",
        risk_weighted_value(60000, risks),
    )