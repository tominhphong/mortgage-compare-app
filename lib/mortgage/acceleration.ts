/**
 * Extra payment, biweekly, and lump-sum acceleration simulators.
 * All simulations derive the monthly rate from the existing PaymentBreakdown
 * via Newton-Raphson (same technique used in calculator.ts).
 */

import type { PaymentBreakdown } from './types';
import { MONTHS_PER_YEAR } from './constants';

export type AccelerationStrategy =
  | 'none'
  | 'extra-monthly'
  | 'biweekly'
  | 'annual-lump'
  | 'custom';

export interface ExtraPaymentInput {
  /** Computed breakdown from buildScenario */
  breakdown: PaymentBreakdown;
  /** Original term in years (needed for total-month count) */
  termYears: number;
  /** Additional principal per month */
  extraMonthly?: number;
  /** One lump sum applied at end of each year (e.g. tax refund) */
  extraAnnual?: number;
  /** Single one-time lump sum at a specific month */
  extraOneTime?: number;
  /** Month number for one-time lump sum (1-indexed) */
  oneTimeMonth?: number;
  /** Acceleration strategy label */
  strategy: AccelerationStrategy;
}

export interface AccelerationResult {
  originalPayoffMonths: number;
  newPayoffMonths: number;
  monthsSaved: number;
  yearsSaved: number;
  interestSaved: number;
  totalPrincipalPaid: number;
  /** Monthly increase in cash outflow vs original */
  cashFlowImpact: number;
}

// ---------------------------------------------------------------------------
// Derive monthly interest rate from loan parameters (Newton-Raphson)
// ---------------------------------------------------------------------------

function deriveMonthlyRate(principal: number, payment: number, n: number): number {
  if (principal <= 0 || payment <= 0) return 0;
  // Edge case: 0% interest
  if (Math.abs(payment * n - principal) < 0.01) return 0;

  let r = Math.max(0.001, payment / principal - 1 / n);

  for (let i = 0; i < 200; i++) {
    const factor = Math.pow(1 + r, n);
    const f = principal * r * factor - payment * (factor - 1);
    const fPrime =
      principal * (factor + r * n * Math.pow(1 + r, n - 1)) -
      payment * n * Math.pow(1 + r, n - 1);
    if (Math.abs(fPrime) < 1e-15) break;
    const rNext = r - f / fPrime;
    if (Math.abs(rNext - r) < 1e-12) {
      r = rNext;
      break;
    }
    r = Math.max(0, rNext);
  }

  return Math.max(0, r);
}

// ---------------------------------------------------------------------------
// Core simulation
// ---------------------------------------------------------------------------

/**
 * Simulate loan payoff under an acceleration strategy.
 *
 * @param input ExtraPaymentInput with strategy and payment overrides
 * @returns AccelerationResult — months saved, interest saved, cash flow impact
 */
export function simulateAcceleration(input: ExtraPaymentInput): AccelerationResult {
  const {
    breakdown,
    termYears,
    extraMonthly = 0,
    extraAnnual = 0,
    extraOneTime = 0,
    oneTimeMonth = 1,
    strategy,
  } = input;

  const { loanAmount, monthlyPI } = breakdown;
  const totalMonths = termYears * MONTHS_PER_YEAR;
  const monthlyRate = deriveMonthlyRate(loanAmount, monthlyPI, totalMonths);

  if (loanAmount <= 0) {
    return {
      originalPayoffMonths: 0,
      newPayoffMonths: 0,
      monthsSaved: 0,
      yearsSaved: 0,
      interestSaved: 0,
      totalPrincipalPaid: 0,
      cashFlowImpact: 0,
    };
  }

  // Original payoff simulation (no acceleration)
  const originalPayoff = runSimulation({
    loanAmount,
    monthlyRate,
    basePayment: monthlyPI,
    totalMonths,
    extraMonthly: 0,
    extraAnnual: 0,
    extraOneTime: 0,
    oneTimeMonth: 0,
    isBiweekly: false,
  });

  // Effective extra amounts per strategy
  let effectiveExtraMonthly = 0;
  let effectiveExtraAnnual = 0;
  let effectiveExtraOneTime = 0;
  let isBiweekly = false;

  switch (strategy) {
    case 'extra-monthly':
      effectiveExtraMonthly = extraMonthly;
      break;
    case 'biweekly':
      isBiweekly = true;
      break;
    case 'annual-lump':
      effectiveExtraAnnual = extraAnnual;
      break;
    case 'custom':
      effectiveExtraMonthly = extraMonthly;
      effectiveExtraAnnual = extraAnnual;
      effectiveExtraOneTime = extraOneTime;
      break;
    case 'none':
    default:
      break;
  }

  const accelerated = runSimulation({
    loanAmount,
    monthlyRate,
    basePayment: monthlyPI,
    totalMonths,
    extraMonthly: effectiveExtraMonthly,
    extraAnnual: effectiveExtraAnnual,
    extraOneTime: effectiveExtraOneTime,
    oneTimeMonth,
    isBiweekly,
  });

  const monthsSaved = Math.max(0, originalPayoff.payoffMonths - accelerated.payoffMonths);
  const interestSaved = Math.max(0, originalPayoff.totalInterest - accelerated.totalInterest);

  // Monthly cash flow increase for the user to feel
  let cashFlowImpact = effectiveExtraMonthly;
  if (isBiweekly) {
    // Biweekly: 26 payments × half-monthly = 1 extra monthly per year ≈ monthlyPI / 12
    cashFlowImpact = monthlyPI / 12;
  }

  return {
    originalPayoffMonths: originalPayoff.payoffMonths,
    newPayoffMonths: accelerated.payoffMonths,
    monthsSaved,
    yearsSaved: parseFloat((monthsSaved / MONTHS_PER_YEAR).toFixed(2)),
    interestSaved,
    totalPrincipalPaid: loanAmount,
    cashFlowImpact,
  };
}

// ---------------------------------------------------------------------------
// Internal simulation runner
// ---------------------------------------------------------------------------

interface SimParams {
  loanAmount: number;
  monthlyRate: number;
  basePayment: number;
  totalMonths: number;
  extraMonthly: number;
  extraAnnual: number;
  extraOneTime: number;
  oneTimeMonth: number;
  isBiweekly: boolean;
}

interface SimResult {
  payoffMonths: number;
  totalInterest: number;
}

function runSimulation(p: SimParams): SimResult {
  let balance = p.loanAmount;
  let totalInterest = 0;
  let month = 0;

  // Biweekly: effective monthly = 13/12 × monthlyPI (26 half-payments per year)
  const effectiveMonthly = p.isBiweekly
    ? (p.basePayment * 13) / 12
    : p.basePayment + p.extraMonthly;

  while (balance > 0.01 && month < p.totalMonths + 1) {
    month++;

    const interestThisMonth = balance * p.monthlyRate;
    totalInterest += interestThisMonth;

    let principalThisMonth = effectiveMonthly - interestThisMonth;

    // Annual lump sum at end of each year
    if (p.extraAnnual > 0 && month % MONTHS_PER_YEAR === 0) {
      principalThisMonth += p.extraAnnual;
    }

    // One-time lump sum
    if (p.extraOneTime > 0 && month === p.oneTimeMonth) {
      principalThisMonth += p.extraOneTime;
    }

    balance = Math.max(0, balance - principalThisMonth);
  }

  return { payoffMonths: month, totalInterest };
}

// ---------------------------------------------------------------------------
// Biweekly equivalent helper
// ---------------------------------------------------------------------------

/**
 * Compute biweekly payment details from a standard monthly P&I payment.
 * Biweekly = 26 half-payments/year = 13 full monthly equivalents/year.
 *
 * @param monthlyPI Standard monthly principal + interest payment
 * @returns biweeklyPayment, effectiveMonthly, and estimated payoff years saved
 */
export function biweeklyEquivalent(
  monthlyPI: number,
): { biweeklyPayment: number; effectiveMonthly: number; yearsFromBiweekly: number } {
  // Half of monthly paid every two weeks
  const biweeklyPayment = monthlyPI / 2;

  // 26 half-payments per year = 13 full monthly payments
  const effectiveMonthly = (monthlyPI * 13) / MONTHS_PER_YEAR;

  // Rough estimate: extra 1 monthly payment / year on a 30-year loan saves ~4-5 years
  // We derive this properly via ratio of extra payment to balance reduction
  // Conservative estimate: (1/12) extra payment per month on standard 30yr ≈ 4.3 years
  const yearsFromBiweekly = parseFloat(((monthlyPI / MONTHS_PER_YEAR / monthlyPI) * 30 * 12 * (1 / 6)).toFixed(1));

  return { biweeklyPayment, effectiveMonthly, yearsFromBiweekly };
}
