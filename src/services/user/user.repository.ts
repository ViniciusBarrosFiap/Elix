import userDataMock from "@/src/mocks/userData.json";

import { UserData } from "@/src/types/userData";

export const UserRepository = {
  async getUser(): Promise<UserData> {
    return userDataMock as UserData;
  },
};