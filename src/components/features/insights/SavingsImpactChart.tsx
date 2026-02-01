import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SavingsImpactChartProps {
  averageMonthlySpending: number;
  potentialSavings: number;
}

export function SavingsImpactChart({ averageMonthlySpending, potentialSavings }: SavingsImpactChartProps) {
  // Generate 12 months projection - memoized to avoid recalculation
  const chartData = useMemo(() => {
    const optimizedMonthly = averageMonthlySpending - potentialSavings;

    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      return {
        month: `Mc ${month}`,
        "Bez optymalizacji": averageMonthlySpending * month,
        "Z optymalizacją": optimizedMonthly * month,
      };
    });
  }, [averageMonthlySpending, potentialSavings]);

  // Calculate metrics for 3, 6, 12 months - memoized to avoid recalculation
  const metrics = useMemo(
    () => ({
      savings3m: potentialSavings * 3,
      savings6m: potentialSavings * 6,
      savings12m: potentialSavings * 12,
    }),
    [potentialSavings]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projekcja oszczędności w czasie</CardTitle>
        <CardDescription>Skumulowane wydatki w ciągu 12 miesięcy</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metrics Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <p className="text-xs text-green-700 font-medium">Za 3 miesiące</p>
            <p className="text-lg font-bold text-green-900">{metrics.savings3m.toFixed(0)} PLN</p>
          </div>
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <p className="text-xs text-green-700 font-medium">Za 6 miesięcy</p>
            <p className="text-lg font-bold text-green-900">{metrics.savings6m.toFixed(0)} PLN</p>
          </div>
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <p className="text-xs text-green-700 font-medium">Za rok</p>
            <p className="text-lg font-bold text-green-900">{metrics.savings12m.toFixed(0)} PLN</p>
          </div>
        </div>

        {/* Chart */}
        <div
          className="h-[250px] w-full"
          role="img"
          aria-label="Wykres projekcji skumulowanych oszczędności w ciągu 12 miesięcy porównujący scenariusz bez optymalizacji i z optymalizacją wydatków"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorWithout" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#9ca3af" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorWith" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(value: number | undefined) => (value !== undefined ? `${value.toFixed(0)} PLN` : "0 PLN")} />
              <Area type="monotone" dataKey="Bez optymalizacji" stroke="#9ca3af" fillOpacity={1} fill="url(#colorWithout)" />
              <Area type="monotone" dataKey="Z optymalizacją" stroke="#22c55e" fillOpacity={1} fill="url(#colorWith)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
