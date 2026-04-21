/**
 * Default constants for DFW Texas mortgage calculations.
 * All rates stored as decimals where applicable in formulas,
 * but exposed as percentages for readability.
 */

/** Default annual interest rate (%) for DFW Texas market */
export const DEFAULT_RATE_PERCENT = 7.0;

/** Default loan term in years */
export const DEFAULT_TERM_YEARS = 30 as const;

/** LTV threshold below which PMI is not required (80% = 0.80) */
export const PMI_LTV_THRESHOLD = 0.8;

/** Default annual PMI rate as a percentage of loan amount */
export const DEFAULT_PMI_RATE_PERCENT = 0.5;

/** Default annual property tax rate for Texas (%) — Grayson County / DFW average */
export const DEFAULT_PROPERTY_TAX_RATE_PERCENT = 2.1;

/** Default annual homeowners insurance in dollars — Texas typical */
export const DEFAULT_INSURANCE_YEARLY = 1400;

/** Default HOA monthly payment — 0 if no HOA */
export const DEFAULT_HOA_MONTHLY = 0;

/** Supported loan term options */
export const SUPPORTED_TERMS = [15, 20, 30] as const;

/** Months per year — used throughout formulas */
export const MONTHS_PER_YEAR = 12;
