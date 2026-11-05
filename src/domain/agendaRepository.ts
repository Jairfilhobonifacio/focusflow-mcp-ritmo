import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DataIsoSchema,
  FiltroEnergiaSchema,
  NivelEnergia,
  PrioridadeEisenhower,
  TarefaPublica,
  sanitizarTituloTarefa,
} from './capacidade.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CAMINHO_AGENDA_FIXO = path.resolve(__dirname, '../../data/agenda-foco.json');

interface TarefaArmazenada {
  id: unknown;
  titulo: unknown;
  energia: unknown;
  estimativa_minutos: unknown;
  prioridade_eisenhower: unknown;
  concluida: unknown;
  nota_privada_usuario?: unknown;
}

interface DiaArmazenado {
  data_iso: string;
  minutos_disponiveis_brutos: number;
  minutos_reunioes_fixas: number;
  blocos_foco_profundo_planejados: number;
  tarefas: TarefaArmazenada[];
}

export interface DiaAgendaPublico {
  data_iso: string;
  minutos_disponiveis_brutos: number;
  minutos_reunioes_fixas: number;
  blocos_foco_profundo_planejados: number;
  tarefas: TarefaPublica[];
}

export function carregarDiaAgenda(
  dataIso: string,
  filtroEnergia?: string,
  customAgendaFileForTest?: DiaArmazenado[],
): DiaAgendaPublico | null {
  const dataValida = DataIsoSchema.parse(dataIso);
  const energiaValida: NivelEnergia | undefined =
    filtroEnergia !== undefined ? FiltroEnergiaSchema.parse(filtroEnergia) : undefined;

  let dias: DiaArmazenado[];
  if (customAgendaFileForTest) {
    dias = customAgendaFileForTest;
  } else {
    const bruto = fs.readFileSync(CAMINHO_AGENDA_FIXO, 'utf-8');
    const json = JSON.parse(bruto) as { dias?: DiaArmazenado[] };
    dias = Array.isArray(json.dias) ? json.dias : [];
  }

  const dia = dias.find((d) => d.data_iso === dataValida);
  if (!dia) {
    return null;
  }

  const tarefasLimpa: TarefaPublica[] = dia.tarefas
    .map((t): TarefaPublica => ({
      id: typeof t.id === 'string' && /^[a-zA-Z0-9_-]{1,32}$/.test(t.id) ? t.id : 'id-invalido',
      titulo: sanitizarTituloTarefa(t.titulo),
      energia:
        t.energia === 'alta' || t.energia === 'media' || t.energia === 'baixa'
          ? t.energia
          : 'media',
      estimativa_minutos:
        typeof t.estimativa_minutos === 'number' &&
        Number.isInteger(t.estimativa_minutos) &&
        t.estimativa_minutos > 0 &&
        t.estimativa_minutos <= 480
          ? t.estimativa_minutos
          : 30,
      prioridade_eisenhower: (
        [
          'importante_urgente',
          'importante_nao_urgente',
          'nao_importante_urgente',
          'nao_importante_nao_urgente',
        ].includes(String(t.prioridade_eisenhower))
          ? t.prioridade_eisenhower
          : 'importante_nao_urgente'
      ) as PrioridadeEisenhower,
      concluida: Boolean(t.concluida),
    }))
    .filter((t) => (energiaValida ? t.energia === energiaValida : true));

  return {
    data_iso: dia.data_iso,
    minutos_disponiveis_brutos: dia.minutos_disponiveis_brutos,
    minutos_reunioes_fixas: dia.minutos_reunioes_fixas,
    blocos_foco_profundo_planejados: dia.blocos_foco_profundo_planejados,
    tarefas: tarefasLimpa,
  };
}
