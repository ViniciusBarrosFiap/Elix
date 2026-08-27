-- Corrige materials.macro_tema_id pra cascatear a deleção. Hoje essa FK é
-- NO ACTION (padrão), o que deixa a ordem de deleção de "DELETE /api/users/me"
-- (apaga o usuário e depende do cascade de users -> macro_temas e de
-- users -> materials disparando na ordem certa) sujeita a comportamento
-- implementation-defined do Postgres em vez de garantido.
--
-- A remoção normal de uma disciplina dentro do app continua sendo soft-delete
-- (macro_temas.ativo = false, ver 005_disciplinas_ativas.sql) — isso aqui só
-- importa pro caso de apagar a conta inteira.
--
-- Rode este arquivo no SQL editor do Supabase depois do 007_material_hierarchy.sql.

alter table materials drop constraint if exists materials_macro_tema_id_fkey;

alter table materials
  add constraint materials_macro_tema_id_fkey
  foreign key (macro_tema_id) references macro_temas(id) on delete cascade;
