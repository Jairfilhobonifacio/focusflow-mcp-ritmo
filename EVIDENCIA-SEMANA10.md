# Evidência Semana 10 — Orquestração Paralela (`git worktree`) e `meu-mcp-client`

## 1. Paralelismo Real em `git worktree`
Dividimos a entrega da Semana 10 em duas frentes estritamente disjuntas rodando em worktrees independentes a partir da `main`:
- **Worktree 1 (`wt-focusflow-client` / branch `feat/semana10-mcp-client`):** criação isolada de `meu-mcp-client/` (`src/index.ts`, `package.json`, `tsconfig.json`, `.env.example`, `.gitignore`).
- **Worktree 2 (`wt-focusflow-quadrantes` / branch `feat/semana10-tool-quadrantes`):** adição da 5ª tool somente-leitura `consultar_distribuicao_quadrantes` em `src/index.ts`.

Como não houve interseção de arquivos entre os dois diretórios de trabalho, ambos os merges (`--no-ff`) entraram na `main` sem nenhum conflito e com `npm run check` 100% verde.

## 2. O Cliente MCP Próprio (`meu-mcp-client/`)
O cliente sobe `../meu-mcp-server/build/index.js` como subprocesso via `StdioClientTransport`, descobre todas as 5 tools dinamicamente com `mcpClient.listTools()`, converte seus JSON Schemas para o formato de tool calling do modelo e executa o loop `while (tool_calls)` repassando os resultados reais do protocolo MCP até obter a síntese final. Nenhuma credencial foi commitada (uso exclusivo de variáveis de ambiente documentadas em `.env.example`).

## 3. Log Real das 3 Perguntas Executadas
Verificado ao vivo via `npm run demo` (detalhes completos em `meu-mcp-client/README.md`).
