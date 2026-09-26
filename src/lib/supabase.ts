// supabase-js usa APIs de URL/crypto que o React Native não tem globalmente —
// o polyfill precisa ser importado antes de qualquer outra coisa usar o client.
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    "EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY ausentes — preencha o .env (ver .env.example)."
  );
}

// Client fala só com a Auth API do Supabase (login/cadastro/sessão) — o app
// nunca consulta as tabelas por aqui, todo acesso a dado passa pelo /server
// com a service role key (ver server/src/config/supabase.ts).
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
