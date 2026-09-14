import { UserRepository } from "./user.repository";

import { useUserDataStore } from "@/src/store/userDataStore";
import { UserData } from "@/src/types/userData";
import { isDevTestModeAtivo } from "@/src/dev/devTestMode";

export const UserService = {
  async initialize() {
    // Modo Teste (ver app/(tabs)/(profile)/testes.tsx) injeta os dados
    // diretamente no store — pular a chamada real evita que ela sobrescreva
    // o mock assim que a tela ganha foco de novo.
    if (isDevTestModeAtivo()) return;

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