import { API_BASE_URL } from "./config";
import { getDeviceId } from "./deviceId";

interface ApiFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Corpo já pronto (ex: FormData) — pula o JSON.stringify automático. */
  rawBody?: FormData;
}

/**
 * Wrapper fino sobre fetch: injeta o header X-Device-Id (identidade anônima por
 * dispositivo, ver src/lib/deviceId.ts), monta a URL a partir de API_BASE_URL e
 * padroniza erro em caso de resposta não-2xx.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const deviceId = await getDeviceId();

  const headers: Record<string, string> = { "X-Device-Id": deviceId };

  let body: BodyInit | undefined;
  if (options.rawBody) {
    body = options.rawBody;
    // NÃO define Content-Type manualmente para FormData — o fetch precisa
    // gerar o boundary do multipart sozinho.
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body,
  });

  if (!response.ok) {
    let mensagem = `Falha na requisição (${response.status})`;
    try {
      const data = await response.json();
      if (data?.erro_mensagem) mensagem = data.erro_mensagem;
    } catch {
      // resposta sem corpo JSON — mantém a mensagem genérica
    }
    throw new Error(mensagem);
  }

  // 204 (ou qualquer resposta sem corpo) não tem JSON pra parsear — response.json()
  // lançaria "Unexpected end of JSON input" nesse caso.
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
