-- Nível 4: pergunta dissertativa (produção ativa), a etapa que agora define
-- "dominado" — antes disso, acertar o nível 3 já bastava. O aluno escreve a
-- resposta com as próprias palavras e se autoavalia contra uma resposta_modelo
-- gerada pela IA (sem gabarito A-D, então `alternativas`/`resposta` ficam
-- nulos nesse nível — ver DOCUMENTACAO.md e buildPrompt.ts).
--
-- Rode este arquivo no SQL editor do Supabase depois do 009_material_url.sql.

alter type tipo_pergunta add value if not exists 'dissertativa';

-- ===== perguntas: nivel agora vai até 4; alternativas/resposta viram
-- opcionais (só nivel 1-3), resposta_modelo é o par delas pro nivel 4 =====
alter table perguntas drop constraint if exists perguntas_nivel_check;
alter table perguntas add constraint perguntas_nivel_check check (nivel between 1 and 4);

alter table perguntas alter column alternativas drop not null;
alter table perguntas alter column resposta drop not null;

alter table perguntas add column if not exists resposta_modelo text;

alter table perguntas drop constraint if exists perguntas_gabarito_por_nivel_check;
alter table perguntas add constraint perguntas_gabarito_por_nivel_check check (
  (nivel < 4 and alternativas is not null and resposta is not null and resposta_modelo is null)
  or
  (nivel = 4 and alternativas is null and resposta is null and resposta_modelo is not null)
);

-- ===== conceitos: nivel_atual agora vai até 4 (dominado só depois do 4) =====
alter table conceitos drop constraint if exists conceitos_nivel_atual_check;
alter table conceitos add constraint conceitos_nivel_atual_check check (nivel_atual between 1 and 4);

-- ===== insert_generated_content: deriva tipo até nivel 4 e grava
-- resposta_modelo quando a pergunta não tem alternativas/resposta =====
drop function if exists insert_generated_content(uuid, uuid, jsonb);

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
          resposta, explicacao, resposta_modelo
        ) values (
          v_conceito_id,
          (v_pergunta->>'nivel')::smallint,
          -- tipo é 1:1 com nivel — derivado aqui em vez de pedido à IA, pra não
          -- correr risco de ela mandar nivel=2 com tipo='aplicacao' inconsistente.
          (case (v_pergunta->>'nivel')::smallint
            when 1 then 'identificacao'
            when 2 then 'relacao'
            when 3 then 'aplicacao'
            when 4 then 'dissertativa'
          end)::tipo_pergunta,
          v_pergunta->>'pergunta',
          v_pergunta->>'dica',
          v_pergunta->'alternativas',
          (v_pergunta->>'resposta')::resposta_opcao,
          v_pergunta->>'explicacao',
          v_pergunta->>'resposta_modelo'
        );
      end loop;
    end loop;
  end loop;
end;
$$;
