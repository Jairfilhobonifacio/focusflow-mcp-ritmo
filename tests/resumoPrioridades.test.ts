import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { resumirQuadrantesDia } from '../src/domain/resumoPrioridades.js';

describe('Semana 9 PR2 — Resumo por Quadrantes de Eisenhower', () => {
  test('soma apenas minutos pendentes por quadrante e calcula percentual estrategico', () => {
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
      {
        id: 'c',
        titulo: 'Email ja respondido',
        energia: 'baixa',
        estimativa_minutos: 120,
        prioridade_eisenhower: 'nao_importante_urgente',
        concluida: true,
      },
    ]);
    assert.equal(res.total_minutos_pendentes, 120);
    assert.equal(res.percentual_foco_estrategico, 50);
  });

  test('retorna percentual zero (sem NaN) quando lista de tarefas esta vazia ou toda concluida', () => {
    const res = resumirQuadrantesDia('2026-11-06', []);
    assert.equal(res.total_minutos_pendentes, 0);
    assert.equal(Number.isNaN(res.percentual_foco_estrategico), false);
    assert.equal(res.percentual_foco_estrategico, 0);
  });

  test('rejeita data_iso invalida na fronteira do dominio', () => {
    assert.throws(() => resumirQuadrantesDia('data-invalida', []));
  });
});
