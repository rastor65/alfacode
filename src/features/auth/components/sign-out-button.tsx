"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#d5e6ea] bg-white px-3 text-sm font-medium text-[#29404a] transition hover:border-[#469eb4] hover:text-[#286273]"
    >
      <LogOut size={16} aria-hidden="true" />
      Salir
    </button>
  );
}
