import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const DEVICE_ID_KEY = "elix_device_id";

let cachedDeviceId: string | null = null;

/**
 * expo-secure-store não tem implementação nativa no navegador (não existe
 * Keychain/Keystore lá) — na web usamos localStorage como equivalente, só
 * sem a camada de criptografia do SecureStore.
 */
const deviceIdStorage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === "web") return window.localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      window.localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === "web") {
      window.localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

/**
 * Identidade anônima por dispositivo (sem login/senha): um UUID gerado uma vez
 * e persistido no SecureStore, enviado em toda request no header X-Device-Id.
 * Reinstalar o app ou trocar de aparelho perde o histórico (ver documentação).
 */
export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  const stored = await deviceIdStorage.get(DEVICE_ID_KEY);
  if (stored) {
    cachedDeviceId = stored;
    return stored;
  }

  const generated = Crypto.randomUUID();
  await deviceIdStorage.set(DEVICE_ID_KEY, generated);
  cachedDeviceId = generated;
  return generated;
}

/**
 * "Apagar dados locais": esquece o device_id atual (SecureStore + cache em
 * memória), fazendo o próximo getDeviceId() gerar um UUID novo. O servidor
 * não é avisado — os dados antigos continuam no Supabase, só ficam órfãos,
 * vinculados a um device_id que o app não usa mais (ver deviceAuth.ts).
 */
export async function resetDeviceId(): Promise<void> {
  await deviceIdStorage.remove(DEVICE_ID_KEY);
  cachedDeviceId = null;
}
