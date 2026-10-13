"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/client";
import { ApiRequestError, describeError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logout() {
    setPending(true);
    setError(null);

    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch (caught) {
      // Si la sesion ya no existe, el resultado es el mismo: no hay sesion abierta.
      if (!(caught instanceof ApiRequestError && caught.status === 401)) {
        setError(describeError(caught));
        setPending(false);
        return;
      }
    }

    router.replace("/ingresar");
    router.refresh();
  }

  return (
    <div className={cn("space-y-3", className)}>
      {error && <Alert tone="error">{error}</Alert>}
      <Button variant="ghost" className="w-full" onClick={logout} pending={pending} pendingLabel="Cerrando sesión…">
        <LogOut size={17} className="mr-2.5" aria-hidden="true" />
        Cerrar sesión
      </Button>
    </div>
  );
}
