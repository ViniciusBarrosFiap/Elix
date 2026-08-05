// Vars prefixadas com EXPO_PUBLIC_ são embutidas no bundle automaticamente pelo Expo.
// Configure num .env na raiz do app (ver .env.example) apontando para o /server local
// ou para a URL de deploy na Vercel.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3333";
