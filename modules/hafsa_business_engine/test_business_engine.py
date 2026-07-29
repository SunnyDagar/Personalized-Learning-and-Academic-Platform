"""
Tests for the business-engine calculators (Hafsa Shabbeer, slides 17+).
Standard library only — the numbers here back the figures in business_model_canvas.md
and Section 1.4/1.8 of the final report, so a regression here should fail loudly.

    python3 -m unittest test_business_engine -v
"""
import unittest

from unit_economics import unit_economics, forecast_12mo, customer_lifetime_value, \
    net_revenue_retention
from pricing_tiers import tier_price, cost_per_seat, revenue_mix
from risk_cost import monthly_cost, break_even, risk_weighted_value


class TestUnitEconomics(unittest.TestCase):
    def test_gross_margin(self):
        ue = unit_economics(price_per_institution_year=12000, ai_cost_month=120,
                            infra_cost_month=80, institutions=5)
        self.assertEqual(ue["annual_revenue"], 60000)
        self.assertEqual(ue["gross_margin_pct"], 80.0)

    def test_zero_revenue_does_not_divide_by_zero(self):
        ue = unit_economics(price_per_institution_year=0, ai_cost_month=10,
                            infra_cost_month=10, institutions=1)
        self.assertEqual(ue["gross_margin_pct"], 0)

    def test_forecast_first_and_last_month(self):
        rows = forecast_12mo(2, 0.15, 12000)
        self.assertEqual(len(rows), 12)
        self.assertEqual(rows[0], (1, 2.0, 2000.0))
        self.assertAlmostEqual(rows[-1][1], 9.3, places=1)

    def test_ltv_scales_inversely_with_churn(self):
        low_churn = customer_lifetime_value(12000, 80, 5)
        high_churn = customer_lifetime_value(12000, 80, 20)
        self.assertGreater(low_churn, high_churn)

    def test_ltv_undefined_at_zero_churn(self):
        self.assertIsNone(customer_lifetime_value(12000, 80, 0))

    def test_nrr_above_100_when_expansion_beats_churn(self):
        nrr = net_revenue_retention(start_of_year_revenue=83000, expansion_revenue=25000,
                                    churned_revenue=8300)
        self.assertGreater(nrr, 100)


class TestPricingTiers(unittest.TestCase):
    def test_base_tier_price(self):
        self.assertEqual(tier_price("Department"), 12000)

    def test_tier_price_with_addons(self):
        self.assertEqual(tier_price("Department", ["advanced_analytics"]), 16000)

    def test_unknown_tier_raises(self):
        with self.assertRaises(ValueError):
            tier_price("NotATier")

    def test_unknown_addon_raises(self):
        with self.assertRaises(ValueError):
            tier_price("Department", ["not_a_real_addon"])

    def test_cost_per_seat(self):
        self.assertEqual(cost_per_seat("Campus"), 9.0)

    def test_revenue_mix_totals(self):
        book = [("Department", []), ("Campus", ["advanced_analytics"])]
        mix = revenue_mix(book)
        self.assertEqual(mix["customers"], 2)
        self.assertEqual(mix["total_annual"], 12000 + 45000 + 4000)


class TestRiskCost(unittest.TestCase):
    def test_monthly_cost_scales_with_institutions(self):
        self.assertEqual(monthly_cost(5), 5 * (120 + 80 + 50))

    def test_break_even_positive_margin(self):
        result = break_even(price_per_year=12000, fixed_cost_year=60000,
                            variable_cost_year_per_inst=3000)
        self.assertAlmostEqual(result, 6.7, places=1)

    def test_break_even_none_when_margin_not_positive(self):
        result = break_even(price_per_year=3000, fixed_cost_year=60000,
                            variable_cost_year_per_inst=3000)
        self.assertIsNone(result)

    def test_risk_weighted_value_reduces_base(self):
        risks = [(0.30, 0.10), (0.25, 0.08)]
        value = risk_weighted_value(60000, risks)
        self.assertLess(value, 60000)


if __name__ == "__main__":
    unittest.main()
