"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const montantFormatter = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const compactMontantFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
});

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number }[];
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm">
      <span className="font-medium text-foreground">
        {montantFormatter.format(payload[0].value)}
      </span>
    </div>
  );
}

export function FinancesCharts({
  byYear,
  byCorpsMetier,
}: {
  byYear: { label: string; montant: number }[];
  byCorpsMetier: { label: string; montant: number }[];
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Dépenses par année</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byYear} barGap={2} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="label"
                stroke="var(--color-border)"
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                stroke="var(--color-border)"
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                tickLine={false}
                tickFormatter={(value: number) => compactMontantFormatter.format(value)}
                width={64}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-secondary)" }} />
              <Bar
                dataKey="montant"
                fill="var(--color-primary)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Dépenses par corps de métier</h2>
        <div className="mt-4" style={{ height: Math.max(byCorpsMetier.length * 40, 120) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={byCorpsMetier}
              layout="vertical"
              barGap={2}
              margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} stroke="var(--color-border)" />
              <XAxis
                type="number"
                stroke="var(--color-border)"
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                tickLine={false}
                tickFormatter={(value: number) => compactMontantFormatter.format(value)}
              />
              <YAxis
                dataKey="label"
                type="category"
                stroke="var(--color-border)"
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                tickLine={false}
                width={110}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-secondary)" }} />
              <Bar
                dataKey="montant"
                fill="var(--color-accent)"
                radius={[0, 4, 4, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
