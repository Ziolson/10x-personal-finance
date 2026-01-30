import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthNavigatorProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

const MONTH_NAMES = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];

export default function MonthNavigator({ currentDate, onDateChange }: MonthNavigatorProps) {
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  const monthName = MONTH_NAMES[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  return (
    <div className="flex items-center justify-center gap-4">
      <Button variant="outline" size="sm" onClick={handlePrevious} aria-label="Poprzedni miesiąc">
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="min-w-[180px] text-center">
        <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {monthName} {year}
        </span>
      </div>

      <Button variant="outline" size="sm" onClick={handleNext} aria-label="Następny miesiąc">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
