/**
 * Holding costs calculator: HOA, MUD, PID, maintenance reserve, utilities.
 * Calibrated for North Texas / DFW market.
 */

import {
  TEXAS_HOA_AVG,
  TEXAS_MUD_RATE,
  TEXAS_PID_ANNUAL_AVG,
  MAINTENANCE_PERCENT_DEFAULT,
  MAINTENANCE_PERCENT_NEW,
  MAINTENANCE_PERCENT_OLD,
  MONTHS_PER_YEAR,
} from './constants';

/** Home age bucket for maintenance estimation */
export type HomeAge = 'new' | 'midage' | 'old';

export interface HoldingCostsInput {
  /** Purchase price of home in USD */
  homePrice: number;
  /** Age bucket of home */
  homeAge: HomeAge;
  /** Monthly HOA dues in USD */
  hoaMonthly: number;
  /** MUD district tax rate as a percentage (e.g. 0.75 for 0.75%) */
  mudRatePercent: number;
  /** Annual PID assessment in USD (flat amount) */
  pidAnnual: number;
  /** Override maintenance rate (as decimal). Falls back to age-based default */
  maintenancePercent?: number;
  /** Monthly utility estimate in USD. Default: $300 */
  utilityMonthlyEstimate?: number;
}

export interface HoldingCostBreakdownRow {
  category: string;
  monthly: number;
  annual: number;
  percentOfPrice: number;
}

export interface HoldingCostsResult {
  monthlyHOA: number;
  monthlyMUD: number;
  monthlyPID: number;
  monthlyMaintenance: number;
  monthlyUtility: number;
  totalMonthlyHolding: number;
  annualTotal: number;
  breakdown: HoldingCostBreakdownRow[];
}

/**
 * Determine maintenance reserve rate by home age bucket.
 * new (<5 yrs): 1% | midage (5-20 yrs): 1.5% | old (>20 yrs): 4%
 */
function maintenanceRateForAge(homeAge: HomeAge): number {
  if (homeAge === 'new') return MAINTENANCE_PERCENT_NEW;
  if (homeAge === 'old') return MAINTENANCE_PERCENT_OLD;
  return MAINTENANCE_PERCENT_DEFAULT;
}

/**
 * Calculate total monthly and annual holding costs beyond PITI.
 *
 * @param input HoldingCostsInput
 * @returns HoldingCostsResult with per-category breakdown
 *
 * @example
 * calculateHoldingCosts({ homePrice: 400000, homeAge: 'midage', hoaMonthly: 250,
 *   mudRatePercent: 0.75, pidAnnual: 1500 })
 */
export function calculateHoldingCosts(input: HoldingCostsInput): HoldingCostsResult {
  const {
    homePrice,
    homeAge,
    hoaMonthly,
    mudRatePercent,
    pidAnnual,
    maintenancePercent,
    utilityMonthlyEstimate = 300,
  } = input;

  const monthlyHOA = hoaMonthly;

  // MUD: annual rate applied to home value, then divide by 12
  const monthlyMUD = (homePrice * (mudRatePercent / 100)) / MONTHS_PER_YEAR;

  // PID: flat annual amount divided by 12
  const monthlyPID = pidAnnual / MONTHS_PER_YEAR;

  // Maintenance reserve: percentage of home price per year
  const effectiveMaintenanceRate = maintenancePercent ?? maintenanceRateForAge(homeAge);
  const monthlyMaintenance = (homePrice * effectiveMaintenanceRate) / MONTHS_PER_YEAR;

  const monthlyUtility = utilityMonthlyEstimate;

  const totalMonthlyHolding =
    monthlyHOA + monthlyMUD + monthlyPID + monthlyMaintenance + monthlyUtility;

  const annualTotal = totalMonthlyHolding * MONTHS_PER_YEAR;

  const pctOf = (monthly: number) =>
    homePrice > 0 ? (monthly * MONTHS_PER_YEAR) / homePrice : 0;

  const breakdown: HoldingCostBreakdownRow[] = [
    {
      category: 'HOA',
      monthly: monthlyHOA,
      annual: monthlyHOA * MONTHS_PER_YEAR,
      percentOfPrice: pctOf(monthlyHOA),
    },
    {
      category: 'MUD Tax',
      monthly: monthlyMUD,
      annual: monthlyMUD * MONTHS_PER_YEAR,
      percentOfPrice: pctOf(monthlyMUD),
    },
    {
      category: 'PID Assessment',
      monthly: monthlyPID,
      annual: pidAnnual,
      percentOfPrice: pctOf(monthlyPID),
    },
    {
      category: 'Maintenance Reserve',
      monthly: monthlyMaintenance,
      annual: monthlyMaintenance * MONTHS_PER_YEAR,
      percentOfPrice: pctOf(monthlyMaintenance),
    },
    {
      category: 'Utilities',
      monthly: monthlyUtility,
      annual: monthlyUtility * MONTHS_PER_YEAR,
      percentOfPrice: pctOf(monthlyUtility),
    },
  ];

  return {
    monthlyHOA,
    monthlyMUD,
    monthlyPID,
    monthlyMaintenance,
    monthlyUtility,
    totalMonthlyHolding,
    annualTotal,
    breakdown,
  };
}
