-- Login real via Supabase Auth (email/senha) substitui device_id como identidade
-- principal. Rode no SQL Editor do seu projeto Supabase.

alter table users add column if not exists auth_user_id uuid unique references auth.users(id) on delete cascade;

-- Contas novas passam a nascer sem device_id (a identidade agora é auth_user_id).
alter table users alter column device_id drop not null;
