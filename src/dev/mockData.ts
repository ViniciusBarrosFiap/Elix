// Dados fake pra tela de Testes (ver app/(tabs)/(profile)/testes.tsx) —
// deixam navegar por qualquer tela do app já com conteúdo populado, sem
// precisar subir um material de verdade e esperar a IA gerar nada. Nunca
// importado fora de src/dev/**.

import { QuizQuestion, QuizQuestionsData } from "@/src/types/quizQuestions";
import { MacroTema, StudyContentData } from "@/src/types/studyContent";
import { UserData } from "@/src/types/userData";

function hojeISO(diasOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + diasOffset);
  return d.toISOString().slice(0, 10);
}

export function mockUserData(overrides: Partial<UserData> = {}): UserData {
  return {
    user_id: "dev-mock-user",
    nome: "Modo Teste",
    primeiroAcesso: false,
    curso: "Medicina",
    disciplinas: ["Biologia Celular"],
    semestre: 2,
    fezUpload: true,
    pontuacao: 480,
    streak: 5,
    ...overrides,
  };
}

// ─── Quiz — uma pergunta de cada nível, incluindo a dissertativa (nível 4) ───
export function mockQuizQuestions(): QuizQuestionsData {
  const questoes: QuizQuestion[] = [
    {
      id: "mock-q1",
      categoria: "Membrana plasmática",
      disciplina: "Biologia Celular",
      titulo: "Qual é a principal função da membrana plasmática?",
      dica: "Pense no que separa o meio interno do externo da célula.",
      ja_errou: false,
      nivel: 1,
      opcoes: [
        { id: "a", rotulo: "Armazenar o material genético da célula" },
        { id: "b", rotulo: "Controlar a entrada e saída de substâncias da célula" },
        { id: "c", rotulo: "Produzir energia na forma de ATP" },
        { id: "d", rotulo: "Sintetizar proteínas" },
      ],
      id_gabarito: "b",
      resposta_modelo: null,
      justificativa:
        "A membrana plasmática é seletivamente permeável — regula o que entra e sai da célula, mantendo o equilíbrio do meio interno.",
    },
    {
      id: "mock-q2",
      categoria: "Membrana plasmática",
      disciplina: "Biologia Celular",
      titulo: "Como a fluidez da membrana se relaciona com o colesterol presente nela?",
      dica: "Considere o efeito do colesterol em diferentes temperaturas.",
      ja_errou: true,
      nivel: 2,
      opcoes: [
        { id: "a", rotulo: "O colesterol não interfere na fluidez da membrana" },
        { id: "b", rotulo: "O colesterol torna a membrana permanentemente rígida" },
        { id: "c", rotulo: "O colesterol modula a fluidez, estabilizando-a em diferentes temperaturas" },
        { id: "d", rotulo: "O colesterol dissolve os fosfolipídios da membrana" },
      ],
      id_gabarito: "c",
      resposta_modelo: null,
      justificativa:
        "O colesterol se intercala entre os fosfolipídios: em altas temperaturas reduz a fluidez, e em baixas temperaturas evita que a membrana fique rígida demais — funciona como um tampão de fluidez.",
    },
    {
      id: "mock-q3",
      categoria: "Transporte de membrana",
      disciplina: "Biologia Celular",
      titulo:
        "Uma célula é colocada numa solução hipertônica. O que acontece com ela e por quê?",
      dica: "Pense na direção do movimento da água por osmose.",
      ja_errou: false,
      nivel: 3,
      opcoes: [
        { id: "a", rotulo: "A célula incha, porque a água entra nela" },
        { id: "b", rotulo: "A célula murcha, porque a água sai dela por osmose" },
        { id: "c", rotulo: "Nada acontece, a membrana bloqueia a osmose" },
        { id: "d", rotulo: "A célula se divide para compensar a pressão" },
      ],
      id_gabarito: "b",
      resposta_modelo: null,
      justificativa:
        "Em meio hipertônico, a concentração de soluto é maior fora da célula — a água se move por osmose de dentro pra fora, e a célula murcha (crenação).",
    },
    {
      id: "mock-q4",
      categoria: "Transporte de membrana",
      disciplina: "Biologia Celular",
      titulo:
        "Explique, como se estivesse ensinando alguém que nunca ouviu falar sobre o assunto, o que é transporte ativo e por que ele precisa de energia (técnica de Feynman).",
      dica: "Pense num exemplo simples do dia a dia pra comparar.",
      ja_errou: false,
      nivel: 4,
      opcoes: [],
      id_gabarito: null,
      resposta_modelo:
        "Transporte ativo é quando a célula 'empurra' substâncias contra a corrente — do lado onde tem pouco pra onde já tem muito, tipo subir uma ladeira empurrando um carrinho: precisa de força pra ir contra o caminho natural. Como a água/moléculas 'preferem' ir do lado cheio pro lado vazio (isso é o transporte passivo, que não gasta energia), forçar o caminho contrário exige energia — no caso da célula, essa energia vem do ATP. Um exemplo clássico é a bomba de sódio-potássio, que fica trocando sódio de dentro pra fora e potássio de fora pra dentro, mesmo isso sendo o caminho 'ladeira acima'.",
      justificativa:
        "O ponto central é comparar com transporte passivo: só é preciso gastar energia quando o movimento vai contra o gradiente de concentração.",
    },
  ];

  return { questoes };
}

// ─── Conteúdo de estudo — 1 disciplina com 2 subtemas, conceitos em vários
// estados (novo, em_reforco, consolidando, dominado) pra inspecionar a UI
// inteira sem depender do progresso real de ninguém.
export function mockStudyContent(): StudyContentData {
  const perguntasPadrao = (nomeConceito: string): MacroTema["subtemas"][number]["conceitos"][number]["perguntas"] => [
    {
      id: `mock-${nomeConceito}-p1`,
      nivel: 1,
      tipo: "identificacao",
      pergunta: `[Nível 1] Identifique o conceito de ${nomeConceito}.`,
      dica: "Dica de identificação.",
      alternativas: { A: "Alternativa A", B: "Alternativa B", C: "Alternativa C", D: "Alternativa D" },
      resposta: "B",
      resposta_modelo: null,
      explicacao: "Explicação do nível 1.",
    },
    {
      id: `mock-${nomeConceito}-p2`,
      nivel: 2,
      tipo: "relacao",
      pergunta: `[Nível 2] Relacione ${nomeConceito} com outro conceito do material.`,
      dica: "Dica de relação.",
      alternativas: { A: "Alternativa A", B: "Alternativa B", C: "Alternativa C", D: "Alternativa D" },
      resposta: "C",
      resposta_modelo: null,
      explicacao: "Explicação do nível 2.",
    },
    {
      id: `mock-${nomeConceito}-p3`,
      nivel: 3,
      tipo: "aplicacao",
      pergunta: `[Nível 3] Aplique ${nomeConceito} num cenário prático.`,
      dica: "Dica de aplicação.",
      alternativas: { A: "Alternativa A", B: "Alternativa B", C: "Alternativa C", D: "Alternativa D" },
      resposta: "A",
      resposta_modelo: null,
      explicacao: "Explicação do nível 3.",
    },
    {
      id: `mock-${nomeConceito}-p4`,
      nivel: 4,
      tipo: "dissertativa",
      pergunta: `[Nível 4] Explique ${nomeConceito} como se estivesse ensinando um iniciante (técnica de Feynman).`,
      dica: "Use uma analogia simples.",
      alternativas: null,
      resposta: null,
      resposta_modelo: `Resposta modelo de ${nomeConceito}, em linguagem simples e com analogia.`,
      explicacao: "Explicação complementar do nível 4.",
    },
  ];

  const macroTema: MacroTema = {
    id: "mock-macrotema-1",
    nome: "Biologia Celular",
    emoji: "🧬",
    status: "em_reforco",
    progresso: 42,
    subtemas_ativos: 2,
    subtemas: [
      {
        id: "mock-subtema-1",
        nome: "Membrana Plasmática",
        status: "em_reforco",
        material: { id: "mock-material-1", nome: "aula_membrana.pdf", tipo: "documento" },
        conceitos: [
          {
            id: "mock-conceito-novo",
            nome: "Fosfolipídios de membrana",
            status: "novo",
            nivel_atual: 1,
            tag_foco: false,
            proxima_revisao: hojeISO(),
            performance: { vezes_revisado: 0, acertos: 0, erros: 0 },
            perguntas: perguntasPadrao("Fosfolipídios de membrana"),
          },
          {
            id: "mock-conceito-reforco",
            nome: "Transporte ativo",
            status: "em_reforco",
            nivel_atual: 2,
            tag_foco: true,
            proxima_revisao: hojeISO(-1), // atrasado, pra testar o badge de atraso
            performance: { vezes_revisado: 3, acertos: 1, erros: 2 },
            perguntas: perguntasPadrao("Transporte ativo"),
          },
          {
            id: "mock-conceito-consolidando",
            nome: "Osmose e tonicidade",
            status: "consolidando",
            nivel_atual: 3,
            tag_foco: false,
            proxima_revisao: hojeISO(2),
            performance: { vezes_revisado: 4, acertos: 4, erros: 0 },
            perguntas: perguntasPadrao("Osmose e tonicidade"),
          },
        ],
      },
      {
        id: "mock-subtema-2",
        nome: "Núcleo e Material Genético",
        status: "consolidando",
        material: { id: "mock-material-2", nome: "https://youtube.com/watch?v=mock", tipo: "youtube" },
        conceitos: [
          {
            id: "mock-conceito-dominado",
            nome: "Estrutura do DNA",
            status: "dominado",
            nivel_atual: 4,
            tag_foco: false,
            proxima_revisao: hojeISO(7),
            performance: { vezes_revisado: 5, acertos: 5, erros: 0 },
            perguntas: perguntasPadrao("Estrutura do DNA"),
          },
        ],
      },
    ],
  };

  return { macrotemas: [macroTema] };
}
