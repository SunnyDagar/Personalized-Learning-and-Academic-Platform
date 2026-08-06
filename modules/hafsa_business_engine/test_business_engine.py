"""
Tests for the business engine — Hafsa Shabbeer (slides 17–end).

Covers the four calculators: unit economics, break-even, customer lifetime value and monthly cost.
Every calculator is checked for a correct result and for the input guards, including the
divide-by-zero cases that would otherwise fail silently.

Standard library only — no pytest, so it runs on a clean machine with no install step.

    python3 -m unittest discover -p 'test_*.py'
"""
import unittest

from unit_economics import (
    customer_lifetime_value,
    unit_economics,
)

from risk_cost import (
    break_even,
    monthly_cost,
)


class TestUnitEconomics(unittest.TestCase):

    def test_unit_economics_calculates_margin_correctly(self):
        result = unit_economics(
            price_per_institution_year=12000,
            ai_cost_month=120,
            infra_cost_month=80,
            institutions=5,
        )

        self.assertEqual(result["annual_revenue"], 60000)
        self.assertEqual(result["annual_cost"], 12000)
        self.assertEqual(result["gross_profit"], 48000)
        self.assertEqual(result["gross_margin_pct"], 80.0)

    def test_unit_economics_rejects_zero_price(self):
        with self.assertRaisesRegex(ValueError, "price_per_institution_year"):
            unit_economics(
                price_per_institution_year=0,
                ai_cost_month=120,
                infra_cost_month=80,
                institutions=5,
            )

    def test_unit_economics_rejects_zero_institutions(self):
        with self.assertRaisesRegex(ValueError, "institutions"):
            unit_economics(
                price_per_institution_year=12000,
                ai_cost_month=120,
                infra_cost_month=80,
                institutions=0,
            )

    def test_unit_economics_rejects_negative_cost(self):
        with self.assertRaisesRegex(ValueError, "ai_cost_month"):
            unit_economics(
                price_per_institution_year=12000,
                ai_cost_month=-120,
                infra_cost_month=80,
                institutions=5,
            )


class TestBreakEven(unittest.TestCase):

    def test_break_even_calculates_correctly(self):
        result = break_even(
            price_per_year=12000,
            fixed_cost_year=60000,
            variable_cost_year_per_inst=3000,
        )

        self.assertEqual(result, 6.7)

    def test_break_even_rejects_divide_by_zero(self):
        with self.assertRaisesRegex(ValueError, "price_per_year must be greater"):
            break_even(
                price_per_year=3000,
                fixed_cost_year=60000,
                variable_cost_year_per_inst=3000,
            )

    def test_break_even_rejects_negative_margin(self):
        with self.assertRaisesRegex(ValueError, "price_per_year must be greater"):
            break_even(
                price_per_year=2000,
                fixed_cost_year=60000,
                variable_cost_year_per_inst=3000,
            )

    def test_break_even_rejects_zero_fixed_cost(self):
        with self.assertRaisesRegex(ValueError, "fixed_cost_year"):
            break_even(
                price_per_year=12000,
                fixed_cost_year=0,
                variable_cost_year_per_inst=3000,
            )


class TestCustomerLifetimeValue(unittest.TestCase):

    def test_customer_lifetime_value_calculates_correctly(self):
        result = customer_lifetime_value(
            annual_price=12000,
            gross_margin_pct=80,
            avg_years=3,
        )

        self.assertEqual(result, 28800.00)

    def test_customer_lifetime_value_rejects_zero_years(self):
        with self.assertRaisesRegex(ValueError, "avg_years"):
            customer_lifetime_value(
                annual_price=12000,
                gross_margin_pct=80,
                avg_years=0,
            )

    def test_customer_lifetime_value_rejects_negative_price(self):
        with self.assertRaisesRegex(ValueError, "annual_price"):
            customer_lifetime_value(
                annual_price=-12000,
                gross_margin_pct=80,
                avg_years=3,
            )

    def test_customer_lifetime_value_rejects_margin_over_100(self):
        with self.assertRaisesRegex(ValueError, "cannot be greater than 100"):
            customer_lifetime_value(
                annual_price=12000,
                gross_margin_pct=110,
                avg_years=3,
            )


class TestMonthlyCost(unittest.TestCase):

    def test_monthly_cost_calculates_correctly(self):
        result = monthly_cost(
            institutions=5,
            ai_cost=120,
            infra_cost=80,
            support_cost=50,
        )

        self.assertEqual(result, 1250)

    def test_monthly_cost_rejects_zero_institutions(self):
        with self.assertRaisesRegex(ValueError, "institutions"):
            monthly_cost(institutions=0)

    def test_monthly_cost_rejects_negative_support_cost(self):
        with self.assertRaisesRegex(ValueError, "support_cost"):
            monthly_cost(
                institutions=5,
                support_cost=-50,
            )


if __name__ == "__main__":
    unittest.main(verbosity=2)
