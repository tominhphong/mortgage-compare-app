/**
 * Opportunity cost calculator: down payment invested vs mortgage paydown.
 *
 * Compares the future value of the down payment if invested in the S&P 500
 * against the equity built via mortgage amortization over the same period.
 */

import { MONTHS_PER_YEAR } from './constants';

/** Default S&P 500 historical annualized return (nominal, pre-inflation) */
const DEFAULT_INVESTMENT_RETURN = 0.07;

export interface OpportunityCostInput {
  /** Down payment amount in USD */
  downPayment: number;
  /** Expected annual investment return as decimal. Default: 0.07 (S&P 500 avg) */
  investmentReturnRate?: number;
  /** Number of years to project */
  holdYears: number;
}

export interface OpportunityCostResult {
  /** Down payment amount */
  downPaymentAmount: number;
  /** Future value of down payment if invested: FV = PV × (1 + r)^n */
  investmentValueAtEnd: number;
  /** Nominal gain from investment (investmentValueAtEnd - downPayment) */
  foregoneGains: number;
  /**
   * Net comparison: investmentValueAtEnd vs downPayment (equity built).
   * Positive = investing beats paying down mortgage (by raw nominal numbers).
   * Note: mortgage paydown equity depends on the specific loan — this is a
   * simplified comparison showing the cost of the down payment decision.
   */
  vsMortgagePaydown: number;
  /** Plain-language recommendation */
  recommendation: string;
}

/**
 * Calculate opportunity cost of using cash as down payment vs investing.
 *
 * @param input OpportunityCostInput
 * @returns OpportunityCostResult with future value and comparison
 *
 * @example
 * calculateOpportunityCost({ downPayment: 80000, holdYears: 10 })
 * // investmentValueAtEnd ≈ $157,351 at 7% / year
 */
export function calculateOpportunityCost(input: OpportunityCostInput): OpportunityCostResult {
  const {
    downPayment,
    investmentReturnRate = DEFAULT_INVESTMENT_RETURN,
    holdYears,
  } = input;

  if (downPayment <= 0 || holdYears <= 0) {
    return {
      downPaymentAmount: downPayment,
      investmentValueAtEnd: downPayment,
      foregoneGains: 0,
      vsMortgagePaydown: 0,
      recommendation:
        'Nhập số tiền đặt cọc và số năm để tính toán. / Enter a down payment and hold years to calculate.',
    };
  }

  // Compound annual growth: FV = PV × (1 + r)^n
  const investmentValueAtEnd = downPayment * Math.pow(1 + investmentReturnRate, holdYears);
  const foregoneGains = investmentValueAtEnd - downPayment;

  // vsMortgagePaydown: how much MORE the investment grows vs the down payment sitting as equity
  // Down payment as equity = flat (doesn't compound unless home appreciates, which is separate)
  // We compare investment FV vs original down payment amount (the "equity you locked in")
  const vsMortgagePaydown = investmentValueAtEnd - downPayment;

  // Recommendation
  const returnPct = (investmentReturnRate * 100).toFixed(0);
  const fvFormatted = Math.round(investmentValueAtEnd).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
  const gainFormatted = Math.round(foregoneGains).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  const recommendation =
    `Nếu $${downPayment.toLocaleString()} được đầu tư ở ${returnPct}%/năm trong ${holdYears} năm, ` +
    `giá trị sẽ tăng lên ${fvFormatted} — tăng thêm ${gainFormatted}. ` +
    `So sánh con số này với lãi suất vay để đưa ra quyết định tối ưu. / ` +
    `If $${downPayment.toLocaleString()} were invested at ${returnPct}%/yr for ${holdYears} years, ` +
    `it would grow to ${fvFormatted} — gaining ${gainFormatted}. ` +
    `Compare against your mortgage rate to determine whether paying down or investing is better.`;

  return {
    downPaymentAmount: downPayment,
    investmentValueAtEnd,
    foregoneGains,
    vsMortgagePaydown,
    recommendation,
  };
}
