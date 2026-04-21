/**
 * Refinance break-even evaluator.
 *
 * Computes whether refinancing makes financial sense by comparing:
 * - New monthly payment vs current payment
 * - Closing costs vs cumulative monthly savings (break-even)
 * - Lifetime interest delta (new loan total interest - remaining old loan interest)
 */

import { MONTHS_PER_YEAR } from './constants';
import { calculateMonthlyPayment } from './calculator';

export interface RefinanceInput {
  /** Current outstanding loan balance in USD */
  currentBalance: number;
  /** Current annual interest rate as a percentage (e.g. 7.0) */
  currentRate: number;
  /** Months remaining on current loan */
  currentRemainingMonths: number;
  /** New loan annual interest rate as a percentage */
  newRate: number;
  /** New loan term in years (typically 30) */
  newTermYears: number;
  /** Closing costs as a percentage of new loan amount. Default: 3% */
  closingCostsPercent?: number;
  /** Override closing costs with a flat dollar amount */
  flatClosingCosts?: number;
}

export interface RefinanceResult {
  /** New monthly P&I after refinance */
  newMonthlyPI: number;
  /** Monthly savings (current payment - new payment) */
  monthlySavings: number;
  /** Total closing costs in USD */
  totalClosingCosts: number;
  /** Months until monthly savings recover closing costs */
  breakEvenMonths: number;
  /**
   * Lifetime interest difference:
   * positive = new loan costs less total interest (good)
   * negative = new loan costs more total interest (bad — term extension)
   */
  lifetimeInterestDiff: number;
  /** Recommendation based on break-even and interest delta */
  recommendation: 'refinance' | 'hold' | 'borderline';
}

/**
 * Evaluate whether a refinance is financially beneficial.
 *
 * @param input RefinanceInput
 * @returns RefinanceResult with break-even, savings, and recommendation
 *
 * @example
 * evaluateRefinance({
 *   currentBalance: 320000,
 *   currentRate: 7.5,
 *   currentRemainingMonths: 324,
 *   newRate: 6.25,
 *   newTermYears: 30,
 * })
 */
export function evaluateRefinance(input: RefinanceInput): RefinanceResult {
  const {
    currentBalance,
    currentRate,
    currentRemainingMonths,
    newRate,
    newTermYears,
    closingCostsPercent = 3,
    flatClosingCosts,
  } = input;

  // Current monthly payment (reconstruct from balance + remaining term + rate)
  const currentMonthlyPI = calculateMonthlyPayment(
    currentBalance,
    currentRate / 100,
    currentRemainingMonths / MONTHS_PER_YEAR,
  );

  // New monthly payment
  const newMonthlyPI = calculateMonthlyPayment(
    currentBalance,
    newRate / 100,
    newTermYears,
  );

  const monthlySavings = currentMonthlyPI - newMonthlyPI;

  // Closing costs
  const totalClosingCosts =
    flatClosingCosts != null
      ? flatClosingCosts
      : currentBalance * (closingCostsPercent / 100);

  // Break-even in months
  const breakEvenMonths =
    monthlySavings > 0 ? Math.ceil(totalClosingCosts / monthlySavings) : Infinity;

  // Lifetime interest comparison
  const remainingOldInterest =
    currentMonthlyPI * currentRemainingMonths - currentBalance;
  const newTotalInterest =
    newMonthlyPI * newTermYears * MONTHS_PER_YEAR - currentBalance;

  // positive = refi costs LESS total interest (favorable)
  const lifetimeInterestDiff = remainingOldInterest - newTotalInterest;

  // Recommendation logic:
  // - refinance: break-even < 36 months AND lifetime interest is better or borderline
  // - borderline: break-even 36-60 months OR term extension hurts lifetime interest
  // - hold: break-even > 60 months OR monthlySavings <= 0
  let recommendation: 'refinance' | 'hold' | 'borderline';
  if (monthlySavings <= 0 || breakEvenMonths === Infinity || breakEvenMonths > 60) {
    recommendation = 'hold';
  } else if (breakEvenMonths <= 36 && lifetimeInterestDiff >= 0) {
    recommendation = 'refinance';
  } else {
    recommendation = 'borderline';
  }

  return {
    newMonthlyPI,
    monthlySavings,
    totalClosingCosts,
    breakEvenMonths,
    lifetimeInterestDiff,
    recommendation,
  };
}
