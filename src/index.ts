import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { calcularCapacidadeLiquida, DataIsoSchema, FiltroEnergiaSchema } from './domain/capacidade.js';
import { carregarDiaAgenda } from './domain/agendaRepository.js';

const server = new McpServer({
  name: 'focusflow-mcp-ritmo',
  version: '1.0.0',
});

server.tool(
  'consultar_agenda_foco',
  'Use quando precisar listar as tarefas planejadas de uma data (YYYY-MM-DD) no FocusFlow/Zenway, opcionalmente filtradas por nivel de energia (alta, media, baixa). Somente leitura; nunca retorna notas privadas.',
  {
    data_iso: z
      .string()
      .max(10, 'data_iso deve ter no maximo 10 caracteres (YYYY-MM-DD)')
      .describe('Data da agenda no formato estrito YYYY-MM-DD (ex.: 2026-11-05)'),
    filtro_energia: z
      .string()
      .optional()
      .describe('Filtro opcional de energia cognitiva: alta, media ou baixa'),
  },
  async (args) => {
    const parsedDate = DataIsoSchema.safeParse(args.data_iso);
    if (!parsedDate.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Parametro data_iso invalido: informe exatamente YYYY-MM-DD (10 caracteres, apenas digitos e hifens).',
      );
    }

    let energiaValida: string | undefined;
    if (args.filtro_energia !== undefined) {
      const parsedEnergy = FiltroEnergiaSchema.safeParse(args.filtro_energia);
      if (!parsedEnergy.success) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Parametro filtro_energia invalido: use apenas alta, media ou baixa.',
        );
      }
      energiaValida = parsedEnergy.data;
    }

    try {
      const dia = carregarDiaAgenda(parsedDate.data, energiaValida);
      if (!dia) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  encontrado: false,
                  data_iso: parsedDate.data,
                  mensagem: 'Nenhuma agenda encontrada para a data informada.',
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                encontrado: true,
                data_iso: dia.data_iso,
                blocos_foco_profundo_planejados: dia.blocos_foco_profundo_planejados,
                total_tarefas_retornadas: dia.tarefas.length,
                tarefas: dia.tarefas,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (err) {
      console.error('[focusflow-mcp-ritmo] Erro interno em consultar_agenda_foco:', err);
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Erro interno ao ler a agenda local de foco.',
          },
        ],
      };
    }
  },
);

server.tool(
  'diagnosticar_sobrecarga_dia',
  'Use quando o usuario perguntar se o dia cabe na agenda, se ha sobrecarga cognitiva ou quanto tempo liquido resta para blocos de foco profundo em uma data (YYYY-MM-DD).',
  {
    data_iso: z
      .string()
      .max(10, 'data_iso deve ter no maximo 10 caracteres (YYYY-MM-DD)')
      .describe('Data da agenda no formato estrito YYYY-MM-DD (ex.: 2026-11-05)'),
  },
  async (args) => {
    const parsedDate = DataIsoSchema.safeParse(args.data_iso);
    if (!parsedDate.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Parametro data_iso invalido: informe exatamente YYYY-MM-DD (10 caracteres, apenas digitos e hifens).',
      );
    }

    try {
      const dia = carregarDiaAgenda(parsedDate.data);
      if (!dia) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  encontrado: false,
                  data_iso: parsedDate.data,
                  mensagem: 'Nenhuma agenda encontrada para calcular capacidade liquida.',
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      const diagnostico = calcularCapacidadeLiquida({
        data_iso: dia.data_iso,
        minutos_disponiveis_brutos: dia.minutos_disponiveis_brutos,
        minutos_reunioes_fixas: dia.minutos_reunioes_fixas,
        tarefas: dia.tarefas,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(diagnostico, null, 2),
          },
        ],
      };
    } catch (err) {
      console.error('[focusflow-mcp-ritmo] Erro interno em diagnosticar_sobrecarga_dia:', err);
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Erro interno ao calcular capacidade liquida do dia.',
          },
        ],
      };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('FocusFlow Ritmo MCP Server rodando via stdio');
}

main().catch((error) => {
  console.error('Falha fatal ao iniciar o servidor MCP:', error);
  process.exit(1);
});
