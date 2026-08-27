import crypto from "node:crypto";

// Handshake do OAuth: o app chama GET /api/notion/auth-url autenticado
// (X-Device-Id), a gente gera um `state` aleatório e guarda "esse state
// pertence a esse userId" aqui. Quando o Notion redireciona de volta pro
// /api/notion/callback, essa é a única forma de saber QUAL usuário estava
// completando o fluxo — o redirect do Notion é um GET puro do navegador,
// sem header nenhum de identificação.
//
// Guardado em memória (processo único, sem Redis nesse stack) — cada state
// expira sozinho em 10 minutos e é consumido (removido) no primeiro uso.
const STATE_TTL_MS = 10 * 60 * 1000;

interface StateEntry {
  userId: string;
  // Deep link específico que o app pediu pra voltar no final (ex: um exp://
  // do Expo Go, que muda a cada sessão de dev) — se ausente, o callback usa
  // o APP_DEEP_LINK_URL fixo do .env.
  returnTo?: string;
  expiresAt: number;
}

const states = new Map<string, StateEntry>();

function limparExpirados() {
  const agora = Date.now();
  for (const [state, entry] of states) {
    if (entry.expiresAt <= agora) states.delete(state);
  }
}

// Varredura periódica pra não acumular states abandonados (usuário que
// nunca completou o OAuth) indefinidamente em memória.
setInterval(limparExpirados, STATE_TTL_MS).unref();

export function criarState(userId: string, returnTo?: string): string {
  limparExpirados();
  const state = crypto.randomBytes(24).toString("hex");
  states.set(state, { userId, returnTo, expiresAt: Date.now() + STATE_TTL_MS });
  return state;
}

/** Consome (remove) o state e devolve os dados associados, ou null se inválido/expirado. */
export function consumirState(state: string): { userId: string; returnTo?: string } | null {
  const entry = states.get(state);
  states.delete(state);

  if (!entry || entry.expiresAt <= Date.now()) return null;
  return { userId: entry.userId, returnTo: entry.returnTo };
}
