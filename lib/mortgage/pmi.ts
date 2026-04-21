/**
 * PMI / MIP removal timeline calculator.
 *
 * Conventional loans: PMI auto-removed at 78% LTV (original value),
 * can request removal at 80% LTV.
 * FHA loans: MIP cannot be removed — must refinance to conventional with 20% equity.
 */

import type { MortgageInput } from './types';
import { MONTHS_PER_YEAR } from './constants';
import { calculateMonthlyPayment } from './calculator';

export interface PMIRemovalInput extends MortgageInput {
  /** Annual home appreciation rate as decimal. Default: 0.04 (4%) */
  appreciationRate?: number;
  /** Extra monthly principal payment. Default: 0 */
  extraMonthlyPrincipal?: number;
}

export interface PMIRemovalResult {
  /** Month when LTV reaches 78% based on original value (auto-removal) */
  monthToAutoRemove: number;
  /** Month when LTV reaches 80% based on original value (request removal) */
  monthToRequestRemove: number;
  /** Month when current appraised value × 0.80 >= balance (appreciation path) */
  monthToRemoveViaAppreciation: number;
  /** Total PMI paid from origination until earliest possible removal */
  totalPMIPaid: number;
  /** Months of PMI remaining from today (using earliest removal strategy) */
  monthsOfPMIRemaining: number;
  /** FHA loans — MIP not removable except via refi */
  isFHA: boolean;
  /** Plain-language recommendation in Vietnamese + English */
  recommendation: string;
}

/**
 * Calculate PMI removal timeline for conventional and FHA loans.
 *
 * @param input PMIRemovalInput — extends MortgageInput with appreciation + extra payment
 * @returns PMIRemovalResult with month targets and lifetime PMI cost
 *
 * @example
 * calculatePMIRemoval({ homePrice: 400000, downPayment: 40000, rate: 7, termYears: 30 })
 */
export function calculatePMIRemoval(input: PMIRemovalInput): PMIRemovalResult {
  const {
    homePrice,
    downPayment,
    rate,
    termYears,
    pmiRate = 0.5,
    appreciationRate = 0.04,
    extraMonthlyPrincipal = 0,
  } = input;

  const loanAmount = Math.max(0, homePrice - downPayment);
  const ltv = homePrice > 0 ? loanAmount / homePrice : 0;

  // No PMI needed — already at or below 80% LTV
  if (ltv <= 0.8) {
    return {
      monthToAutoRemove: 0,
      monthToRequestRemove: 0,
      monthToRemoveViaAppreciation: 0,
      totalPMIPaid: 0,
      monthsOfPMIRemaining: 0,
      isFHA: false,
      recommendation:
        'Bạn không cần PMI vì LTV <= 80%. / No PMI required — LTV is already at or below 80%.',
    };
  }

  // FHA detection: rate < 3.5% down OR pmiRate >= 0.85 are heuristics;
  // simplest check: FHA flag via pmiRate being unusually high (MIP is 0.85%)
  // We treat FHA = pmiRate >= 0.85 as a convention for this app
  const isFHA = pmiRate >= 0.85;

  const monthlyRate = rate / 100 / MONTHS_PER_YEAR;
  const totalMonths = termYears * MONTHS_PER_YEAR;
  const baseMonthlyPI = calculateMonthlyPayment(loanAmount, rate / 100, termYears);
  const effectiveMonthlyPayment = baseMonthlyPI + extraMonthlyPrincipal;
  const monthlyPMI = (loanAmount * (pmiRate / 100)) / MONTHS_PER_YEAR;

  let balance = loanAmount;
  let monthToAutoRemove = totalMonths; // fallback: full term
  let monthToRequestRemove = totalMonths;
  let totalPMIPaid = 0;
  let foundRequest = false;
  let foundAuto = false;

  // Simulate amortization to find schedule-based removal months
  for (let m = 1; m <= totalMonths; m++) {
    const interestPortion = balance * monthlyRate;
    const principalPortion = effectiveMonthlyPayment - interestPortion;
    balance = Math.max(0, balance - principalPortion);

    const currentLTV = homePrice > 0 ? balance / homePrice : 0;

    // PMI still active this month
    if (!foundAuto) {
      totalPMIPaid += monthlyPMI;
    }

    if (!foundRequest && currentLTV <= 0.8) {
      monthToRequestRemove = m;
      foundRequest = true;
    }

    if (!foundAuto && currentLTV <= 0.78) {
      monthToAutoRemove = m;
      foundAuto = true;
      break;
    }

    if (balance <= 0) break;
  }

  // Appreciation-based removal: find month where appraised value × 0.80 >= balance
  let appBalance = loanAmount;
  let monthToRemoveViaAppreciation = totalMonths;
  const monthlyAppreciation = Math.pow(1 + appreciationRate, 1 / MONTHS_PER_YEAR) - 1;

  for (let m = 1; m <= totalMonths; m++) {
    const interestPortion = appBalance * monthlyRate;
    const principalPortion = baseMonthlyPI + extraMonthlyPrincipal - interestPortion;
    appBalance = Math.max(0, appBalance - principalPortion);

    // Appraised value grows monthly
    const appraisedValue = homePrice * Math.pow(1 + monthlyAppreciation, m);
    const ltvOnAppraised = appraisedValue > 0 ? appBalance / appraisedValue : 1;

    if (ltvOnAppraised <= 0.8) {
      monthToRemoveViaAppreciation = m;
      break;
    }

    if (appBalance <= 0) break;
  }

  // Earliest removal month across all strategies
  const earliestMonth = Math.min(monthToRequestRemove, monthToRemoveViaAppreciation);
  const monthsOfPMIRemaining = Math.max(0, earliestMonth);

  let recommendation: string;
  if (isFHA) {
    recommendation =
      'Vay FHA: Phí MIP không thể xóa trừ khi tái tài trợ sang vay thông thường với 20% vốn chủ sở hữu. / FHA loan: MIP cannot be removed. Refinance to conventional once you reach 20% equity to eliminate MIP.';
  } else {
    const reqYrs = Math.floor(monthToRequestRemove / 12);
    const reqMos = monthToRequestRemove % 12;
    const appYrs = Math.floor(monthToRemoveViaAppreciation / 12);
    const appMos = monthToRemoveViaAppreciation % 12;
    recommendation =
      `PMI tự động xóa ở tháng ${monthToAutoRemove} (LTV 78%). ` +
      `Bạn có thể yêu cầu xóa ở tháng ${monthToRequestRemove} (${reqYrs} năm ${reqMos} tháng, LTV 80%). ` +
      `Hoặc với tốc độ tăng giá ${(appreciationRate * 100).toFixed(0)}%/năm, nhà đủ điều kiện thẩm định lại ở tháng ${monthToRemoveViaAppreciation} (${appYrs} năm ${appMos} tháng). / ` +
      `PMI auto-cancels at month ${monthToAutoRemove} (78% LTV). ` +
      `Request removal at month ${monthToRequestRemove} (${reqYrs}y ${reqMos}m, 80% LTV). ` +
      `With ${(appreciationRate * 100).toFixed(0)}%/yr appreciation, reappraisal qualifies at month ${monthToRemoveViaAppreciation} (${appYrs}y ${appMos}m).`;
  }

  return {
    monthToAutoRemove,
    monthToRequestRemove,
    monthToRemoveViaAppreciation,
    totalPMIPaid,
    monthsOfPMIRemaining,
    isFHA,
    recommendation,
  };
}
