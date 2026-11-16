import { TarefaPublica } from './capacidade.js';

export interface EntradaDiaFadiga {
  data_iso: string;
  minutos_disponiveis_brutos: number;
  minutos_reunioes_fixas: number;
  tarefas: TarefaPublica[];
}

export interface ResultadoFadigaSemanal {
  total_dias_analisados: number;
  dias_em_sobrecarga: number;
  maior_sequencia_sobrecarga: number;
  media_minutos_alta_energia: number;
  risco_burnout: 'baixo' | 'moderado' | 'alto';
  orientacao_ritmo: string;
}

export function calcularFadigaSemanal(_dias: EntradaDiaFadiga[]): ResultadoFadigaSemanal {
  throw new Error('RED: calcularFadigaSemanal ainda nao implementado');
}
