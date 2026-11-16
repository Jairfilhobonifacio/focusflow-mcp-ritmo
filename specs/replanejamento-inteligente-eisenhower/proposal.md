# Proposta de Mudança: Replanejamento Inteligente por Matriz de Eisenhower e Energia

## Motivação
Hoje o motor `calcularCapacidadeLiquida` e a tool MCP `diagnosticar_sobrecarga_dia` identificam quando o dia está em `sobrecarga` (saldo líquido negativo ou soma de tarefas de `alta` energia > 240 min), mas entregam apenas uma frase genérica pedindo para "mover pelo menos 1 tarefa". Na prática, quando a pessoa está com sobrecarga cognitiva, decidir **qual** tarefa adiar gera fadiga decisória adicional.

Precisamos de um motor determinístico (`simularReplanejamentoDia`) e de uma tool MCP somente-leitura (`simular_replanejamento_dia`) que recebam um dia da agenda e devolvam exatamente quais tarefas cabem hoje sem estourar nem a capacidade líquida nem o teto de 240 minutos de foco profundo, e quais tarefas devem ser adiadas para o próximo dia útil com justificativa explícita.

## Escopo (O que entra)
1. Função pura `simularReplanejamentoDia` em `src/domain/replanejamento.ts` que ordena as tarefas pendentes por prioridade de retenção (`importante_urgente` > `importante_nao_urgente` > `nao_importante_urgente` > `nao_importante_nao_urgente`, desempatando por menor estimativa de minutos e ID estável) sem mutar o array original.
2. Respeito simultâneo às duas invariantes cognitivas do FocusFlow:
   - Soma total das tarefas mantidas `<= capacidade_liquida_minutos`.
   - Soma das tarefas mantidas com `energia === 'alta'` `<= 240` minutos (`TETO_FOCO_PROFUNDO_MINUTOS`).
3. Preservação integral de tarefas já concluídas (`concluida === true`) sem consumir orçamento pendente.
4. Nova tool somente-leitura `simular_replanejamento_dia` em `src/index.ts` com validação Zod de `data_iso`, isolamento de `nota_privada_usuario` e retorno JSON estruturado.

## Fora de Escopo (O que não entra)
- Persistência ou escrita em `data/agenda-foco.json` (mantém a Regra Permanente #2 do `AGENTS.md`: servidor MCP 100% somente-leitura).
- Reagendamento automático no Google Calendar externo.
- Divisão automática (split) de uma tarefa única em subtarefas menores.

## Riscos e Mitigações
- **Mutação acidental da lista de tarefas do dia em memória:** usar cópia rasa (`[...tarefas]`) antes da ordenação.
- **Tarefa individual maior que a capacidade líquida inteira do dia:** marcar explicitamente o motivo `excede_capacidade_individual_do_dia` na lista de adiadas, sem travar a alocação de tarefas menores seguintes que caibam no saldo restante.
