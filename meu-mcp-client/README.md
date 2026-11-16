# `meu-mcp-client` — Cliente MCP Próprio do FocusFlow (Semana 10)

Cliente MCP escrito do zero em TypeScript utilizando `@modelcontextprotocol/sdk` (`Client` + `StdioClientTransport`) conectado ao `../meu-mcp-server/build/index.js` construído na Semana 4 e expandido nas Semanas 7–10.

## Como configurar e rodar

1. Na raiz do projeto, compile o servidor MCP:
   ```bash
   npm install
   npm run build
   ```
2. Entre em `meu-mcp-client/`, instale as dependências e configure as variáveis de ambiente (sem chaves no código):
   ```bash
   cd meu-mcp-client
   npm install
   cp .env.example .env
   ```
3. Exporte `LLM_BASE_URL`, `LLM_API_KEY` e `LLM_MODEL` e rode o modo interativo (`npm start`) ou a bateria de 3 perguntas reais (`npm run demo`):
   ```bash
   npm run demo
   ```

## Servidor Conectado e Tools Descobertas Dinamicamente
- `consultar_agenda_foco`
- `diagnosticar_sobrecarga_dia`
- `simular_replanejamento_dia`
- `diagnosticar_fadiga_periodo`
- `consultar_distribuicao_quadrantes`

## Evidência Real de Execução (3 Perguntas Acionando Tools via `stdio`)

```text
> meu-mcp-client@1.0.0 demo
> node --import tsx src/index.ts --demo

Conectado ao FocusFlow MCP Server. Tools descobertas (5): consultar_agenda_foco, diagnosticar_sobrecarga_dia, simular_replanejamento_dia, diagnosticar_fadiga_periodo, consultar_distribuicao_quadrantes

=== Pergunta 1: O dia 2026-11-05 cabe na minha agenda ou esta em sobrecarga? Se estiver sobrecarregado, qual tarefa devo adiar? ===
  [MCP tool_call] diagnosticar_sobrecarga_dia({"data_iso":"2026-11-05"})
  [MCP tool_call] simular_replanejamento_dia({"data_iso":"2026-11-05"})
Resposta do Agente:
O dia **2026-11-05 está em sobrecarga cognitiva**.

### Diagnóstico do dia
* **Capacidade líquida:** 293 min (descontando 135 min de reuniões fixas e 52 min de transição).
* **Carga pendente:** 285 min (saldo de apenas 8 min, ultrapassando em **45 min** o teto seguro de 240 min para tarefas de alta energia).

### Tarefa recomendada para adiar
* **Auditar relatorio semanal MXP e aprovar pauta de sexta** (`ff-102`) — 75 min | Energia: Alta | Prioridade: *Importante, mas não urgente*.
* **Motivo:** Excede o limite seguro de 240 min de foco de alta energia no mesmo dia.

### Tarefas para manter hoje (210 min — Importante e Urgente)
1. **Revisar especificacao EARS e BDD do checkout idempotente** (`ff-101`) — 90 min (alta energia)
2. **Implementar validacao de schema no servidor MCP com testes** (`ff-104`) — 120 min (alta energia)

Com esse ajuste, você libera **75 min** e reduz o status do dia para **atenção**, preservando um ritmo sustentável.

=== Pergunta 2: Como esta a distribuicao de minutos pendentes por quadrante de Eisenhower em 2026-11-06? ===
  [MCP tool_call] consultar_distribuicao_quadrantes({"data_iso":"2026-11-06"})
Resposta do Agente:
Em **2026-11-06**, a distribuição de minutos pendentes por quadrante de Eisenhower é:

- **Importante e Urgente:** 0 min
- **Importante e Não Urgente (Foco Estratégico):** 100 min
- **Não Importante e Urgente:** 0 min
- **Não Importante e Não Urgente:** 0 min

**Resumo:**
- **Total pendente:** 100 minutos
- **Foco estratégico:** 100%

=== Pergunta 3: Analise o risco de burnout entre os dias 2026-11-05 e 2026-11-06. ===
  [MCP tool_call] diagnosticar_fadiga_periodo({"datas_iso":["2026-11-05","2026-11-06"]})
  [MCP tool_call] diagnosticar_sobrecarga_dia({"data_iso":"2026-11-05"})
  [MCP tool_call] diagnosticar_sobrecarga_dia({"data_iso":"2026-11-06"})
Resposta do Agente:
**Diagnóstico de Burnout (2026-11-05 a 2026-11-06)**

* **Risco de Burnout:** Moderado
* **Dias analisados:** 2 (1 dia em sobrecarga, sem sequência contínua)
* **Média de alta energia:** 143 min/dia

**Detalhamento por dia:**
* **2026-11-05 (Sobrecarga):** Capacidade líquida de 293 min para 285 min de carga pendente (saldo de apenas 8 min; 45 min acima do limite seguro de alta energia).
* **2026-11-06 (Equilibrada):** Capacidade líquida de 306 min para 100 min de carga pendente (saldo livre de 206 min).

**Recomendação:** Há sinais iniciais de compressão de agenda. Mova pelo menos 1 tarefa de alta energia do dia **2026-11-05** para **2026-11-06** (que possui folga suficiente), mas evite empilhar novos blocos pesados além disso para garantir a recuperação cognitiva.
```
