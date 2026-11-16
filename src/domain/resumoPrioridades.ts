import { PrioridadeEisenhower, TarefaPublica } from './capacidade.js';

export interface ResumoQuadrantesDia {
  data_iso: string;
  minutos_por_quadrante: Record<PrioridadeEisenhower, number>;
  percentual_foco_estrategico: number;
}

export function resumirQuadrantesDia(dataIso: string, tarefas: TarefaPublica[]): ResumoQuadrantesDia {
  const minutos: Record<PrioridadeEisenhower, number> = {
    importante_urgente: 0,
    importante_nao_urgente: 0,
    nao_importante_urgente: 0,
    nao_importante_nao_urgente: 0,
  };

  let totalMinutos = 0;
  for (const t of tarefas) {
    minutos[t.prioridade_eisenhower] += t.estimativa_minutos;
    totalMinutos += t.estimativa_minutos;
  }

  const estrategico = Math.round((minutos.importante_nao_urgente / totalMinutos) * 100);
  return {
    data_iso: dataIso,
    minutos_por_quadrante: minutos,
    percentual_foco_estrategico: estrategico,
  };
}
