import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Lightbulb } from "lucide-react";
import type { AIInsight } from "@/types";

interface InsightDetailCardProps {
  insight: AIInsight;
  rank: number;
}

const PRIORITY_CONFIG = {
  high: { label: "Wysoki", color: "bg-red-500", bgColor: "bg-red-50", borderColor: "border-red-200" },
  medium: { label: "Średni", color: "bg-amber-500", bgColor: "bg-amber-50", borderColor: "border-amber-200" },
  low: { label: "Niski", color: "bg-blue-500", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
};

export function InsightDetailCard({ insight, rank }: InsightDetailCardProps) {
  const config = PRIORITY_CONFIG[insight.priority];
  const reductionPercent = ((insight.potential_savings / insight.current_spending) * 100).toFixed(0);
  const targetPercent = (insight.suggested_target / insight.current_spending) * 100;

  return (
    <Card className={`border-l-4 ${config.borderColor}`}>
      <CardContent className="pt-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold">{rank}</div>
            <div>
              <h3 className="text-lg font-semibold">{insight.category}</h3>
              <Badge variant="outline" className={config.color + " text-white border-0"}>
                {config.label} priorytet
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-purple-600">{insight.potential_savings.toFixed(0)} PLN</p>
            <p className="text-sm text-muted-foreground">/miesiąc</p>
          </div>
        </div>

        {/* Current vs Target */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Current Spending */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Obecne wydatki</span>
              <span className="font-semibold">{insight.current_spending.toFixed(0)} PLN</span>
            </div>
            <Progress value={100} className="h-2" />
          </div>

          {/* Target */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3 text-purple-600" />
                <span className="text-muted-foreground">Proponowany cel</span>
              </div>
              <span className="font-semibold text-purple-600">{insight.suggested_target.toFixed(0)} PLN</span>
            </div>
            <Progress value={targetPercent} className="h-2" />
          </div>
        </div>

        {/* Reduction Badge */}
        <div className="flex justify-center">
          <Badge variant="secondary" className="text-sm">
            Redukcja o {reductionPercent}%
          </Badge>
        </div>

        {/* Reasoning */}
        <div className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-4`}>
          <p className="text-sm">{insight.reasoning}</p>
        </div>

        {/* Actionable Tips */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <span>Jak to osiągnąć:</span>
          </div>
          <ul className="space-y-2 ml-6">
            {insight.actionable_tips.map((tip, index) => (
              <li key={index} className="text-sm text-muted-foreground list-disc">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
