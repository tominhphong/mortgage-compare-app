"use client";

import * as React from "react";
import { TrendingDown, AlertTriangle, CheckCircle, Info } from "lucide-react";

// @temp - will use lib/mortgage/types when math agent merges
import type { Scenario } from "@/lib/mortgage/types";

interface DecisionSummaryProps {
  scenarios: Scenario[];
}

function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatCurrencyCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return formatCurrency(n);
}

interface CalloutProps {
  type: "success" | "warning" | "info";
  children: React.ReactNode;
}

function Callout({ type, children }: CalloutProps) {
  const styles = {
    success: {
      wrapper: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700",
      icon: <CheckCircle className="size-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />,
    },
    warning: {
      wrapper: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700",
      icon: <AlertTriangle className="size-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />,
    },
    info: {
      wrapper: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700",
      icon: <Info className="size-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />,
    },
  };
  const s = styles[type];
  return (
    <div className={`flex gap-3 rounded-xl border p-4 text-sm ${s.wrapper}`}>
      {s.icon}
      <div className="flex-1 leading-relaxed">{children}</div>
    </div>
  );
}

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

// Simple accessible tooltip using title + aria-describedby pattern
function Tooltip({ text, children }: TooltipProps) {
  const id = React.useId();
  return (
    <span className="relative inline-flex items-center gap-0.5 group cursor-help">
      {children}
      <span
        role="tooltip"
        id={id}
        className="pointer-events-none absolute bottom-full left-1/2 z-10 -translate-x-1/2 mb-1 w-max max-w-[220px] rounded-md bg-foreground px-2 py-1 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

export function DecisionSummary({ scenarios }: DecisionSummaryProps) {
  if (scenarios.length < 2) {
    return (
      <Callout type="info">
        <span className="font-medium">Thêm ít nhất 2 kịch bản để so sánh.</span>
        <br />
        <span className="text-muted-foreground">
          Add at least 2 scenarios to see the decision summary.
        </span>
      </Callout>
    );
  }

  // Find winner by lowest monthly total
  const lowestMonthly = scenarios.reduce((a, b) =>
    a.breakdown.monthlyTotal < b.breakdown.monthlyTotal ? a : b
  );
  const highestMonthly = scenarios.reduce((a, b) =>
    a.breakdown.monthlyTotal > b.breakdown.monthlyTotal ? a : b
  );

  // Find winner by lowest total interest (lifetime cost)
  const lowestInterest = scenarios.reduce((a, b) =>
    a.breakdown.totalInterest < b.breakdown.totalInterest ? a : b
  );
  const highestInterest = scenarios.reduce((a, b) =>
    a.breakdown.totalInterest > b.breakdown.totalInterest ? a : b
  );

  const monthlySavings =
    highestMonthly.breakdown.monthlyTotal - lowestMonthly.breakdown.monthlyTotal;
  const lifetimeSavings =
    highestInterest.breakdown.totalInterest - lowestInterest.breakdown.totalInterest;

  // Break-even calculation: comparing scenarios[0] vs scenarios[1] (first pair)
  const [scA, scB] = scenarios;
  const monthlyDiff = Math.abs(
    scA.breakdown.monthlyTotal - scB.breakdown.monthlyTotal
  );
  const downDiff = Math.abs(scA.breakdown.downAmount - scB.breakdown.downAmount);
  const breakEvenMonths = monthlyDiff > 0 ? Math.ceil(downDiff / monthlyDiff) : null;
  const higherDownScenario =
    scA.breakdown.downAmount > scB.breakdown.downAmount ? scA : scB;
  const lowerMonthlyScenario =
    scA.breakdown.monthlyTotal < scB.breakdown.monthlyTotal ? scA : scB;

  // PMI warnings — any scenario with LTV > 80
  const pmiWarnings = scenarios.filter((s) => s.breakdown.ltv > 80);

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">
        Phân tích quyết định / Decision Summary
      </h3>

      {/* Lifetime savings callout */}
      {lifetimeSavings > 0 && (
        <Callout type="success">
          <span className="font-medium">{lowestInterest.label}</span> tiết kiệm{" "}
          <Tooltip text="Total interest paid over the full loan term">
            <span className="font-bold underline decoration-dotted">
              {formatCurrencyCompact(lifetimeSavings)}
            </span>
          </Tooltip>{" "}
          tiền lãi so với <span className="font-medium">{highestInterest.label}</span>.
          <br />
          <span className="text-muted-foreground text-xs">
            {lowestInterest.label} saves {formatCurrencyCompact(lifetimeSavings)} in total
            interest vs {highestInterest.label}.
          </span>
        </Callout>
      )}

      {/* Monthly savings callout */}
      {monthlySavings > 0 && lowestMonthly.id !== lowestInterest.id && (
        <Callout type="info">
          <span className="font-medium">{lowestMonthly.label}</span> có khoản trả
          hàng tháng thấp hơn{" "}
          <span className="font-bold">{formatCurrency(monthlySavings)}/tháng</span>{" "}
          so với <span className="font-medium">{highestMonthly.label}</span>.
          <br />
          <span className="text-muted-foreground text-xs">
            {lowestMonthly.label} has a lower monthly payment by{" "}
            {formatCurrency(monthlySavings)}/mo vs {highestMonthly.label}.
          </span>
        </Callout>
      )}

      {/* Break-even (only meaningful for 2-scenario comparison) */}
      {scenarios.length === 2 &&
        breakEvenMonths !== null &&
        breakEvenMonths > 0 &&
        downDiff > 0 && (
          <Callout type="info">
            <span className="font-medium">{higherDownScenario.label}</span> yêu cầu
            trả trước cao hơn{" "}
            <span className="font-bold">{formatCurrencyCompact(downDiff)}</span>.{" "}
            {lowerMonthlyScenario.id === higherDownScenario.id ? (
              <>
                Điểm hoà vốn:{" "}
                <Tooltip text="Month when higher upfront cost is recovered via lower monthly payments">
                  <span className="font-bold underline decoration-dotted">
                    tháng {breakEvenMonths}
                  </span>
                </Tooltip>{" "}
                (khoảng {Math.ceil(breakEvenMonths / 12)} năm).
                <br />
                <span className="text-muted-foreground text-xs">
                  Break-even at month {breakEvenMonths} (
                  {Math.ceil(breakEvenMonths / 12)} yrs) — if you stay longer,
                  the higher down payment wins.
                </span>
              </>
            ) : (
              <>
                nhưng khoản trả tháng cũng cao hơn — không có điểm hoà vốn.
                <br />
                <span className="text-muted-foreground text-xs">
                  Higher down payment also has higher monthly — no break-even
                  advantage.
                </span>
              </>
            )}
          </Callout>
        )}

      {/* PMI warnings */}
      {pmiWarnings.map((s) => (
        <Callout key={s.id} type="warning">
          <span className="font-medium">{s.label}</span>: LTV{" "}
          <span className="font-bold">{s.breakdown.ltv.toFixed(1)}%</span> &gt; 80%
          — có thể phát sinh PMI.
          <br />
          <span className="text-muted-foreground text-xs">
            LTV above 80% — PMI likely required. Consider increasing down payment
            to 20% to avoid PMI.
          </span>
        </Callout>
      ))}
    </div>
  );
}
