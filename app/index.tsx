import { useUserDataStore } from "@/src/store/userDataStore";
import { Redirect } from "expo-router";

export default function Index() {
  const isFirstAccess =
  useUserDataStore(
    (state) =>
      state.data?.primeiroAcesso
  );

  // Enquanto o store ainda está hidratando, ainda não sabemos pra onde ir —
  // esse instante é curto demais pra valer uma tela própria.
  if(isFirstAccess === undefined) {
    return null;
  }

  // A partir daqui já sabemos o destino, então toda abertura do app passa
  // pela tela de Loading (mesmo padrão usado em welcome/addSubjects) em vez
  // de pular direto pra welcome/home.
  return (
    <Redirect
      href={{
        pathname: "/loadingScreen",
        params: {
          next: isFirstAccess ? "/welcome" : "/home",
          title: "Aguarde um momento...",
          subtitle: "Preparando tudo pra você.",
        },
      }}
    />
  );
}