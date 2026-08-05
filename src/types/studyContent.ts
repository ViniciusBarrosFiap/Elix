export type Status =
  | "comecando"
  | "em_reforco"
  | "consolidando";

export type TipoCognitivo =
  | "lembranca_direta"
  | "causa_consequencia"
  | "aplicacao_contextual"
  | "relacao_entre_conceitos"
  | "comparacao";

export interface Performance {
  vezes_revisada: number;
  acertos: number;
  erros: number;
}

export interface Alternativas {
  A: string;
  B: string;
  C: string;
  D: string;
}

export interface Pergunta {
  id: string;

  tipo_cognitivo: TipoCognitivo;

  pergunta: string;

  alternativas: {
    A: Alternativas["A"];
    B: Alternativas["B"];
    C: Alternativas["C"];
    D: Alternativas["D"];
  };

  resposta: "A" | "B" | "C" | "D";

  explicacao: string;

  dificuldade: number;

  peso_atual: number;

  proxima_revisao: string;

  review_stage: number;

  performance: Performance;
}

export interface Conceito {
  id: string;

  nome: string;

  peso_atual: number;

  status: Status;

  perguntas: Pergunta[];
}

export interface SubTema {
  id: string;

  nome: string;

  status: Status;

  conceitos: Conceito[];
}

export interface MacroTema {
  id: string;

  nome: string;

  emoji: string;

  status: Status;

  subtemas_ativos: number;

  subtemas: SubTema[];
}

export interface StudyContentData {
  macrotemas: MacroTema[];
}