/**
 * Core mortgage math engine — pure functions, no side effects.
 * All monetary inputs/outputs are in USD. Rates are percentages unless noted.
 *
 * Standard amortization formula:
 *   M = P × r(1+r)^n / ((1+r)^n - 1)
 *   where r = monthly rate (annual% / 100 / 12), n = total months
 *
 * Edge cases handled:
 *   - 0% interest rate: M = P / n (equal principal payments)
 *   - 100% down payment: no loan, all values are 0
 *   - Very short terms (1–2 years): formula still applies
 */

import {
  DEFAULT_HOA_MONTHLY,
  DEFAULT_INSURANCE_YEARLY,
  DEFAULT_PMI_RATE_PERCENT,
  DEFAULT_PROPERTY_TAX_RATE_PERCENT,
  MONTHS_PER_YEAR,
  PMI_LTV_THRESHOLD,
} from './constants';
import type {
  AmortizationEntry,
  CompareResult,
  LabeledScenario,
  MortgageInput,
  PaymentBreakdown,
} from './types';

// ---------------------------------------------------------------------------
// Primitive calculators
// ---------------------------------------------------------------------------

/**
 * Calculate the monthly principal + interest payment.
 *
 * @param principal  Loan amount in USD (homePrice - downPayment)
 * @param rateDecimal  Annual interest rate as a decimal (e.g. 0.07 for 7%)
 * @param termYears  Loan term in years
 * @returns Monthly P&I payment in USD (unrounded — round only at display layer)
 *
 * @example
 * calculateMonthlyPayment(320000, 0.07, 30) // → 2129.826...
 */
export function calculateMonthlyPayment(
  principal: number,
  rateDecimal: number,
  termYears: number,
): number {
  if (principal <= 0) return 0;

  const n = termYears * MONTHS_PER_YEAR;

  // Special case: 0% interest — divide principal equally
  if (rateDecimal === 0) {
    return principal / n;
  }

  const r = rateDecimal / MONTHS_PER_YEAR;
  const factor = Math.pow(1 + r, n);
  return (principal * r * factor) / (factor - 1);
}

/**
 * Calculate the monthly PMI (Private Mortgage Insurance) payment.
 * PMI applies only when LTV > 80% (i.e. down payment < 20%).
 *
 * @param loanAmount  Loan amount in USD
 * @param homePrice  Purchase price in USD
 * @param pmiRatePercent  Annual PMI rate as a percentage (default 0.5%)
 * @returns Monthly PMI in USD, or 0 if LTV <= 80%
 *
 * @example
 * calculatePMI(360000, 400000) // LTV 90% → 150 (0.5% of 360k / 12)
 * calculatePMI(320000, 400000) // LTV 80% → 0
 */
export function calculatePMI(
  loanAmount: number,
  homePrice: number,
  pmiRatePercent: number = DEFAULT_PMI_RATE_PERCENT,
): number {
  if (homePrice <= 0 || loanAmount <= 0) return 0;

  const ltv = loanAmount / homePrice;
  if (ltv <= PMI_LTV_THRESHOLD) return 0;

  return (loanAmount * (pmiRatePercent / 100)) / MONTHS_PER_YEAR;
}

/**
 * Estimate monthly property tax and homeowners insurance.
 * Defaults are calibrated for DFW / Grayson County, Texas.
 *
 * @param homePrice  Purchase price in USD
 * @param propertyTaxRatePercent  Annual tax rate as % (default 2.1% for TX)
 * @param insuranceYearly  Annual insurance premium in USD (default $1,400)
 * @returns Object with monthly tax and monthly insurance amounts
 *
 * @example
 * estimateTaxInsurance(400000) // { tax: 700, insurance: 116.67 }
 */
export function estimateTaxInsurance(
  homePrice: number,
  propertyTaxRatePercent: number = DEFAULT_PROPERTY_TAX_RATE_PERCENT,
  insuranceYearly: number = DEFAULT_INSURANCE_YEARLY,
): { tax: number; insurance: number } {
  if (homePrice <= 0) return { tax: 0, insurance: 0 };

  const tax = (homePrice * (propertyTaxRatePercent / 100)) / MONTHS_PER_YEAR;
  const insurance = insuranceYearly / MONTHS_PER_YEAR;
  return { tax, insurance };
}

// ---------------------------------------------------------------------------
// Scenario builder
// ---------------------------------------------------------------------------

/**
 * Build a complete PaymentBreakdown from a MortgageInput.
 * All computed values are unrounded — rounding belongs at the display layer.
 *
 * @param input  MortgageInput describing the scenario
 * @returns Full PaymentBreakdown including monthly components and lifetime totals
 *
 * @example
 * buildScenario({ homePrice: 400000, downPayment: 80000, rate: 7, termYears: 30 })
 * // → { monthlyPI: 2129.83, monthlyPMI: 0, monthlyTax: 700, ... }
 */
export function buildScenario(input: MortgageInput): PaymentBreakdown {
  const {
    homePrice,
    downPayment,
    rate,
    termYears,
    propertyTaxRate = DEFAULT_PROPERTY_TAX_RATE_PERCENT,
    insuranceYearly = DEFAULT_INSURANCE_YEARLY,
    pmiRate = DEFAULT_PMI_RATE_PERCENT,
    hoaMonthly = DEFAULT_HOA_MONTHLY,
  } = input;

  const loanAmount = Math.max(0, homePrice - downPayment);
  const downAmount = Math.min(downPayment, homePrice);
  const ltv = homePrice > 0 ? loanAmount / homePrice : 0;

  const rateDecimal = rate / 100;
  const monthlyPI = calculateMonthlyPayment(loanAmount, rateDecimal, termYears);
  const monthlyPMI = calculatePMI(loanAmount, homePrice, pmiRate);
  const { tax: monthlyTax, insurance: monthlyInsurance } = estimateTaxInsurance(
    homePrice,
    propertyTaxRate,
    insuranceYearly,
  );

  const monthlyTotal = monthlyPI + monthlyPMI + monthlyTax + monthlyInsurance + hoaMonthly;

  const totalMonths = termYears * MONTHS_PER_YEAR;
  const totalPaidPI = monthlyPI * totalMonths;
  const totalInterest = Math.max(0, totalPaidPI - loanAmount);
  const totalPaid = totalPaidPI; // P&I only; tax/insurance are escrow, not loan cost

  // Payoff date: today + termYears years
  const payoffDate = new Date();
  payoffDate.setFullYear(payoffDate.getFullYear() + termYears);

  return {
    monthlyPI,
    monthlyPMI,
    monthlyTax,
    monthlyInsurance,
    monthlyHOA: hoaMonthly,
    monthlyTotal,
    loanAmount,
    downAmount,
    ltv,
    totalInterest,
    totalPaid,
    payoffDate,
  };
}

// ---------------------------------------------------------------------------
// Amortization schedule
// ---------------------------------------------------------------------------

/**
 * Build a full (or partial) amortization schedule for a given scenario.
 * Each entry represents one monthly payment period.
 *
 * @param scenario  PaymentBreakdown from buildScenario
 * @param termYears  Loan term in years (used to derive total months)
 * @param years  Optional: limit output to first N years (default: full term)
 * @returns Array of AmortizationEntry, one per month
 *
 * @example
 * buildAmortizationSchedule(scenario, 30, 5) // first 60 months
 */
export function buildAmortizationSchedule(
  scenario: PaymentBreakdown,
  termYears: number,
  years?: number,
): AmortizationEntry[] {
  const { loanAmount, monthlyPI } = scenario;
  const totalMonths = termYears * MONTHS_PER_YEAR;
  const limitMonths = years != null ? Math.min(years * MONTHS_PER_YEAR, totalMonths) : totalMonths;

  if (loanAmount <= 0) return [];

  // Derive monthly rate from P&I and loan amount (back-calculate from payment)
  // We need the rate — re-derive via Newton's method or accept rate from outside.
  // Since PaymentBreakdown doesn't store rate, we'll work numerically:
  // Use the payment amount and principal to iteratively amortize.
  const schedule: AmortizationEntry[] = [];
  let balance = loanAmount;
  const payment = monthlyPI;

  // Estimate monthly rate from payment formula (Newton-Raphson, converges fast)
  const monthlyRate = deriveMonthlyRate(loanAmount, payment, totalMonths);

  for (let month = 1; month <= limitMonths; month++) {
    const interestPortion = balance * monthlyRate;
    const principalPortion = payment - interestPortion;
    balance = Math.max(0, balance - principalPortion);

    schedule.push({
      month,
      payment,
      principal: principalPortion,
      interest: interestPortion,
      balance,
    });

    if (balance === 0) break;
  }

  return schedule;
}

/**
 * Derive monthly interest rate from loan parameters using Newton-Raphson.
 * Handles 0% rate edge case (returns 0).
 *
 * @param principal  Loan amount
 * @param payment  Monthly P&I payment
 * @param n  Total number of months
 * @returns Monthly interest rate as a decimal
 */
function deriveMonthlyRate(principal: number, payment: number, n: number): number {
  // Edge case: if payment × n ≈ principal, rate is essentially 0
  if (Math.abs(payment * n - principal) < 0.01) return 0;

  // Initial guess: rough approximation
  let r = payment / principal - 1 / n;
  if (r < 0) r = 0.001;

  // Newton-Raphson iterations
  for (let i = 0; i < 100; i++) {
    const factor = Math.pow(1 + r, n);
    const f = principal * r * factor - payment * (factor - 1);
    const fPrime = principal * (factor + r * n * Math.pow(1 + r, n - 1)) - payment * n * Math.pow(1 + r, n - 1);
    const rNext = r - f / fPrime;
    if (Math.abs(rNext - r) < 1e-12) {
      r = rNext;
      break;
    }
    r = rNext;
  }

  return Math.max(0, r);
}

// ---------------------------------------------------------------------------
// Scenario comparison
// ---------------------------------------------------------------------------

/**
 * Compare two or more mortgage scenarios and rank them across key dimensions.
 * Also computes pairwise break-even months between every pair of scenarios.
 *
 * Break-even logic: higher upfront cost (down payment) vs lower monthly payment.
 * breakEvenMonths[A][B] = months until cumulative monthly savings of A vs B
 * offset the additional cash A required at close. Returns Infinity if B always
 * costs more monthly (no break-even needed / A dominates immediately).
 *
 * @param scenarios  Array of LabeledScenario (id + label + breakdown)
 * @returns CompareResult with rankings and pairwise break-even table
 *
 * @example
 * compareScenarios([
 *   { id: 's1', label: '30yr 7%', ...buildScenario(...) },
 *   { id: 's2', label: '15yr 6.5%', ...buildScenario(...) },
 * ])
 */
export function compareScenarios(scenarios: LabeledScenario[]): CompareResult {
  if (scenarios.length === 0) {
    return {
      scenarios: [],
      rankings: {
        lowestMonthlyPayment: '',
        lowestTotalInterest: '',
        lowestCashAtClose: '',
        fastestPayoff: '',
      },
      breakEvenMonths: {},
    };
  }

  // Rankings — find the best scenario for each dimension
  const lowestMonthlyPayment = minBy(scenarios, (s) => s.monthlyTotal);
  const lowestTotalInterest = minBy(scenarios, (s) => s.totalInterest);
  const lowestCashAtClose = minBy(scenarios, (s) => s.downAmount);
  const fastestPayoff = scenarios.reduce((best, s) => {
    if (!s.payoffDate || !best.payoffDate) return best;
    return s.payoffDate < best.payoffDate ? s : best;
  });

  // Pairwise break-even: for each pair (A, B), how many months until A's
  // higher down payment is offset by lower monthly costs vs B?
  const breakEvenMonths: Record<string, Record<string, number>> = {};

  for (const a of scenarios) {
    breakEvenMonths[a.id] = {};
    for (const b of scenarios) {
      if (a.id === b.id) {
        breakEvenMonths[a.id][b.id] = 0;
        continue;
      }

      const extraUpfront = a.downAmount - b.downAmount;
      const monthlySavings = b.monthlyTotal - a.monthlyTotal;

      if (monthlySavings <= 0) {
        // A costs more monthly AND more upfront — never breaks even
        breakEvenMonths[a.id][b.id] = Infinity;
      } else if (extraUpfront <= 0) {
        // A costs less upfront AND less monthly — already ahead
        breakEvenMonths[a.id][b.id] = 0;
      } else {
        breakEvenMonths[a.id][b.id] = Math.ceil(extraUpfront / monthlySavings);
      }
    }
  }

  return {
    scenarios,
    rankings: {
      lowestMonthlyPayment: lowestMonthlyPayment.id,
      lowestTotalInterest: lowestTotalInterest.id,
      lowestCashAtClose: lowestCashAtClose.id,
      fastestPayoff: fastestPayoff.id,
    },
    breakEvenMonths,
  };
}

// ---------------------------------------------------------------------------
// Internal utility
// ---------------------------------------------------------------------------

/** Return the element of arr that minimizes the value returned by fn. */
function minBy<T>(arr: T[], fn: (item: T) => number): T {
  return arr.reduce((best, item) => (fn(item) < fn(best) ? item : best));
}
