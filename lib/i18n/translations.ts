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
  | "addFirst";

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
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const translations: Record<Language, Translations> = { vi, en };

/** Convenience t() function for use outside React */
export function translate(lang: Language, key: TranslationKey): string {
  return translations[lang][key] ?? key;
}
