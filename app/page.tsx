"use client";

import * as React from "react";
import { CompareView } from "@/components/mortgage/CompareView";
import { DecisionSummary } from "@/components/mortgage/DecisionSummary";
import { LanguageToggle, type Language } from "@/components/mortgage/LanguageToggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { AffordabilityPanel } from "@/components/mortgage/AffordabilityPanel";
import type { Scenario, MortgageInput, PaymentBreakdown } from "@/lib/mortgage/types";

// ---------------------------------------------------------------------------
// Mock math helpers — placeholder until math agent provides lib/mortgage/calc
// ---------------------------------------------------------------------------
function calcBreakdown(input: MortgageInput): PaymentBreakdown {
  const { homePrice, downPayment, rate, termYears } = input;
  const loanAmount = homePrice - downPayment;
  const monthlyRate = rate / 100 / 12;
  const numPayments = termYears * 12;

  // P&I using standard amortisation formula
  let monthlyPI = 0;
  if (monthlyRate === 0) {
    monthlyPI = loanAmount / numPayments;
  } else {
    monthlyPI =
      (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);
  }

  const ltv = loanAmount > 0 ? (loanAmount / homePrice) * 100 : 0;

  // PMI: if provided use it, otherwise auto 0.5% when LTV > 80
  const effectivePMIRate =
    input.pmiRate ?? (ltv > 80 ? 0.5 : 0);
  const monthlyPMI = (loanAmount * (effectivePMIRate / 100)) / 12;

  const monthlyTax = input.propertyTaxRate
    ? (homePrice * (input.propertyTaxRate / 100)) / 12
    : 0;
  const monthlyInsurance = input.insuranceYearly
    ? input.insuranceYearly / 12
    : 0;
  const monthlyHOA = input.hoaMonthly ?? 0;

  const monthlyTotal =
    monthlyPI + monthlyPMI + monthlyTax + monthlyInsurance + monthlyHOA;

  const totalPaid = monthlyTotal * numPayments;
  const totalInterest = monthlyPI * numPayments - loanAmount;

  return {
    monthlyPI: Math.round(monthlyPI),
    monthlyPMI: Math.round(monthlyPMI),
    monthlyTax: Math.round(monthlyTax),
    monthlyInsurance: Math.round(monthlyInsurance),
    monthlyHOA: Math.round(monthlyHOA),
    monthlyTotal: Math.round(monthlyTotal),
    loanAmount: Math.round(loanAmount),
    downAmount: Math.round(downPayment),
    ltv: Math.round(ltv * 10) / 10,
    totalInterest: Math.round(totalInterest),
    totalPaid: Math.round(totalPaid),
  };
}

// ---------------------------------------------------------------------------
// Default mock scenarios
// ---------------------------------------------------------------------------
const DEFAULT_INPUTS: { id: string; label: string; input: MortgageInput }[] = [
  {
    id: "sc-1",
    label: "Kịch bản A",
    input: {
      homePrice: 400000,
      downPayment: 40000, // 10% down
      rate: 7.0,
      termYears: 30,
      propertyTaxRate: 1.5,
      insuranceYearly: 1200,
    },
  },
  {
    id: "sc-2",
    label: "Kịch bản B",
    input: {
      homePrice: 400000,
      downPayment: 80000, // 20% down
      rate: 6.5,
      termYears: 30,
      propertyTaxRate: 1.5,
      insuranceYearly: 1200,
    },
  },
];

function buildScenarios(
  items: typeof DEFAULT_INPUTS
): Scenario[] {
  return items.map(({ id, label, input }) => ({
    id,
    label,
    input,
    breakdown: calcBreakdown(input),
  }));
}

let nextId = DEFAULT_INPUTS.length + 1;
const LABELS = ["Kịch bản A", "Kịch bản B", "Kịch bản C", "Kịch bản D"];

export default function HomePage() {
  const [scenarioItems, setScenarioItems] = React.useState(DEFAULT_INPUTS);
  const [language, setLanguage] = React.useState<Language>("vi");

  const scenarios = buildScenarios(scenarioItems);

  function handleUpdate(id: string, input: MortgageInput) {
    setScenarioItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, input } : s))
    );
  }

  function handleAdd() {
    if (scenarioItems.length >= 4) return;
    const idx = scenarioItems.length;
    setScenarioItems((prev) => [
      ...prev,
      {
        id: `sc-${nextId++}`,
        label: LABELS[idx] ?? `Kịch bản ${idx + 1}`,
        input: {
          homePrice: 400000,
          downPayment: 80000,
          rate: 6.75,
          termYears: 30,
          propertyTaxRate: 1.5,
          insuranceYearly: 1200,
        },
      },
    ]);
  }

  function handleRemove(id: string) {
    setScenarioItems((prev) => prev.filter((s) => s.id !== id));
  }

  function handleReset() {
    setScenarioItems(DEFAULT_INPUTS);
    nextId = DEFAULT_INPUTS.length + 1;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <h1 className="text-base font-bold sm:text-lg">
              So Sánh Vay Mua Nhà
            </h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Mortgage Scenario Comparator
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle language={language} onChange={setLanguage} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <CompareView
            scenarios={scenarios}
            onUpdate={handleUpdate}
            onAdd={handleAdd}
            onRemove={handleRemove}
            onReset={handleReset}
          />

          <DecisionSummary scenarios={scenarios} />

          {/* Affordability panels — one per scenario, collapsible */}
          {scenarios.length > 0 && (
            <section className="flex flex-col gap-4">
              <div>
                <h2 className="text-base font-semibold">
                  {language === "vi" ? "Kiểm Tra Khả Năng Tài Chính" : "Affordability Check"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {language === "vi"
                    ? "DTI · Quy tắc 28/36 · Dự phòng tiền mặt (mỗi kịch bản)"
                    : "DTI · 28/36 Rule · Cash Reserves (per scenario)"}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {scenarios.map((scenario) => (
                  <AffordabilityPanel
                    key={scenario.id}
                    breakdown={scenario.breakdown}
                    scenarioLabel={scenario.label}
                    language={language}
                    defaultCollapsed={true}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
