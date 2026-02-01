import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { AIInsight } from "@/types";

interface SavingsComparisonChartProps {
  insights: AIInsight[];
}

export function SavingsComparisonChart({ insights }: SavingsComparisonChartProps) {
  // Transform data for chart - memoized to avoid recalculation on every render
  const chartData = useMemo(() => {
    return insights.map((insight) => ({
      category: insight.category,
      "Obecne wydatki": insight.current_spending,
      "Proponowany cel": insight.suggested_target,
    }));
  }, [insights]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Porównanie wydatków</CardTitle>
        <CardDescription>Obecne vs proponowane cele oszczędności</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350} role="img" aria-label="Wykres porównania obecnych wydatków z proponowanymi celami oszczędności dla różnych kategorii">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} fontSize={12} />
            <YAxis label={{ value: "PLN", angle: -90, position: "insideLeft" }} />
            <Tooltip formatter={(value: number) => `${value.toFixed(0)} PLN`} labelStyle={{ color: "#000" }} />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            <Bar dataKey="Obecne wydatki" fill="#9ca3af" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Proponowany cel" fill="#9333ea" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
