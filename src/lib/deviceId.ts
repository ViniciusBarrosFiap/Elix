import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const DEVICE_ID_KEY = "elix_device_id";

let cachedDeviceId: string | null = null;

/**
 * Identidade anônima por dispositivo (sem login/senha): um UUID gerado uma vez
 * e persistido no SecureStore, enviado em toda request no header X-Device-Id.
 * Reinstalar o app ou trocar de aparelho perde o histórico (ver documentação).
 */
export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (stored) {
    cachedDeviceId = stored;
    return stored;
  }

  const generated = Crypto.randomUUID();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, generated);
  cachedDeviceId = generated;
  return generated;
}
