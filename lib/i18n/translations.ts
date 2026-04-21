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
  // Sprint 3 — Advanced Scenarios
  | "advancedAnalysis"
  | "showAdvanced"
  | "hideAdvanced"
  | "pmiTimeline"
  | "holdingCosts"
  | "acceleration"
  | "refinance"
  | "opportunityCost"
  | "pmiAutoRemove"
  | "pmiRequestRemove"
  | "pmiViaAppreciation"
  | "totalPmiPaid"
  | "hoaLabel"
  | "mudLabel"
  | "pidLabel"
  | "maintenanceLabel"
  | "utilitiesLabel"
  | "totalMonthlyHolding"
  | "extraMonthly"
  | "extraAnnual"
  | "biweekly"
  | "monthsSaved"
  | "interestSaved"
  | "cashFlowImpact"
  | "currentRate"
  | "newRate"
  | "newTerm"
  | "closingCosts"
  | "breakEven"
  | "monthlySavings"
  | "lifetimeInterestDiff"
  | "refiRecommendation"
  | "investmentReturn"
  | "holdYears"
  | "investmentValueAtEnd"
  | "foregoneGains";

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
  // Sprint 3 — Advanced Scenarios
  advancedAnalysis: "Phân Tích Nâng Cao",
  showAdvanced: "Xem phân tích nâng cao",
  hideAdvanced: "Ẩn phân tích nâng cao",
  pmiTimeline: "Lộ Trình Xóa PMI",
  holdingCosts: "Chi Phí Giữ Nhà",
  acceleration: "Trả Nhanh",
  refinance: "Tái Tài Trợ",
  opportunityCost: "Chi Phí Cơ Hội",
  pmiAutoRemove: "Tự động xóa (LTV 78%)",
  pmiRequestRemove: "Yêu cầu xóa (LTV 80%)",
  pmiViaAppreciation: "Xóa qua thẩm định lại",
  totalPmiPaid: "Tổng PMI đã trả",
  hoaLabel: "Phí HOA",
  mudLabel: "Thuế MUD",
  pidLabel: "Phí PID",
  maintenanceLabel: "Dự phòng bảo trì",
  utilitiesLabel: "Điện nước",
  totalMonthlyHolding: "Tổng chi phí hàng tháng",
  extraMonthly: "Trả thêm hàng tháng",
  extraAnnual: "Trả lump hàng năm",
  biweekly: "Trả 2 tuần/lần",
  monthsSaved: "Tiết kiệm thời gian",
  interestSaved: "Tiết kiệm lãi suất",
  cashFlowImpact: "Tăng chi tiêu hàng tháng",
  currentRate: "Lãi suất hiện tại",
  newRate: "Lãi suất mới",
  newTerm: "Kỳ hạn mới",
  closingCosts: "Chi phí đóng",
  breakEven: "Điểm hoà vốn",
  monthlySavings: "Tiết kiệm hàng tháng",
  lifetimeInterestDiff: "Chênh lệch lãi suất kỳ hạn",
  refiRecommendation: "Khuyến nghị tái tài trợ",
  investmentReturn: "Lợi nhuận đầu tư",
  holdYears: "Số năm nắm giữ",
  investmentValueAtEnd: "Giá trị sau kỳ hạn",
  foregoneGains: "Lợi nhuận bị bỏ lỡ",
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
  // Sprint 3 — Advanced Scenarios
  advancedAnalysis: "Advanced Analysis",
  showAdvanced: "Show advanced analysis",
  hideAdvanced: "Hide advanced analysis",
  pmiTimeline: "PMI Removal Timeline",
  holdingCosts: "Holding Costs",
  acceleration: "Payoff Acceleration",
  refinance: "Refinance",
  opportunityCost: "Opportunity Cost",
  pmiAutoRemove: "Auto-cancel (78% LTV)",
  pmiRequestRemove: "Request removal (80% LTV)",
  pmiViaAppreciation: "Via reappraisal",
  totalPmiPaid: "Total PMI paid",
  hoaLabel: "HOA Fees",
  mudLabel: "MUD Tax",
  pidLabel: "PID Assessment",
  maintenanceLabel: "Maintenance Reserve",
  utilitiesLabel: "Utilities",
  totalMonthlyHolding: "Total Monthly Holding",
  extraMonthly: "Extra Monthly Principal",
  extraAnnual: "Annual Lump Sum",
  biweekly: "Biweekly Payments",
  monthsSaved: "Time Saved",
  interestSaved: "Interest Saved",
  cashFlowImpact: "Monthly Cash Flow Impact",
  currentRate: "Current Rate",
  newRate: "New Rate",
  newTerm: "New Term",
  closingCosts: "Closing Costs",
  breakEven: "Break-Even",
  monthlySavings: "Monthly Savings",
  lifetimeInterestDiff: "Lifetime Interest Difference",
  refiRecommendation: "Refi Recommendation",
  investmentReturn: "Investment Return",
  holdYears: "Hold Years",
  investmentValueAtEnd: "Value at End of Period",
  foregoneGains: "Foregone Gains",
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const translations: Record<Language, Translations> = { vi, en };

/** Convenience t() function for use outside React */
export function translate(lang: Language, key: TranslationKey): string {
  return translations[lang][key] ?? key;
}
