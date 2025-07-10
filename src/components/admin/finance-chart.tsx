
"use client";

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const timeRangeLabels: Record<string, string> = {
  today: 'Hoy',
  week: 'Esta Semana',
  month: 'Este Mes',
  year: 'Este Año',
  all: 'Global',
};

interface FinanceChartProps {
    timeRangedStats: {
        totalRevenue: number;
        commissionsPaid: number;
        totalExpenses: number;
    };
    timeRange: 'today' | 'week' | 'month' | 'year' | 'all';
}

export function FinanceChart({ timeRangedStats, timeRange }: FinanceChartProps) {
    const chartData = useMemo(() => ([
        {
          label: timeRangeLabels[timeRange],
          Ingresos: timeRangedStats.totalRevenue,
          Comisiones: timeRangedStats.commissionsPaid,
          Gastos: timeRangedStats.totalExpenses,
        }
    ]), [timeRange, timeRangedStats]);

    const chartConfig = {
        Ingresos: { label: "Ingresos", color: "hsl(var(--chart-2))" },
        Comisiones: { label: "Comisiones", color: "hsl(var(--chart-4))" },
        Gastos: { label: "Gastos", color: "hsl(var(--destructive))" },
    } satisfies ChartConfig;

    return (
        <ChartContainer config={chartConfig} className="h-72 w-full">
            <BarChart data={chartData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="label"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="Ingresos" fill="var(--color-Ingresos)" radius={4} />
                <Bar dataKey="Comisiones" fill="var(--color-Comisiones)" radius={4} />
                <Bar dataKey="Gastos" fill="var(--color-Gastos)" radius={4} />
            </BarChart>
        </ChartContainer>
    );
}
