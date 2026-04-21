"use client";

/**
 * AffordabilityPanel.tsx
 * DTI + 28/36 rule + reserves check panel.
 * Inputs: gross income, other debt, liquid assets, living expenses.
 * Outputs: front-end ratio, back-end ratio, reserves, max home price, cash-to-close.
 * Mobile-first, dark-mode compatible via Tailwind `dark:` classes.
 */

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";
import {
  calculateAffordability,
  type AffordabilityInput,
  type AffordabilityResult,
} from "@/lib/mortgage/affordability";
import type { PaymentBreakdown } from "@/lib/mortgage/types";
import type { Language } from "@/lib/i18n/translations";
import { translations } from "@/lib/i18n/translations";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number, compact = false): string {
  if (compact && n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (compact && n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function fmtPct(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Badge helpers — colour-coded by threshold
// ---------------------------------------------------------------------------

type RatioLevel = "green" | "yellow" | "red";

function frontEndLevel(ratio: number): RatioLevel {
  if (ratio <= 0.28) return "green";
  if (ratio <= 0.35) return "yellow";
  return "red";
}

function backEndLevel(ratio: number): RatioLevel {
  if (ratio <= 0.36) return "green";
  if (ratio <= 0.43) return "yellow";
  return "red";
}

function reservesLevel(months: number): RatioLevel {
  if (months >= 6) return "green";
  if (months >= 3) return "yellow";
  return "red";
}

function levelBadge(
  level: RatioLevel,
  passLabel: string,
  warnLabel: string,
  failLabel: string,
) {
  const map: Record<RatioLevel, { label: string; classes: string }> = {
    green: {
      label: passLabel,
      classes:
        "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    },
    yellow: {
      label: warnLabel,
      classes:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
    },
    red: {
      label: failLabel,
      classes:
        "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    },
  };
  const { label, classes } = map[level];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}

function StatusIcon({ level }: { level: RatioLevel }) {
  if (level === "green") return <ShieldCheck className="h-4 w-4 text-green-500 dark:text-green-400" />;
  if (level === "yellow") return <AlertTriangle className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />;
  return <ShieldAlert className="h-4 w-4 text-red-500 dark:text-red-400" />;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatRow({
  label,
  value,
  badge,
  icon,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        {icon}
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground leading-tight truncate">{label}</p>
          {sub && (
            <p className="text-xs text-muted-foreground leading-tight">{sub}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {value}
        </span>
        {badge}
      </div>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          $
        </span>
        <input
          type="number"
          min="0"
          step="100"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "0"}
          className="w-full rounded-md border border-input bg-background pl-7 pr-3 py-2 text-sm
            text-foreground placeholder:text-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1
            dark:bg-muted/20 dark:border-border"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------

export interface AffordabilityPanelProps {
  /** The scenario's payment breakdown to evaluate */
  breakdown: PaymentBreakdown;
  /** Display label for this scenario, shown in the card header */
  scenarioLabel: string;
  /** Active UI language */
  language: Language;
  /** Whether the panel starts collapsed (default: true) */
  defaultCollapsed?: boolean;
}

export function AffordabilityPanel({
  breakdown,
  scenarioLabel,
  language,
  defaultCollapsed = true,
}: AffordabilityPanelProps) {
  const t = translations[language];

  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  // Form state — stored as strings to allow partial input
  const [grossIncome, setGrossIncome] = React.useState("10000");
  const [otherDebt, setOtherDebt] = React.useState("500");
  const [liquidAssets, setLiquidAssets] = React.useState("60000");
  const [livingExpenses, setLivingExpenses] = React.useState("2000");

  const input: AffordabilityInput = {
    grossMonthlyIncome: parseFloat(grossIncome) || 0,
    otherMonthlyDebt: parseFloat(otherDebt) || 0,
    liquidAssets: parseFloat(liquidAssets) || 0,
    monthlyLivingExpenses: parseFloat(livingExpenses) || 0,
  };

  const result: AffordabilityResult = calculateAffordability(breakdown, input);

  const feLevel = frontEndLevel(result.frontEndRatio);
  const beLevel = backEndLevel(result.backEndRatio);
  const resLevel = reservesLevel(result.reservesMonths);

  const reservesDisplay =
    result.reservesMonths === Infinity
      ? "∞"
      : result.reservesMonths.toFixed(1);

  return (
    <Card className="w-full border-border dark:bg-card">
      {/* Header — always visible, clickable to collapse */}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold text-foreground">
            {t.affordabilityTitle} — {scenarioLabel}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand affordability panel" : "Collapse affordability panel"}
          >
            {collapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t.affordabilitySubtitle}</p>
      </CardHeader>

      {!collapsed && (
        <CardContent className="flex flex-col gap-5 pt-0">
          {/* ---- Inputs ---- */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.inputsLabel}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <NumberInput
                label={t.grossIncome}
                value={grossIncome}
                onChange={setGrossIncome}
                placeholder="10000"
              />
              <NumberInput
                label={t.otherDebt}
                value={otherDebt}
                onChange={setOtherDebt}
                placeholder="500"
              />
              <NumberInput
                label={t.liquidAssets}
                value={liquidAssets}
                onChange={setLiquidAssets}
                placeholder="60000"
              />
              <NumberInput
                label={t.livingExpenses}
                value={livingExpenses}
                onChange={setLivingExpenses}
                placeholder="2000"
              />
            </div>
          </div>

          <Separator />

          {/* ---- Results ---- */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.resultsLabel}
            </p>
            <div className="divide-y divide-border">
              <StatRow
                label={t.frontEndRatio}
                sub="target ≤ 28%"
                value={fmtPct(result.frontEndRatio)}
                icon={<StatusIcon level={feLevel} />}
                badge={levelBadge(feLevel, t.pass, t.warning, t.fail)}
              />
              <StatRow
                label={t.backEndRatio}
                sub="target ≤ 36%"
                value={fmtPct(result.backEndRatio)}
                icon={<StatusIcon level={beLevel} />}
                badge={levelBadge(beLevel, t.pass, t.warning, t.fail)}
              />
              <StatRow
                label={t.qualifiedMortgage}
                sub="CFPB QM ≤ 43%"
                value={fmtPct(result.backEndRatio)}
                icon={
                  result.qualifiedMortgageLimit ? (
                    <ShieldCheck className="h-4 w-4 text-green-500 dark:text-green-400" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 text-red-500 dark:text-red-400" />
                  )
                }
                badge={
                  result.qualifiedMortgageLimit
                    ? levelBadge("green", t.pass, t.warning, t.fail)
                    : levelBadge("red", t.pass, t.warning, t.fail)
                }
              />
              <StatRow
                label={t.reserves}
                sub={`target ≥ 3 ${t.reservesMonths}`}
                value={`${reservesDisplay} ${t.reservesMonths}`}
                icon={<StatusIcon level={resLevel} />}
                badge={levelBadge(resLevel, t.pass, t.warning, t.fail)}
              />
            </div>
          </div>

          <Separator />

          {/* ---- Summary numbers ---- */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <SummaryCell
              label={t.maxAffordable}
              value={fmt(result.maxAffordableMonthlyPITI)}
              sub="/mo"
            />
            <SummaryCell
              label={t.maxHomePrice}
              value={fmt(result.maxAffordableHomePriceRough, true)}
              sub="~20% down, 7%, 30yr"
            />
            <SummaryCell
              label={t.closingCosts}
              value={fmt(result.estimatedClosingCosts, true)}
              sub="~3% of loan"
            />
            <SummaryCell
              label={t.cashToClose}
              value={fmt(result.cashToClose, true)}
              sub="down + closing"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Summary cell
// ---------------------------------------------------------------------------

function SummaryCell({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-muted/50 px-3 py-2.5 dark:bg-muted/20">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground leading-tight">
        {label}
      </p>
      <p className="text-base font-bold tabular-nums text-foreground">{value}</p>
      {sub && (
        <p className="text-[10px] text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}
