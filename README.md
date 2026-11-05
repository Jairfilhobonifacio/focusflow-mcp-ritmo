# FocusFlow Ritmo & MCP Server — Planejador de Capacidade Cognitiva Diária

Motor de cálculo de capacidade cognitiva líquida, priorização por energia/Eisenhower e servidor MCP (`stdio`) do ecossistema FocusFlow / Zenway, desenvolvido ao longo das Semanas 2, 3 e 4 da Especialização em Desenvolvimento com IA (Programadores do Amanhã — PDA).

## Contexto do Problema (Parágrafo para o Dono do Negócio — Semana 2)

Hoje, quem tenta organizar a própria rotina costuma anotar uma lista enorme de tarefas sem descontar o tempo gasto em reuniões e o cansaço natural de trocar de assunto ao longo do dia. O resultado é chegar ao fim da tarde com a sensação de que trabalhou o dia inteiro, mas deixou o mais importante pela metade porque o plano nunca cabia nas horas reais disponíveis. Este projeto resolve isso calculando quanto tempo livre de verdade sobra na agenda e avisando, antes de o dia começar, quando há tarefas pesadas demais concentradas no mesmo turno. Isso importa porque transforma uma lista de desejos irrealista em um plano diário que a pessoa realmente consegue cumprir sem esgotamento e sem atrasar entregas críticas.

## O que a Ferramenta de IA Faz e Seus Limites (Parágrafo para o Dono do Negócio — Semana 4)

Demos ao assistente de IA duas ferramentas de consulta para que ele possa olhar os compromissos do dia e calcular sozinho se as tarefas planejadas cabem no tempo disponível, sem que a pessoa precise somar minutos na mão. Com isso, basta perguntar ao assistente se a agenda de hoje está viável e ele já aponta onde há excesso de trabalho pesado. As ferramentas funcionam exclusivamente em modo de leitura sobre os dados públicos da agenda: elas não têm permissão para apagar, criar ou alterar nenhuma tarefa, não leem anotações pessoais confidenciais e não acessam nenhum outro arquivo do computador. Mesmo que alguém tente esconder uma ordem maliciosa dentro do nome de uma tarefa para enganar o assistente, a própria ferramenta bloqueia o texto suspeito e recusa comandos fora do padrão, porque a trava de segurança está gravada no código e não depende da obediência da IA.

## Qual Risco Ameaça Mais Este Domínio (Semana 4 — Faixa Completa)

Dos três riscos trabalhados na Semana 4 (Prompt Injection, Improper Output Handling e Supply Chain), o que mais ameaça especificamente o domínio de produtividade pessoal e gestão de agenda é a combinação de **Improper Output Handling servindo de porta de entrada para Prompt Injection Indireta**. Em um aplicativo de rotina e tarefas, os títulos de compromissos frequentemente vêm de fora (convites de calendário, demandas de clientes ou mensagens encaminhadas). Se o servidor MCP devolver esses textos crus para o assistente ou ecoar parâmetros inválidos dentro de mensagens de erro, um convite de agenda malicioso consegue injetar instruções na sessão sem que o usuário perceba. Por isso, a defesa principal deste projeto filtra os campos na saída (omitindo `nota_privada_usuario` e sanitizando `titulo` com allow-list e bloqueio anti-injeção) e emite mensagens estáticas de erro.

## Estrutura de Pastas e Artefatos por Semana

```text
focusflow-mcp-ritmo/
├── CLAUDE.md                        # Contexto enxuto do projeto, stack, comandos e regras (Semana 2)
├── AGENTS.md                        # Regras permanentes multi-agente (Semanas 2 e 3)
├── PROMPT-SEMANA2.md                # Prompt específico (especificidade + exemplo + formato) e ajustes (Semana 2)
├── .claude/
│   └── skills/
│       └── diagnosticar-carga-diaria/
│           ├── SKILL.md             # Skill própria com gatilho de domínio e allowed-tools restrito (Semana 3)
│           ├── reference.md         # Progressive Disclosure: limites, corte Eisenhower e template (Semana 3)
│           └── README.md            # Instruções de reuso da skill em outros projetos (Semana 3)
├── EVIDENCIA-SKILL-SEMANA3.md       # Comando real e saída da invocação da skill com Progressive Disclosure
├── DECISAO-ESCOPO.md                # Escopo das tools, limites e garantias no código (Semana 4)
├── LOG-INJECTION-TEMPLATE.md        # Relatório Red Team antes/depois + testes no MCP Inspector (Semana 4)
├── PARAGRAFOS-ENTREGA.md            # Parágrafos para o dono do negócio e análise de risco OWASP
├── data/
│   └── agenda-foco.json             # Base local de blocos de foco, reuniões e tarefas do dia
├── src/
│   ├── index.ts                     # Servidor MCP (stdio) expondo consultar_agenda_foco e diagnosticar_sobrecarga_dia
│   └── domain/
│       ├── capacidade.ts            # Funções puras de capacidade líquida, schemas Zod e sanitização anti-injeção
│       └── agendaRepository.ts      # Leitura segura da agenda com omissão de nota_privada_usuario
├── meu-mcp-server/                  # Espelho compatível com o passo a passo da Semana 4 (npm run build)
└── tests/
    └── capacidade.test.ts           # Suíte automatizada de domínio e segurança (Red Team / Prompt Injection)
```

## Como Rodar Localmente

### 1. Instalar dependências
```bash
npm install
```

### 2. Rodar a suíte de testes automatizados (Domínio + Segurança Red Team)
```bash
npm test
```

### 3. Compilar o servidor MCP (`build/index.js` e `meu-mcp-server/build/index.js`)
```bash
npm run build
```

### 4. Conectar ao Claude Code via transporte `stdio`
```bash
claude mcp add --transport stdio focusflow-mcp -- node "$(pwd)/build/index.js"
```

### 5. Testar pelo MCP Inspector (CLI)
```bash
npx @modelcontextprotocol/inspector --cli node build/index.js --method tools/list
npx @modelcontextprotocol/inspector --cli node build/index.js --method tools/call --tool-name diagnosticar_sobrecarga_dia --tool-arg data_iso=2026-11-05
```

## Como Reutilizar a Skill `diagnosticar-carga-diaria` (Semana 3)

A skill localizada em `.claude/skills/diagnosticar-carga-diaria/` avalia a viabilidade da agenda diária aplicando Progressive Disclosure (regras rápidas no `SKILL.md` e tabelas detalhadas em `reference.md`). Para utilizá-la em outro projeto, copie a pasta `.claude/skills/diagnosticar-carga-diaria/` para o diretório `.claude/skills/` do seu projeto, reinicie o Claude Code e peça `"avalie se minha agenda de hoje cabe no dia"` ou invoque `/diagnosticar-carga-diaria`.
