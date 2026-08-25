import { Client } from "@notionhq/client";

// Instância única, sem auth fixo — cada chamada passa `auth: accessToken` do
// usuário (multi-tenant: um token por usuário conectado, ver notion.service.ts).
export const notionClient = new Client();
