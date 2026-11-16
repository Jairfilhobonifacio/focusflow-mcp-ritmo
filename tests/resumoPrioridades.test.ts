import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { resumirQuadrantesDia } from '../src/domain/resumoPrioridades.js';

describe('Semana 9 PR2 — Resumo por Quadrantes de Eisenhower', () => {
  test('soma minutos por quadrante em dia com tarefas', () => {
    const res = resumirQuadrantesDia('2026-11-06', [
      {
        id: 'a',
        titulo: 'Planejar arquitetura',
        energia: 'alta',
        estimativa_minutos: 60,
        prioridade_eisenhower: 'importante_nao_urgente',
        concluida: false,
      },
      {
        id: 'b',
        titulo: 'Incidente producao',
        energia: 'alta',
        estimativa_minutos: 60,
        prioridade_eisenhower: 'importante_urgente',
        concluida: false,
      },
    ]);
    assert.equal(res.percentual_foco_estrategico, 50);
  });
});
