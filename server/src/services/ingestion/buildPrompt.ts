interface BuildPromptInput {
  disciplinaNome: string;
  tags: string[];
  texto: string;
  correcaoAnterior?: string; // usado no retry, quando a 1ª resposta falhou validação
}

const ENUM_STATUS = ["comecando", "em_reforco", "consolidando"];
const ENUM_TIPO_COGNITIVO = [
  "lembranca_direta",
  "causa_consequencia",
  "aplicacao_contextual",
  "relacao_entre_conceitos",
  "comparacao",
];

export function buildStudyContentPrompt({
  disciplinaNome,
  tags,
  texto,
  correcaoAnterior,
}: BuildPromptInput): string {
  const focoLine =
    tags.length > 0
      ? `O aluno pediu foco especial nestes tópicos: ${tags.join(", ")}.`
      : "Nenhum foco específico foi indicado — organize pelo conteúdo do material.";

  const correcaoBlock = correcaoAnterior
    ? `\n\nATENÇÃO: uma tentativa anterior de gerar esse conteúdo falhou na validação com o seguinte erro:\n${correcaoAnterior}\nCorrija isso e gere novamente, respeitando estritamente o schema.`
    : "";

  return `Você é um assistente pedagógico que transforma material de estudo em perguntas de revisão espaçada para estudantes de ${disciplinaNome}.

Disciplina: ${disciplinaNome}
${focoLine}

Organize o conteúdo do material abaixo em subtemas, cada subtema com um ou mais conceitos, e cada conceito com uma ou mais perguntas de múltipla escolha (4 alternativas A/B/C/D).

Regras obrigatórias:
- NÃO invente um "macrotema" — a disciplina já é ${disciplinaNome}, comece direto pelos subtemas.
- "tipo_cognitivo" de cada pergunta deve ser um destes valores exatos: ${ENUM_TIPO_COGNITIVO.join(", ")}.
- "dica" é um texto curto mostrado ANTES do aluno responder — NUNCA revele ou insinue a resposta correta nela.
- "explicacao" é mostrada DEPOIS do aluno responder — aí sim pode e deve explicar por que a resposta está certa.
- "dificuldade" é um inteiro de 1 (fácil) a 5 (difícil), avaliando a pergunta em si.
- Gere entre 2 e 5 subtemas, cada um com 1 a 3 conceitos, cada conceito com 1 a 3 perguntas — não exagere no volume.
- Baseie-se estritamente no conteúdo do material abaixo. Não invente fatos que não estejam nele.
- Responda em português do Brasil.
${correcaoBlock}

Material (texto extraído, pode estar truncado):
"""
${texto}
"""`;
}

export { ENUM_STATUS, ENUM_TIPO_COGNITIVO };
