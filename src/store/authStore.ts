import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";

interface AuthStore {
  session: Session | null;
  // Diferencia "ainda não sabemos se há sessão" (isHydrated: false) de
  // "sabemos que não há sessão" (isHydrated: true, session: null) — sem
  // isso o boot do app não teria como esperar a checagem inicial antes de
  // decidir entre welcome/login e home.
  isHydrated: boolean;

  setSession: (session: Session | null) => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  isHydrated: false,

  setSession: (session) => set({ session }),
  setHydrated: () => set({ isHydrated: true }),
}));
