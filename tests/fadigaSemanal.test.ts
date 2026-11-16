import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calcularFadigaSemanal } from '../src/domain/fadigaSemanal.js';

describe('Semana 8 Red-Green-Refactor — Fadiga Cognitiva Multi-Dia', () => {
  test('classifica risco_burnout como baixo quando dias estao equilibrados', () => {
    const res = calcularFadigaSemanal([
      {
        data_iso: '2026-11-06',
        minutos_disponiveis_brutos: 420,
        minutos_reunioes_fixas: 60,
        tarefas: [
          {
            id: 't1',
            titulo: 'Revisar PR',
            energia: 'alta',
            estimativa_minutos: 90,
            prioridade_eisenhower: 'importante_urgente',
            concluida: false,
          },
        ],
      },
    ]);
    assert.equal(res.total_dias_analisados, 1);
    assert.equal(res.dias_em_sobrecarga, 0);
    assert.equal(res.maior_sequencia_sobrecarga, 0);
    assert.equal(res.risco_burnout, 'baixo');
  });

  test('classifica risco_burnout como alto quando ha 2 ou mais dias consecutivos em sobrecarga', () => {
    const diaPesado = (data: string) => ({
      data_iso: data,
      minutos_disponiveis_brutos: 420,
      minutos_reunioes_fixas: 120,
      tarefas: [
        {
          id: 'p1',
          titulo: 'Arquitetura critica',
          energia: 'alta' as const,
          estimativa_minutos: 180,
          prioridade_eisenhower: 'importante_urgente' as const,
          concluida: false,
        },
        {
          id: 'p2',
          titulo: 'Migracao banco',
          energia: 'alta' as const,
          estimativa_minutos: 120,
          prioridade_eisenhower: 'importante_urgente' as const,
          concluida: false,
        },
      ],
    });

    const res = calcularFadigaSemanal([diaPesado('2026-11-04'), diaPesado('2026-11-05')]);
    assert.equal(res.dias_em_sobrecarga, 2);
    assert.equal(res.maior_sequencia_sobrecarga, 2);
    assert.equal(res.media_minutos_alta_energia, 300);
    assert.equal(res.risco_burnout, 'alto');
  });

  test('rejeita lista vazia de dias com erro claro', () => {
    assert.throws(() => calcularFadigaSemanal([]), /pelo menos 1 dia/i);
  });
});
