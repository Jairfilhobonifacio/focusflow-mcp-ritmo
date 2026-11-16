# Retrospectiva Semana 7 — Spec-Driven Development (SDD)

## 1. Mudança implementada e artefatos da Spec
Implementamos a feature **`replanejamento-inteligente-eisenhower`** (`specs/replanejamento-inteligente-eisenhower/`), composta pelos quatro artefatos canônicos do SDD:
- `proposal.md`: motivação cognitiva (eliminar fadiga decisória em dias sobrecarregados), escopo fechado e fronteira somente-leitura.
- `specs/replanejamento.spec.md`: cenários comportamentais Given/When/Then cobrindo caminho feliz (`2026-11-06`), sobrecarga por teto de foco profundo (`2026-11-05`), caso de borda estilo knapsack (tarefa pesada adiada liberando janela para tarefa menor) e erro de validação ISO.
- `design.md`: reutilização de `calcularCapacidadeLiquida` como fonte única de verdade, ordenação pura sem mutação e contrato MCP.
- `tasks.md`: execução dividida em 3 tijolos com commits separados.

## 2. Onde a implementação seguiu a Spec e onde divergiu
- **Seguiu 100%:** separação em domínio puro (`src/domain/replanejamento.ts`) e tool MCP somente-leitura (`simular_replanejamento_dia` em `src/index.ts`), imutabilidade do array de entrada e isolamento estrito de `nota_privada_usuario`.
- **Ajuste descoberto durante o Tijolo 2:** no cenário `2026-11-06` (`ff-201` 60 min e `ff-202` 40 min, ambas no quadrante `importante_nao_urgente`), o critério de desempate por menor estimativa definido no `design.md` posicionou `ff-202` antes de `ff-201` em `tarefas_mantidas_hoje`. Documentamos essa ordem determinística nos testes em vez de depender da ordem arbitrária do JSON, e diferenciamos explicitamente `excede_capacidade_individual_do_dia` de `capacidade_liquida_insuficiente` para explicar melhor ao usuário por que uma tarefa isolada de 180 min não cabe em um dia de 170 min líquidos.

## 3. Aprendizado sobre especificar antes de codar
Escrever o `Fora de Escopo` (`proposal.md`) e os cenários de borda (`replanejamento.spec.md`) antes do código impediu dois erros clássicos de vibe coding: (1) tentar gravar alterações direto em `data/agenda-foco.json`, o que quebraria a Regra Permanente #2 de segurança do servidor MCP; e (2) parar o loop na primeira tarefa pesada que não coubesse, desperdiçando os minutos restantes do dia onde tarefas menores cabiam perfeitamente.
