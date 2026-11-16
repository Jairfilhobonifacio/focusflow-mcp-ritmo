import { calcularCapacidadeLiquida, TarefaPublica } from './capacidade.js';

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

export function calcularFadigaSemanal(dias: EntradaDiaFadiga[]): ResultadoFadigaSemanal {
  if (dias.length === 0) {
    throw new RangeError('Informe pelo menos 1 dia para calcular fadiga semanal.');
  }

  const ordenados = [...dias].sort((a, b) => a.data_iso.localeCompare(b.data_iso));
  let diasSobrecarga = 0;
  let seqAtual = 0;
  let maiorSeq = 0;
  let somaAltaEnergia = 0;

  for (const dia of ordenados) {
    const diag = calcularCapacidadeLiquida(dia);
    const altaMin = dia.tarefas
      .filter((t) => !t.concluida && t.energia === 'alta')
      .reduce((acc, t) => acc + t.estimativa_minutos, 0);
    somaAltaEnergia += altaMin;

    if (diag.status_carga === 'sobrecarga') {
      diasSobrecarga += 1;
      seqAtual += 1;
      if (seqAtual > maiorSeq) maiorSeq = seqAtual;
    } else {
      seqAtual = 0;
    }
  }

  const mediaAlta = Math.round(somaAltaEnergia / ordenados.length);
  let risco: 'baixo' | 'moderado' | 'alto' = 'baixo';
  let orientacao = 'Ritmo sustentavel ao longo do periodo analisado.';

  if (maiorSeq >= 2 || mediaAlta > 240) {
    risco = 'alto';
    orientacao = 'Alerta de fadiga acumulada: reserve um bloco de desaceleracao e renegocie escopo.';
  } else if (diasSobrecarga >= 1 || mediaAlta > 180) {
    risco = 'moderado';
    orientacao = 'Sinais iniciais de compressao de agenda: evite empilhar foco profundo amanha.';
  }

  return {
    total_dias_analisados: ordenados.length,
    dias_em_sobrecarga: diasSobrecarga,
    maior_sequencia_sobrecarga: maiorSeq,
    media_minutos_alta_energia: mediaAlta,
    risco_burnout: risco,
    orientacao_ritmo: orientacao,
  };
}
