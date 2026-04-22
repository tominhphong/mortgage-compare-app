/**
 * Mortgage recast calculator.
 *
 * A recast (re-amortization) applies a lump-sum principal payment and
 * recalculates the monthly payment on the remaining balance over the original
 * remaining term — keeping the same interest rate and maturity date.
 *
 * Recast differs from refinance: no new loan, no credit check, minimal fee (~$250).
 */

import type { PaymentBreakdown } from './types';
import { MONTHS_PER_YEAR } from './constants';
import { calculateMonthlyPayment } from './calculator';

export interface RecastInput {
  /** Original PaymentBreakdown before recast */
  originalBreakdown: PaymentBreakdown;
  /** Original loan term in years */
  termYears: number;
  /** Lump sum principal payment applied at recast */
  lumpSumPayment: number;
  /** Month number when recast occurs (1-indexed from origination) */
  monthOfRecast: number;
  /** One-time recast fee in USD. Default: $250 */
  recastFee?: number;
}

export interface RecastResult {
  /** Remaining principal after lump sum applied */
  newPrincipal: number;
  /** New monthly P&I after recast */
  newMonthlyPI: number;
  /** Monthly savings vs original payment */
  monthlySavings: number;
  /** Months to recover recast fee via monthly savings */
  breakEvenMonths: number;
  /** Total interest saved over remaining life of loan */
  totalInterestSavings: number;
}

// Derive monthly rate via Newton-Raphson (same approach as calculator.ts)
function deriveMonthlyRate(principal: number, payment: number, n: number): number {
  if (principal <= 0 || payment <= 0) return 0;
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

/**
 * Calculate the impact of a mortgage recast.
 *
 * @param input RecastInput
 * @returns RecastResult with new payment, savings, and break-even
 *
 * @example
 * calculateRecast({
 *   originalBreakdown: breakdown,
 *   termYears: 30,
 *   lumpSumPayment: 50000,
 *   monthOfRecast: 12,
 * })
 */
export function calculateRecast(input: RecastInput): RecastResult {
  const {
    originalBreakdown,
    termYears,
    lumpSumPayment,
    monthOfRecast,
    recastFee = 250,
  } = input;

  const { loanAmount, monthlyPI } = originalBreakdown;
  const totalMonths = termYears * MONTHS_PER_YEAR;
  const monthlyRate = deriveMonthlyRate(loanAmount, monthlyPI, totalMonths);

  // Simulate amortization up to month of recast to get current balance
  let balance = loanAmount;
  let interestPaidBeforeRecast = 0;

  for (let m = 1; m <= Math.min(monthOfRecast, totalMonths); m++) {
    const interestPortion = balance * monthlyRate;
    interestPaidBeforeRecast += interestPortion;
    const principalPortion = monthlyPI - interestPortion;
    balance = Math.max(0, balance - principalPortion);
  }

  // Apply lump sum
  const newPrincipal = Math.max(0, balance - lumpSumPayment);

  // Remaining months after recast
  const remainingMonths = totalMonths - monthOfRecast;

  if (remainingMonths <= 0 || newPrincipal <= 0) {
    return {
      newPrincipal: 0,
      newMonthlyPI: 0,
      monthlySavings: monthlyPI,
      breakEvenMonths: 0,
      totalInterestSavings: 0,
    };
  }

  // New monthly payment — same rate, same remaining term
  const newMonthlyPI = calculateMonthlyPayment(newPrincipal, monthlyRate * MONTHS_PER_YEAR, remainingMonths / MONTHS_PER_YEAR);

  const monthlySavings = monthlyPI - newMonthlyPI;

  // Break-even: months to recover recast fee via savings
  const breakEvenMonths =
    monthlySavings > 0 ? Math.ceil(recastFee / monthlySavings) : Infinity;

  // Total interest savings over remaining life
  const originalRemainingInterest = monthlyPI * remainingMonths - balance;
  const newTotalInterest = newMonthlyPI * remainingMonths - newPrincipal;
  const totalInterestSavings = Math.max(0, originalRemainingInterest - newTotalInterest);

  return {
    newPrincipal,
    newMonthlyPI,
    monthlySavings,
    breakEvenMonths,
    totalInterestSavings,
  };
}
