import { UserRepository } from "./user.repository";

import { useUserDataStore } from "@/src/store/userDataStore";
import { UserData } from "@/src/types/userData";

export const UserService = {
  async initialize() {
    const data =
      await UserRepository.getUser();

    useUserDataStore
      .getState()
      .setData(data);
  },

  async updateUser(
    updates: Partial<UserData>
  ) {
    const data =
      await UserRepository.updateUser(updates);

    useUserDataStore
      .getState()
      .setData(data);

    return data;
  },
};