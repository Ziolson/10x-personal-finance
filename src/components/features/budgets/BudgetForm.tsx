import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CreateBudgetSchema } from "@/lib/validators/budgets.validators";
import type { CategoryDTO, BudgetDTO } from "@/types";
import { useMemo } from "react";

// Create a form schema without month/year for the form
const BudgetFormSchema = CreateBudgetSchema.omit({ month: true, year: true });
type BudgetFormValues = z.infer<typeof BudgetFormSchema>;

interface BudgetFormProps {
  defaultValues?: Partial<BudgetFormValues>;
  onSubmit: (data: BudgetFormValues) => Promise<void>;
  isSubmitting: boolean;
  mode: "create" | "edit";
  availableCategories: CategoryDTO[];
  usedCategoryIds: string[];
  currentBudgetCategoryIds?: string[];
}

export default function BudgetForm({ defaultValues, onSubmit, isSubmitting, mode, availableCategories, usedCategoryIds, currentBudgetCategoryIds = [] }: BudgetFormProps) {
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(BudgetFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      amount: defaultValues?.amount || 0,
      category_ids: defaultValues?.category_ids || [],
    },
  });

  // Filter categories: exclude those used by OTHER budgets but allow current budget's categories
  const selectableCategories = useMemo(() => {
    return availableCategories.filter((cat) => !usedCategoryIds.includes(cat.id) || currentBudgetCategoryIds.includes(cat.id));
  }, [availableCategories, usedCategoryIds, currentBudgetCategoryIds]);

  const selectedCategoryIds = form.watch("category_ids") || [];

  const toggleCategory = (categoryId: string) => {
    const current = form.getValues("category_ids") || [];
    const newValue = current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId];
    form.setValue("category_ids", newValue);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nazwa budżetu</FormLabel>
              <FormControl>
                <Input placeholder="Np. Dom i Spożywcze" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kwota (PLN)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category_ids"
          render={() => (
            <FormItem>
              <FormLabel>Kategorie</FormLabel>
              <div className="space-y-2">
                {selectableCategories.length === 0 ? (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Wszystkie kategorie są już przypisane do innych budżetów w tym miesiącu.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {selectableCategories.map((category) => {
                      const isSelected = selectedCategoryIds.includes(category.id);
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => toggleCategory(category.id)}
                          className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                            isSelected
                              ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                              : "border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
                          }`}
                        >
                          {category.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Dodaj budżet" : "Zapisz zmiany"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
