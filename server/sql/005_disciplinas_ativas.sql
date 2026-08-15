-- "Remover" uma disciplina não pode apagar conteúdo já gerado (subtemas/conceitos/
-- perguntas) — por isso é um soft-remove: macro_temas ganha `ativo`, e os endpoints
-- de leitura passam a filtrar por ele. PATCH /api/users/me com `disciplinas` agora
-- trata a lista como o conjunto ativo completo: cria o que falta, reativa o que
-- voltou, desativa o que saiu (ver syncMacroTemasFromDisciplinas).

alter table macro_temas add column if not exists ativo boolean not null default true;
