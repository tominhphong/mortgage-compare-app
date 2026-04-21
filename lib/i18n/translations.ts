/**
 * translations.ts
 * VN/EN translation strings for mortgage compare app.
 * Vietnamese is primary (Phong's DFW Vietnamese-American clients).
 * Realtor-friendly tone — clear, professional, approachable.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Language = "vi" | "en";

export type TranslationKey =
  | "homePrice"
  | "downPayment"
  | "rate"
  | "termYears"
  | "monthlyPayment"
  | "totalInterest"
  | "pmi"
  | "propertyTax"
  | "insurance"
  | "hoa"
  | "addScenario"
  | "reset"
  | "compare"
  | "lowestMonthly"
  | "lowestTotalInterest"
  | "smallestDown"
  | "shareLink"
  | "printReport"
  | "scenarioLabel"
  | "removeScenario"
  | "language"
  | "appTitle"
  | "appSubtitle"
  | "totalCost"
  | "loanAmount"
  | "copySuccess"
  | "copyFail"
  | "recommended"
  | "termYearsUnit"
  | "perMonth"
  | "saving"
  | "noScenarios"
  | "addFirst"
  // TCO keys
  | "tcoTitle"
  | "tcoHoldYears"
  | "tcoTrueMonthly"
  | "tcoNetEquity"
  | "tcoMortgagePayments"
  | "tcoMaintenance"
  | "tcoUtilities"
  | "tcoTaxBenefits"
  | "tcoGrossCost"
  | "tcoNetCost"
  | "tcoHomeValue"
  // Tax keys
  | "taxTitle"
  | "taxFilingStatus"
  | "taxMarginalRate"
  | "taxMCC"
  | "taxItemize"
  | "taxStandard"
  | "taxAnnualBenefit"
  | "taxEffectiveRate"
  | "taxInterestDeduction"
  | "taxSaltDeduction"
  // Rent vs Buy keys
  | "rvbTitle"
  | "rvbMonthlyRent"
  | "rvbRentGrowth"
  | "rvbBreakEven"
  | "rvbBuy"
  | "rvbRent"
  | "rvbNeutral"
  | "rvbOpportunityCost";

export type Translations = Record<TranslationKey, string>;

// ---------------------------------------------------------------------------
// Vietnamese (primary — realtor-friendly DFW style)
// ---------------------------------------------------------------------------

const vi: Translations = {
  appTitle: "So Sánh Khoản Vay Nhà",
  appSubtitle: "Tính toán và so sánh các kịch bản vay mua nhà tại DFW",
  homePrice: "Giá Nhà",
  downPayment: "Tiền Đặt Cọc",
  rate: "Lãi Suất (%/năm)",
  termYears: "Thời Hạn Vay",
  termYearsUnit: "năm",
  loanAmount: "Số Tiền Vay",
  monthlyPayment: "Trả Hàng Tháng",
  totalInterest: "Tổng Tiền Lãi",
  totalCost: "Tổng Chi Phí",
  pmi: "Bảo Hiểm PMI/MIP",
  propertyTax: "Thuế Bất Động Sản",
  insurance: "Bảo Hiểm Nhà",
  hoa: "Phí HOA",
  addScenario: "Thêm Kịch Bản",
  reset: "Đặt Lại",
  compare: "So Sánh",
  lowestMonthly: "Trả Hàng Tháng Thấp Nhất",
  lowestTotalInterest: "Tổng Lãi Thấp Nhất",
  smallestDown: "Tiền Đặt Cọc Ít Nhất",
  shareLink: "Chia Sẻ Link",
  printReport: "In Báo Cáo",
  scenarioLabel: "Tên Kịch Bản",
  removeScenario: "Xóa",
  language: "Ngôn Ngữ",
  copySuccess: "Đã sao chép link!",
  copyFail: "Không thể sao chép. Vui lòng copy thủ công.",
  recommended: "Đề Xuất",
  perMonth: "/tháng",
  saving: "Tiết kiệm",
  noScenarios: "Chưa có kịch bản nào",
  addFirst: "Nhấn 'Thêm Kịch Bản' để bắt đầu so sánh",
  // TCO
  tcoTitle: "Tổng Chi Phí Sở Hữu (TCO)",
  tcoHoldYears: "Thời gian giữ nhà",
  tcoTrueMonthly: "Chi phí thực hàng tháng",
  tcoNetEquity: "Vốn chủ sở hữu ròng",
  tcoMortgagePayments: "Tổng trả nợ vay",
  tcoMaintenance: "Bảo trì",
  tcoUtilities: "Tiện ích",
  tcoTaxBenefits: "Lợi ích thuế",
  tcoGrossCost: "Tổng chi phí thô",
  tcoNetCost: "Chi phí ròng",
  tcoHomeValue: "Giá trị nhà cuối kỳ",
  // Tax
  taxTitle: "Lợi Ích Thuế 2026",
  taxFilingStatus: "Tình trạng hộ khẩu",
  taxMarginalRate: "Thuế suất cận biên",
  taxMCC: "Chứng chỉ tín dụng thế chấp (MCC)",
  taxItemize: "Nên liệt kê khấu trừ",
  taxStandard: "Nên dùng khấu trừ tiêu chuẩn",
  taxAnnualBenefit: "Tổng lợi ích thuế hàng năm",
  taxEffectiveRate: "Lãi suất hiệu dụng sau thuế",
  taxInterestDeduction: "Khấu trừ tiền lãi",
  taxSaltDeduction: "Khấu trừ thuế địa phương (SALT)",
  // Rent vs Buy
  rvbTitle: "Thuê vs Mua",
  rvbMonthlyRent: "Tiền thuê hiện tại",
  rvbRentGrowth: "Tốc độ tăng tiền thuê",
  rvbBreakEven: "Điểm hoà vốn",
  rvbBuy: "Nên Mua",
  rvbRent: "Nên Thuê",
  rvbNeutral: "Trung Lập",
  rvbOpportunityCost: "Chi phí cơ hội",
};

// ---------------------------------------------------------------------------
// English
// ---------------------------------------------------------------------------

const en: Translations = {
  appTitle: "Mortgage Comparison Tool",
  appSubtitle: "Calculate and compare mortgage scenarios for your DFW home",
  homePrice: "Home Price",
  downPayment: "Down Payment",
  rate: "Interest Rate (%/yr)",
  termYears: "Loan Term",
  termYearsUnit: "years",
  loanAmount: "Loan Amount",
  monthlyPayment: "Monthly Payment",
  totalInterest: "Total Interest",
  totalCost: "Total Cost",
  pmi: "PMI / MIP",
  propertyTax: "Property Tax",
  insurance: "Home Insurance",
  hoa: "HOA Fees",
  addScenario: "Add Scenario",
  reset: "Reset",
  compare: "Compare",
  lowestMonthly: "Lowest Monthly Payment",
  lowestTotalInterest: "Lowest Total Interest",
  smallestDown: "Smallest Down Payment",
  shareLink: "Share Link",
  printReport: "Print Report",
  scenarioLabel: "Scenario Name",
  removeScenario: "Remove",
  language: "Language",
  copySuccess: "Link copied!",
  copyFail: "Could not copy. Please copy manually.",
  recommended: "Best Pick",
  perMonth: "/mo",
  saving: "Saves",
  noScenarios: "No scenarios yet",
  addFirst: "Click 'Add Scenario' to start comparing",
  // TCO
  tcoTitle: "Total Cost of Ownership (TCO)",
  tcoHoldYears: "Hold period",
  tcoTrueMonthly: "True monthly cost",
  tcoNetEquity: "Net equity",
  tcoMortgagePayments: "Total mortgage payments",
  tcoMaintenance: "Maintenance",
  tcoUtilities: "Utilities",
  tcoTaxBenefits: "Tax benefits",
  tcoGrossCost: "Gross cost",
  tcoNetCost: "Net cost",
  tcoHomeValue: "Home value at end",
  // Tax
  taxTitle: "2026 Tax Implications",
  taxFilingStatus: "Filing status",
  taxMarginalRate: "Marginal tax rate",
  taxMCC: "Mortgage Credit Certificate (MCC)",
  taxItemize: "Recommend itemizing",
  taxStandard: "Recommend standard deduction",
  taxAnnualBenefit: "Total annual tax benefit",
  taxEffectiveRate: "Effective rate after tax",
  taxInterestDeduction: "Interest deduction",
  taxSaltDeduction: "SALT deduction (capped $10K)",
  // Rent vs Buy
  rvbTitle: "Rent vs Buy",
  rvbMonthlyRent: "Current monthly rent",
  rvbRentGrowth: "Annual rent growth",
  rvbBreakEven: "Break-even point",
  rvbBuy: "Buy",
  rvbRent: "Rent",
  rvbNeutral: "Neutral",
  rvbOpportunityCost: "Opportunity cost",
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const translations: Record<Language, Translations> = { vi, en };

/** Convenience t() function for use outside React */
export function translate(lang: Language, key: TranslationKey): string {
  return translations[lang][key] ?? key;
}
