interface BuildPromptInput {
  disciplinaNome: string;
  tags: string[];
  texto: string;
  correcaoAnterior?: string; // usado no retry, quando a 1ª resposta falhou validação
}

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

Organize o conteúdo do material abaixo em subtemas, e cada subtema em um ou mais conceitos. Para CADA conceito, gere exatamente 3 perguntas de múltipla escolha (4 alternativas A/B/C/D) — uma para cada nível, sempre nesta ordem pedagógica:

- Nível 1 (identificação): o estudante reconhece o conceito de forma direta. Responde "o estudante sabe o que é esse conceito?".
- Nível 2 (relação entre conceitos): o estudante conecta o conceito com outros conceitos do mesmo material. Responde "o estudante entende como esse conceito se relaciona com outros?".
- Nível 3 (aplicação contextual): o estudante aplica o conceito em uma situação prática ou cenário real. Responde "o estudante consegue usar esse conceito em um contexto real?".

Regras obrigatórias:
- NÃO invente um "macrotema" — a disciplina já é ${disciplinaNome}, comece direto pelos subtemas.
- Cada conceito deve ter EXATAMENTE 3 perguntas: uma com "nivel": 1, uma com "nivel": 2, uma com "nivel": 3. Nunca repita nível nem pule algum.
- "tag_foco" de cada conceito deve ser true apenas se ele estiver diretamente relacionado aos tópicos de foco pedidos pelo aluno (quando houver); caso contrário, false.
- "dica" é um texto curto mostrado ANTES do aluno responder — NUNCA revele ou insinue a resposta correta nela.
- "explicacao" é mostrada DEPOIS do aluno responder — aí sim pode e deve explicar por que a resposta está certa.
- Gere entre 2 e 5 subtemas, cada um com 1 a 3 conceitos — não exagere no volume.
- Baseie-se estritamente no conteúdo do material abaixo. Não invente fatos que não estejam nele.
- Responda em português do Brasil.
${correcaoBlock}

Material (texto extraído, pode estar truncado):
"""
${texto}
"""`;
}
