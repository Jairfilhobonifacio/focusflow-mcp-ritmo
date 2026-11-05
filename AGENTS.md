# AGENTS.md — Regras de Engenharia de Contexto (FocusFlow Ritmo & MCP)

## Papel deste arquivo
Define as regras permanentes que valem em qualquer sessão de agente de código (Claude Code, Codex, Cursor, Hermes) neste repositório. Procedimentos específicos sob demanda ficam em `.claude/skills/`.

## Regras Permanentes
1. **Separação Código × Teste:** O código-fonte fica em `src/` (`src/domain/` para regras puras e `src/index.ts` para o servidor MCP) e os testes ficam em `tests/`. Nunca edite um teste para mascarar um bug de domínio.
2. **Segurança por Construção no MCP:** As tools são estritamente **somente leitura** sobre `data/agenda-foco.json`. Nenhuma tool pode criar, editar ou apagar arquivos, nem ler caminhos arbitrários do sistema de arquivos.
3. **Validação de Entrada e Saída:** Todo parâmetro de tool passa por schema Zod com limite de tamanho (`maxLength`) e formato explícito. Títulos vindos do armazenamento passam por `sanitizarTituloTarefa` antes de chegarem ao contexto do modelo.
4. **Verificação Obrigatória:** Nenhuma alteração está pronta sem `npm test` verde e `npm run build` sem erros.
