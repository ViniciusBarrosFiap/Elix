-- Repetição espaçada de verdade pro que já foi "dominado": antes, dominar um
-- conceito (acertar o nível 4) tirava ele de circulação pra sempre — a query
-- da dose diária excluía status='dominado', então o "+7 dias" agendado em
-- submitAnswer.ts nunca era checado de novo (código morto). Agora dominado
-- volta a entrar na dose quando vence, com o intervalo DOBRANDO a cada
-- acerto (7 -> 14 -> 28 ... até um teto de 90 dias) — se o aluno errar,
-- volta pra "em_reforco" com intervalo curto, como um lapso no Anki.
--
-- Rode este arquivo no SQL editor do Supabase depois do 010_pergunta_dissertativa_nivel4.sql.

alter table conceitos add column if not exists intervalo_dominado smallint;

comment on column conceitos.intervalo_dominado is
  'Dias até a próxima revisão de um conceito já dominado — dobra a cada acerto (teto 90d); volta a null se o conceito for esquecido (status volta a em_reforco).';
