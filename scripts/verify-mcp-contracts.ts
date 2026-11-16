import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_ENTRY = path.resolve(__dirname, '../build/index.js');

async function verificarContratosMcp() {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [SERVER_ENTRY],
    stderr: 'pipe',
  });

  const client = new Client({
    name: 'focusflow-contract-verifier',
    version: '1.0.0',
  });

  await client.connect(transport);
  try {
    const lista = await client.listTools();
    const nomes = lista.tools.map((t) => t.name).sort();

    for (const obrigatoria of [
      'consultar_agenda_foco',
      'diagnosticar_sobrecarga_dia',
      'simular_replanejamento_dia',
    ]) {
      assert.ok(
        nomes.includes(obrigatoria),
        `Tool obrigatoria ausente no servidor MCP: ${obrigatoria}`,
      );
    }

    const respAgenda = await client.callTool({
      name: 'consultar_agenda_foco',
      arguments: { data_iso: '2026-11-05' },
    });
    const textoAgenda = JSON.stringify(respAgenda);
    assert.equal(
      textoAgenda.includes('nota_privada_usuario') || textoAgenda.includes('Segredo interno'),
      false,
      'Vazamento detectado no contrato de consultar_agenda_foco',
    );

    const respReplan = await client.callTool({
      name: 'simular_replanejamento_dia',
      arguments: { data_iso: '2026-11-05' },
    });
    const conteudoTexto = (respReplan.content as Array<{ type: string; text?: string }>)[0]?.text ?? '{}';
    const parsedReplan = JSON.parse(conteudoTexto) as { necessita_replanejamento: boolean };
    assert.equal(parsedReplan.necessita_replanejamento, true);

    console.log(
      `OK [check:contracts] ${nomes.length} tools verificadas via MCP stdio (${nomes.join(', ')}).`,
    );
  } finally {
    await client.close();
  }
}

verificarContratosMcp().catch((err) => {
  console.error('Falha no verificador de contratos MCP:', err);
  process.exit(1);
});
