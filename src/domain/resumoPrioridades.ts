import { DataIsoSchema, PrioridadeEisenhower, TarefaPublica } from './capacidade.js';

export interface ResumoQuadrantesDia {
  data_iso: string;
  minutos_pendentes_por_quadrante: Record<PrioridadeEisenhower, number>;
  total_minutos_pendentes: number;
  percentual_foco_estrategico: number;
}

export function resumirQuadrantesDia(dataIso: string, tarefas: TarefaPublica[]): ResumoQuadrantesDia {
  const validDate = DataIsoSchema.parse(dataIso);
  const minutos: Record<PrioridadeEisenhower, number> = {
    importante_urgente: 0,
    importante_nao_urgente: 0,
    nao_importante_urgente: 0,
    nao_importante_nao_urgente: 0,
  };

  let totalMinutos = 0;
  for (const t of tarefas) {
    if (t.concluida) continue;
    minutos[t.prioridade_eisenhower] += t.estimativa_minutos;
    totalMinutos += t.estimativa_minutos;
  }

  const estrategico =
    totalMinutos === 0 ? 0 : Math.round((minutos.importante_nao_urgente / totalMinutos) * 100);

  return {
    data_iso: validDate,
    minutos_pendentes_por_quadrante: minutos,
    total_minutos_pendentes: totalMinutos,
    percentual_foco_estrategico: estrategico,
  };
}
