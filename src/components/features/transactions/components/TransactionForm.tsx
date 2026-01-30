import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { AccountDTO, CategoryDTO } from "@/types";
import type { TransactionFormValues } from "../types";

const transactionSchema = z
  .object({
    type: z.enum(["expense", "income", "transfer"]),
    amount: z.coerce.number().min(0.01, "Kwota musi być większa od 0"),
    date: z.date({ required_error: "Data jest wymagana" }),
    description: z.string().optional(),
    from_account_id: z.string().optional(),
    to_account_id: z.string().optional(),
    category_id: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "expense") {
      if (!data.from_account_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Konto źródłowe jest wymagane",
          path: ["from_account_id"],
        });
      }
      if (!data.category_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Kategoria jest wymagana",
          path: ["category_id"],
        });
      }
    }

    if (data.type === "income") {
      if (!data.to_account_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Konto docelowe jest wymagane",
          path: ["to_account_id"],
        });
      }
      if (!data.category_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Kategoria jest wymagana",
          path: ["category_id"],
        });
      }
    }

    if (data.type === "transfer") {
      if (!data.from_account_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Konto źródłowe jest wymagane",
          path: ["from_account_id"],
        });
      }
      if (!data.to_account_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Konto docelowe jest wymagane",
          path: ["to_account_id"],
        });
      }
      if (data.from_account_id && data.to_account_id && data.from_account_id === data.to_account_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Konto docelowe musi być inne niż źródłowe",
          path: ["to_account_id"],
        });
      }
    }
  });

interface TransactionFormProps {
  defaultValues?: Partial<TransactionFormValues>;
  accounts: AccountDTO[];
  categories: CategoryDTO[];
  onSubmit: (values: TransactionFormValues) => Promise<void>;
  isLoading: boolean;
}

export default function TransactionForm({ defaultValues, accounts, categories, onSubmit, isLoading }: TransactionFormProps) {
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "expense",
      amount: 0,
      date: new Date(),
      description: "",
      from_account_id: "",
      to_account_id: "",
      category_id: "",
      ...defaultValues,
    },
  });

  const type = form.watch("type");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Typ transakcji</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz typ" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="expense">Wydatek</SelectItem>
                  <SelectItem value="income">Przychód</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kwota</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "dd.MM.yyyy") : <span>Wybierz datę</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opis</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {(type === "expense" || type === "transfer") && (
          <FormField
            control={form.control}
            name="from_account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Z konta</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz konto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {(type === "income" || type === "transfer") && (
          <FormField
            control={form.control}
            name="to_account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Na konto</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz konto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {(type === "expense" || type === "income") && (
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategoria</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz kategorię" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories
                      .filter((c) => c.type === type) // Filter categories by transaction type
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Zapisywanie..." : "Zapisz"}
        </Button>
      </form>
    </Form>
  );
}
