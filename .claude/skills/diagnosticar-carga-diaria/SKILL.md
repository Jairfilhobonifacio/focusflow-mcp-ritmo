---
name: diagnosticar-carga-diaria
description: Diagnostica a capacidade cognitiva liquida do dia no FocusFlow/Zenway, cruza blocos de foco profundo com reunioes fixas e recomenda cortes quando ha sobrecarga. Use quando o usuario pedir para avaliar se a agenda do dia cabe, planejar blocos de foco ou revisar sobrecarga diaria.
allowed-tools: Read, Grep, Glob, Bash(npm test:*)
---

# Diagnosticar Carga Diária (FocusFlow / Zenway)

Esta skill analisa um dia da agenda (`data/agenda-foco.json`) e produz um veredito objetivo sobre a viabilidade do plano diário antes que o usuário comece a executar tarefas no impulso.

## Quando abrir o material de apoio (Progressive Disclosure)

- **Se o dia tiver apenas 1 ou 2 tarefas leves e menos de 120 minutos totais:** aplique direto a regra base abaixo sem precisar carregar arquivos extras.
- **Se o dia tiver reuniões fixas, 3 ou mais tarefas pendentes, tarefas de `energia: "alta"` ou suspeita de sobrecarga:** leia obrigatoriamente [`reference.md`](./reference.md) antes de calcular o veredito, pois lá estão a tabela oficial de pesos de transição, a política de corte por prioridade de Eisenhower e o template obrigatório do relatório.

## Passos

1. Leia `data/agenda-foco.json` e localize o objeto correspondente à data pedida pelo usuário (ou o primeiro dia com tarefas pendentes se nenhuma data for informada).
2. Caso o cenário exija cálculo detalhado ou desempate de corte (ver critério acima), leia `.claude/skills/diagnosticar-carga-diaria/reference.md`.
3. Calcule:
   - Tempo após reuniões = `minutos_disponiveis_brutos - minutos_reunioes_fixas`
   - Reserva de transição (15%) = `round(tempo_apos_reunioes * 0.15)`
   - Capacidade líquida = `tempo_apos_reunioes - reserva_de_transicao`
   - Carga pendente total e carga pendente de alta energia (ignorando tarefas com `concluida: true`).
4. Nunca exiba nem mencione o campo `nota_privada_usuario` em nenhuma parte da resposta.
5. Entregue o diagnóstico seguindo o formato padronizado de `reference.md`.
