// Flag global (em memória, não persistida) usada só pela tela de Testes (ver
// app/(tabs)/(profile)/testes.tsx). Enquanto ativa, os `initialize()` dos
// services (user/studyContent/quiz) não disparam a chamada de rede real —
// sem isso, o primeiro useEffect/useFocusEffect que rodasse depois de
// navegar pra uma tela mockada sobrescreveria os dados fake com a resposta
// (vazia) da API de verdade.

let ativo = false;

export function isDevTestModeAtivo(): boolean {
  return ativo;
}

export function ativarDevTestMode(): void {
  ativo = true;
}

export function desativarDevTestMode(): void {
  ativo = false;
}
