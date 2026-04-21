/**
 * Rent vs Buy break-even calculator.
 * Year-by-year cumulative cost comparison accounting for:
 * - Appreciation, equity build-up, opportunity cost of down payment
 * - Rent growth, investment returns on invested down payment
 *
 * DFW defaults: 4% appreciation, 3% rent growth, 7% S&P opportunity cost.
 */

import type { PaymentBreakdown } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RentVsBuyInput {
  /** Purchase price of the home */
  homePrice: number;
  /** Down payment amount in USD */
  downPayment: number;
  /** Computed payment breakdown from calculator */
  breakdown: PaymentBreakdown;
  /** Current monthly rent the buyer is paying */
  currentMonthlyRent: number;
  /** Annual rent growth rate (default 3%) */
  annualRentGrowth?: number;
  /** Annual home appreciation rate (default 4%) */
  appreciationRate?: number;
  /** Maximum years to simulate (default 30) */
  holdYearsMax?: number;
  /** Annual investment return rate for opportunity cost (default 7% S&P) */
  investmentReturnRate?: number;
  /** Annual maintenance as % of home price (default 1.5%) */
  maintenancePercent?: number;
  /** Annual inflation for maintenance/utilities (default 3%) */
  inflationRate?: number;
}

export interface RentVsBuyResult {
  /** Month number when cumulative buying cost < cumulative renting cost, or null */
  breakEvenMonth: number | null;
  /** Year of break-even (breakEvenMonth / 12, rounded up), or null */
  breakEvenYear: number | null;
  /** Cumulative net cost of owning per year (array index = year 1..holdYearsMax) */
  cumulativeNetOwningCost: number[];
  /** Cumulative net cost of renting per year */
  cumulativeRentingCost: number[];
  /** What the down payment would have grown to if invested instead */
  opportunityCost: number;
  /** 'buy' | 'rent' | 'neutral' — recommendation at holdYearsMax */
  recommendation: 'buy' | 'rent' | 'neutral';
  /** Plain-English summary of the recommendation */
  summary: string;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_RENT_GROWTH = 0.03;
const DEFAULT_APPRECIATION = 0.04;
const DEFAULT_HOLD_YEARS_MAX = 30;
const DEFAULT_INVESTMENT_RETURN = 0.07;
const DEFAULT_MAINTENANCE_PERCENT = 1.5;
const DEFAULT_INFLATION = 0.03;
const SALE_COST_RATE = 0.06;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format USD for summary strings */
function fmtK(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Compute year-by-year cumulative cost comparison for renting vs buying.
 *
 * Buying annual cost includes:
 *   - Mortgage PITI payments
 *   - Maintenance (inflation-adjusted)
 *   - Minus equity gain (appreciation + principal paydown)
 *   - Minus opportunity cost benefit of equity (already captured in net equity)
 *
 * Renting annual cost includes:
 *   - Annual rent (with growth)
 *   - Minus the investment return on the down payment invested in S&P
 *
 * Break-even = first year cumulative buying < cumulative renting.
 *
 * @example
 * calculateRentVsBuy({
 *   homePrice: 400000,
 *   downPayment: 80000,
 *   breakdown,
 *   currentMonthlyRent: 2200,
 * })
 */
export function calculateRentVsBuy(input: RentVsBuyInput): RentVsBuyResult {
  const {
    homePrice,
    downPayment,
    breakdown,
    currentMonthlyRent,
    annualRentGrowth = DEFAULT_RENT_GROWTH,
    appreciationRate = DEFAULT_APPRECIATION,
    holdYearsMax = DEFAULT_HOLD_YEARS_MAX,
    investmentReturnRate = DEFAULT_INVESTMENT_RETURN,
    maintenancePercent = DEFAULT_MAINTENANCE_PERCENT,
    inflationRate = DEFAULT_INFLATION,
  } = input;

  const loanAmount = breakdown.loanAmount;
  const monthlyRate = loanAmount > 0
    ? deriveMonthlyRateFromPayment(loanAmount, breakdown.monthlyPI, breakdown.loanAmount > 0 ? 360 : 1)
    : 0;

  const cumulativeNetOwningCost: number[] = [];
  const cumulativeRentingCost: number[] = [];

  let cumOwning = 0;        // cumulative gross cost of owning
  let cumRenting = 0;       // cumulative gross cost of renting
  let investedDownPayment = downPayment; // hypothetical invested down payment (renting scenario)
  let loanBalance = loanAmount;
  let breakEvenMonth: number | null = null;

  for (let year = 1; year <= holdYearsMax; year++) {
    // --- OWNING: annual costs ---
    // Mortgage PITI for the year
    const annualMortgage = breakdown.monthlyTotal * 12;

    // Maintenance (inflation-adjusted)
    const annualMaintenance =
      homePrice * (maintenancePercent / 100) * Math.pow(1 + inflationRate, year - 1);

    // Gross owning cost this year
    const grossOwningYear = annualMortgage + annualMaintenance;

    // Equity value at end of year: appreciation minus remaining balance minus sale costs
    const homeValueNow = homePrice * Math.pow(1 + appreciationRate, year);
    // Remaining balance after year payments
    loanBalance = calcRemainingBalance(loanAmount, monthlyRate, breakdown.monthlyPI, year * 12);
    const saleCosts = homeValueNow * SALE_COST_RATE;
    const equityNow = Math.max(0, homeValueNow - loanBalance - saleCosts);

    // Net owning cost = gross paid so far - equity built vs initial down payment
    cumOwning += grossOwningYear;
    const equityGain = Math.max(0, equityNow - downPayment);
    const netOwningCum = Math.max(0, cumOwning - equityGain);

    cumulativeNetOwningCost.push(netOwningCum);

    // --- RENTING: annual costs ---
    // Rent this year (grows each year)
    const annualRent = currentMonthlyRent * 12 * Math.pow(1 + annualRentGrowth, year - 1);
    cumRenting += annualRent;

    // Down payment invested at investmentReturnRate (compound)
    investedDownPayment = downPayment * Math.pow(1 + investmentReturnRate, year);
    const investmentGain = Math.max(0, investedDownPayment - downPayment);

    // Net renting cost = cumulative rent - investment gains on down payment
    const netRentingCum = Math.max(0, cumRenting - investmentGain);

    cumulativeRentingCost.push(netRentingCum);

    // --- Break-even detection (month granularity via linear interpolation) ---
    if (breakEvenMonth === null) {
      const prevOwning = year > 1 ? cumulativeNetOwningCost[year - 2] : downPayment;
      const prevRenting = year > 1 ? cumulativeRentingCost[year - 2] : 0;

      if (netOwningCum <= netRentingCum) {
        if (year === 1) {
          breakEvenMonth = 1;
        } else {
          // Linear interpolation within the year
          const owningDelta = netOwningCum - prevOwning;
          const rentingDelta = netRentingCum - prevRenting;
          const gap = prevOwning - prevRenting;
          const slope = rentingDelta - owningDelta;
          const fraction = slope > 0 ? gap / slope : 0.5;
          breakEvenMonth = Math.max(1, Math.round((year - 1 + Math.min(1, Math.max(0, fraction))) * 12));
        }
      }
    }
  }

  const breakEvenYear =
    breakEvenMonth !== null ? Math.ceil(breakEvenMonth / 12) : null;

  // --- Opportunity cost (what down payment grows to if invested) ---
  const opportunityCost = downPayment * Math.pow(1 + investmentReturnRate, holdYearsMax);

  // --- Recommendation ---
  const finalOwning = cumulativeNetOwningCost[holdYearsMax - 1] ?? Infinity;
  const finalRenting = cumulativeRentingCost[holdYearsMax - 1] ?? Infinity;
  const diff = finalRenting - finalOwning;
  const threshold = finalRenting * 0.05; // 5% threshold for "neutral"

  let recommendation: 'buy' | 'rent' | 'neutral';
  if (Math.abs(diff) <= threshold) {
    recommendation = 'neutral';
  } else if (diff > 0) {
    recommendation = 'buy';
  } else {
    recommendation = 'rent';
  }

  // --- Summary ---
  let summary: string;
  if (recommendation === 'buy') {
    const savings = fmtK(Math.abs(diff));
    summary = breakEvenYear
      ? `Mua nhà có lợi hơn sau năm thứ ${breakEvenYear}. Sau ${holdYearsMax} năm, tiết kiệm được khoảng ${savings} so với thuê nhà.`
      : `Buying is more cost-effective — saves ~${savings} over ${holdYearsMax} years vs renting.`;
  } else if (recommendation === 'rent') {
    const savings = fmtK(Math.abs(diff));
    summary = `Thuê nhà có lợi hơn trong ${holdYearsMax} năm này — tiết kiệm ${savings} khi đầu tư tiền đặt cọc vào S&P 500.`;
  } else {
    summary = `Chi phí mua và thuê tương đương nhau sau ${holdYearsMax} năm. Quyết định phụ thuộc vào lối sống và kế hoạch dài hạn.`;
  }

  return {
    breakEvenMonth,
    breakEvenYear,
    cumulativeNetOwningCost,
    cumulativeRentingCost,
    opportunityCost,
    recommendation,
    summary,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Remaining balance after N months (standard amortization formula) */
function calcRemainingBalance(
  principal: number,
  monthlyRate: number,
  monthlyPayment: number,
  monthsPaid: number,
): number {
  if (principal <= 0) return 0;
  if (monthlyRate === 0) return Math.max(0, principal - monthlyPayment * monthsPaid);
  const factor = Math.pow(1 + monthlyRate, monthsPaid);
  return Math.max(0, principal * factor - monthlyPayment * ((factor - 1) / monthlyRate));
}

/**
 * Derive monthly rate from loan parameters (Newton-Raphson).
 * Needed because PaymentBreakdown doesn't store the rate directly.
 */
function deriveMonthlyRateFromPayment(
  principal: number,
  payment: number,
  n: number,
): number {
  if (principal <= 0 || payment <= 0) return 0;
  if (Math.abs(payment * n - principal) < 0.01) return 0;

  let r = Math.max(0.001, payment / principal - 1 / n);

  for (let i = 0; i < 100; i++) {
    const factor = Math.pow(1 + r, n);
    const f = principal * r * factor - payment * (factor - 1);
    const fPrime =
      principal * (factor + r * n * Math.pow(1 + r, n - 1)) -
      payment * n * Math.pow(1 + r, n - 1);
    if (Math.abs(fPrime) < 1e-15) break;
    const rNext = r - f / fPrime;
    if (Math.abs(rNext - r) < 1e-12) { r = rNext; break; }
    r = Math.max(0, rNext);
  }

  return Math.max(0, r);
}
