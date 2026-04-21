/**
 * affordability.ts
 * DTI (Debt-to-Income) + 28/36 rule + reserves check for mortgage qualification.
 *
 * Key ratios:
 *   Front-end (housing ratio): PITI / gross monthly income — lender target ≤ 28%
 *   Back-end (DTI):            (PITI + other debt) / gross monthly income — target ≤ 36%
 *   Qualified Mortgage limit:  DTI ≤ 43% (CFPB QM rule)
 *   Reserves:                  liquid assets / (PITI + living expenses) — target ≥ 3 months
 *
 * All monetary values are in USD.
 */

import type { PaymentBreakdown } from './types';
import {
  DEFAULT_RATE_PERCENT,
  DEFAULT_TERM_YEARS,
  MONTHS_PER_YEAR,
} from './constants';
import { calculateMonthlyPayment } from './calculator';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AffordabilityInput {
  /** Gross monthly income before taxes */
  grossMonthlyIncome: number;
  /** Sum of all other monthly debt minimums (car, student, credit card) */
  otherMonthlyDebt: number;
  /** Cash + savings available for down payment, closing costs, and reserves */
  liquidAssets: number;
  /** Optional: recurring monthly living expenses for reserves calculation */
  monthlyLivingExpenses?: number;
}

export interface AffordabilityResult {
  /** PITI / grossMonthlyIncome — target ≤ 0.28 */
  frontEndRatio: number;
  /** (PITI + otherDebt) / grossMonthlyIncome — target ≤ 0.36 */
  backEndRatio: number;
  /** frontEndRatio ≤ 0.28 */
  frontEndPass: boolean;
  /** backEndRatio ≤ 0.36 */
  backEndPass: boolean;
  /** backEndRatio ≤ 0.43 (CFPB Qualified Mortgage limit) */
  qualifiedMortgageLimit: boolean;
  /** grossMonthlyIncome × 0.28 — maximum affordable monthly PITI by income */
  maxAffordableMonthlyPITI: number;
  /**
   * Rough maximum home price estimate.
   * Assumes DEFAULT_RATE_PERCENT, DEFAULT_TERM_YEARS, 20% down.
   * Formula: solve P&I budget → loan amount → home price.
   */
  maxAffordableHomePriceRough: number;
  /** liquidAssets / (monthlyPITI + monthlyLivingExpenses) — months of cash reserves */
  reservesMonths: number;
  /** reservesMonths ≥ 3 */
  reservesPass: boolean;
  /** downPayment + loanAmount × 0.03 — estimated cash needed to close */
  cashToClose: number;
  /** loanAmount × 0.03 — closing cost estimate (3% of loan) */
  estimatedClosingCosts: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FRONT_END_TARGET = 0.28;
const BACK_END_TARGET = 0.36;
const QM_LIMIT = 0.43;
const MIN_RESERVES_MONTHS = 3;
const CLOSING_COST_RATE = 0.03; // 3% of loan amount
const DEFAULT_DOWN_PAYMENT_RATIO = 0.20; // 20% assumed for rough estimate

// ---------------------------------------------------------------------------
// Main calculator
// ---------------------------------------------------------------------------

/**
 * Calculate affordability metrics for a given PaymentBreakdown and income inputs.
 *
 * @param breakdown  Computed PaymentBreakdown from buildScenario
 * @param input      Borrower income and asset data
 * @returns          AffordabilityResult with all DTI ratios, reserves, and estimates
 *
 * @example
 * const result = calculateAffordability(breakdown, {
 *   grossMonthlyIncome: 10000,
 *   otherMonthlyDebt: 500,
 *   liquidAssets: 60000,
 * });
 * // result.frontEndRatio = 0.24  (PASS)
 * // result.backEndRatio  = 0.29  (PASS)
 */
export function calculateAffordability(
  breakdown: PaymentBreakdown,
  input: AffordabilityInput,
): AffordabilityResult {
  const {
    grossMonthlyIncome,
    otherMonthlyDebt,
    liquidAssets,
    monthlyLivingExpenses = 0,
  } = input;

  const monthlyPITI = breakdown.monthlyTotal;

  // --- DTI ratios ---
  const frontEndRatio =
    grossMonthlyIncome > 0 ? monthlyPITI / grossMonthlyIncome : 0;
  const backEndRatio =
    grossMonthlyIncome > 0
      ? (monthlyPITI + otherMonthlyDebt) / grossMonthlyIncome
      : 0;

  // --- Max affordable PITI by income ---
  const maxAffordableMonthlyPITI = grossMonthlyIncome * FRONT_END_TARGET;

  // --- Rough max home price (20% down, default rate/term) ---
  // Budget for P&I = maxMonthlyPITI (ignoring tax/insurance for rough estimate)
  const maxAffordableHomePriceRough = deriveMaxHomePriceFromPaymentBudget(
    maxAffordableMonthlyPITI,
  );

  // --- Reserves ---
  const monthlyBurn = monthlyPITI + monthlyLivingExpenses;
  const reservesMonths =
    monthlyBurn > 0 ? liquidAssets / monthlyBurn : Infinity;

  // --- Cash to close ---
  const estimatedClosingCosts = breakdown.loanAmount * CLOSING_COST_RATE;
  const cashToClose = breakdown.downAmount + estimatedClosingCosts;

  return {
    frontEndRatio,
    backEndRatio,
    frontEndPass: frontEndRatio <= FRONT_END_TARGET,
    backEndPass: backEndRatio <= BACK_END_TARGET,
    qualifiedMortgageLimit: backEndRatio <= QM_LIMIT,
    maxAffordableMonthlyPITI,
    maxAffordableHomePriceRough,
    reservesMonths,
    reservesPass: reservesMonths >= MIN_RESERVES_MONTHS,
    cashToClose,
    estimatedClosingCosts,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Reverse-engineer a rough max home price from a monthly payment budget.
 * Assumes: DEFAULT_RATE_PERCENT, DEFAULT_TERM_YEARS, 20% down payment.
 * Note: ignores tax/insurance/PMI — intended as a rough upper-bound estimate only.
 *
 * @param monthlyBudget  Maximum affordable monthly P&I payment
 * @returns              Estimated maximum home price
 */
function deriveMaxHomePriceFromPaymentBudget(monthlyBudget: number): number {
  if (monthlyBudget <= 0) return 0;

  const rateDecimal = DEFAULT_RATE_PERCENT / 100;
  const n = DEFAULT_TERM_YEARS * MONTHS_PER_YEAR;
  const r = rateDecimal / MONTHS_PER_YEAR;

  // Invert amortisation formula: P = M × ((1+r)^n - 1) / (r × (1+r)^n)
  const factor = Math.pow(1 + r, n);
  const maxLoanAmount = (monthlyBudget * (factor - 1)) / (r * factor);

  // With 20% down: loanAmount = homePrice × 0.80
  const maxHomePrice = maxLoanAmount / (1 - DEFAULT_DOWN_PAYMENT_RATIO);
  return Math.round(maxHomePrice);
}
