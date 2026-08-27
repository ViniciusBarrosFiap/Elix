// Status de macro_tema/sub_tema — nunca muda hoje (não há algoritmo que os atualize).
export type Status =
  | "comecando"
  | "em_reforco"
  | "consolidando";

export const STATUS_LABEL: Record<Status, string> = {
  comecando: "Começando",
  em_reforco: "Em reforço",
  consolidando: "Consolidando",
};

// Status de conceito — vocabulário à parte, evolui via POST /api/quiz/answer
// (nasce "novo" e chega a "dominado" ao acertar o nível 3).
export type StatusConceito =
  | "novo"
  | "em_reforco"
  | "consolidando"
  | "dominado";

export const STATUS_CONCEITO_LABEL: Record<StatusConceito, string> = {
  novo: "Novo",
  em_reforco: "Em reforço",
  consolidando: "Consolidando",
  dominado: "Dominado",
};

export type NivelPergunta = 1 | 2 | 3;

export type TipoPergunta =
  | "identificacao"
  | "relacao"
  | "aplicacao";

export interface Performance {
  vezes_revisado: number;
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

  nivel: NivelPergunta;

  tipo: TipoPergunta;

  pergunta: string;

  dica: string;

  alternativas: {
    A: Alternativas["A"];
    B: Alternativas["B"];
    C: Alternativas["C"];
    D: Alternativas["D"];
  };

  resposta: "A" | "B" | "C" | "D";

  explicacao: string;
}

export interface Conceito {
  id: string;

  nome: string;

  status: StatusConceito;

  nivel_atual: NivelPergunta;

  tag_foco: boolean;

  proxima_revisao: string;

  performance: Performance;

  perguntas: Pergunta[];
}

// Tipo do material que originou o subtema — determina como a tela da
// disciplina oferece "abrir material" (link direto pro YouTube, URL assinada
// pro documento, ou nenhuma opção pro Notion).
export type MaterialTipo = "documento" | "youtube" | "notion";

export interface SubTemaMaterial {
  id: string;
  nome: string; // nome do arquivo, URL do vídeo ou título da página
  tipo: MaterialTipo;
}

export interface SubTema {
  id: string;

  nome: string;

  status: Status;

  material: SubTemaMaterial;

  conceitos: Conceito[];
}

export interface MacroTema {
  id: string;

  nome: string;

  emoji: string;

  status: Status;

  progresso: number;

  subtemas_ativos: number;

  subtemas: SubTema[];
}

export interface StudyContentData {
  macrotemas: MacroTema[];
}
