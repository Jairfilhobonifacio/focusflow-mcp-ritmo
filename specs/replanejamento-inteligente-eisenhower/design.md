# Decisões Técnicas (Design): Replanejamento Inteligente

## Arquitetura e Fronteiras
1. **Domínio Puro (`src/domain/replanejamento.ts`):**
   - Recebe `{ data_iso, minutos_disponiveis_brutos, minutos_reunioes_fixas, tarefas }` já tipados como `TarefaPublica[]` (sem `nota_privada_usuario`).
   - Reutiliza `calcularCapacidadeLiquida` de `src/domain/capacidade.ts` como fonte única de verdade para o cálculo de `capacidade_liquida_minutos` e `novo_status_carga` pós-replanejamento (evita duplicação da fórmula de 15% de transição).
2. **Critério Determinístico de Ordenação (Greedy Knapsack Cognitivo):**
   - Peso por quadrante de Eisenhower:
     - `importante_urgente`: peso `1` (maior prioridade de permanência no dia)
     - `importante_nao_urgente`: peso `2`
     - `nao_importante_urgente`: peso `3`
     - `nao_importante_nao_urgente`: peso `4`
   - Desempate dentro do mesmo quadrante: menor `estimativa_minutos` primeiro (maximiza entregas completas dentro do orçamento) e `id.localeCompare` para determinismo total.
3. **Exposição no Servidor MCP (`src/index.ts`):**
   - Nova tool `simular_replanejamento_dia` recebendo `{ data_iso }`.
   - Usa `DataIsoSchema.safeParse` e `carregarDiaAgenda(parsedDate.data)`, herdando automaticamente a sanitização anti-injection e o descarte de `nota_privada_usuario`.
   - Em caso de data inexistente, retorna `{ encontrado: false, data_iso, mensagem }` com o mesmo contrato das tools existentes.
