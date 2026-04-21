"use client";

import * as React from "react";
import { Plus, RotateCcw, Trophy, TrendingDown, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScenarioInputCard } from "./ScenarioInputCard";
import { PaymentBreakdownCard } from "./PaymentBreakdownCard";

// @temp - will use lib/mortgage/types when math agent merges
import type { Scenario, WinnerBadge, WinnerType } from "@/lib/mortgage/types";

interface CompareViewProps {
  scenarios: Scenario[];
  onUpdate: (id: string, input: Scenario["input"]) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onReset: () => void;
}

const MAX_SCENARIOS = 4;

// Winner badge config
const WINNER_CONFIG: Record<
  WinnerType,
  { label: string; labelVi: string; icon: React.ReactNode; color: string }
> = {
  lowestMonthly: {
    label: "Lowest Monthly",
    labelVi: "Trả ít nhất/tháng",
    icon: <Trophy className="size-3.5" />,
    color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300",
  },
  lowestTotalInterest: {
    label: "Lowest Total Interest",
    labelVi: "Ít lãi nhất",
    icon: <TrendingDown className="size-3.5" />,
    color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
  },
  smallestDown: {
    label: "Smallest Down",
    labelVi: "Trả trước ít nhất",
    icon: <DollarSign className="size-3.5" />,
    color: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
  },
};

function computeWinners(scenarios: Scenario[]): WinnerBadge[] {
  if (scenarios.length < 2) return [];

  const winners: WinnerBadge[] = [];

  // Lowest monthly
  const lowestMonthly = scenarios.reduce((a, b) =>
    a.breakdown.monthlyTotal <= b.breakdown.monthlyTotal ? a : b
  );
  winners.push({
    type: "lowestMonthly",
    scenarioId: lowestMonthly.id,
    scenarioLabel: lowestMonthly.label,
  });

  // Lowest total interest
  const lowestInterest = scenarios.reduce((a, b) =>
    a.breakdown.totalInterest <= b.breakdown.totalInterest ? a : b
  );
  winners.push({
    type: "lowestTotalInterest",
    scenarioId: lowestInterest.id,
    scenarioLabel: lowestInterest.label,
  });

  // Smallest down payment
  const smallestDown = scenarios.reduce((a, b) =>
    a.breakdown.downAmount <= b.breakdown.downAmount ? a : b
  );
  winners.push({
    type: "smallestDown",
    scenarioId: smallestDown.id,
    scenarioLabel: smallestDown.label,
  });

  return winners;
}

export function CompareView({
  scenarios,
  onUpdate,
  onAdd,
  onRemove,
  onReset,
}: CompareViewProps) {
  const winners = computeWinners(scenarios);

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">
          So sánh {scenarios.length} kịch bản / Compare {scenarios.length}{" "}
          {scenarios.length === 1 ? "Scenario" : "Scenarios"}
        </h2>
        <div className="flex items-center gap-2">
          {scenarios.length < MAX_SCENARIOS && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAdd}
              aria-label="Add scenario"
              className="min-h-[44px] gap-1.5"
            >
              <Plus className="size-4" />
              Thêm / Add
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            aria-label="Reset all scenarios"
            className="min-h-[44px] gap-1.5 text-muted-foreground"
          >
            <RotateCcw className="size-4" />
            Reset
          </Button>
        </div>
      </div>

      {/* Scenario columns — 1 col mobile, 2 desktop, up to 4 side-by-side */}
      <div
        className={`grid gap-6 ${
          scenarios.length === 1
            ? "grid-cols-1 max-w-xl"
            : scenarios.length === 2
            ? "grid-cols-1 md:grid-cols-2"
            : scenarios.length === 3
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="flex flex-col gap-4">
            <ScenarioInputCard
              scenario={scenario.input}
              label={scenario.label}
              onChange={(input) => onUpdate(scenario.id, input)}
              onRemove={scenarios.length > 1 ? () => onRemove(scenario.id) : undefined}
            />
            <PaymentBreakdownCard
              breakdown={scenario.breakdown}
            />
          </div>
        ))}
      </div>

      {/* Winner summary row — shown only when 2+ scenarios */}
      {winners.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Tổng kết / Summary
          </p>
          <div className="flex flex-wrap gap-3">
            {winners.map((winner) => {
              const config = WINNER_CONFIG[winner.type];
              return (
                <div
                  key={winner.type}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${config.color}`}
                >
                  {config.icon}
                  <span>
                    {config.labelVi}:{" "}
                    <span className="font-bold">{winner.scenarioLabel}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
