import {
  calcularCapacidadeLiquida,
  TarefaPublica,
  TETO_FOCO_PROFUNDO_MINUTOS,
} from './capacidade.js';

export const LIMIAR_SEQUENCIA_BURNOUT_ALTO = 2;
export const LIMIAR_MEDIA_ALTA_ENERGIA_MODERADO = 180;

export type NivelRiscoBurnout = 'baixo' | 'moderado' | 'alto';

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
  risco_burnout: NivelRiscoBurnout;
  orientacao_ritmo: string;
}

function somarMinutosAltaEnergiaPendentes(tarefas: TarefaPublica[]): number {
  return tarefas
    .filter((t) => !t.concluida && t.energia === 'alta')
    .reduce((acc, t) => acc + t.estimativa_minutos, 0);
}

function classificarRiscoBurnout(params: {
  diasEmSobrecarga: number;
  maiorSequencia: number;
  mediaAltaEnergia: number;
}): { risco: NivelRiscoBurnout; orientacao: string } {
  if (
    params.maiorSequencia >= LIMIAR_SEQUENCIA_BURNOUT_ALTO ||
    params.mediaAltaEnergia > TETO_FOCO_PROFUNDO_MINUTOS
  ) {
    return {
      risco: 'alto',
      orientacao:
        'Alerta de fadiga acumulada: reserve um bloco de desaceleracao e renegocie escopo.',
    };
  }
  if (
    params.diasEmSobrecarga >= 1 ||
    params.mediaAltaEnergia > LIMIAR_MEDIA_ALTA_ENERGIA_MODERADO
  ) {
    return {
      risco: 'moderado',
      orientacao:
        'Sinais iniciais de compressao de agenda: evite empilhar foco profundo amanha.',
    };
  }
  return {
    risco: 'baixo',
    orientacao: 'Ritmo sustentavel ao longo do periodo analisado.',
  };
}

export function calcularFadigaSemanal(dias: EntradaDiaFadiga[]): ResultadoFadigaSemanal {
  if (dias.length === 0) {
    throw new RangeError('Informe pelo menos 1 dia para calcular fadiga semanal.');
  }

  const ordenados = [...dias].sort((a, b) => a.data_iso.localeCompare(b.data_iso));
  let diasEmSobrecarga = 0;
  let sequenciaAtual = 0;
  let maiorSequencia = 0;
  let somaAltaEnergia = 0;

  for (const dia of ordenados) {
    const diag = calcularCapacidadeLiquida(dia);
    somaAltaEnergia += somarMinutosAltaEnergiaPendentes(dia.tarefas);

    if (diag.status_carga === 'sobrecarga') {
      diasEmSobrecarga += 1;
      sequenciaAtual += 1;
      maiorSequencia = Math.max(maiorSequencia, sequenciaAtual);
    } else {
      sequenciaAtual = 0;
    }
  }

  const mediaAltaEnergia = Math.round(somaAltaEnergia / ordenados.length);
  const { risco, orientacao } = classificarRiscoBurnout({
    diasEmSobrecarga,
    maiorSequencia,
    mediaAltaEnergia,
  });

  return {
    total_dias_analisados: ordenados.length,
    dias_em_sobrecarga: diasEmSobrecarga,
    maior_sequencia_sobrecarga: maiorSequencia,
    media_minutos_alta_energia: mediaAltaEnergia,
    risco_burnout: risco,
    orientacao_ritmo: orientacao,
  };
}
