"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// @temp - will use lib/mortgage/types when math agent merges
import type { PaymentBreakdown } from "@/lib/mortgage/types";

interface PaymentBreakdownCardProps {
  breakdown: PaymentBreakdown;
  label?: string;
}

// Breakdown bar segment config
interface BarSegment {
  key: keyof PaymentBreakdown;
  label: string;
  labelVi: string;
  color: string;
}

const BAR_SEGMENTS: BarSegment[] = [
  { key: "monthlyPI", label: "P&I", labelVi: "Gốc+Lãi", color: "bg-blue-500" },
  { key: "monthlyPMI", label: "PMI", labelVi: "PMI", color: "bg-orange-400" },
  { key: "monthlyTax", label: "Tax", labelVi: "Thuế", color: "bg-yellow-400" },
  { key: "monthlyInsurance", label: "Insurance", labelVi: "Bảo hiểm", color: "bg-green-400" },
  { key: "monthlyHOA", label: "HOA", labelVi: "HOA", color: "bg-purple-400" },
];

function formatCurrency(n: number, compact = false): string {
  if (compact && n >= 1_000_000) {
    return `$${(n / 1_000_000).toFixed(2)}M`;
  }
  if (compact && n >= 1_000) {
    return `$${(n / 1_000).toFixed(0)}k`;
  }
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function PaymentBreakdownCard({
  breakdown,
  label,
}: PaymentBreakdownCardProps) {
  const activeSegments = BAR_SEGMENTS.filter(
    (s) => (breakdown[s.key] as number) > 0
  );

  return (
    <Card className="w-full">
      {label && (
        <CardHeader className="border-b">
          <CardTitle className="text-base font-semibold">{label}</CardTitle>
        </CardHeader>
      )}

      <CardContent className="flex flex-col gap-5 pt-4">
        {/* Big monthly total */}
        <div className="flex flex-col items-center gap-1 py-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Trả hàng tháng / Total Monthly
          </p>
          <p className="text-4xl font-bold tabular-nums text-foreground">
            {formatCurrency(breakdown.monthlyTotal)}
          </p>
        </div>

        {/* Proportional bar chart */}
        <div className="flex flex-col gap-2">
          <div
            className="flex h-6 w-full overflow-hidden rounded-full"
            role="img"
            aria-label="Payment breakdown chart"
          >
            {breakdown.monthlyTotal > 0 &&
              activeSegments.map((seg) => {
                const value = breakdown[seg.key] as number;
                const pct = (value / breakdown.monthlyTotal) * 100;
                return (
                  <div
                    key={seg.key}
                    className={`${seg.color} transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${seg.label}: ${formatCurrency(value)}`}
                  />
                );
              })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {activeSegments.map((seg) => {
              const value = breakdown[seg.key] as number;
              return (
                <div key={seg.key} className="flex items-center gap-1.5">
                  <div
                    className={`size-2.5 rounded-full ${seg.color} shrink-0`}
                    aria-hidden="true"
                  />
                  <span className="text-xs text-muted-foreground">
                    {seg.labelVi}{" "}
                    <span className="font-medium text-foreground">
                      {formatCurrency(value)}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Secondary stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCell
            label="Vay / Loan"
            value={formatCurrency(breakdown.loanAmount, true)}
          />
          <StatCell
            label="Trả trước / Down"
            value={formatCurrency(breakdown.downAmount, true)}
          />
          <StatCell
            label="LTV"
            value={
              <Badge
                variant={breakdown.ltv > 80 ? "destructive" : "secondary"}
                className="tabular-nums"
              >
                {breakdown.ltv.toFixed(1)}%
              </Badge>
            }
          />
          <StatCell
            label="Tổng lãi / Interest"
            value={formatCurrency(breakdown.totalInterest, true)}
          />
        </div>

        {/* Total paid */}
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">
            Tổng trả toàn khoá / Total Paid Over Life
          </p>
          <p className="text-lg font-semibold tabular-nums">
            {formatCurrency(breakdown.totalPaid)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Reusable stat cell
function StatCell({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/50 px-2 py-2 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground leading-tight">
        {label}
      </p>
      <div className="text-sm font-semibold tabular-nums text-foreground">
        {value}
      </div>
    </div>
  );
}
