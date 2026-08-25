-- Integração com o Notion via OAuth 2.0 (fluxo "connect my account").
-- Um workspace conectado por usuário — reconectar substitui o token antigo.

create table if not exists notion_connections (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  access_token   text not null,
  refresh_token  text,
  bot_id         text not null,
  workspace_id   text not null,
  workspace_name text,
  workspace_icon text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id)
);
