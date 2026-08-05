import { create } from "zustand";

import { UserData } from "@/src/types/userData";

interface UserDataStore {
  data: UserData | null;

  setData: (
    data: UserData
  ) => void;

  updateUser: (
    updates: Partial<UserData>
  ) => void;
}

export const useUserDataStore =
  create<UserDataStore>((set) => ({
    data: null,

    setData: (data) =>
      set({ data }),

    updateUser: (updates) =>
      set((state) => ({
        data: state.data
          ? {
              ...state.data,
              ...updates,
            }
          : null,
      })),
  }));