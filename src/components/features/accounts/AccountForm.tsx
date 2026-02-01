import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import type { AccountFormViewModel } from "@/types";

const accountFormSchema = z.object({
  name: z.string().min(1, "Nazwa konta jest wymagana").max(100, "Nazwa może mieć maksymalnie 100 znaków"),
  initial_balance: z.preprocess(
    (value) => {
      if (typeof value === "string") {
        const cleaned = value.trim();
        if (cleaned === "") {
          return undefined;
        }
        return Number(cleaned.replace(",", "."));
      }
      return value;
    },
    z
      .number({
        invalid_type_error: "Saldo początkowe musi być liczbą",
        required_error: "Saldo początkowe jest wymagane",
      })
      .min(0, "Saldo nie może być wartością ujemną")
  ),
});

export type AccountFormServerErrors = Partial<Record<keyof AccountFormViewModel, string>>;

export interface AccountFormProps {
  onSubmit: (data: AccountFormViewModel) => Promise<void> | void;
  initialData?: AccountFormViewModel;
  isSubmitting: boolean;
  serverErrors?: AccountFormServerErrors;
  generalError?: string | null;
}

export default function AccountForm({ onSubmit, initialData, isSubmitting, serverErrors, generalError }: AccountFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AccountFormViewModel>({
    resolver: zodResolver(accountFormSchema) as Resolver<AccountFormViewModel>,
    mode: "onTouched",
    defaultValues: {
      name: initialData?.name ?? "",
      initial_balance: initialData?.initial_balance ?? 0,
    },
  });

  useEffect(() => {
    reset({
      name: initialData?.name ?? "",
      initial_balance: initialData?.initial_balance ?? 0,
    });
  }, [initialData, reset]);

  const idPrefix = useId();
  const nameId = `${idPrefix}-name`;
  const balanceId = `${idPrefix}-initial-balance`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label htmlFor={nameId} className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Nazwa konta
        </label>
        <input
          id={nameId}
          type="text"
          className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          placeholder="Np. Rachunek bieżący"
          aria-invalid={errors.name || serverErrors?.name ? "true" : "false"}
          {...register("name")}
        />
        {(errors.name?.message || serverErrors?.name) && <p className="mt-1 text-xs text-destructive">{errors.name?.message ?? serverErrors?.name}</p>}
      </div>

      <div>
        <label htmlFor={balanceId} className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Saldo początkowe
        </label>
        <input
          id={balanceId}
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          placeholder="0.00"
          aria-invalid={errors.initial_balance || serverErrors?.initial_balance ? "true" : "false"}
          {...register("initial_balance")}
        />
        {(errors.initial_balance?.message || serverErrors?.initial_balance) && (
          <p className="mt-1 text-xs text-destructive">{errors.initial_balance?.message ?? serverErrors?.initial_balance}</p>
        )}
      </div>

      {generalError && <p className="text-sm text-destructive">{generalError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Zapisywanie..." : "Zapisz"}
      </button>
    </form>
  );
}
