-- Migração: modelo pedagógico real (ver DOCUMENTACAO.md / documento de MVP).
-- O estado de progressão sai da pergunta e vai para o conceito: nivel_atual,
-- tag_foco, proxima_revisao e performance agora vivem em `conceitos`.
-- Cada conceito passa a ter exatamente 3 perguntas fixas (uma por nível).
--
-- Assume banco vazio (ou aceita descartar dados existentes nas colunas
-- afetadas) — rode no SQL Editor do Supabase depois de 001_init.sql/002.

-- ===== perguntas: nivel (1/2/3) + tipo, sem estado próprio =====
alter table perguntas
  drop column if exists tipo_cognitivo,
  drop column if exists dificuldade,
  drop column if exists peso_atual,
  drop column if exists proxima_revisao,
  drop column if exists review_stage,
  drop column if exists performance;

do $$ begin
  create type tipo_pergunta as enum ('identificacao', 'relacao', 'aplicacao');
exception when duplicate_object then null; end $$;

alter table perguntas
  add column if not exists nivel smallint not null default 1 check (nivel between 1 and 3),
  add column if not exists tipo tipo_pergunta not null default 'identificacao';

do $$ begin
  alter table perguntas add constraint perguntas_conceito_nivel_unique unique (conceito_id, nivel);
exception when duplicate_object then null; end $$;

-- ===== conceitos: nivel_atual, tag_foco, proxima_revisao, performance =====
alter table conceitos drop column if exists status;
alter table conceitos drop column if exists peso_atual;

do $$ begin
  create type status_conceito as enum ('novo', 'em_reforco', 'consolidando', 'dominado');
exception when duplicate_object then null; end $$;

alter table conceitos
  add column if not exists status status_conceito not null default 'novo',
  add column if not exists nivel_atual smallint not null default 1 check (nivel_atual between 1 and 3),
  add column if not exists tag_foco boolean not null default false,
  add column if not exists proxima_revisao date not null default current_date,
  add column if not exists performance jsonb not null default '{"vezes_revisado":0,"acertos":0,"erros":0}';

create index if not exists idx_conceitos_proxima_revisao on conceitos(proxima_revisao);
