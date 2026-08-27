-- Hierarquia material -> sub_tema: todo subtema agora nasce vinculado ao
-- material (documento enviado, vídeo do YouTube ou página do Notion) que o
-- gerou, permitindo agrupar/mostrar os subtemas por origem na tela da
-- disciplina (ver studyContent.service.ts e app/(tabs)/studyContents/[id].tsx).
--
-- ATENÇÃO — esta migração APAGA todo o conteúdo de estudo já gerado
-- (macro_temas, materials, sub_temas, conceitos, perguntas) pra poder criar
-- material_id como NOT NULL sem precisar de um caso "sem material" legado.
-- As disciplinas (macro_temas) somem daqui, mas users.disciplinas continua
-- intacto — reabrir "Editar disciplinas" no app resincroniza e recria os
-- macro_temas a partir dele (ver syncMacroTemasFromDisciplinas). Os materiais
-- (PDF/vídeo/Notion) precisam ser reenviados pra gerar conteúdo de novo.
--
-- Rode este arquivo no SQL editor do Supabase depois do 006_notion_integration.sql.

delete from perguntas;
delete from conceitos;
delete from sub_temas;
delete from materials;
delete from macro_temas;

-- Sem conteúdo, a Home volta pra tela de "vamos começar" (upload primeiro)
-- em vez de mostrar um dashboard vazio.
update users set fez_upload = false;

alter table sub_temas
  add column if not exists material_id uuid references materials(id) on delete cascade;

alter table sub_temas
  alter column material_id set not null;

create index if not exists idx_sub_temas_material on sub_temas(material_id);

-- ===== insert_generated_content: agora recebe também o material de origem =====

drop function if exists insert_generated_content(uuid, jsonb);

create function insert_generated_content(p_macro_tema_id uuid, p_material_id uuid, p_subtemas jsonb)
returns void
language plpgsql
as $$
declare
  v_subtema   jsonb;
  v_conceito  jsonb;
  v_pergunta  jsonb;
  v_sub_tema_id  uuid;
  v_conceito_id  uuid;
begin
  for v_subtema in select * from jsonb_array_elements(p_subtemas)
  loop
    insert into sub_temas (macro_tema_id, material_id, nome)
    values (p_macro_tema_id, p_material_id, v_subtema->>'nome')
    returning id into v_sub_tema_id;

    for v_conceito in select * from jsonb_array_elements(v_subtema->'conceitos')
    loop
      insert into conceitos (sub_tema_id, nome, tag_foco)
      values (v_sub_tema_id, v_conceito->>'nome', coalesce((v_conceito->>'tag_foco')::boolean, false))
      returning id into v_conceito_id;

      for v_pergunta in select * from jsonb_array_elements(v_conceito->'perguntas')
      loop
        insert into perguntas (
          conceito_id, nivel, tipo, pergunta, dica, alternativas,
          resposta, explicacao
        ) values (
          v_conceito_id,
          (v_pergunta->>'nivel')::smallint,
          -- tipo é 1:1 com nivel — derivado aqui em vez de pedido à IA, pra não
          -- correr risco de ela mandar nivel=2 com tipo='aplicacao' inconsistente.
          (case (v_pergunta->>'nivel')::smallint
            when 1 then 'identificacao'
            when 2 then 'relacao'
            when 3 then 'aplicacao'
          end)::tipo_pergunta,
          v_pergunta->>'pergunta',
          v_pergunta->>'dica',
          v_pergunta->'alternativas',
          (v_pergunta->>'resposta')::resposta_opcao,
          v_pergunta->>'explicacao'
        );
      end loop;
    end loop;
  end loop;
end;
$$;
