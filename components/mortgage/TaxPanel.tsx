"use client";

/**
 * TaxPanel — 2026 mortgage tax implications panel.
 * Inputs: filing status, marginal tax rate, MCC toggle.
 * Outputs: itemize vs standard recommendation, annual benefit, effective rate.
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calculateTaxImpact } from "@/lib/mortgage/tax";
import type { TaxInput } from "@/lib/mortgage/tax";
import { buildAmortizationSchedule, buildScenario } from "@/lib/mortgage/calculator";
import type { MortgageInput } from "@/lib/mortgage/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function pct(n: number, decimals = 2): string {
  return `${n.toFixed(decimals)}%`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InfoRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: "green" | "red" | "blue";
}) {
  const colorClass =
    accent === "green"
      ? "text-green-600 dark:text-green-400"
      : accent === "red"
        ? "text-red-600 dark:text-red-400"
        : accent === "blue"
          ? "text-blue-600 dark:text-blue-400"
          : "text-foreground";

  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground leading-tight">{label}</span>
      <span className={`font-semibold tabular-nums shrink-0 ${colorClass}`}>
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface TaxPanelProps {
  mortgageInput: MortgageInput;
}

const TAX_RATES = [0.1, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37] as const;
const MCC_RATES = [0.2, 0.25, 0.3, 0.35, 0.4, 0.5] as const;

export function TaxPanel({ mortgageInput }: TaxPanelProps) {
  const [filingStatus, setFilingStatus] = React.useState<"single" | "married">(
    "married"
  );
  const [marginalRate, setMarginalRate] = React.useState(0.24);
  const [hasMCC, setHasMCC] = React.useState(false);
  const [mccRate, setMccRate] = React.useState(0.2);

  // Derive first-year interest from amortization schedule
  const taxResult = React.useMemo(() => {
    const breakdown = buildScenario(mortgageInput);
    const schedule = buildAmortizationSchedule(breakdown, mortgageInput.termYears, 1);
    const firstYearInterest = schedule.reduce((sum, e) => sum + e.interest, 0);
    const annualPropertyTax =
      mortgageInput.homePrice *
      ((mortgageInput.propertyTaxRate ?? 2.1) / 100);

    const taxInput: TaxInput = {
      filingStatus,
      marginalTaxRate: marginalRate,
      firstYearInterest,
      annualPropertyTax,
      otherSALT: 0, // Texas: no state income tax
      hasMCC,
      mccRate,
      loanBalance: breakdown.loanAmount,
    };

    return calculateTaxImpact(taxInput, mortgageInput.rate);
  }, [mortgageInput, filingStatus, marginalRate, hasMCC, mccRate]);

  return (
    <Card>
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-base">
          Lợi Ích Thuế 2026
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            / Tax Implications
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-5 pt-4">
        {/* --- Inputs --- */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Filing status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Tình trạng hộ khẩu / Filing Status
            </label>
            <div className="flex gap-1">
              {(["married", "single"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilingStatus(s)}
                  className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    filingStatus === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {s === "married" ? "Kết hôn / Married" : "Độc thân / Single"}
                </button>
              ))}
            </div>
          </div>

          {/* Marginal tax rate */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Thuế suất cận biên / Marginal Rate
            </label>
            <div className="flex flex-wrap gap-1">
              {TAX_RATES.map((r) => (
                <button
                  key={r}
                  onClick={() => setMarginalRate(r)}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    marginalRate === r
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {(r * 100).toFixed(0)}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MCC toggle */}
        <div className="rounded-lg border bg-muted/20 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                Mortgage Credit Certificate (MCC)
              </p>
              <p className="text-xs text-muted-foreground">
                Tín dụng thuế trực tiếp — chương trình hỗ trợ người mua nhà lần đầu
              </p>
            </div>
            <button
              onClick={() => setHasMCC((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                hasMCC ? "bg-primary" : "bg-muted"
              }`}
              role="switch"
              aria-checked={hasMCC}
            >
              <span
                className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${
                  hasMCC ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {hasMCC && (
            <div className="mt-3 flex flex-col gap-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Tỷ lệ MCC / MCC Rate
              </p>
              <div className="flex flex-wrap gap-1">
                {MCC_RATES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setMccRate(r)}
                    className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                      mccRate === r
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {(r * 100).toFixed(0)}%
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* --- Results --- */}
        {/* Itemize vs standard recommendation badge */}
        <div className="flex items-center gap-3 rounded-xl border px-4 py-3">
          <div className="flex-1">
            <p className="text-sm font-medium">
              {taxResult.useStandard
                ? "Nên dùng khấu trừ tiêu chuẩn"
                : "Nên liệt kê khấu trừ (Itemize)"}
            </p>
            <p className="text-xs text-muted-foreground">
              {taxResult.useStandard
                ? `Standard ($${(taxResult.standardDeduction / 1000).toFixed(0)}K) > Itemized ($${(taxResult.totalItemized / 1000).toFixed(0)}K)`
                : `Itemized ($${(taxResult.totalItemized / 1000).toFixed(0)}K) > Standard ($${(taxResult.standardDeduction / 1000).toFixed(0)}K)`}
            </p>
          </div>
          <Badge
            variant={taxResult.useStandard ? "secondary" : "default"}
            className="shrink-0"
          >
            {taxResult.useStandard ? "Standard" : "Itemize"}
          </Badge>
        </div>

        {/* Total benefit callout */}
        <div className="flex flex-col items-center gap-1 rounded-xl bg-green-50 py-4 dark:bg-green-950/30">
          <p className="text-xs font-medium uppercase tracking-wider text-green-700 dark:text-green-400">
            Tổng lợi ích thuế hàng năm / Annual Tax Benefit
          </p>
          <p className="text-4xl font-bold tabular-nums text-green-700 dark:text-green-400">
            {fmt(taxResult.totalAnnualTaxBenefit)}
          </p>
          <p className="text-xs text-green-600/80 dark:text-green-500">
            /năm (tiết kiệm + tín dụng MCC)
          </p>
        </div>

        {/* Detailed rows */}
        <div className="flex flex-col gap-2 rounded-lg bg-muted/30 px-4 py-3">
          <InfoRow
            label="Khấu trừ tiền lãi / Interest Deduction"
            value={fmt(taxResult.interestDeduction)}
          />
          <InfoRow
            label="Khấu trừ thuế địa phương / SALT Deduction (capped $10K)"
            value={fmt(taxResult.saltDeduction)}
          />
          <InfoRow
            label="Tổng khấu trừ liệt kê / Total Itemized"
            value={fmt(taxResult.totalItemized)}
          />
          <div className="my-1 border-t" />
          <InfoRow
            label="Tiết kiệm từ khấu trừ / Deduction Savings"
            value={fmt(taxResult.annualTaxSavings)}
            accent="green"
          />
          {hasMCC && (
            <InfoRow
              label="Tín dụng MCC / MCC Credit (max $2K)"
              value={fmt(taxResult.mccAnnualCredit)}
              accent="green"
            />
          )}
          <div className="my-1 border-t" />
          <InfoRow
            label="Lãi suất danh nghĩa / Nominal Rate"
            value={pct(taxResult.nominalRate)}
          />
          <InfoRow
            label="Lãi suất hiệu dụng sau thuế / Effective Rate After Tax"
            value={pct(taxResult.effectiveMortgageRate)}
            accent="blue"
          />
        </div>
      </CardContent>
    </Card>
  );
}
