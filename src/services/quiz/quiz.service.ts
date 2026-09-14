import { useQuizQuestionsStore } from "@/src/store/quizQuestionsStore";
import { QuizQuestionsRepository } from "./quiz.repository";
import { isDevTestModeAtivo } from "@/src/dev/devTestMode";


export const QuizQuestionsService = {
  async initialize(macroTemaId?: string) {
    // Modo Teste (ver app/(tabs)/(profile)/testes.tsx) injeta os dados
    // diretamente no store — pular a chamada real evita que ela sobrescreva
    // o mock assim que a tela ganha foco de novo.
    if (isDevTestModeAtivo()) return;

    const data =
      await QuizQuestionsRepository.getAll(macroTemaId);

    useQuizQuestionsStore
      .getState()
      .setData(data);
  },

  // `resposta` (A-D) é pra perguntas de múltipla escolha (nível 1-3);
  // `autoavaliacao` é pra dissertativas (nível 4, sem gabarito A-D) — o
  // aluno reporta se acertou depois de comparar com a resposta_modelo.
  async submitAnswer(perguntaId: string, resposta?: string, autoavaliacao?: "acertou" | "errou") {
    // Perguntas mockadas (Modo Teste) não existem no backend — enviar
    // daria 404 à toa. O feedback local (elixir, progresso da sessão) já
    // acontece antes disso em quiz/index.tsx, então não precisa de rede aqui.
    if (isDevTestModeAtivo()) {
      const acertou = autoavaliacao ? autoavaliacao === "acertou" : true;
      return { acertou, elixir_ganho: 0, conceito: { id: perguntaId, nivel_atual: 1 as const, status: "novo", proxima_revisao: "" } };
    }

    return QuizQuestionsRepository.submitAnswer(perguntaId, resposta, autoavaliacao);
  },
};
