# Evidência Semana 8 — Verificadores Determinísticos e Red -> Green -> Refactor

## 1. Pipeline de 4 Verificadores (`npm run check`)
O comando único `npm run check` encadeia 4 verificadores determinísticos com saída binária:
1. `npm run check:types` (`tsc --noEmit`): garante tipagem estrita TypeScript (`strict: true`) sem erros de compilação.
2. `npm run check:static` (`node scripts/verify-static-guards.mjs`): barra `console.log` em `src/` (proteção do protocolo MCP `stdio`), barra `any` explícito e impede qualquer acesso a `nota_privada_usuario` fora de `src/domain/agendaRepository.ts`.
3. `npm run check:contracts` (`node --import tsx scripts/verify-mcp-contracts.ts`): sobe o servidor MCP real via `StdioClientTransport`, valida a presença das tools em `listTools()` e verifica contratos JSON + ausência de vazamento de notas privadas em `callTool()`.
4. `npm run check:tests` (`node --import tsx --test tests/*.test.ts`): executa a suíte completa de testes unitários e de segurança.

## 2. Feature em Red -> Green -> Refactor (3 commits separados)
Implementamos `calcularFadigaSemanal` em `src/domain/fadigaSemanal.ts`:
- **Commit 1 (Red):** suíte `tests/fadigaSemanal.test.ts` + assinatura stub lançando erro, confirmando falha real em `npm test`.
- **Commit 2 (Green):** implementação mínima do cálculo de dias consecutivos em sobrecarga e média de minutos de alta energia passando em todos os verificadores.
- **Commit 3 (Refactor):** extração das constantes de domínio (`TETO_FOCO_PROFUNDO_MINUTOS`, `LIMIAR_SEQUENCIA_BURNOUT_ALTO`, `LIMIAR_MEDIA_ALTA_ENERGIA_MODERADO`) e das funções auxiliares `somarMinutosAltaEnergiaPendentes` e `classificarRiscoBurnout`, mantendo a suíte 100% verde.

## 3. Guardrail Novo Adicionado
Adicionamos a Regra Permanente #5 em `AGENTS.md` proibindo `console.log` em `src/` porque o transporte MCP `stdio` usa `stdout` exclusivamente para frames JSON-RPC 2.0, automatizando essa checagem em `scripts/verify-static-guards.mjs`.
