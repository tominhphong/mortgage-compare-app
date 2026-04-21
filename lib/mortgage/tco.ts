/**
 * Total Cost of Ownership (TCO) calculator.
 * Computes the real 5/10/30-year cost of homeownership including
 * maintenance, utilities, PMI, tax benefits, and net equity.
 * Calibrated for DFW / North Texas market defaults.
 */

import { buildScenario, buildAmortizationSchedule } from './calculator';
import type { MortgageInput, PaymentBreakdown } from './types';
import { PMI_LTV_THRESHOLD } from './constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TCOInput extends MortgageInput {
  /** Number of years to hold the property (e.g. 5, 10, 30) */
  holdYears: number;
  /** Annual maintenance as % of home price (default 1.5%) */
  maintenancePercent?: number;
  /** Annual home appreciation rate (default 4% — DFW historical 4–6%) */
  appreciationRate?: number;
  /** Annual general inflation rate (default 3%) */
  inflationRate?: number;
  /** Marginal federal income tax rate (default 24%) */
  marginalTaxRate?: number;
  /** Annual utility estimate in USD (default $3,600 = $300/mo) */
  annualUtilityEstimate?: number;
}

export interface TCOResult {
  /** Total PITI × 12 × holdYears */
  totalMortgagePayments: number;
  /** Inflation-adjusted maintenance sum over hold period */
  totalMaintenance: number;
  /** Inflation-adjusted utility sum over hold period */
  totalUtilities: number;
  /** Total PMI paid until LTV drops to 80% */
  totalPMI: number;
  /** Estimated tax benefits (interest deduction + property tax, SALT-capped) */
  taxBenefits: number;
  /** Home value at end of hold period: price × (1+apr)^years */
  homeValueAtEnd: number;
  /** Remaining loan balance after holdYears payments */
  remainingLoanBalance: number;
  /** Net equity after sale: homeValue - remainingBalance - saleCosts (6%) */
  netEquity: number;
  /** Gross cost: mortgage + maintenance + utilities + PMI */
  totalCost: number;
  /** Net cost: totalCost - taxBenefits - netEquity gain */
  netCost: number;
  /** netCost / (holdYears × 12) — "true" monthly cost */
  costPerMonth: number;
}

// ---------------------------------------------------------------------------
// Constants / defaults
// ---------------------------------------------------------------------------

const DEFAULT_MAINTENANCE_PERCENT = 1.5;
const DEFAULT_APPRECIATION_RATE = 0.04;
const DEFAULT_INFLATION_RATE = 0.03;
const DEFAULT_MARGINAL_TAX_RATE = 0.24;
const DEFAULT_ANNUAL_UTILITY = 3600;
const SALE_COST_RATE = 0.06; // 6% realtor + closing
const SALT_CAP = 10000;
const MORTGAGE_INTEREST_DEDUCTION_LOAN_CAP = 750000;
const STANDARD_DEDUCTION_MARRIED = 30000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Calculate remaining loan balance after N months of payments.
 * Uses the standard amortization balance formula.
 *
 * B(n) = P × (1+r)^n - PMT × ((1+r)^n - 1) / r
 * where r = monthly rate, n = months paid, P = principal, PMT = monthly P&I
 */
function remainingBalance(
  principal: number,
  monthlyRate: number,
  monthlyPayment: number,
  monthsPaid: number,
): number {
  if (principal <= 0) return 0;
  if (monthlyRate === 0) {
    return Math.max(0, principal - monthlyPayment * monthsPaid);
  }
  const factor = Math.pow(1 + monthlyRate, monthsPaid);
  const balance = principal * factor - monthlyPayment * ((factor - 1) / monthlyRate);
  return Math.max(0, balance);
}

/**
 * Calculate total PMI paid until LTV reaches 80%.
 * PMI stops when balance drops to 80% of original home price.
 */
function calcTotalPMI(
  breakdown: PaymentBreakdown,
  input: MortgageInput,
  holdYears: number,
): number {
  if (breakdown.monthlyPMI === 0) return 0;

  const monthlyRate = input.rate / 100 / 12;
  const totalMonths = input.termYears * 12;
  const pmiStopBalance = input.homePrice * PMI_LTV_THRESHOLD;

  let totalPMI = 0;
  for (let month = 1; month <= Math.min(holdYears * 12, totalMonths); month++) {
    const bal = remainingBalance(
      breakdown.loanAmount,
      monthlyRate,
      breakdown.monthlyPI,
      month,
    );
    if (bal <= pmiStopBalance) break;
    totalPMI += breakdown.monthlyPMI;
  }
  return totalPMI;
}

/**
 * Estimate annual tax savings from mortgage interest + property tax deductions.
 * Uses first-year interest (highest) as approximation for all years.
 * SALT capped at $10K. Assumes married filing jointly standard deduction $30K.
 */
function calcTaxBenefits(
  breakdown: PaymentBreakdown,
  input: MortgageInput,
  holdYears: number,
  marginalTaxRate: number,
): number {
  // Effective loan for deduction (capped at $750K)
  const effectiveLoan = Math.min(breakdown.loanAmount, MORTGAGE_INTEREST_DEDUCTION_LOAN_CAP);
  const loanFraction = effectiveLoan / Math.max(breakdown.loanAmount, 1);

  // Build schedule to get actual interest per year
  const schedule = buildAmortizationSchedule(breakdown, input.termYears, holdYears);

  const annualPropertyTax = input.homePrice * ((input.propertyTaxRate ?? 2.1) / 100);

  let totalBenefit = 0;

  for (let year = 1; year <= holdYears; year++) {
    const startMonth = (year - 1) * 12;
    const endMonth = year * 12;
    const yearSchedule = schedule.slice(startMonth, endMonth);

    const annualInterest =
      yearSchedule.reduce((sum, entry) => sum + entry.interest, 0) * loanFraction;

    // SALT: property tax (Texas has no state income tax), capped at $10K
    const saltDeduction = Math.min(annualPropertyTax, SALT_CAP);

    const totalItemized = annualInterest + saltDeduction;

    // Only benefit if itemized > standard deduction
    if (totalItemized > STANDARD_DEDUCTION_MARRIED) {
      const beneficialDeduction = totalItemized - STANDARD_DEDUCTION_MARRIED;
      totalBenefit += beneficialDeduction * marginalTaxRate;
    }
  }

  return Math.max(0, totalBenefit);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Calculate Total Cost of Ownership over a given hold period.
 *
 * @example
 * calculateTCO({ homePrice: 400000, downPayment: 80000, rate: 7, termYears: 30, holdYears: 10 })
 */
export function calculateTCO(input: TCOInput): TCOResult {
  const {
    holdYears,
    maintenancePercent = DEFAULT_MAINTENANCE_PERCENT,
    appreciationRate = DEFAULT_APPRECIATION_RATE,
    inflationRate = DEFAULT_INFLATION_RATE,
    marginalTaxRate = DEFAULT_MARGINAL_TAX_RATE,
    annualUtilityEstimate = DEFAULT_ANNUAL_UTILITY,
  } = input;

  const breakdown = buildScenario(input);
  const monthlyRate = input.rate / 100 / 12;

  // --- Total mortgage payments (PITI × 12 × years) ---
  const totalMortgagePayments = breakdown.monthlyTotal * 12 * holdYears;

  // --- Inflation-adjusted maintenance: sum year 1 to holdYears ---
  let totalMaintenance = 0;
  for (let year = 1; year <= holdYears; year++) {
    totalMaintenance +=
      input.homePrice * (maintenancePercent / 100) * Math.pow(1 + inflationRate, year - 1);
  }

  // --- Inflation-adjusted utilities ---
  let totalUtilities = 0;
  for (let year = 1; year <= holdYears; year++) {
    totalUtilities += annualUtilityEstimate * Math.pow(1 + inflationRate, year - 1);
  }

  // --- Total PMI ---
  const totalPMI = calcTotalPMI(breakdown, input, holdYears);

  // --- Tax benefits ---
  const taxBenefits = calcTaxBenefits(breakdown, input, holdYears, marginalTaxRate);

  // --- Home value at end ---
  const homeValueAtEnd = input.homePrice * Math.pow(1 + appreciationRate, holdYears);

  // --- Remaining loan balance after holdYears ---
  const monthsPaid = Math.min(holdYears * 12, input.termYears * 12);
  const remainingLoanBalance = remainingBalance(
    breakdown.loanAmount,
    monthlyRate,
    breakdown.monthlyPI,
    monthsPaid,
  );

  // --- Net equity after sale (6% sale costs) ---
  const saleCosts = homeValueAtEnd * SALE_COST_RATE;
  const netEquity = homeValueAtEnd - remainingLoanBalance - saleCosts;

  // --- Gross and net cost ---
  const totalCost = totalMortgagePayments + totalMaintenance + totalUtilities + totalPMI;
  const equityGain = Math.max(0, netEquity - input.downPayment);
  const netCost = Math.max(0, totalCost - taxBenefits - equityGain);
  const costPerMonth = netCost / (holdYears * 12);

  return {
    totalMortgagePayments,
    totalMaintenance,
    totalUtilities,
    totalPMI,
    taxBenefits,
    homeValueAtEnd,
    remainingLoanBalance,
    netEquity,
    totalCost,
    netCost,
    costPerMonth,
  };
}
