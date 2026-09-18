-- Guarda o page_id do Notion no material, separado do título de exibição.
--
-- Até aqui, depois de importar uma página do Notion não tinha como recuperar
-- o page_id original a partir do material já salvo — só o título (em
-- nome_arquivo) ficava gravado. Isso impedia reabrir/reler o conteúdo da
-- página depois do upload (ver getMaterialNotionContent em materials.service.ts).
--
-- Rode este arquivo no SQL editor do Supabase depois do 011_dominado_revisao_continua.sql.

alter table materials add column if not exists notion_page_id text;
