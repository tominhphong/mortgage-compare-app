"use client";

import * as React from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// @temp - will use lib/mortgage/types when math agent merges
import type { MortgageInput, TermYears } from "@/lib/mortgage/types";

interface ScenarioInputCardProps {
  scenario: MortgageInput;
  label?: string;
  onChange: (input: MortgageInput) => void;
  onRemove?: () => void;
}

// Format number with commas
function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

// Parse string to number, strip commas
function parseNum(s: string): number {
  return parseFloat(s.replace(/,/g, "")) || 0;
}

export function ScenarioInputCard({
  scenario,
  label = "Scenario",
  onChange,
  onRemove,
}: ScenarioInputCardProps) {
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  // Toggle: "dollar" | "percent" for down payment
  const [downPaymentMode, setDownPaymentMode] = React.useState<"dollar" | "percent">("percent");

  const downPercent =
    scenario.homePrice > 0
      ? Math.round((scenario.downPayment / scenario.homePrice) * 10000) / 100
      : 0;

  function handleDownPaymentChange(value: string, mode: "dollar" | "percent") {
    const num = parseNum(value);
    if (mode === "dollar") {
      onChange({ ...scenario, downPayment: num });
    } else {
      const dollars = Math.round((num / 100) * scenario.homePrice);
      onChange({ ...scenario, downPayment: dollars });
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{label}</CardTitle>
          {onRemove && (
            <button
              type="button"
              aria-label={`Remove ${label}`}
              onClick={onRemove}
              className="flex h-8 w-8 min-w-[44px] min-h-[44px] items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5 pt-4">
        {/* Home Price */}
        <div className="flex flex-col gap-2">
          <Label htmlFor={`home-price-${label}`} className="text-sm font-medium">
            Giá nhà / Home Price
          </Label>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <input
              type="range"
              id={`home-price-slider-${label}`}
              aria-label="Home price slider"
              min={50000}
              max={2000000}
              step={5000}
              value={scenario.homePrice}
              onChange={(e) =>
                onChange({ ...scenario, homePrice: Number(e.target.value) })
              }
              className="h-2 w-full cursor-pointer accent-primary md:flex-1"
            />
            <div className="relative w-full md:w-36">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id={`home-price-${label}`}
                type="text"
                aria-label="Home price"
                value={formatNumber(scenario.homePrice)}
                onChange={(e) =>
                  onChange({ ...scenario, homePrice: parseNum(e.target.value) })
                }
                className="pl-6 min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* Down Payment */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Trả trước / Down Payment
            </Label>
            {/* Toggle $/ % */}
            <div
              role="group"
              aria-label="Down payment unit toggle"
              className="flex rounded-md border border-border overflow-hidden"
            >
              <button
                type="button"
                aria-pressed={downPaymentMode === "dollar"}
                onClick={() => setDownPaymentMode("dollar")}
                className={cn(
                  "min-h-[44px] min-w-[44px] px-3 text-sm font-medium transition-colors",
                  downPaymentMode === "dollar"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted text-foreground"
                )}
              >
                $
              </button>
              <button
                type="button"
                aria-pressed={downPaymentMode === "percent"}
                onClick={() => setDownPaymentMode("percent")}
                className={cn(
                  "min-h-[44px] min-w-[44px] px-3 text-sm font-medium transition-colors",
                  downPaymentMode === "percent"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted text-foreground"
                )}
              >
                %
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <input
              type="range"
              aria-label="Down payment slider"
              min={0}
              max={downPaymentMode === "percent" ? 100 : scenario.homePrice}
              step={downPaymentMode === "percent" ? 0.5 : 1000}
              value={downPaymentMode === "percent" ? downPercent : scenario.downPayment}
              onChange={(e) =>
                handleDownPaymentChange(e.target.value, downPaymentMode)
              }
              className="h-2 w-full cursor-pointer accent-primary md:flex-1"
            />
            <div className="relative w-full md:w-36">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {downPaymentMode === "dollar" ? "$" : "%"}
              </span>
              <Input
                type="text"
                aria-label={downPaymentMode === "dollar" ? "Down payment dollars" : "Down payment percent"}
                value={
                  downPaymentMode === "dollar"
                    ? formatNumber(scenario.downPayment)
                    : String(downPercent)
                }
                onChange={(e) =>
                  handleDownPaymentChange(e.target.value, downPaymentMode)
                }
                className="pl-6 min-h-[44px]"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {downPaymentMode === "percent"
              ? `= $${formatNumber(scenario.downPayment)}`
              : `= ${downPercent}%`}
          </p>
        </div>

        {/* Interest Rate */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">Lãi suất / Interest Rate</Label>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <input
              type="range"
              aria-label="Interest rate slider"
              min={0}
              max={12}
              step={0.05}
              value={scenario.rate}
              onChange={(e) =>
                onChange({ ...scenario, rate: Number(e.target.value) })
              }
              className="h-2 w-full cursor-pointer accent-primary md:flex-1"
            />
            <div className="relative w-full md:w-36">
              <Input
                type="text"
                aria-label="Interest rate"
                value={scenario.rate}
                onChange={(e) =>
                  onChange({ ...scenario, rate: parseNum(e.target.value) })
                }
                className="pr-6 min-h-[44px]"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                %
              </span>
            </div>
          </div>
        </div>

        {/* Loan Term */}
        <div className="flex flex-col gap-2">
          <Label htmlFor={`term-${label}`} className="text-sm font-medium">
            Thời hạn vay / Loan Term
          </Label>
          <Select
            value={String(scenario.termYears)}
            onValueChange={(v) =>
              onChange({ ...scenario, termYears: Number(v) as TermYears })
            }
          >
            <SelectTrigger
              id={`term-${label}`}
              aria-label="Loan term"
              className="min-h-[44px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 năm / 30 Years</SelectItem>
              <SelectItem value="20">20 năm / 20 Years</SelectItem>
              <SelectItem value="15">15 năm / 15 Years</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Toggle */}
        <button
          type="button"
          aria-expanded={showAdvanced}
          aria-controls={`advanced-${label}`}
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex min-h-[44px] items-center gap-2 text-sm font-medium text-primary hover:underline self-start"
        >
          {showAdvanced ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
          {showAdvanced ? "Ẩn nâng cao" : "Tuỳ chọn nâng cao / Advanced"}
        </button>

        {/* Advanced Fields */}
        {showAdvanced && (
          <div
            id={`advanced-${label}`}
            className="flex flex-col gap-4 rounded-lg bg-muted/50 p-4"
          >
            {/* Property Tax */}
            <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
              <Label className="text-sm">
                Thuế BĐS / Property Tax <span className="text-muted-foreground">(% /year)</span>
              </Label>
              <div className="relative w-full md:w-32">
                <Input
                  type="number"
                  aria-label="Property tax rate percent per year"
                  min={0}
                  max={5}
                  step={0.01}
                  value={scenario.propertyTaxRate ?? ""}
                  placeholder="1.5"
                  onChange={(e) =>
                    onChange({
                      ...scenario,
                      propertyTaxRate: parseNum(e.target.value) || undefined,
                    })
                  }
                  className="pr-6 min-h-[44px]"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
            </div>

            {/* Insurance */}
            <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
              <Label className="text-sm">
                Bảo hiểm nhà / Insurance <span className="text-muted-foreground">($ /year)</span>
              </Label>
              <div className="relative w-full md:w-32">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  aria-label="Home insurance yearly dollars"
                  min={0}
                  step={50}
                  value={scenario.insuranceYearly ?? ""}
                  placeholder="1200"
                  onChange={(e) =>
                    onChange({
                      ...scenario,
                      insuranceYearly: parseNum(e.target.value) || undefined,
                    })
                  }
                  className="pl-6 min-h-[44px]"
                />
              </div>
            </div>

            {/* PMI */}
            <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
              <Label className="text-sm">
                PMI <span className="text-muted-foreground">(% /year)</span>
              </Label>
              <div className="relative w-full md:w-32">
                <Input
                  type="number"
                  aria-label="PMI rate percent per year"
                  min={0}
                  max={3}
                  step={0.01}
                  value={scenario.pmiRate ?? ""}
                  placeholder="0.5"
                  onChange={(e) =>
                    onChange({
                      ...scenario,
                      pmiRate: parseNum(e.target.value) || undefined,
                    })
                  }
                  className="pr-6 min-h-[44px]"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
            </div>

            {/* HOA */}
            <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
              <Label className="text-sm">
                HOA <span className="text-muted-foreground">($ /month)</span>
              </Label>
              <div className="relative w-full md:w-32">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  aria-label="HOA monthly dollars"
                  min={0}
                  step={10}
                  value={scenario.hoaMonthly ?? ""}
                  placeholder="0"
                  onChange={(e) =>
                    onChange({
                      ...scenario,
                      hoaMonthly: parseNum(e.target.value) || undefined,
                    })
                  }
                  className="pl-6 min-h-[44px]"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
