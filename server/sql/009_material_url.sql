-- Guarda a URL original do material separada do nome de exibição.
--
-- Até aqui, materials.nome_arquivo fazia dois papéis pro YouTube: era tanto
-- o "nome" mostrado na tela quanto a URL usada pra abrir o vídeo — por isso
-- o vídeo aparecia com o link como título. Agora nome_arquivo vira o título
-- de verdade do vídeo (buscado via oEmbed do YouTube) e a URL fica nessa
-- coluna nova, usada só pra abrir o material (ver getMaterialViewUrl).
--
-- Rode este arquivo no SQL editor do Supabase depois do 008_materials_cascade.sql.

alter table materials add column if not exists url text;
