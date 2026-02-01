import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ExpenseByCategory } from "@/types";

interface ExpensesPieChartProps {
  data: ExpenseByCategory[];
}

const COLORS = [
  "#10b981", // Emerald 500
  "#3b82f6", // Blue 500
  "#f59e0b", // Amber 500
  "#ef4444", // Red 500
  "#8b5cf6", // Violet 500
  "#ec4899", // Pink 500
  "#06b6d4", // Cyan 500
  "#6366f1", // Indigo 500
];

export function ExpensesPieChart({ data }: ExpensesPieChartProps) {
  // Filter out zero amounts just in case
  const chartData = data.filter((item) => item.amount > 0);

  interface CustomTooltipProps {
    active?: boolean;
    payload?: {
      payload: ExpenseByCategory;
    }[];
  }

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <p className="text-sm font-medium">{item.category_name}</p>
          <p className="text-xs text-muted-foreground">
            {new Intl.NumberFormat("pl-PL", {
              style: "currency",
              currency: "PLN",
            }).format(item.amount)}
            {" ("}
            {item.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Struktura wydatków</CardTitle>
        <CardDescription>Podział wydatków wg kategorii</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Pie data={chartData as any} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="amount" nameKey="category_name">
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-center text-muted-foreground">
            <p className="text-sm">Brak wydatków w tym miesiącu</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
