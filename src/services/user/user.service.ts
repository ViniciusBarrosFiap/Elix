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

  updateUser(
    updates: Partial<UserData>
  ) {
    useUserDataStore
      .getState()
      .updateUser(updates);
  },
};