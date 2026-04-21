/**
 * TypeScript types for the mortgage calculator engine.
 * All monetary values are in USD. Rates are percentages (e.g. 7.0 for 7%).
 */

import { SUPPORTED_TERMS } from './constants';

/** Supported loan term options (years) */
export type TermYears = (typeof SUPPORTED_TERMS)[number];

/**
 * Input parameters for a single mortgage scenario.
 */
export interface MortgageInput {
  /** Purchase price of the home in USD */
  homePrice: number;
  /** Down payment in USD */
  downPayment: number;
  /** Annual interest rate as a percentage (e.g. 7.0 means 7%) */
  rate: number;
  /** Loan term in years */
  termYears: TermYears;
  /** Annual property tax rate as a percentage (default: 2.1% for Texas) */
  propertyTaxRate?: number;
  /** Annual homeowners insurance in USD (default: $1,400) */
  insuranceYearly?: number;
  /** Annual PMI rate as a percentage of loan amount (default: 0.5%) */
  pmiRate?: number;
  /** Monthly HOA dues in USD (default: 0) */
  hoaMonthly?: number;
}

/**
 * Full payment breakdown for a single mortgage scenario.
 */
export interface PaymentBreakdown {
  /** Monthly principal + interest payment */
  monthlyPI: number;
  /** Monthly PMI (0 if LTV <= 80%) */
  monthlyPMI: number;
  /** Monthly property tax estimate */
  monthlyTax: number;
  /** Monthly homeowners insurance estimate */
  monthlyInsurance: number;
  /** Monthly HOA dues */
  monthlyHOA: number;
  /** Total monthly PITI + PMI + HOA */
  monthlyTotal: number;
  /** Loan amount (homePrice - downPayment) */
  loanAmount: number;
  /** Down payment amount in USD */
  downAmount: number;
  /** Loan-to-value ratio (0–1, e.g. 0.8 = 80%) */
  ltv: number;
  /** Total interest paid over the life of the loan */
  totalInterest: number;
  /** Total amount paid over the life of the loan (P&I only, not tax/insurance) */
  totalPaid: number;
  /** Estimated payoff date based on today's date */
  payoffDate?: Date;
}

/**
 * Single row of an amortization schedule.
 */
export interface AmortizationEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

/**
 * A scenario = input + computed breakdown + display metadata.
 * Used throughout UI state and comparison logic.
 */
export interface Scenario {
  /** Unique scenario identifier */
  id: string;
  /** Human-readable label (e.g. "Kịch bản A: 10% down @ 7%") */
  label: string;
  input: MortgageInput;
  breakdown: PaymentBreakdown;
}

/**
 * A PaymentBreakdown annotated with an identifier and display label,
 * used inside CompareResult.
 */
export interface LabeledScenario extends PaymentBreakdown {
  id: string;
  label: string;
}

/**
 * Winner category for side-by-side compare summary.
 */
export type WinnerType =
  | 'lowestMonthly'
  | 'lowestTotalInterest'
  | 'smallestDown'
  | 'fastestPayoff';

/**
 * Badge shown on a scenario card highlighting its win category.
 */
export interface WinnerBadge {
  type: WinnerType;
  scenarioId: string;
  scenarioLabel: string;
}

/**
 * Result of comparing two or more mortgage scenarios.
 */
export interface CompareResult {
  scenarios: LabeledScenario[];
  rankings: {
    lowestMonthlyPayment: string;
    lowestTotalInterest: string;
    lowestCashAtClose: string;
    fastestPayoff: string;
  };
  /**
   * Pairwise break-even in months.
   * breakEvenMonths[idA][idB] = months for A to break even against B.
   */
  breakEvenMonths: Record<string, Record<string, number>>;
}
