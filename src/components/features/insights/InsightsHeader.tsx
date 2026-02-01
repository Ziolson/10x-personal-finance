import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InsightsHeaderProps {
  recommendation: string;
  selectedMonths: 1 | 2 | 3;
  onMonthsChange: (months: 1 | 2 | 3) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  generatedAt: string;
}

export function InsightsHeader({ recommendation, selectedMonths, onMonthsChange, onRefresh, isRefreshing, generatedAt }: InsightsHeaderProps) {
  const formattedDate = new Date(generatedAt).toLocaleString("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 flex-1">
          <h1 className="text-3xl font-bold">Rekomendacje AI</h1>
          <p className="text-muted-foreground">{recommendation}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMonths.toString()} onValueChange={(value) => onMonthsChange(parseInt(value) as 1 | 2 | 3)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 miesiąc</SelectItem>
              <SelectItem value="2">2 miesiące</SelectItem>
              <SelectItem value="3">3 miesiące</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={onRefresh} variant="outline" disabled={isRefreshing} aria-label="Odśwież analizę AI" title="Odśwież analizę">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Odśwież
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Ostatnia aktualizacja: {formattedDate}</p>
    </div>
  );
}
