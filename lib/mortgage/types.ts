// Mortgage calculator types
// NOTE: This file is a temporary placeholder — math agent will fill in real implementations

export type TermYears = 15 | 20 | 30;

export interface MortgageInput {
  homePrice: number;
  downPayment: number;
  rate: number;
  termYears: TermYears;
  // Advanced fields
  propertyTaxRate?: number; // percentage per year, e.g. 1.5
  insuranceYearly?: number; // dollars per year
  pmiRate?: number; // percentage per year, e.g. 0.5
  hoaMonthly?: number; // dollars per month
}

export interface PaymentBreakdown {
  monthlyPI: number; // principal + interest
  monthlyPMI: number;
  monthlyTax: number;
  monthlyInsurance: number;
  monthlyHOA: number;
  monthlyTotal: number;
  loanAmount: number;
  downAmount: number;
  ltv: number; // loan-to-value ratio as percentage
  totalInterest: number;
  totalPaid: number;
}

export interface Scenario {
  id: string;
  label: string;
  input: MortgageInput;
  breakdown: PaymentBreakdown;
}

export type WinnerType = "lowestMonthly" | "lowestTotalInterest" | "smallestDown";

export interface WinnerBadge {
  type: WinnerType;
  scenarioId: string;
  scenarioLabel: string;
}
