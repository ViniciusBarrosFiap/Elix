-- Função de persistência transacional do conteúdo gerado pela IA.
-- Uma chamada de função em Postgres já é atômica: se qualquer INSERT falhar
-- (ex: enum inválido), TUDO é revertido — é assim que fica "tudo ou nada"
-- sem precisar de BEGIN/COMMIT manual via REST (supabase-js não expõe isso).
--
-- Rode este arquivo no SQL editor do Supabase depois do 001_init.sql.

create or replace function insert_generated_content(p_macro_tema_id uuid, p_subtemas jsonb)
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
    insert into sub_temas (macro_tema_id, nome)
    values (p_macro_tema_id, v_subtema->>'nome')
    returning id into v_sub_tema_id;

    for v_conceito in select * from jsonb_array_elements(v_subtema->'conceitos')
    loop
      insert into conceitos (sub_tema_id, nome)
      values (v_sub_tema_id, v_conceito->>'nome')
      returning id into v_conceito_id;

      for v_pergunta in select * from jsonb_array_elements(v_conceito->'perguntas')
      loop
        insert into perguntas (
          conceito_id, tipo_cognitivo, pergunta, dica, alternativas,
          resposta, explicacao, dificuldade
        ) values (
          v_conceito_id,
          (v_pergunta->>'tipo_cognitivo')::tipo_cognitivo,
          v_pergunta->>'pergunta',
          v_pergunta->>'dica',
          v_pergunta->'alternativas',
          (v_pergunta->>'resposta')::resposta_opcao,
          v_pergunta->>'explicacao',
          (v_pergunta->>'dificuldade')::int
        );
      end loop;
    end loop;
  end loop;
end;
$$;
