import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/authStore";

let inicializado = false;

function traduzErro(mensagem: string): string {
  if (mensagem.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (mensagem.includes("User already registered")) return "Já existe uma conta com esse e-mail.";
  if (mensagem.includes("Password should be at least")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (mensagem.includes("Unable to validate email address")) return "Digite um e-mail válido.";
  return "Não foi possível completar a operação. Tente novamente.";
}

export const AuthService = {
  /**
   * Assina as mudanças de sessão do Supabase (login, logout, refresh de
   * token) e faz a checagem inicial — chamar uma vez só, no boot do app
   * (ver app/_layout.tsx). Idempotente porque _layout roda esse efeito a
   * cada montagem em dev (fast refresh).
   */
  initialize() {
    if (inicializado) return;
    inicializado = true;

    supabase.auth.getSession().then(({ data }) => {
      useAuthStore.getState().setSession(data.session);
      useAuthStore.getState().setHydrated();
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      useAuthStore.getState().setSession(session);
    });
  },

  async signUp(email: string, senha: string) {
    const { data, error } = await supabase.auth.signUp({ email, password: senha });
    if (error) throw new Error(traduzErro(error.message));
    return data;
  },

  async signIn(email: string, senha: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) throw new Error(traduzErro(error.message));
    return data;
  },

  async signOut() {
    await supabase.auth.signOut();
  },
};
