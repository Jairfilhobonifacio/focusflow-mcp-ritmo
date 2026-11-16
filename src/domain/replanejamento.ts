import {
  calcularCapacidadeLiquida,
  DataIsoSchema,
  PrioridadeEisenhower,
  ResultadoCapacidadeLiquida,
  TarefaPublica,
  TETO_FOCO_PROFUNDO_MINUTOS,
} from './capacidade.js';

export type MotivoAdiamento =
  | 'teto_alta_energia_240m'
  | 'capacidade_liquida_insuficiente'
  | 'excede_capacidade_individual_do_dia';

export interface TarefaAdiadaSugestao {
  tarefa: TarefaPublica;
  motivo: MotivoAdiamento;
}

export interface ResultadoReplanejamentoDia {
  data_iso: string;
  necessita_replanejamento: boolean;
  capacidade_liquida_minutos: number;
  minutos_mantidos_hoje: number;
  minutos_alta_energia_mantidos: number;
  minutos_liberados: number;
  novo_status_carga: ResultadoCapacidadeLiquida['status_carga'];
  tarefas_mantidas_hoje: TarefaPublica[];
  tarefas_sugeridas_adiar: TarefaAdiadaSugestao[];
  tarefas_concluidas_preservadas: TarefaPublica[];
  resumo_decisao: string;
}

const PESO_EISENHOWER: Record<PrioridadeEisenhower, number> = {
  importante_urgente: 1,
  importante_nao_urgente: 2,
  nao_importante_urgente: 3,
  nao_importante_nao_urgente: 4,
};

export function simularReplanejamentoDia(params: {
  data_iso: string;
  minutos_disponiveis_brutos: number;
  minutos_reunioes_fixas: number;
  tarefas: TarefaPublica[];
}): ResultadoReplanejamentoDia {
  const validDate = DataIsoSchema.parse(params.data_iso);

  const diagInicial = calcularCapacidadeLiquida({
    data_iso: validDate,
    minutos_disponiveis_brutos: params.minutos_disponiveis_brutos,
    minutos_reunioes_fixas: params.minutos_reunioes_fixas,
    tarefas: params.tarefas,
  });

  const concluidas = params.tarefas.filter((t) => t.concluida);
  const pendentesOrdenadas = [...params.tarefas.filter((t) => !t.concluida)].sort((a, b) => {
    const diffPeso =
      PESO_EISENHOWER[a.prioridade_eisenhower] - PESO_EISENHOWER[b.prioridade_eisenhower];
    if (diffPeso !== 0) return diffPeso;
    if (a.estimativa_minutos !== b.estimativa_minutos) {
      return a.estimativa_minutos - b.estimativa_minutos;
    }
    return a.id.localeCompare(b.id);
  });

  const mantidas: TarefaPublica[] = [];
  const adiadas: TarefaAdiadaSugestao[] = [];
  let minutosAlocados = 0;
  let minutosAltaEnergia = 0;

  for (const tarefa of pendentesOrdenadas) {
    if (tarefa.estimativa_minutos > diagInicial.capacidade_liquida_minutos) {
      adiadas.push({
        tarefa,
        motivo: 'excede_capacidade_individual_do_dia',
      });
      continue;
    }

    if (
      tarefa.energia === 'alta' &&
      minutosAltaEnergia + tarefa.estimativa_minutos > TETO_FOCO_PROFUNDO_MINUTOS
    ) {
      adiadas.push({
        tarefa,
        motivo: 'teto_alta_energia_240m',
      });
      continue;
    }

    if (minutosAlocados + tarefa.estimativa_minutos > diagInicial.capacidade_liquida_minutos) {
      adiadas.push({
        tarefa,
        motivo: 'capacidade_liquida_insuficiente',
      });
      continue;
    }

    mantidas.push(tarefa);
    minutosAlocados += tarefa.estimativa_minutos;
    if (tarefa.energia === 'alta') {
      minutosAltaEnergia += tarefa.estimativa_minutos;
    }
  }

  const diagPosReplanejamento = calcularCapacidadeLiquida({
    data_iso: validDate,
    minutos_disponiveis_brutos: params.minutos_disponiveis_brutos,
    minutos_reunioes_fixas: params.minutos_reunioes_fixas,
    tarefas: [...concluidas, ...mantidas],
  });

  const minutosLiberados = adiadas.reduce((acc, item) => acc + item.tarefa.estimativa_minutos, 0);
  const necessitaReplanejamento = adiadas.length > 0;

  const resumoDecisao = necessitaReplanejamento
    ? `Replanejamento recomendado: manter ${mantidas.length} tarefa(s) (${minutosAlocados} min) e adiar ${adiadas.length} tarefa(s) (${minutosLiberados} min liberados).`
    : `Nenhuma mudanca necessaria: todas as ${mantidas.length} tarefa(s) pendentes cabem no orcamento cognitivo de hoje.`;

  return {
    data_iso: validDate,
    necessita_replanejamento: necessitaReplanejamento,
    capacidade_liquida_minutos: diagInicial.capacidade_liquida_minutos,
    minutos_mantidos_hoje: minutosAlocados,
    minutos_alta_energia_mantidos: minutosAltaEnergia,
    minutos_liberados: minutosLiberados,
    novo_status_carga: diagPosReplanejamento.status_carga,
    tarefas_mantidas_hoje: mantidas,
    tarefas_sugeridas_adiar: adiadas,
    tarefas_concluidas_preservadas: concluidas,
    resumo_decisao: resumoDecisao,
  };
}
