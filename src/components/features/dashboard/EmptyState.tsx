import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, Wallet } from "lucide-react";
import AddAccountModal from "../accounts/AddAccountModal";
import useAccounts from "@/components/hooks/useAccounts";

export function EmptyState() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { createAccount } = useAccounts();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-2 text-2xl font-bold tracking-tight">Witaj w 10xPersonal Finance!</h2>
          <p className="mb-8 text-muted-foreground">Aby zacząć kontrolować swoje finanse, dodaj swoje pierwsze konto bankowe lub portfel.</p>

          <Button onClick={() => setIsModalOpen(true)} size="lg" className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Dodaj pierwsze konto
          </Button>

          <AddAccountModal
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
            onSubmit={createAccount}
            onSuccess={() => {
              setIsModalOpen(false);
              window.location.reload();
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
