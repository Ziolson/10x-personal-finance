import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Assuming Alert component exists or will be added, if not use simple div for now or Toast
// import { Icons } from "@/components/icons"; // Assuming generic icons or lucide-react direct usage

const formSchema = z.object({
  email: z.string().email({
    message: "Proszę wprowadzić poprawny adres e-mail.",
  }),
  password: z.string().min(1, {
    message: "Hasło jest wymagane.",
  }),
});

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (rateLimitCountdown === null) return;

    if (rateLimitCountdown <= 0) {
      setRateLimitCountdown(null);
      setError(null);
      return;
    }

    const timer = setTimeout(() => {
      setRateLimitCountdown((prev) => (prev !== null ? prev - 1 : null));
      setError((prev) => {
        if (prev && prev.startsWith("Zbyt wiele prób")) {
          return `Zbyt wiele prób logowania. Spróbuj ponownie za ${rateLimitCountdown - 1}s.`;
        }
        return prev;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [rateLimitCountdown]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const seconds = retryAfter ? parseInt(retryAfter, 10) : 60;
        setRateLimitCountdown(seconds);
        setError(`Zbyt wiele prób logowania. Spróbuj ponownie za ${seconds}s.`);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Nie udało się zalogować");
      }

      // Successful login - redirect to dashboard
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd podczas logowania. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="nazwa@przyklad.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Hasło</FormLabel>
                  <a href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                    Zapomniałeś hasła?
                  </a>
                </div>
                <FormControl>
                  <PasswordInput placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">{error}</div>}

          <Button type="submit" className="w-full" disabled={isLoading || rateLimitCountdown !== null}>
            {isLoading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
            {rateLimitCountdown !== null ? `Poczekaj ${rateLimitCountdown}s` : "Zaloguj się"}
          </Button>
        </form>
      </Form>
      <div className="text-center text-sm">
        Nie masz konta?{" "}
        <a href="/register" className="font-medium text-primary hover:underline">
          Zarejestruj się
        </a>
      </div>
    </div>
  );
}
