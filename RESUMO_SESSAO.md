# Resumo da sessão — o que mudou no Elix

Este arquivo explica, em linguagem simples, tudo que foi feito nessa sessão de trabalho
no app. A ideia é qualquer pessoa do grupo conseguir entender o que mudou sem precisar
ler código.

## O que o app faz agora

1. Você cadastra suas disciplinas (matérias) no início.
2. Você envia um material de estudo (PDF ou DOCX) e escolhe pra qual disciplina ele é.
3. Uma IA (Gemini) lê o material e cria perguntas de revisão sobre o conteúdo.
4. Todo dia, o app monta uma "dose" de até 5 perguntas pra você revisar — escolhidas
   pelas coisas que você mais precisa reforçar (o que você errou, o que está atrasado,
   o que é novo).
5. Você responde, recebe feedback na hora, e vai ganhando "elixir" (pontos) e mantendo
   uma sequência de dias seguidos estudando (streak).

## O que foi construído/corrigido nessa sessão

### 1. Sistema de revisão de verdade (antes era só um esqueleto)

Cada assunto que a IA identifica no seu material vira um "conceito", e cada conceito
tem 3 perguntas — uma fácil (identificar o assunto), uma média (relacionar com outras
coisas) e uma mais difícil (aplicar em uma situação). Você começa na fácil; quando
acerta, sobe pra próxima. Quando erra, continua na mesma e o app te mostra ela de novo
no dia seguinte. Quando você acerta a mais difícil, aquele conceito é considerado
"dominado" e só volta a aparecer bem mais tarde.

Antes, isso tudo existia só na aparência — as perguntas apareciam meio soltas, sem
esse acompanhamento de progresso de verdade por trás.

### 2. A dose diária agora escolhe por prioridade de verdade

O app dá mais peso pra:
- Coisas que você errou antes
- Coisas que estão atrasadas (passou o dia que era pra revisar)
- Coisas que você marcou como foco na hora do upload
- Coisas novas que você ainda não viu

E nunca mostra mais que 5 perguntas por vez, pra não virar uma tarefa cansativa.

### 3. Elixir e sequência (streak) agora funcionam de verdade

Cada acerto soma 1 de elixir. Responder pelo menos 1 pergunta por dia mantém sua
sequência subindo; deixar passar mais de um dia sem revisar zera a sequência (igual
Duolingo). Antes esses números ficavam sempre parados em zero, porque nada
alimentava eles.

### 4. Nova tela: detalhes da disciplina

Antes, tocar em uma disciplina não abria nada. Agora dá pra ver, disciplina por
disciplina, quais assuntos (subtemas e conceitos) existem, o nível de cada um, se
está em foco, e quantos acertos/erros você já teve ali. Também tem um botão pra
revisar só aquela disciplina na hora, se quiser.

### 5. Dá pra editar as disciplinas depois do cadastro inicial

Antes, uma vez cadastrada a disciplina, não tinha como tirar ou adicionar outra.
Agora tem uma tela pra isso. E remover uma disciplina não apaga o conteúdo que já
foi gerado pra ela — só some da sua lista até você digitar o nome de novo.

### 6. Vários ajustes de "isso parecia quebrado, mas na verdade só não avisava nada"

- Depois de gerar uma revisão, o app agora avisa claramente que deu certo (antes só
  ficava uma animação ambígua, sem confirmação real).
- A tela de resultado do quiz (acertos, erros, o que foi revisado) mostrava sempre
  os mesmos números fixos, sem relação com o que você realmente respondeu — agora
  mostra os números reais.
- A barra de navegação de baixo estava tampando parte do conteúdo da tela inicial —
  corrigido.
- Os botões relacionados ao Notion não faziam nada quando tocados — agora avisam
  "em breve" (a integração de verdade com o Notion ainda não existe).
- Vários pontos onde a tela ficava com informação desatualizada (ex: card de "hoje"
  mostrando 0 perguntas mesmo depois de gerar revisão nova) foram corrigidos —
  o app agora sempre busca os dados mais recentes quando você volta pra uma tela.

### 7. Erros tratados de forma mais clara

Se você mandar um arquivo corrompido, uma disciplina errada, ou a IA falhar por
algum motivo, o app agora mostra uma mensagem específica do que aconteceu, em vez de
um erro genérico sem explicação.

## O que ainda não existe (de propósito, por enquanto)

- Login/senha de verdade — cada aparelho é identificado sozinho, sem conta.
- Integração real com Notion — só o aviso "em breve".
- O app ainda só roda testado localmente (no computador de quem está desenvolvendo);
  ainda não foi colocado num servidor público que qualquer um acesse de qualquer
  lugar.

## Como rodar o projeto

O projeto tem duas partes que precisam rodar juntas: o app (que vocês veem no
celular/emulador) e o servidor (que fala com o banco de dados e com a IA).

Passo a passo completo:
- Servidor: [`server/README.md`](server/README.md)
- App: [`README.md`](README.md)

As chaves de acesso (banco de dados e IA) foram compartilhadas separadamente por
mensagem — não estão neste repositório por segurança.
