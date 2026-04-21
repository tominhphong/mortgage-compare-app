/**
 * TypeScript types for the mortgage calculator engine.
 * All monetary values are in USD. Rates are percentages (e.g. 7.0 for 7%).
 */

import { SUPPORTED_TERMS } from './constants';

/** Supported loan term options (years) */
export type TermYears = (typeof SUPPORTED_TERMS)[number];

/**
 * Input parameters for a single mortgage scenario.
 * Caller provides either downPayment (dollars) or the calculator derives it
 * from homePrice and the implied percentage.
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
 * All monthly values are in USD. Lifetime values cover the full loan term.
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
  /** Payment number (1-based) */
  month: number;
  /** Total payment for this period (P&I) */
  payment: number;
  /** Principal portion of this payment */
  principal: number;
  /** Interest portion of this payment */
  interest: number;
  /** Remaining loan balance after this payment */
  balance: number;
}

/**
 * A PaymentBreakdown annotated with an identifier and display label,
 * used inside CompareResult.
 */
export interface LabeledScenario extends PaymentBreakdown {
  /** Unique scenario identifier (e.g. "scenario-1") */
  id: string;
  /** Human-readable label (e.g. "30yr @ 7%") */
  label: string;
}

/**
 * Result of comparing two or more mortgage scenarios.
 */
export interface CompareResult {
  /** All scenarios with their full breakdowns */
  scenarios: LabeledScenario[];
  /** IDs of the scenario that wins each category */
  rankings: {
    /** Scenario with lowest total monthly payment */
    lowestMonthlyPayment: string;
    /** Scenario with lowest lifetime interest paid */
    lowestTotalInterest: string;
    /** Scenario requiring least cash at closing (down payment) */
    lowestCashAtClose: string;
    /** Scenario with earliest payoff date / shortest term */
    fastestPayoff: string;
  };
  /**
   * Pairwise break-even in months: how many months until Scenario A's
   * cumulative savings in monthly payments offset its higher upfront cost
   * vs Scenario B.
   * breakEvenMonths[idA][idB] = months for A to break even against B
   */
  breakEvenMonths: Record<string, Record<string, number>>;
}
