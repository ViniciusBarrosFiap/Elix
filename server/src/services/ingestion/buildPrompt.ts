interface FocoInput {
  tags: string[];
}

function buildFocoLine({ tags }: FocoInput): string {
  return tags.length > 0
    ? `O aluno pediu foco especial nestes tópicos: ${tags.join(", ")}.`
    : "Nenhum foco específico foi indicado — organize pelo conteúdo do material.";
}

function buildCorrecaoBlock(correcaoAnterior?: string): string {
  return correcaoAnterior
    ? `\n\nATENÇÃO: uma tentativa anterior de gerar essa resposta falhou na validação com o seguinte erro:\n${correcaoAnterior}\nCorrija isso e gere novamente, respeitando estritamente o schema.`
    : "";
}

interface BuildSubtemasPromptInput {
  disciplinaNome: string;
  tags: string[];
  texto: string;
  correcaoAnterior?: string; // usado no retry, quando a 1ª resposta falhou validação
}

/**
 * 1ª chamada do pipeline (ver generateStudyContent.ts): pede só os NOMES dos
 * subtemas, sem conceitos nem perguntas — resposta pequena e rápida. Os
 * conceitos de cada subtema são gerados depois, em paralelo, um agente por
 * subtema (buildConceitosPrompt), em vez de tudo numa única chamada gigante.
 */
export function buildSubtemasPrompt({
  disciplinaNome,
  tags,
  texto,
  correcaoAnterior,
}: BuildSubtemasPromptInput): string {
  return `Você é um assistente pedagógico organizando material de estudo de ${disciplinaNome} em tópicos de revisão espaçada.

Disciplina: ${disciplinaNome}
${buildFocoLine({ tags })}

Leia o material abaixo e divida-o em subtemas, na ordem em que aparecem no material. Por enquanto, gere APENAS os nomes dos subtemas — os conceitos e perguntas de cada um serão gerados depois, em chamadas separadas, uma por subtema.

Regras obrigatórias:
- NÃO invente um "macrotema" — a disciplina já é ${disciplinaNome}, comece direto pelos subtemas.
- Gere entre 2 e 5 subtemas — não exagere no volume.
- Cada nome de subtema deve ser específico o bastante pra alguém gerar perguntas só a partir dele, sem ambiguidade com os outros nomes.
- Responda em português do Brasil.
${buildCorrecaoBlock(correcaoAnterior)}

Material (texto extraído, pode estar truncado):
"""
${texto}
"""`;
}

interface BuildConceitosPromptInput {
  disciplinaNome: string;
  subtemaNome: string;
  tags: string[];
  texto: string;
  correcaoAnterior?: string;
}

/**
 * 2ª fase do pipeline: uma chamada por subtema (disparadas em paralelo, ver
 * generateStudyContent.ts), cada uma recebendo o material completo mas
 * respondendo só pelo subtema que lhe foi atribuído — é o que reduz o tempo
 * de geração de "1 chamada gigante" pra "N chamadas pequenas simultâneas".
 */
export function buildConceitosPrompt({
  disciplinaNome,
  subtemaNome,
  tags,
  texto,
  correcaoAnterior,
}: BuildConceitosPromptInput): string {
  return `Você é um assistente pedagógico que transforma material de estudo em perguntas de revisão espaçada para estudantes de ${disciplinaNome}.

Disciplina: ${disciplinaNome}
Subtema desta chamada: "${subtemaNome}"
${buildFocoLine({ tags })}

O material completo abaixo já foi dividido em vários subtemas por outra etapa. Sua tarefa AGORA é gerar apenas o conteúdo do subtema "${subtemaNome}" — ignore trechos do material que pertençam a outros subtemas.

Organize o conteúdo desse subtema em um ou mais conceitos (1 a 3). Para CADA conceito, gere exatamente 4 perguntas — uma para cada nível, sempre nesta ordem pedagógica:

- Nível 1 (identificação, múltipla escolha): o estudante reconhece o conceito de forma direta. Responde "o estudante sabe o que é esse conceito?".
- Nível 2 (relação entre conceitos, múltipla escolha): o estudante conecta o conceito com outros conceitos do mesmo material. Responde "o estudante entende como esse conceito se relaciona com outros?".
- Nível 3 (aplicação contextual, múltipla escolha): o estudante aplica o conceito em uma situação prática ou cenário real. Responde "o estudante consegue usar esse conceito em um contexto real?".
- Nível 4 (dissertativa, produção ativa — a etapa que marca o conceito como DOMINADO): o estudante escreve, com as próprias palavras, uma explicação do conceito. Não tem alternativas nem "resposta" — em vez disso, gere "resposta_modelo": um parágrafo curto que sirva de gabarito pro aluno comparar com o que ele mesmo escreveu e se autoavaliar. A pergunta deve pedir mais do que decorar uma definição — deve exigir explicar, relacionar ou justificar o conceito com as próprias palavras.

Formato de CADA pergunta, conforme o nível:
- Níveis 1, 2 e 3: "nivel", "pergunta", "dica", "alternativas" (objeto com A/B/C/D), "resposta" (a letra certa), "explicacao".
- Nível 4: "nivel", "pergunta", "dica", "resposta_modelo" (o parágrafo-gabarito), "explicacao". NÃO inclua "alternativas" nem "resposta" nessa pergunta.

Regras obrigatórias:
- Cada conceito deve ter EXATAMENTE 4 perguntas: uma com "nivel": 1, uma com "nivel": 2, uma com "nivel": 3, uma com "nivel": 4. Nunca repita nível nem pule algum.
- "tag_foco" de cada conceito deve ser true apenas se ele estiver diretamente relacionado aos tópicos de foco pedidos pelo aluno (quando houver); caso contrário, false.
- "dica" é um texto curto mostrado ANTES do aluno responder — NUNCA revele ou insinue a resposta correta nela (isso vale também pra pergunta dissertativa: a dica não pode conter a resposta_modelo nem se aproximar dela).
- "explicacao" é mostrada DEPOIS do aluno responder — aí sim pode e deve explicar por que a resposta está certa (nas de nível 1-3) ou complementar a resposta_modelo (no nível 4).
- Baseie-se estritamente no conteúdo do material abaixo. Não invente fatos que não estejam nele.
- Varie a posição da alternativa correta entre as perguntas de múltipla escolha (A, B, C ou D) — não deixe a resposta certa sempre na mesma letra nem siga um padrão previsível.
- Responda em português do Brasil.
${buildCorrecaoBlock(correcaoAnterior)}

Material completo (texto extraído, pode estar truncado — use só a parte relevante ao subtema "${subtemaNome}"):
"""
${texto}
"""`;
}
