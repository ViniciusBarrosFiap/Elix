import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { env } from "./env";

// Service Role Key: acesso total ao banco. Nunca expor esse client ao app —
// o isolamento por usuário é responsabilidade do backend (ver deviceAuth middleware).
//
// Não usamos Realtime (só REST/RPC/Storage), mas o supabase-js inicializa o
// RealtimeClient de qualquer forma no construtor, e Node < 22 não tem WebSocket
// global — por isso o transport explícito via pacote `ws` (fix sugerido pelo SDK).
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: WebSocket as any },
});
