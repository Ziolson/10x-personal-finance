import { Calendar, TrendingDown, Wallet } from "lucide-react";

interface InsightsSummaryBannerProps {
  monthsAnalyzed: number;
  averageSpending: number;
  potentialSavings: number;
}

export function InsightsSummaryBanner({ monthsAnalyzed, averageSpending, potentialSavings }: InsightsSummaryBannerProps) {
  const monthsLabel = monthsAnalyzed === 1 ? "miesiąc" : monthsAnalyzed <= 4 ? "miesiące" : "miesięcy";

  return (
    <div className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Analyzed Period */}
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white/20 p-3">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm opacity-90">Analizowany okres</p>
            <p className="text-2xl font-bold">
              {monthsAnalyzed} {monthsLabel}
            </p>
          </div>
        </div>

        {/* Average Spending */}
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white/20 p-3">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm opacity-90">Średnie wydatki</p>
            <p className="text-2xl font-bold">
              {averageSpending.toFixed(0)} PLN<span className="text-sm font-normal">/mc</span>
            </p>
          </div>
        </div>

        {/* Potential Savings */}
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white/20 p-3">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm opacity-90">Możesz zaoszczędzić</p>
            <p className="text-3xl font-bold">
              {potentialSavings.toFixed(0)} PLN<span className="text-sm font-normal">/mc</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
