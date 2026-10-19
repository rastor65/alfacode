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
  iconOnly?: boolean;
};

export function LogoutButton({ className, iconOnly = false }: LogoutButtonProps) {
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
      <Button
        variant="ghost"
        className={cn("w-full", iconOnly && "size-10 px-0 justify-center mx-auto")}
        onClick={logout}
        pending={pending}
        pendingLabel={iconOnly ? "" : "Cerrando sesión…"}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
      >
        <LogOut size={17} className={cn(!iconOnly && "mr-2.5")} aria-hidden="true" />
        {!iconOnly && <span>Cerrar sesión</span>}
      </Button>
    </div>
  );
}
