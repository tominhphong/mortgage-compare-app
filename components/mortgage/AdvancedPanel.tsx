"use client";

/**
 * AdvancedPanel — tabbed panel for Sprint 3 advanced scenarios.
 * Tabs: PMI Timeline | Holding Costs | Acceleration | Refinance | Opportunity Cost
 * Uses shadcn Tabs, Card, Input, Label, Badge.
 */

import * as React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import type { PaymentBreakdown, MortgageInput } from "@/lib/mortgage/types";
import { calculatePMIRemoval } from "@/lib/mortgage/pmi";
import {
  calculateHoldingCosts,
  type HomeAge,
} from "@/lib/mortgage/holding-costs";
import { simulateAcceleration } from "@/lib/mortgage/acceleration";
import { evaluateRefinance } from "@/lib/mortgage/refinance";
import { calculateOpportunityCost } from "@/lib/mortgage/opportunity-cost";
import {
  TEXAS_HOA_AVG,
  TEXAS_MUD_RATE,
  TEXAS_PID_ANNUAL_AVG,
} from "@/lib/mortgage/constants";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function fmt(n: number, compact = false): string {
  if (!isFinite(n) || isNaN(n)) return "N/A";
  if (compact && n >= 1_000_000)
    return `$${(n / 1_000_000).toFixed(2)}M`;
  if (compact && n >= 1_000)
    return `$${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function fmtMonths(months: number): string {
  if (!isFinite(months)) return "N/A";
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} tháng`;
  if (m === 0) return `${y} năm`;
  return `${y} năm ${m} tháng`;
}

function StatRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-1.5 ${
        highlight ? "font-semibold text-foreground" : "text-muted-foreground"
      }`}
    >
      <span className="text-sm">{label}</span>
      <span className="text-sm tabular-nums text-right">{value}</span>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">{children}</CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AdvancedPanelProps {
  /** Full payment breakdown for the scenario */
  breakdown: PaymentBreakdown;
  /** Raw input (for homePrice, downPayment, rate, termYears) */
  input: MortgageInput;
}

// ---------------------------------------------------------------------------
// Tab 1 — PMI Timeline
// ---------------------------------------------------------------------------

function PmiTab({ breakdown, input }: AdvancedPanelProps) {
  const [appreciationRate, setAppreciationRate] = React.useState(4);
  const [extraMonthly, setExtraMonthly] = React.useState(0);

  const result = React.useMemo(
    () =>
      calculatePMIRemoval({
        ...input,
        appreciationRate: appreciationRate / 100,
        extraMonthlyPrincipal: extraMonthly,
      }),
    [input, appreciationRate, extraMonthly],
  );

  if (breakdown.monthlyPMI === 0 && !result.isFHA) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Không có PMI — LTV ≤ 80%. / No PMI — LTV ≤ 80%.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pmi-appr">
            Tăng giá / Appreciation (%/yr)
          </Label>
          <Input
            id="pmi-appr"
            type="number"
            min={0}
            max={20}
            step={0.5}
            value={appreciationRate}
            onChange={(e) =>
              setAppreciationRate(parseFloat(e.target.value) || 0)
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pmi-extra">
            Trả thêm gốc / Extra Principal ($/mo)
          </Label>
          <Input
            id="pmi-extra"
            type="number"
            min={0}
            step={50}
            value={extraMonthly}
            onChange={(e) =>
              setExtraMonthly(parseFloat(e.target.value) || 0)
            }
          />
        </div>
      </div>

      <Separator />

      {result.isFHA ? (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          {result.recommendation}
        </div>
      ) : (
        <SectionCard title="Lộ trình xóa PMI / PMI Removal Timeline">
          <StatRow
            label="Yêu cầu xóa (LTV 80%) / Request removal (80%)"
            value={fmtMonths(result.monthToRequestRemove)}
          />
          <StatRow
            label="Tự động xóa (LTV 78%) / Auto-cancel (78%)"
            value={fmtMonths(result.monthToAutoRemove)}
          />
          <StatRow
            label="Qua thẩm định lại / Via reappraisal"
            value={fmtMonths(result.monthToRemoveViaAppreciation)}
          />
          <Separator className="my-1" />
          <StatRow
            label="Tổng PMI đã trả / Total PMI paid"
            value={fmt(result.totalPMIPaid)}
            highlight
          />
        </SectionCard>
      )}

      <p className="text-xs text-muted-foreground leading-relaxed">
        {result.recommendation}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2 — Holding Costs
// ---------------------------------------------------------------------------

function HoldingCostsTab({ input }: { input: MortgageInput }) {
  const [hoaMonthly, setHoaMonthly] = React.useState(TEXAS_HOA_AVG);
  const [mudRate, setMudRate] = React.useState(TEXAS_MUD_RATE * 100); // as pct
  const [pidAnnual, setPidAnnual] = React.useState(TEXAS_PID_ANNUAL_AVG);
  const [homeAge, setHomeAge] = React.useState<HomeAge>("midage");
  const [utility, setUtility] = React.useState(300);

  const result = React.useMemo(
    () =>
      calculateHoldingCosts({
        homePrice: input.homePrice,
        homeAge,
        hoaMonthly,
        mudRatePercent: mudRate,
        pidAnnual,
        utilityMonthlyEstimate: utility,
      }),
    [input.homePrice, homeAge, hoaMonthly, mudRate, pidAnnual, utility],
  );

  const ageOptions: { value: HomeAge; label: string }[] = [
    { value: "new", label: "Mới (<5 năm) / New (<5yr)" },
    { value: "midage", label: "Trung bình (5–20) / Mid-age" },
    { value: "old", label: "Cũ (>20 năm) / Old (>20yr)" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hc-hoa">HOA ($/tháng)</Label>
          <Input
            id="hc-hoa"
            type="number"
            min={0}
            step={25}
            value={hoaMonthly}
            onChange={(e) => setHoaMonthly(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hc-mud">MUD Rate (%/yr)</Label>
          <Input
            id="hc-mud"
            type="number"
            min={0}
            max={5}
            step={0.1}
            value={mudRate}
            onChange={(e) => setMudRate(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hc-pid">PID ($/năm)</Label>
          <Input
            id="hc-pid"
            type="number"
            min={0}
            step={100}
            value={pidAnnual}
            onChange={(e) => setPidAnnual(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hc-util">Điện nước / Utility ($/mo)</Label>
          <Input
            id="hc-util"
            type="number"
            min={0}
            step={50}
            value={utility}
            onChange={(e) => setUtility(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-2">
          <Label>Tuổi nhà / Home Age</Label>
          <div className="flex gap-2 flex-wrap">
            {ageOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setHomeAge(opt.value)}
                className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                  homeAge === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      <SectionCard title="Chi tiết / Breakdown">
        {result.breakdown.map((row) => (
          <StatRow
            key={row.category}
            label={row.category}
            value={`${fmt(row.monthly)}/mo  (${(row.percentOfPrice * 100).toFixed(2)}%/yr)`}
          />
        ))}
        <Separator className="my-1" />
        <StatRow
          label="Tổng hàng tháng / Total Monthly"
          value={fmt(result.totalMonthlyHolding)}
          highlight
        />
        <StatRow
          label="Tổng hàng năm / Annual Total"
          value={fmt(result.annualTotal)}
          highlight
        />
      </SectionCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3 — Acceleration
// ---------------------------------------------------------------------------

function AccelerationTab({
  breakdown,
  input,
}: AdvancedPanelProps) {
  const [extraMonthly, setExtraMonthly] = React.useState(200);
  const [extraAnnual, setExtraAnnual] = React.useState(2000);
  const [biweekly, setBiweekly] = React.useState(false);

  const strategy = biweekly
    ? "biweekly"
    : extraMonthly > 0 || extraAnnual > 0
    ? "custom"
    : "none";

  const result = React.useMemo(
    () =>
      simulateAcceleration({
        breakdown,
        termYears: input.termYears,
        extraMonthly,
        extraAnnual,
        strategy: biweekly ? "biweekly" : strategy,
      }),
    [breakdown, input.termYears, extraMonthly, extraAnnual, biweekly, strategy],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="acc-extra">Trả thêm / Extra Monthly ($/mo)</Label>
          <Input
            id="acc-extra"
            type="number"
            min={0}
            step={50}
            value={extraMonthly}
            onChange={(e) =>
              setExtraMonthly(parseFloat(e.target.value) || 0)
            }
            disabled={biweekly}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="acc-annual">Trả lump / Annual Lump ($/yr)</Label>
          <Input
            id="acc-annual"
            type="number"
            min={0}
            step={500}
            value={extraAnnual}
            onChange={(e) =>
              setExtraAnnual(parseFloat(e.target.value) || 0)
            }
            disabled={biweekly}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="acc-biweekly"
          type="checkbox"
          checked={biweekly}
          onChange={(e) => setBiweekly(e.target.checked)}
          className="rounded"
        />
        <Label htmlFor="acc-biweekly" className="cursor-pointer">
          Trả 2 tuần/lần (Biweekly = 13 payments/yr)
        </Label>
      </div>

      <Separator />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SectionCard title="Kế hoạch gốc / Original">
          <StatRow
            label="Trả hết tháng / Payoff month"
            value={fmtMonths(result.originalPayoffMonths)}
          />
        </SectionCard>

        <SectionCard title="Với tăng tốc / Accelerated">
          <StatRow
            label="Trả hết tháng / Payoff month"
            value={fmtMonths(result.newPayoffMonths)}
          />
        </SectionCard>
      </div>

      <SectionCard title="Tiết kiệm / Savings">
        <StatRow
          label="Tiết kiệm thời gian / Time saved"
          value={`${fmtMonths(result.monthsSaved)} (${result.yearsSaved} năm)`}
          highlight
        />
        <StatRow
          label="Tiết kiệm lãi / Interest saved"
          value={fmt(result.interestSaved)}
          highlight
        />
        <StatRow
          label="Tăng chi tiêu / Monthly cash outflow +"
          value={fmt(result.cashFlowImpact)}
        />
      </SectionCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 4 — Refinance
// ---------------------------------------------------------------------------

function RefinanceTab({ breakdown, input }: AdvancedPanelProps) {
  const [newRate, setNewRate] = React.useState(
    Math.max(3, input.rate - 1),
  );
  const [newTerm, setNewTerm] = React.useState(30);
  const [closingPct, setClosingPct] = React.useState(3);

  // Remaining months — approximate from loan amount and current monthly PI
  const estimatedRemainingMonths = input.termYears * 12;

  const result = React.useMemo(
    () =>
      evaluateRefinance({
        currentBalance: breakdown.loanAmount,
        currentRate: input.rate,
        currentRemainingMonths: estimatedRemainingMonths,
        newRate,
        newTermYears: newTerm,
        closingCostsPercent: closingPct,
      }),
    [
      breakdown.loanAmount,
      input.rate,
      estimatedRemainingMonths,
      newRate,
      newTerm,
      closingPct,
    ],
  );

  const recBadgeVariant =
    result.recommendation === "refinance"
      ? "default"
      : result.recommendation === "hold"
      ? "destructive"
      : "secondary";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="refi-rate">Lãi mới / New Rate (%)</Label>
          <Input
            id="refi-rate"
            type="number"
            min={1}
            max={15}
            step={0.125}
            value={newRate}
            onChange={(e) => setNewRate(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="refi-term">Kỳ mới / New Term (yr)</Label>
          <Input
            id="refi-term"
            type="number"
            min={10}
            max={30}
            step={5}
            value={newTerm}
            onChange={(e) => setNewTerm(parseInt(e.target.value) || 30)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="refi-closing">Chi phí đóng / Closing (%)</Label>
          <Input
            id="refi-closing"
            type="number"
            min={0}
            max={10}
            step={0.5}
            value={closingPct}
            onChange={(e) =>
              setClosingPct(parseFloat(e.target.value) || 3)
            }
          />
        </div>
      </div>

      <Separator />

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Khuyến nghị / Recommendation:</span>
        <Badge variant={recBadgeVariant} className="capitalize">
          {result.recommendation}
        </Badge>
      </div>

      <SectionCard title="So sánh / Comparison">
        <StatRow
          label="Trả hiện tại / Current monthly"
          value={fmt(breakdown.monthlyPI)}
        />
        <StatRow
          label="Trả mới / New monthly"
          value={fmt(result.newMonthlyPI)}
        />
        <StatRow
          label="Tiết kiệm hàng tháng / Monthly savings"
          value={fmt(result.monthlySavings)}
          highlight
        />
        <Separator className="my-1" />
        <StatRow
          label="Chi phí đóng / Closing costs"
          value={fmt(result.totalClosingCosts)}
        />
        <StatRow
          label="Hoà vốn / Break-even"
          value={
            isFinite(result.breakEvenMonths)
              ? fmtMonths(result.breakEvenMonths)
              : "Không hoà vốn / Never"
          }
          highlight
        />
        <StatRow
          label="Chênh lệch lãi suất kỳ hạn / Lifetime interest diff"
          value={
            result.lifetimeInterestDiff >= 0
              ? `Tiết kiệm ${fmt(result.lifetimeInterestDiff)}`
              : `Tốn thêm ${fmt(-result.lifetimeInterestDiff)}`
          }
        />
      </SectionCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 5 — Opportunity Cost
// ---------------------------------------------------------------------------

function OpportunityCostTab({ breakdown }: { breakdown: PaymentBreakdown }) {
  const [returnRate, setReturnRate] = React.useState(7);
  const [holdYears, setHoldYears] = React.useState(10);

  const result = React.useMemo(
    () =>
      calculateOpportunityCost({
        downPayment: breakdown.downAmount,
        investmentReturnRate: returnRate / 100,
        holdYears,
      }),
    [breakdown.downAmount, returnRate, holdYears],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="opp-return">
            Lợi nhuận đầu tư / Return Rate (%/yr)
          </Label>
          <Input
            id="opp-return"
            type="number"
            min={1}
            max={20}
            step={0.5}
            value={returnRate}
            onChange={(e) =>
              setReturnRate(parseFloat(e.target.value) || 7)
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="opp-years">Số năm / Hold Years</Label>
          <Input
            id="opp-years"
            type="number"
            min={1}
            max={30}
            step={1}
            value={holdYears}
            onChange={(e) =>
              setHoldYears(parseInt(e.target.value) || 10)
            }
          />
        </div>
      </div>

      <Separator />

      <SectionCard title="Chi phí cơ hội / Opportunity Cost">
        <StatRow
          label="Tiền đặt cọc / Down payment"
          value={fmt(result.downPaymentAmount)}
        />
        <StatRow
          label={`Giá trị sau ${holdYears} năm / Value in ${holdYears}yr`}
          value={fmt(result.investmentValueAtEnd)}
          highlight
        />
        <StatRow
          label="Lợi nhuận bị bỏ lỡ / Foregone gains"
          value={fmt(result.foregoneGains)}
          highlight
        />
      </SectionCard>

      <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground leading-relaxed">
        {result.recommendation}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main AdvancedPanel component
// ---------------------------------------------------------------------------

export function AdvancedPanel({ breakdown, input }: AdvancedPanelProps) {
  return (
    <Card className="w-full">
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-base font-semibold">
          Phân tích nâng cao / Advanced Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs defaultValue="pmi">
          <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
            <TabsTrigger value="pmi" className="text-xs">
              PMI Timeline
            </TabsTrigger>
            <TabsTrigger value="holding" className="text-xs">
              Chi phí giữ nhà
            </TabsTrigger>
            <TabsTrigger value="acceleration" className="text-xs">
              Trả nhanh
            </TabsTrigger>
            <TabsTrigger value="refinance" className="text-xs">
              Tái tài trợ
            </TabsTrigger>
            <TabsTrigger value="opportunity" className="text-xs">
              Chi phí cơ hội
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pmi">
            <PmiTab breakdown={breakdown} input={input} />
          </TabsContent>

          <TabsContent value="holding">
            <HoldingCostsTab input={input} />
          </TabsContent>

          <TabsContent value="acceleration">
            <AccelerationTab breakdown={breakdown} input={input} />
          </TabsContent>

          <TabsContent value="refinance">
            <RefinanceTab breakdown={breakdown} input={input} />
          </TabsContent>

          <TabsContent value="opportunity">
            <OpportunityCostTab breakdown={breakdown} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
