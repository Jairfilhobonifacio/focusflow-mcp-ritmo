import { z } from 'zod';

export const NIVEIS_ENERGIA = ['alta', 'media', 'baixa'] as const;
export type NivelEnergia = (typeof NIVEIS_ENERGIA)[number];

export const PRIORIDADES_EISENHOWER = [
  'importante_urgente',
  'importante_nao_urgente',
  'nao_importante_urgente',
  'nao_importante_nao_urgente',
] as const;
export type PrioridadeEisenhower = (typeof PRIORIDADES_EISENHOWER)[number];

export const DataIsoSchema = z
  .string({
    required_error: 'data_iso obrigatoria no formato YYYY-MM-DD',
    invalid_type_error: 'data_iso invalida; informe texto no formato YYYY-MM-DD',
  })
  .min(10, 'data_iso deve ter exatamente 10 caracteres (YYYY-MM-DD)')
  .max(10, 'data_iso deve ter exatamente 10 caracteres (YYYY-MM-DD)')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'data_iso deve respeitar o padrao YYYY-MM-DD (apenas digitos e hifens)');

export const FiltroEnergiaSchema = z.preprocess(
  (val: unknown) => val,
  z.enum(NIVEIS_ENERGIA, {
    errorMap: () => ({
      message: 'filtro_energia invalido; use apenas um de: alta, media, baixa',
    }),
  }),
);

export const TituloTarefaSeguroSchema = z
  .string()
  .min(1)
  .max(140)
  .regex(/^[\p{L}\p{N}\s.,:;()\-_/+#]+$/u);

const PADROES_INJECAO = [
  /ignore\s+(todas\s+as\s+|as\s+)?instru[cç][oõ]es/i,
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /system\s*prompt/i,
  /sistema\s*:/i,
  /rm\s+-rf/i,
  /pwned/i,
  /id_rsa/i,
  /<\s*script/i,
];

export function sanitizarTituloTarefa(tituloBruto: unknown): string {
  if (typeof tituloBruto !== 'string') {
    return '[titulo invalido omitido]';
  }
  const limpo = tituloBruto.trim().replace(/\s+/g, ' ');
  if (limpo.length === 0 || limpo.length > 140) {
    return '[titulo fora do limite seguro omitido]';
  }
  for (const padrao of PADROES_INJECAO) {
    if (padrao.test(limpo)) {
      return '[conteudo bloqueado por politica anti-injecao]';
    }
  }
  if (!TituloTarefaSeguroSchema.safeParse(limpo).success) {
    return '[titulo com caracteres nao permitidos omitido]';
  }
  return limpo;
}

export interface TarefaPublica {
  id: string;
  titulo: string;
  energia: NivelEnergia;
  estimativa_minutos: number;
  prioridade_eisenhower: PrioridadeEisenhower;
  concluida: boolean;
}

export interface ResultadoCapacidadeLiquida {
  data_iso: string;
  minutos_disponiveis_brutos: number;
  minutos_reunioes_fixas: number;
  reserva_transicao_minutos: number;
  capacidade_liquida_minutos: number;
  carga_pendente_minutos: number;
  saldo_minutos: number;
  status_carga: 'equilibrada' | 'atencao' | 'sobrecarga';
  recomendacao_objetiva: string;
}

export const TETO_FOCO_PROFUNDO_MINUTOS = 240;
export const TAXA_RESERVA_TRANSICAO = 0.15;

export function calcularCapacidadeLiquida(params: {
  data_iso: string;
  minutos_disponiveis_brutos: number;
  minutos_reunioes_fixas: number;
  tarefas: TarefaPublica[];
}): ResultadoCapacidadeLiquida {
  const validDate = DataIsoSchema.parse(params.data_iso);

  if (
    !Number.isInteger(params.minutos_disponiveis_brutos) ||
    params.minutos_disponiveis_brutos < 0 ||
    params.minutos_disponiveis_brutos > 960
  ) {
    throw new RangeError('minutos_disponiveis_brutos deve ser inteiro entre 0 e 960');
  }

  if (
    !Number.isInteger(params.minutos_reunioes_fixas) ||
    params.minutos_reunioes_fixas < 0 ||
    params.minutos_reunioes_fixas > params.minutos_disponiveis_brutos
  ) {
    throw new RangeError('minutos_reunioes_fixas deve ser inteiro entre 0 e minutos_disponiveis_brutos');
  }

  const tempoAposReunioes = params.minutos_disponiveis_brutos - params.minutos_reunioes_fixas;
  const reservaTransicao = Math.round(tempoAposReunioes * TAXA_RESERVA_TRANSICAO);
  const capacidadeLiquida = Math.max(0, tempoAposReunioes - reservaTransicao);

  const tarefasPendentes = params.tarefas.filter((t) => !t.concluida);
  const cargaPendente = tarefasPendentes.reduce((acc, t) => acc + t.estimativa_minutos, 0);
  const cargaAltaEnergia = tarefasPendentes
    .filter((t) => t.energia === 'alta')
    .reduce((acc, t) => acc + t.estimativa_minutos, 0);

  const saldo = capacidadeLiquida - cargaPendente;

  let status: 'equilibrada' | 'atencao' | 'sobrecarga' = 'equilibrada';
  let recomendacao = 'Planejamento dentro da capacidade liquida do dia.';

  if (saldo < 0 || cargaAltaEnergia > TETO_FOCO_PROFUNDO_MINUTOS) {
    status = 'sobrecarga';
    const excesso = Math.max(0, -saldo, cargaAltaEnergia - TETO_FOCO_PROFUNDO_MINUTOS);
    recomendacao = `Sobrecarga detectada (${excesso} min acima do limite seguro). Renegocie ou mova pelo menos 1 tarefa de alta energia para outro dia.`;
  } else if (saldo <= 30 || cargaAltaEnergia > 180) {
    status = 'atencao';
    recomendacao = 'Margem estreita para imprevistos. Nao adicione novas tarefas de foco profundo hoje.';
  }

  return {
    data_iso: validDate,
    minutos_disponiveis_brutos: params.minutos_disponiveis_brutos,
    minutos_reunioes_fixas: params.minutos_reunioes_fixas,
    reserva_transicao_minutos: reservaTransicao,
    capacidade_liquida_minutos: capacidadeLiquida,
    carga_pendente_minutos: cargaPendente,
    saldo_minutos: saldo,
    status_carga: status,
    recomendacao_objetiva: recomendacao,
  };
}
