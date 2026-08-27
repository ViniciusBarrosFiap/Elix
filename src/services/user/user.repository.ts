import { apiFetch } from "@/src/lib/apiClient";
import { UserData } from "@/src/types/userData";

export const UserRepository = {
  async getUser(): Promise<UserData> {
    return apiFetch<UserData>("/api/users/identify", { method: "POST", body: {} });
  },

  async updateUser(updates: Partial<UserData>): Promise<UserData> {
    return apiFetch<UserData>("/api/users/me", { method: "PATCH", body: updates });
  },

  async deleteAccount(): Promise<void> {
    return apiFetch<void>("/api/users/me", { method: "DELETE" });
  },
};
