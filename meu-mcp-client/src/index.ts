import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LLM_BASE_URL = (process.env.LLM_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/+$/, '');
const LLM_API_KEY = process.env.LLM_API_KEY ?? '';
const LLM_MODEL = process.env.LLM_MODEL ?? 'gpt-4o-mini';
const MCP_SERVER_SCRIPT = path.resolve(
  __dirname,
  process.env.MCP_SERVER_SCRIPT ?? '../../meu-mcp-server/build/index.js',
);

interface OpenAiToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
  extra_content?: unknown;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  tool_calls?: OpenAiToolCall[];
  tool_call_id?: string;
  extra_content?: unknown;
}

async function chamarLlm(
  messages: ChatMessage[],
  tools: Array<{
    type: 'function';
    function: { name: string; description: string; parameters: Record<string, unknown> };
  }>,
): Promise<ChatMessage> {
  if (!LLM_API_KEY) {
    throw new Error(
      'Defina LLM_API_KEY (e opcionalmente LLM_BASE_URL e LLM_MODEL) no ambiente antes de executar.',
    );
  }

  const resp = await fetch(`${LLM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LLM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      tools,
      temperature: 0.1,
    }),
  });

  if (!resp.ok) {
    const erroTxt = await resp.text();
    throw new Error(`Falha HTTP ${resp.status} no provedor LLM: ${erroTxt.slice(0, 300)}`);
  }

  const dados = (await resp.json()) as { choices: Array<{ message: ChatMessage }> };
  return dados.choices[0].message;
}

export async function executarPerguntaNoAgenteMcp(
  mcpClient: Client,
  ferramentasLlm: Array<{
    type: 'function';
    function: { name: string; description: string; parameters: Record<string, unknown> };
  }>,
  perguntaUsuario: string,
): Promise<string> {
  const historico: ChatMessage[] = [
    {
      role: 'system',
      content:
        'Voce eh o assistente de ritmo cognitivo do FocusFlow. Sempre consulte as tools MCP disponiveis antes de responder sobre datas ou sobrecarga, e responda em portugues objetivo.',
    },
    { role: 'user', content: perguntaUsuario },
  ];

  const MAX_ITERACOES = 6;
  for (let passo = 1; passo <= MAX_ITERACOES; passo += 1) {
    const respostaModelo = await chamarLlm(historico, ferramentasLlm);
    historico.push(respostaModelo);

    if (!respostaModelo.tool_calls || respostaModelo.tool_calls.length === 0) {
      return respostaModelo.content ?? '';
    }

    for (const tc of respostaModelo.tool_calls) {
      let argumentosObj: Record<string, unknown> = {};
      try {
        argumentosObj = JSON.parse(tc.function.arguments || '{}') as Record<string, unknown>;
      } catch {
        argumentosObj = {};
      }

      console.log(`  [MCP tool_call] ${tc.function.name}(${JSON.stringify(argumentosObj)})`);
      const resultadoMcp = await mcpClient.callTool({
        name: tc.function.name,
        arguments: argumentosObj,
      });

      const blocos = (resultadoMcp.content ?? []) as Array<{ type: string; text?: string }>;
      const textoTool = blocos.map((b) => b.text ?? '').join('\n');

      historico.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: textoTool,
      });
    }
  }

  return 'Limite maximo de iteracoes de ferramentas atingido.';
}

async function main() {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [MCP_SERVER_SCRIPT],
    stderr: 'pipe',
  });

  const mcpClient = new Client({
    name: 'focusflow-meu-mcp-client',
    version: '1.0.0',
  });

  await mcpClient.connect(transport);

  try {
    const catalogo = await mcpClient.listTools();
    console.log(
      `Conectado ao FocusFlow MCP Server. Tools descobertas (${catalogo.tools.length}): ${catalogo.tools.map((t) => t.name).join(', ')}`,
    );

    const ferramentasLlm = catalogo.tools.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description ?? '',
        parameters: (t.inputSchema ?? { type: 'object', properties: {} }) as Record<
          string,
          unknown
        >,
      },
    }));

    if (process.argv.includes('--demo')) {
      const perguntasDemo = [
        'O dia 2026-11-05 cabe na minha agenda ou esta em sobrecarga? Se estiver sobrecarregado, qual tarefa devo adiar?',
        'Como esta a distribuicao de minutos pendentes por quadrante de Eisenhower em 2026-11-06?',
        'Analise o risco de burnout entre os dias 2026-11-05 e 2026-11-06.',
      ];

      for (const [indice, pergunta] of perguntasDemo.entries()) {
        console.log(`\n=== Pergunta ${indice + 1}: ${pergunta} ===`);
        const respostaFinal = await executarPerguntaNoAgenteMcp(
          mcpClient,
          ferramentasLlm,
          pergunta,
        );
        console.log(`Resposta do Agente:\n${respostaFinal}`);
      }
      return;
    }

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    try {
      while (true) {
        const entrada = (await rl.question('\nPergunta FocusFlow (ou "sair"): ')).trim();
        if (!entrada || entrada.toLowerCase() === 'sair') break;
        const resposta = await executarPerguntaNoAgenteMcp(mcpClient, ferramentasLlm, entrada);
        console.log(`\n${resposta}`);
      }
    } finally {
      rl.close();
    }
  } finally {
    await mcpClient.close();
  }
}

main().catch((err) => {
  console.error('Erro no meu-mcp-client:', err);
  process.exit(1);
});
