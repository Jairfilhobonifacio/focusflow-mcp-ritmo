# Especificação Comportamental: Replanejamento Inteligente por Eisenhower e Energia

## Feature: Simulação determinística de replanejamento diário sem escrita em disco

### Scenario: Caminho feliz — Dia equilibrado mantém todas as tarefas pendentes
- **Given** uma agenda para `2026-11-06` com `420` minutos disponíveis brutos, `60` minutos de reuniões fixas (`306` min líquidos após 15% de transição)
- **And** duas tarefas pendentes somando `100` minutos (`ff-201` média 60 min, `ff-202` baixa 40 min)
- **When** `simularReplanejamentoDia` é executada para `2026-11-06`
- **Then** `necessita_replanejamento` deve ser `false`
- **And** `tarefas_mantidas_hoje` deve conter `ff-201` e `ff-202`
- **And** `tarefas_sugeridas_adiar` deve estar vazia (`[]`)
- **And** `novo_status_carga` deve ser `equilibrada`

### Scenario: Sobrecarga por teto de foco profundo (alta energia > 240 min)
- **Given** a agenda de `2026-11-05` com `480` min brutos, `135` min de reuniões fixas (`293` min líquidos)
- **And** três tarefas pendentes de `alta` energia:
  - `ff-101` (`importante_urgente`, `90` min)
  - `ff-104` (`importante_urgente`, `120` min)
  - `ff-102` (`importante_nao_urgente`, `75` min)
- **And** uma tarefa concluída `ff-103` (`45` min, `concluida: true`)
- **When** `simularReplanejamentoDia` é executada para `2026-11-05`
- **Then** `necessita_replanejamento` deve ser `true`
- **And** `tarefas_mantidas_hoje` deve conter `ff-101` e `ff-104` (somando `210` min `<= 240` min de foco profundo e `<= 293` min líquidos)
- **And** `tarefas_sugeridas_adiar` deve conter `ff-102` com motivo `teto_alta_energia_240m`
- **And** `tarefas_concluidas_preservadas` deve conter `ff-103`
- **And** `minutos_liberados` deve ser `75`

### Scenario: Caso de borda — Tarefa menor aproveita janela restante após adiar tarefa pesada
- **Given** um dia com `200` minutos brutos e `0` minutos de reuniões (`170` min líquidos)
- **And** uma tarefa `t-pesada` (`importante_nao_urgente`, `media`, `180` min) e uma tarefa `t-leve` (`nao_importante_urgente`, `baixa`, `45` min)
- **When** `simularReplanejamentoDia` é executada
- **Then** `t-pesada` deve ir para `tarefas_sugeridas_adiar` com motivo `capacidade_liquida_insuficiente`
- **And** `t-leve` deve entrar em `tarefas_mantidas_hoje` aproveitando os `170` min disponíveis

### Scenario: Caso de erro — Data fora do padrão ISO YYYY-MM-DD na fronteira MCP
- **Given** uma chamada com `data_iso` igual a `"05/11/2026; rm -rf /"`
- **When** a validação de entrada é executada
- **Then** a operação deve rejeitar o parâmetro sem ecoar o texto bruto enviado pelo usuário
