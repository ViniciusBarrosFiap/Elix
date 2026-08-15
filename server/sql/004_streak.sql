-- Streak: dias consecutivos em que o usuário respondeu ao menos 1 pergunta.
-- Regra (não estava no documento de MVP, decidida agora): igual Duolingo/Anki —
-- conta presença/hábito, não acerto. Ver submitAnswer.ts para a lógica de cálculo.

alter table users add column if not exists last_review_date date;
