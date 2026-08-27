import { apiFetch } from "@/src/lib/apiClient";

export interface NotionStatus {
  connected: boolean;
  workspace_name?: string | null;
  workspace_icon?: string | null;
}

export interface NotionPage {
  id: string;
  title: string;
  icon: string | null;
  url: string;
  last_edited_time: string;
}

export const NotionRepository = {
  async getStatus(): Promise<NotionStatus> {
    return apiFetch<NotionStatus>("/api/notion/status");
  },

  async getAuthUrl(redirectUri: string): Promise<string> {
    const { url } = await apiFetch<{ url: string }>(
      `/api/notion/auth-url?redirect_uri=${encodeURIComponent(redirectUri)}`
    );
    return url;
  },

  async getPages(): Promise<NotionPage[]> {
    const { pages } = await apiFetch<{ pages: NotionPage[] }>("/api/notion/pages");
    return pages;
  },

  async disconnect(): Promise<void> {
    await apiFetch<void>("/api/notion/connection", { method: "DELETE" });
  },
};
