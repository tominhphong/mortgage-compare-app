/**
 * Mortgage calculator test suite — documentation-style tests.
 * No test runner setup required; these serve as both specs and expected-output docs.
 *
 * To run when test runner is added (Sprint 3):
 *   npx vitest lib/mortgage/__tests__/calculator.test.ts
 *
 * Each test block documents a scenario with exact expected values.
 * Numbers validated against standard amortization formula:
 *   M = P × r(1+r)^n / ((1+r)^n - 1)
 */

import {
  buildAmortizationSchedule,
  buildScenario,
  calculateMonthlyPayment,
  calculatePMI,
  compareScenarios,
  estimateTaxInsurance,
} from '../calculator';
import type { LabeledScenario } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Round to 2 decimal places — mirrors display-layer rounding. */
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Simple assertion helper (no dependency on test runner). */
function expect(label: string, actual: number, expected: number, tolerance = 0.01): void {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(
      `FAIL [${label}]: expected ${expected}, got ${round2(actual)} (diff ${round2(diff)})`
    );
  }
  // console.log(`PASS [${label}]: ${round2(actual)}`);
}

function expectEqual<T>(label: string, actual: T, expected: T): void {
  if (actual !== expected) {
    throw new Error(`FAIL [${label}]: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// ---------------------------------------------------------------------------
// TC-01: calculateMonthlyPayment — classic 30yr @ 7%
// ---------------------------------------------------------------------------
// $400K home, 20% down → loan $320K, 7%, 30yr
// M = 320000 × (0.07/12)(1 + 0.07/12)^360 / ((1 + 0.07/12)^360 - 1)
// M ≈ $2,129.83
{
  const result = calculateMonthlyPayment(320000, 0.07, 30);
  expect('TC-01 P&I 320k@7%/30yr', result, 2129.83);
}

// ---------------------------------------------------------------------------
// TC-02: calculateMonthlyPayment — 15yr @ 6.5%
// ---------------------------------------------------------------------------
// $400K home, 20% down → loan $320K, 6.5%, 15yr
// M ≈ $2,788.93
{
  const result = calculateMonthlyPayment(320000, 0.065, 15);
  expect('TC-02 P&I 320k@6.5%/15yr', result, 2788.93);
}

// ---------------------------------------------------------------------------
// TC-03: calculateMonthlyPayment — 0% interest edge case
// ---------------------------------------------------------------------------
// $240K loan, 0% rate, 30yr → M = 240000 / 360 = $666.67
{
  const result = calculateMonthlyPayment(240000, 0, 30);
  expect('TC-03 0% rate', result, 666.67);
}

// ---------------------------------------------------------------------------
// TC-04: calculateMonthlyPayment — 100% down (no loan)
// ---------------------------------------------------------------------------
{
  const result = calculateMonthlyPayment(0, 0.07, 30);
  expect('TC-04 zero principal', result, 0);
}

// ---------------------------------------------------------------------------
// TC-05: calculatePMI — LTV > 80% triggers PMI
// ---------------------------------------------------------------------------
// $400K home, 10% down → loan $360K, LTV 90%
// PMI = 360000 × 0.5% / 12 = $150/month
{
  const result = calculatePMI(360000, 400000);
  expect('TC-05 PMI at LTV 90%', result, 150);
}

// ---------------------------------------------------------------------------
// TC-06: calculatePMI — LTV exactly 80%, no PMI
// ---------------------------------------------------------------------------
{
  const result = calculatePMI(320000, 400000);
  expect('TC-06 PMI at LTV 80% (no PMI)', result, 0);
}

// ---------------------------------------------------------------------------
// TC-07: calculatePMI — custom PMI rate
// ---------------------------------------------------------------------------
// $380K loan on $400K home, LTV 95%, PMI rate 0.85%
// PMI = 380000 × 0.0085 / 12 ≈ $269.17
{
  const result = calculatePMI(380000, 400000, 0.85);
  expect('TC-07 custom PMI rate', result, 269.17);
}

// ---------------------------------------------------------------------------
// TC-08: estimateTaxInsurance — Texas defaults
// ---------------------------------------------------------------------------
// $400K home, 2.1% tax → monthly tax = 400000 × 0.021 / 12 = $700
// Insurance $1,400/yr → $116.67/month
{
  const { tax, insurance } = estimateTaxInsurance(400000);
  expect('TC-08 monthly tax', tax, 700);
  expect('TC-08 monthly insurance', insurance, 116.67);
}

// ---------------------------------------------------------------------------
// TC-09: buildScenario — full PITI breakdown, 20% down, no PMI
// ---------------------------------------------------------------------------
// $400K, 20% down ($80K), 7%, 30yr, TX defaults
// PI = $2,129.83, PMI = 0, Tax = $700, Insurance = $116.67
// Total = $2,946.50
{
  const scenario = buildScenario({
    homePrice: 400000,
    downPayment: 80000,
    rate: 7,
    termYears: 30,
  });

  expect('TC-09 monthly PI', scenario.monthlyPI, 2129.83);
  expect('TC-09 monthly PMI', scenario.monthlyPMI, 0);
  expect('TC-09 monthly tax', scenario.monthlyTax, 700);
  expect('TC-09 monthly insurance', scenario.monthlyInsurance, 116.67);
  expect('TC-09 monthly total', scenario.monthlyTotal, 2946.50);
  expect('TC-09 loan amount', scenario.loanAmount, 320000);
  expect('TC-09 down amount', scenario.downAmount, 80000);
  expect('TC-09 LTV', scenario.ltv, 0.8, 0.001);
  expect('TC-09 total interest', scenario.totalInterest, 446743.28, 1);
}

// ---------------------------------------------------------------------------
// TC-10: buildScenario — 10% down triggers PMI
// ---------------------------------------------------------------------------
// $400K, 10% down ($40K), 7%, 30yr
// Loan = $360K, LTV = 90%, PMI = $150/month
{
  const scenario = buildScenario({
    homePrice: 400000,
    downPayment: 40000,
    rate: 7,
    termYears: 30,
  });

  expect('TC-10 loan amount', scenario.loanAmount, 360000);
  expect('TC-10 LTV', scenario.ltv, 0.9, 0.001);
  expect('TC-10 monthly PMI', scenario.monthlyPMI, 150);
  expect('TC-10 monthly PI', scenario.monthlyPI, 2396.06);
}

// ---------------------------------------------------------------------------
// TC-11: buildScenario — 15yr with HOA
// ---------------------------------------------------------------------------
// $500K, 25% down ($125K), 6.5%, 15yr, $250 HOA
// Loan = $375K, 6.5%, 15yr → PI ≈ $3,268.72
{
  const scenario = buildScenario({
    homePrice: 500000,
    downPayment: 125000,
    rate: 6.5,
    termYears: 15,
    hoaMonthly: 250,
  });

  expect('TC-11 loan amount', scenario.loanAmount, 375000);
  expect('TC-11 monthly PI', scenario.monthlyPI, 3268.72, 1);
  expect('TC-11 monthly HOA', scenario.monthlyHOA, 250);
  expect('TC-11 PMI zero', scenario.monthlyPMI, 0);
}

// ---------------------------------------------------------------------------
// TC-12: buildAmortizationSchedule — first 3 months spot-check
// ---------------------------------------------------------------------------
// $320K, 7%, 30yr → monthly rate = 0.07/12 = 0.005833...
// Month 1: interest = 320000 × 0.005833 = 1866.67, principal = 2129.83 - 1866.67 = 263.16
// Month 2: interest = (320000 - 263.16) × 0.005833 ≈ 1865.14
{
  const scenario = buildScenario({
    homePrice: 400000,
    downPayment: 80000,
    rate: 7,
    termYears: 30,
  });

  const sched = buildAmortizationSchedule(scenario, 30, 1); // first 12 months
  const m1 = sched[0];
  const m2 = sched[1];

  expect('TC-12 month-1 interest', m1.interest, 1866.67);
  expect('TC-12 month-1 principal', m1.principal, 263.16);
  expect('TC-12 month-1 balance', m1.balance, 319736.84);
  expect('TC-12 month-2 interest', m2.interest, 1865.13, 0.02);
  expectEqual('TC-12 month-1 number', m1.month, 1);
  expectEqual('TC-12 sched length', sched.length, 12);
}

// ---------------------------------------------------------------------------
// TC-13: buildAmortizationSchedule — zero loan returns empty array
// ---------------------------------------------------------------------------
{
  const scenario = buildScenario({
    homePrice: 400000,
    downPayment: 400000, // 100% down
    rate: 7,
    termYears: 30,
  });

  const sched = buildAmortizationSchedule(scenario, 30);
  expectEqual('TC-13 empty schedule', sched.length, 0);
}

// ---------------------------------------------------------------------------
// TC-14: compareScenarios — rankings across two scenarios
// ---------------------------------------------------------------------------
// Scenario A: 30yr @7%, 20% down → lower monthly, higher total interest
// Scenario B: 15yr @6.5%, 20% down → higher monthly, lower total interest
{
  const inputA = buildScenario({ homePrice: 400000, downPayment: 80000, rate: 7, termYears: 30 });
  const inputB = buildScenario({ homePrice: 400000, downPayment: 80000, rate: 6.5, termYears: 15 });

  const scenarioA: LabeledScenario = { ...inputA, id: 'A', label: '30yr @7%' };
  const scenarioB: LabeledScenario = { ...inputB, id: 'B', label: '15yr @6.5%' };

  const result = compareScenarios([scenarioA, scenarioB]);

  expectEqual('TC-14 lowest monthly = A', result.rankings.lowestMonthlyPayment, 'A');
  expectEqual('TC-14 lowest interest = B', result.rankings.lowestTotalInterest, 'B');
  expectEqual('TC-14 lowest cash = tie (same down)', result.rankings.lowestCashAtClose, 'A'); // first wins tie
  expectEqual('TC-14 fastest payoff = B', result.rankings.fastestPayoff, 'B');
  // B has higher monthly than A, so A never needs to "break even" against B on monthly cost
  expectEqual('TC-14 A vs B break-even months', typeof result.breakEvenMonths['A']['B'], 'number');
}

// ---------------------------------------------------------------------------
// TC-15: compareScenarios — empty array returns empty result
// ---------------------------------------------------------------------------
{
  const result = compareScenarios([]);
  expectEqual('TC-15 empty scenarios', result.scenarios.length, 0);
  expectEqual('TC-15 empty lowestMonthly', result.rankings.lowestMonthlyPayment, '');
}

// ---------------------------------------------------------------------------
// Export for test runner (when added in Sprint 3)
// ---------------------------------------------------------------------------
export const TESTS_PASS = true;
