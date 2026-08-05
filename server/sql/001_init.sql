-- Elix — schema inicial (v1)
-- Rode este arquivo inteiro no SQL editor do seu projeto Supabase (Dashboard > SQL Editor > New query).
-- Idempotente o suficiente para um único ambiente novo; não é uma ferramenta de migration incremental.

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ===== users =====
create table if not exists users (
  id               uuid primary key default gen_random_uuid(),
  device_id        text not null unique,
  nome             text not null default 'usuário',
  curso            text,
  semestre         int,
  disciplinas      text[] not null default '{}',
  primeiro_acesso  boolean not null default true,
  fez_upload       boolean not null default false,
  pontuacao        int not null default 0,
  streak           int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ===== hierarquia de conteúdo =====
do $$ begin
  create type status_dominio as enum ('comecando', 'em_reforco', 'consolidando');
exception when duplicate_object then null; end $$;

-- macro_temas nasce a partir de users.disciplinas (sincronizado no PATCH /api/users/me),
-- NÃO a partir da geração de IA de um material.
create table if not exists macro_temas (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  nome         text not null,
  emoji        text not null default '📘',
  status       status_dominio not null default 'comecando',
  ordem        int not null default 0,
  created_at   timestamptz not null default now(),
  unique (user_id, nome)
);

-- ===== materiais enviados =====
do $$ begin
  create type material_status as enum ('recebido', 'processando', 'concluido', 'erro');
exception when duplicate_object then null; end $$;

create table if not exists materials (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  macro_tema_id uuid not null references macro_temas(id),
  nome_arquivo  text not null,
  mime_type     text,
  tamanho_bytes bigint,
  storage_path  text,
  tags          text[] default '{}',
  status        material_status not null default 'recebido',
  erro_mensagem text,
  created_at    timestamptz not null default now(),
  processed_at  timestamptz
);

create table if not exists sub_temas (
  id            uuid primary key default gen_random_uuid(),
  macro_tema_id uuid not null references macro_temas(id) on delete cascade,
  nome          text not null,
  status        status_dominio not null default 'comecando',
  ordem         int not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists conceitos (
  id           uuid primary key default gen_random_uuid(),
  sub_tema_id  uuid not null references sub_temas(id) on delete cascade,
  nome         text not null,
  peso_atual   int not null default 5,
  status       status_dominio not null default 'comecando',
  ordem        int not null default 0,
  created_at   timestamptz not null default now()
);

do $$ begin
  create type tipo_cognitivo as enum (
    'lembranca_direta', 'causa_consequencia', 'aplicacao_contextual',
    'relacao_entre_conceitos', 'comparacao'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type resposta_opcao as enum ('A','B','C','D');
exception when duplicate_object then null; end $$;

create table if not exists perguntas (
  id               uuid primary key default gen_random_uuid(),
  conceito_id      uuid not null references conceitos(id) on delete cascade,
  tipo_cognitivo   tipo_cognitivo not null,
  pergunta         text not null,
  dica             text not null,
  alternativas     jsonb not null,
  resposta         resposta_opcao not null,
  explicacao       text not null,
  dificuldade      int not null default 1,
  peso_atual       int not null default 5,
  proxima_revisao  date not null default (current_date + 1),
  review_stage     int not null default 1,
  performance      jsonb not null default '{"vezes_revisada":0,"acertos":0,"erros":0}',
  created_at       timestamptz not null default now()
);

create index if not exists idx_macro_temas_user on macro_temas(user_id);
create index if not exists idx_sub_temas_macro on sub_temas(macro_tema_id);
create index if not exists idx_conceitos_sub on conceitos(sub_tema_id);
create index if not exists idx_perguntas_conceito on perguntas(conceito_id);
create index if not exists idx_materials_user on materials(user_id);
create index if not exists idx_materials_macro_tema on materials(macro_tema_id);

-- Sem RLS habilitado: este backend usa a Service Role Key e é ele quem garante
-- isolamento por user_id em toda query (ver riscos na documentação). Se algum dia
-- migrar para Supabase Auth, habilite RLS com policies por auth.uid() nessas tabelas.
