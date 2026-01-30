import * as React from "react";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import type { DashboardSummary } from "@/types";
import { SummaryCard } from "./SummaryCard";

interface SummaryCardsProps {
  summary: DashboardSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <SummaryCard title="Przychody" amount={summary.total_income} type="income" icon={<ArrowDownLeft className="h-4 w-4 text-muted-foreground" />} />
      <SummaryCard title="Wydatki" amount={summary.total_expense} type="expense" icon={<ArrowUpRight className="h-4 w-4 text-muted-foreground" />} />
      <SummaryCard title="Saldo" amount={summary.balance} icon={<Wallet className="h-4 w-4 text-muted-foreground" />} />
    </div>
  );
}
