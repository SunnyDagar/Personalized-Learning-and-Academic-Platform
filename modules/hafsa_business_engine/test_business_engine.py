import pytest

from unit_economics import (
    customer_lifetime_value,
    unit_economics,
)

from risk_cost import (
    break_even,
    monthly_cost,
)



def test_unit_economics_calculates_margin_correctly():
    result = unit_economics(
        price_per_institution_year=12000,
        ai_cost_month=120,
        infra_cost_month=80,
        institutions=5,
    )

    assert result["annual_revenue"] == 60000
    assert result["annual_cost"] == 12000
    assert result["gross_profit"] == 48000
    assert result["gross_margin_pct"] == 80.0


def test_unit_economics_rejects_zero_price():
    with pytest.raises(
        ValueError,
        match="price_per_institution_year",
    ):
        unit_economics(
            price_per_institution_year=0,
            ai_cost_month=120,
            infra_cost_month=80,
            institutions=5,
        )


def test_unit_economics_rejects_zero_institutions():
    with pytest.raises(
        ValueError,
        match="institutions",
    ):
        unit_economics(
            price_per_institution_year=12000,
            ai_cost_month=120,
            infra_cost_month=80,
            institutions=0,
        )


def test_unit_economics_rejects_negative_cost():
    with pytest.raises(
        ValueError,
        match="ai_cost_month",
    ):
        unit_economics(
            price_per_institution_year=12000,
            ai_cost_month=-120,
            infra_cost_month=80,
            institutions=5,
        )


def test_break_even_calculates_correctly():
    result = break_even(
        price_per_year=12000,
        fixed_cost_year=60000,
        variable_cost_year_per_inst=3000,
    )

    assert result == 6.7


def test_break_even_rejects_divide_by_zero():
    with pytest.raises(
        ValueError,
        match="price_per_year must be greater",
    ):
        break_even(
            price_per_year=3000,
            fixed_cost_year=60000,
            variable_cost_year_per_inst=3000,
        )


def test_break_even_rejects_negative_margin():
    with pytest.raises(
        ValueError,
        match="price_per_year must be greater",
    ):
        break_even(
            price_per_year=2000,
            fixed_cost_year=60000,
            variable_cost_year_per_inst=3000,
        )


def test_break_even_rejects_zero_fixed_cost():
    with pytest.raises(
        ValueError,
        match="fixed_cost_year",
    ):
        break_even(
            price_per_year=12000,
            fixed_cost_year=0,
            variable_cost_year_per_inst=3000,
        )



def test_customer_lifetime_value_calculates_correctly():
    result = customer_lifetime_value(
        annual_price=12000,
        gross_margin_pct=80,
        avg_years=3,
    )

    assert result == 28800.00


def test_customer_lifetime_value_rejects_zero_years():
    with pytest.raises(
        ValueError,
        match="avg_years",
    ):
        customer_lifetime_value(
            annual_price=12000,
            gross_margin_pct=80,
            avg_years=0,
        )


def test_customer_lifetime_value_rejects_negative_price():
    with pytest.raises(
        ValueError,
        match="annual_price",
    ):
        customer_lifetime_value(
            annual_price=-12000,
            gross_margin_pct=80,
            avg_years=3,
        )


def test_customer_lifetime_value_rejects_margin_over_100():
    with pytest.raises(
        ValueError,
        match="cannot be greater than 100",
    ):
        customer_lifetime_value(
            annual_price=12000,
            gross_margin_pct=110,
            avg_years=3,
        )


def test_monthly_cost_calculates_correctly():
    result = monthly_cost(
        institutions=5,
        ai_cost=120,
        infra_cost=80,
        support_cost=50,
    )

    assert result == 1250


def test_monthly_cost_rejects_zero_institutions():
    with pytest.raises(
        ValueError,
        match="institutions",
    ):
        monthly_cost(institutions=0)


def test_monthly_cost_rejects_negative_support_cost():
    with pytest.raises(
        ValueError,
        match="support_cost",
    ):
        monthly_cost(
            institutions=5,
            support_cost=-50,
        )