import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

// Service Role Key: acesso total ao banco. Nunca expor esse client ao app —
// o isolamento por usuário é responsabilidade do backend (ver deviceAuth middleware).
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
