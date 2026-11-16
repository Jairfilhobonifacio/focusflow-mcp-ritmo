# Plano de Tarefas (Tijolo por Tijolo) — Semana 7 SDD

## Tijolo 1 — Especificação SDD
- [x] 1.1 Escrever `proposal.md` com motivação, escopo, fora de escopo e riscos
- [x] 1.2 Escrever `specs/replanejamento.spec.md` com cenários Given/When/Then (feliz, sobrecarga foco profundo, borda knapsack e erro)
- [x] 1.3 Escrever `design.md` e `tasks.md` definindo fronteiras puras e algoritmo determinístico

## Tijolo 2 — Motor de Domínio Puro e Testes Unitários BDD
- [x] 2.1 Implementar `simularReplanejamentoDia` em `src/domain/replanejamento.ts` reutilizando `calcularCapacidadeLiquida` sem mutar arrays de entrada
- [x] 2.2 Criar `tests/replanejamento.test.ts` cobrindo todos os cenários do `specs/replanejamento.spec.md` + imutabilidade

## Tijolo 3 — Integração MCP Somente-Leitura e Retrospectiva
- [x] 3.1 Registrar a tool `simular_replanejamento_dia` em `src/index.ts` com validação Zod e isolamento de campos privados
- [x] 3.2 Adicionar teste de integração com `agenda-foco.json` real (`2026-11-05` e `2026-11-06`) e validar `npm test` + `npm run build`
- [x] 3.3 Documentar `RETROSPECTIVA-SEMANA7.md` comparando a spec original com a implementação entregue
