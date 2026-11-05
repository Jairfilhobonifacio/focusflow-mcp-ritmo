# FocusFlow Ritmo & MCP — Guia do Agente

@AGENTS.md

## Contexto do Projeto
Motor de cálculo de capacidade cognitiva diária (blocos de foco profundo 4-4-4 e matriz de Eisenhower) e servidor MCP (`stdio`) do ecossistema FocusFlow / Zenway. Resolve o problema de agendas irrealistas calculando a capacidade líquida real do dia (descontando reuniões fixas e 15% de margem de transição entre contextos) antes que a pessoa assuma mais tarefas do que consegue cumprir.

## Stack
- TypeScript 5.8 (ES2022, NodeNext, `"strict": true`) em Node.js 20+
- Validação de fronteira com `zod` e protocolo `@modelcontextprotocol/sdk` (stdio)
- Testes nativos com `node --import tsx --test`

## Comandos Úteis
- Instalar dependências: `npm install`
- Rodar testes automatizados: `npm test`
- Compilar TypeScript para `build/` e `meu-mcp-server/build/`: `npm run build`
- Inspecionar MCP via CLI: `npx @modelcontextprotocol/inspector --cli node build/index.js --method tools/list`

## Convenções Técnicas e Regras
- Toda regra de negócio vive em `src/domain/` como função pura e possui teste correspondente em `tests/`.
- Nunca exponha o campo `nota_privada_usuario` na saída das tools do MCP; devolva apenas os campos públicos estritamente necessários (`id`, `titulo` sanitizado, `energia`, `estimativa_minutos`, `prioridade_eisenhower`, `concluida`).
- Nunca faça eco do valor bruto recebido do usuário em mensagens de erro de validação (previne reflexão de Prompt Injection).
- Sempre rode `npm test` e `npm run build` antes de encerrar qualquer tarefa.
