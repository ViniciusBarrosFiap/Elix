import { useAuthStore } from "@/src/store/authStore";
import { useUserDataStore } from "@/src/store/userDataStore";
import { Redirect } from "expo-router";

export default function Index() {
  const isAuthHydrated = useAuthStore((state) => state.isHydrated);
  const session = useAuthStore((state) => state.session);
  const isFirstAccess = useUserDataStore((state) => state.data?.primeiroAcesso);

  // Ainda não sabemos se há uma sessão salva (ver src/services/auth/auth.service.ts) —
  // esse instante é curto demais pra valer uma tela própria.
  if (!isAuthHydrated) {
    return null;
  }

  // Sem sessão: nunca logou ou saiu — cai na tela de entrada (Cadastrar/Entrar).
  if (!session) {
    return (
      <Redirect
        href={{
          pathname: "/loadingScreen",
          params: {
            next: "/welcome",
            title: "Aguarde um momento...",
            subtitle: "Preparando tudo pra você.",
          },
        }}
      />
    );
  }

  // Sessão existe, mas o _layout ainda está buscando os dados do usuário
  // (useEffect disparado pela sessão em app/_layout.tsx).
  if (isFirstAccess === undefined) {
    return null;
  }

  // Logado mas nunca terminou o onboarding (curso/semestre/disciplinas) —
  // retoma daí em vez de mostrar a tela de entrada de novo.
  return (
    <Redirect
      href={{
        pathname: "/loadingScreen",
        params: {
          next: isFirstAccess ? "/(auth)/signUp" : "/home",
          title: "Aguarde um momento...",
          subtitle: "Preparando tudo pra você.",
        },
      }}
    />
  );
}
