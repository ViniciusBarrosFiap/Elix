import { create } from "zustand";

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

interface QuizSessionState {
  data: string;
  totalSessao: number;
  elixirMaximo: number;
  acertos: number;
  erros: number;
  elixirTotal: number;

  /**
   * Garante que a sessão de hoje já foi iniciada — captura o tamanho total
   * da dose (`totalAtual`) e o elixir máximo possível (`elixirMaximoAtual`)
   * só na PRIMEIRA vez que a tela do quiz é aberta hoje. Sem isso, cada vez
   * que o aluno sai pra Home e volta (o que remonta a tela e refaz o
   * fetch), a lista de perguntas vem menor — o backend já não devolve mais
   * o que foi respondido hoje — e a barra de progresso/frasco de elixir,
   * que antes eram calculados em cima dessa lista, voltavam pra 0%.
   * Guardando os totais originais uma vez só, o progresso continua
   * refletindo o dia inteiro, não só o que sobrou na tela atual.
   */
  garantirSessao: (totalAtual: number, elixirMaximoAtual: number) => void;
  registrarResposta: (acertou: boolean, elixirGanho: number) => void;
}

export const useQuizSessionStore = create<QuizSessionState>((set, get) => ({
  data: "",
  totalSessao: 0,
  elixirMaximo: 0,
  acertos: 0,
  erros: 0,
  elixirTotal: 0,

  garantirSessao: (totalAtual, elixirMaximoAtual) => {
    const hoje = hojeISO();
    if (get().data !== hoje) {
      set({
        data: hoje,
        totalSessao: totalAtual,
        elixirMaximo: elixirMaximoAtual,
        acertos: 0,
        erros: 0,
        elixirTotal: 0,
      });
    }
  },

  registrarResposta: (acertou, elixirGanho) =>
    set((s) => ({
      acertos: s.acertos + (acertou ? 1 : 0),
      erros: s.erros + (acertou ? 0 : 1),
      elixirTotal: s.elixirTotal + elixirGanho,
    })),
}));
