import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');

function listarArquivosTs(dir) {
  const saida = [];
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      saida.push(...listarArquivosTs(p));
    } else if (entrada.isFile() && entrada.name.endsWith('.ts')) {
      saida.push(p);
    }
  }
  return saida;
}

const falhas = [];
const arquivos = listarArquivosTs(SRC_DIR);

for (const arq of arquivos) {
  const rel = path.relative(ROOT, arq).replace(/\\/g, '/');
  const conteudo = fs.readFileSync(arq, 'utf-8');

  // Guardrail 1: Proibido console.log em src/ (stdout eh exclusivo para JSON-RPC stdio do MCP)
  if (/\bconsole\.log\s*\(/.test(conteudo)) {
    falhas.push(`[GUARDRAIL-STDIO] ${rel}: uso proibido de console.log em src/ (quebra protocolo MCP stdio; use console.error).`);
  }

  // Guardrail 2: Proibido tipo 'any' explicito em src/
  if (/:\s*any\b|<any>|as\s+any\b/.test(conteudo)) {
    falhas.push(`[GUARDRAIL-TYPES] ${rel}: uso proibido de 'any' explicito em src/.`);
  }

  // Guardrail 3: nota_privada_usuario nunca pode ser referenciada fora de agendaRepository.ts
  if (rel !== 'src/domain/agendaRepository.ts' && conteudo.includes('nota_privada_usuario')) {
    falhas.push(`[GUARDRAIL-PRIVACY] ${rel}: referencia indevida a nota_privada_usuario fora da fronteira de leitura.`);
  }
}

if (falhas.length > 0) {
  console.error('Verificador estatico reprovado:');
  for (const f of falhas) console.error(' -', f);
  process.exit(1);
}

console.log(`OK [check:static] ${arquivos.length} arquivos em src/ verificados (stdio limpo, sem any, isolamento privado integro).`);
