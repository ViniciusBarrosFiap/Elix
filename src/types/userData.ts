export interface UserData {
  user_id: string;
  nome: string;
  primeiroAcesso: boolean;
  curso: string;
  disciplinas: string[];
  semestre: number;
  fezUpload: boolean;
  pontuacao: number;
  streak: number;
}