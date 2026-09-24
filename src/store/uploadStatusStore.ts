import { create } from "zustand";

export type UploadStatus = "idle" | "processing" | "success" | "error";

interface ConcluirOpcoes {
  titulo?: string;
  subtitulo?: string;
}

interface UploadStatusStore {
  status: UploadStatus;
  // Linha principal do card. Em erro, o detalhe da falha vai em `subtitulo`.
  mensagem: string | null;
  subtitulo: string | null;
  // Reexecuta a mesma geração que falhou — usado pelo botão "Tentar
  // novamente" do UploadStatusPill. Fica null fora do fluxo de erro.
  retry: (() => void) | null;

  iniciar: (mensagem?: string, retry?: () => void) => void;
  concluir: (opcoes?: ConcluirOpcoes) => void;
  falhar: (detalhe: string) => void;
  reset: () => void;
}

// Estado global (não fica preso ao ciclo de vida de addContent.tsx) — é o que
// permite disparar a geração, redirecionar pra Home na hora, e mesmo assim
// atualizar o container flutuante (ver UploadStatusPill) quando a IA terminar,
// não importa em qual tela o usuário esteja nesse momento.
export const useUploadStatusStore = create<UploadStatusStore>((set) => ({
  status: "idle",
  mensagem: null,
  subtitulo: null,
  retry: null,

  iniciar: (mensagem, retry) =>
    set({
      status: "processing",
      mensagem: mensagem ?? "Gerando sua revisão...",
      subtitulo: null,
      retry: retry ?? null,
    }),
  concluir: (opcoes) =>
    set({
      status: "success",
      mensagem: opcoes?.titulo ?? "Revisão pronta",
      subtitulo: opcoes?.subtitulo ?? "Sua revisão diária foi atualizada",
      retry: null,
    }),
  // Mantém `retry` do estado anterior (setado em iniciar) — é o que permite
  // ao pill reexecutar a mesma geração que acabou de falhar.
  falhar: (detalhe) =>
    set((state) => ({
      status: "error",
      mensagem: "Falha ao gerar revisão",
      subtitulo: detalhe,
      retry: state.retry,
    })),
  reset: () => set({ status: "idle", mensagem: null, subtitulo: null, retry: null }),
}));
