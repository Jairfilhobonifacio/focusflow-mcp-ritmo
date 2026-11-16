import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { simularReplanejamentoDia } from '../src/domain/replanejamento.js';
import { carregarDiaAgenda } from '../src/domain/agendaRepository.js';
import { TarefaPublica } from '../src/domain/capacidade.js';

describe('Semana 7 SDD — Replanejamento Inteligente por Eisenhower e Energia', () => {
  test('Scenario: Caminho feliz — Dia equilibrado (2026-11-06) mantem todas as tarefas pendentes', () => {
    const dia = carregarDiaAgenda('2026-11-06');
    assert.ok(dia);
    const resultado = simularReplanejamentoDia({
      data_iso: dia.data_iso,
      minutos_disponiveis_brutos: dia.minutos_disponiveis_brutos,
      minutos_reunioes_fixas: dia.minutos_reunioes_fixas,
      tarefas: dia.tarefas,
    });

    assert.equal(resultado.necessita_replanejamento, false);
    assert.deepEqual(
      resultado.tarefas_mantidas_hoje.map((t) => t.id),
      ['ff-202', 'ff-201'],
    );
    assert.equal(resultado.tarefas_sugeridas_adiar.length, 0);
    assert.equal(resultado.novo_status_carga, 'equilibrada');
  });

  test('Scenario: Sobrecarga por teto de foco profundo (2026-11-05) adia tarefa menos urgente', () => {
    const dia = carregarDiaAgenda('2026-11-05');
    assert.ok(dia);
    const copiaOriginal = dia.tarefas.map((t) => t.id);

    const resultado = simularReplanejamentoDia({
      data_iso: dia.data_iso,
      minutos_disponiveis_brutos: dia.minutos_disponiveis_brutos,
      minutos_reunioes_fixas: dia.minutos_reunioes_fixas,
      tarefas: dia.tarefas,
    });

    // Garante imutabilidade do array original
    assert.deepEqual(
      dia.tarefas.map((t) => t.id),
      copiaOriginal,
    );

    assert.equal(resultado.necessita_replanejamento, true);
    assert.deepEqual(
      resultado.tarefas_mantidas_hoje.map((t) => t.id),
      ['ff-101', 'ff-104'],
    );
    assert.equal(resultado.minutos_mantidos_hoje, 210);
    assert.equal(resultado.minutos_alta_energia_mantidos, 210);
    assert.equal(resultado.tarefas_sugeridas_adiar.length, 1);
    assert.equal(resultado.tarefas_sugeridas_adiar[0].tarefa.id, 'ff-102');
    assert.equal(resultado.tarefas_sugeridas_adiar[0].motivo, 'teto_alta_energia_240m');
    assert.equal(resultado.minutos_liberados, 75);
    assert.deepEqual(
      resultado.tarefas_concluidas_preservadas.map((t) => t.id),
      ['ff-103'],
    );
  });

  test('Scenario: Caso de borda — Tarefa menor aproveita janela restante apos adiar tarefa pesada', () => {
    const tarefas: TarefaPublica[] = [
      {
        id: 't-pesada',
        titulo: 'Refatorar modulo legado inteiro',
        energia: 'media',
        estimativa_minutos: 180,
        prioridade_eisenhower: 'importante_nao_urgente',
        concluida: false,
      },
      {
        id: 't-leve',
        titulo: 'Revisar PR urgente do time',
        energia: 'baixa',
        estimativa_minutos: 45,
        prioridade_eisenhower: 'nao_importante_urgente',
        concluida: false,
      },
    ];

    const resultado = simularReplanejamentoDia({
      data_iso: '2026-11-16',
      minutos_disponiveis_brutos: 200,
      minutos_reunioes_fixas: 0, // 170 min liquidos
      tarefas,
    });

    assert.equal(resultado.capacidade_liquida_minutos, 170);
    assert.equal(resultado.tarefas_sugeridas_adiar.length, 1);
    assert.equal(resultado.tarefas_sugeridas_adiar[0].tarefa.id, 't-pesada');
    assert.equal(
      resultado.tarefas_sugeridas_adiar[0].motivo,
      'excede_capacidade_individual_do_dia',
    );
    assert.deepEqual(
      resultado.tarefas_mantidas_hoje.map((t) => t.id),
      ['t-leve'],
    );
  });

  test('Scenario: Caso de erro — Rejeita data fora do padrao ISO YYYY-MM-DD', () => {
    assert.throws(() => {
      simularReplanejamentoDia({
        data_iso: '05/11/2026; rm -rf /',
        minutos_disponiveis_brutos: 480,
        minutos_reunioes_fixas: 60,
        tarefas: [],
      });
    });
  });
});
