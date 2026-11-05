# Diagnóstico do Código (Checklist de 6 Sinais de Código Gerado por IA)

Revisão do código de `src/` e `tests/` deste repositório aplicando as 6 categorias de `checklist-sinais-codigo-ia.md`:

1. **Abstraction Bloat (Classe Deus, Miragem Modular, Camada de Passagem, nome genérico):**
   - **Não aparece no código final.** Rejeitamos no Checkpoint 2 da Semana 2 a criação de `CapacityCalculatorService` e `dateUtils.ts` sugerida inicialmente pelo agente, mantendo funções puras diretas em `src/domain/capacidade.ts` e `src/domain/agendaRepository.ts`.
2. **Duplicação em vez de reuso:**
   - **Apareceu e foi tratada:** em `src/index.ts` (linhas 27-32 e 111-116), a validação de `DataIsoSchema.safeParse(args.data_iso)` com lançamento de `McpError(ErrorCode.InvalidParams)` repete o mesmo bloco de 6 linhas nas duas tools (`consultar_agenda_foco` e `diagnosticar_sobrecarga_dia`). Mantivemos explícito nas duas tools por legibilidade imediata da fronteira MCP, mas em uma terceira tool extrairíamos `validarDataIsoOuErro(dataIso)`.
3. **Mascaramento de erro (`catch` vazio, `|| 0` silencioso):**
   - **Ponto de atenção mapeado em `src/domain/agendaRepository.ts` (linhas 68-89):** quando um registro armazenado no JSON tem `estimativa_minutos` inválida, o mapeador usa fallback `30` minutos e `energia: 'media'` para não derrubar a leitura do dia inteiro. Documentado como decisão defensiva de leitura.
4. **API ou biblioteca alucinada:**
   - **Não aparece.** Apenas `@modelcontextprotocol/sdk` (`1.12.1`), `zod` (`3.25.0`) e módulos nativos do Node (`node:fs`, `node:path`, `node:test`, `node:assert/strict`).
5. **Defensividade sem necessidade (`if` para caso que não existe):**
   - **Aparece em `src/domain/agendaRepository.ts` (linha 58):** `Array.isArray(json.dias) ? json.dias : []` mesmo sendo um JSON versionado no próprio projeto. Mantido porque protege contra arquivo corrompido em disco.
6. **Fronteira dissolvida (um arquivo resolvendo dois contextos):**
   - **Ponto de atenção mapeado em `src/domain/capacidade.ts`:** hoje o mesmo arquivo concentra tanto a regra de domínio de **Capacidade Cognitiva** (`calcularCapacidadeLiquida`) quanto a sanitização de segurança de ** Catálogo de Tarefas** (`sanitizarTituloTarefa`). Candidatos naturais a 2 bounded contexts separados: **Planejamento de Capacidade** e **Acervo de Tarefas**.
