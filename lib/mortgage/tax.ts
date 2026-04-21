/**
 * Tax implication calculator for 2026 mortgage scenarios.
 * Handles mortgage interest deduction, SALT cap, standard vs itemized,
 * and Mortgage Credit Certificate (MCC) credits.
 *
 * Texas-specific: no state income tax → SALT is predominantly property tax.
 * 2026 estimates based on TCJA extension assumptions.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** 2026 federal tax configuration constants */
export interface TaxConfig2026 {
  /** Maximum loan balance eligible for interest deduction */
  mortgageInterestCap: number;
  /** SALT (State and Local Tax) annual deduction cap */
  saltCap: number;
  /** Standard deduction amounts by filing status */
  standardDeduction: {
    single: number;
    married: number;
  };
  /** MCC credit rate range (20–50% of interest paid) */
  mccCreditRate?: number;
  /** Maximum annual MCC tax credit */
  mccMaxCredit: number;
}

/** Inputs for a single-year tax impact calculation */
export interface TaxInput {
  /** Federal filing status */
  filingStatus: 'single' | 'married';
  /** Federal marginal income tax rate (e.g. 0.22, 0.24, 0.32) */
  marginalTaxRate: number;
  /** Total mortgage interest paid in year 1 (from amortization) */
  firstYearInterest: number;
  /** Annual property tax amount in USD */
  annualPropertyTax: number;
  /** Other SALT items — state income tax etc. (Texas = 0) */
  otherSALT?: number;
  /** Whether borrower has a Mortgage Credit Certificate */
  hasMCC?: boolean;
  /** MCC credit rate — percentage of interest as credit (20–50%) */
  mccRate?: number;
  /** Actual loan balance (to check against $750K cap) */
  loanBalance?: number;
}

/** Computed tax benefit summary */
export interface TaxResult {
  /** Mortgage interest deduction after $750K loan cap */
  interestDeduction: number;
  /** SALT deduction after $10K cap (property tax + state income) */
  saltDeduction: number;
  /** Total itemized deductions */
  totalItemized: number;
  /** Applicable standard deduction for filing status */
  standardDeduction: number;
  /** True if standard deduction > itemized (should NOT itemize) */
  useStandard: boolean;
  /** Annual tax savings from deductions: marginalRate × beneficial deduction */
  annualTaxSavings: number;
  /** Annual MCC tax credit (separate from deductions, dollar-for-dollar) */
  mccAnnualCredit: number;
  /** Total annual tax benefit: savings + MCC credit */
  totalAnnualTaxBenefit: number;
  /** Effective mortgage rate after tax benefit: nominal - (savings / interest) */
  effectiveMortgageRate: number;
  /** Nominal annual interest rate derived from inputs (for display) */
  nominalRate: number;
}

// ---------------------------------------------------------------------------
// 2026 Tax Constants
// ---------------------------------------------------------------------------

export const TAX_CONFIG_2026: TaxConfig2026 = {
  mortgageInterestCap: 750_000,
  saltCap: 10_000,
  standardDeduction: {
    single: 15_000,   // 2026 TCJA extension estimate
    married: 30_000,  // 2026 TCJA extension estimate
  },
  mccMaxCredit: 2_000,
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Calculate the annual tax impact of a mortgage for 2026.
 * Returns itemize vs standard recommendation plus effective rate after tax.
 *
 * @example
 * calculateTaxImpact({
 *   filingStatus: 'married',
 *   marginalTaxRate: 0.24,
 *   firstYearInterest: 22000,
 *   annualPropertyTax: 8400,
 * })
 */
export function calculateTaxImpact(input: TaxInput, nominalRate = 7): TaxResult {
  const {
    filingStatus,
    marginalTaxRate,
    firstYearInterest,
    annualPropertyTax,
    otherSALT = 0,  // Texas: 0 state income tax
    hasMCC = false,
    mccRate = 0.20,
    loanBalance,
  } = input;

  const config = TAX_CONFIG_2026;

  // --- Mortgage interest deduction (capped at $750K loan) ---
  const loanCapFraction = loanBalance
    ? Math.min(1, config.mortgageInterestCap / Math.max(loanBalance, 1))
    : 1;
  const interestDeduction = firstYearInterest * loanCapFraction;

  // --- SALT deduction: property tax + state income (TX = 0), capped $10K ---
  const rawSALT = annualPropertyTax + otherSALT;
  const saltDeduction = Math.min(rawSALT, config.saltCap);

  // --- Total itemized ---
  const totalItemized = interestDeduction + saltDeduction;

  // --- Standard deduction for filing status ---
  const standardDeduction = config.standardDeduction[filingStatus];

  // --- Should itemize? ---
  const useStandard = standardDeduction >= totalItemized;

  // --- Annual tax savings from deductions ---
  // Only the amount ABOVE standard deduction generates incremental savings
  const incrementalDeduction = Math.max(0, totalItemized - standardDeduction);
  const annualTaxSavings = useStandard ? 0 : incrementalDeduction * marginalTaxRate;

  // --- MCC credit (separate from deduction — dollar-for-dollar credit) ---
  // MCC applies to a portion of interest paid, capped at $2K
  let mccAnnualCredit = 0;
  if (hasMCC && firstYearInterest > 0) {
    const rawCredit = firstYearInterest * mccRate;
    mccAnnualCredit = Math.min(rawCredit, config.mccMaxCredit);
    // Note: interest used for MCC credit cannot also be deducted
    // (reduce itemized interest by the MCC portion)
  }

  const totalAnnualTaxBenefit = annualTaxSavings + mccAnnualCredit;

  // --- Effective mortgage rate after tax ---
  // Savings reduce the net cost of interest
  const effectiveSavingsRate =
    firstYearInterest > 0 ? (annualTaxSavings / firstYearInterest) * nominalRate : 0;
  const effectiveMortgageRate = Math.max(0, nominalRate - effectiveSavingsRate);

  return {
    interestDeduction,
    saltDeduction,
    totalItemized,
    standardDeduction,
    useStandard,
    annualTaxSavings,
    mccAnnualCredit,
    totalAnnualTaxBenefit,
    effectiveMortgageRate,
    nominalRate,
  };
}
