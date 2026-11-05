# Registro da Semana 2 — Prompt Específico e Julgamento do Esqueleto

## 1. Prompt inicial de uma linha (Lab 1 — para contraste)

```text
faz um sistema para calcular se minha agenda de tarefas do dia cabe no meu tempo livre
```

**O que voltou no prompt vago:** o agente escolheu uma stack arbitrária com banco de dados externo, criou rotas de CRUD genéricas (`TaskService`, `TaskManager`), somou as durações das tarefas de forma ingênua sem descontar reuniões nem tempo de transição cognitiva, e não criou nenhum teste automatizado.

## 2. Prompt reescrito com os 3 controles (Especificidade + Exemplo + Formato de Saída)

```text
Quero um esqueleto funcional de projeto para o meu domínio (FocusFlow / Zenway): diagnóstico de capacidade cognitiva líquida diária para evitar agendas sobrecarregadas.

Restrições (Especificidade):
- Stack: TypeScript estrito em Node.js 20+, sem frameworks web e sem banco externo (usar JSON local em data/agenda-foco.json).
- Separação clara entre código de domínio puro (src/domain/) e testes automatizados (tests/) rodando com node --test.
- Regra de domínio obrigatória: a capacidade líquida desconta as reuniões fixas do tempo bruto e reserva 15% do tempo restante para transição entre tarefas. Se a soma das tarefas pendentes de alta energia passar de 240 minutos (ou se o saldo líquido ficar negativo), o status deve ser "sobrecarga".
- Nunca expor o campo nota_privada_usuario na camada pública.

Exemplo concreto (Entrada -> Saída esperada):
- Entrada: data_iso = "2026-11-05", minutos_disponiveis_brutos = 480, minutos_reunioes_fixas = 135, 1 tarefa pendente de alta energia com 90 min e 1 tarefa concluída com 45 min.
- Cálculo esperado: 480 - 135 = 345 min após reuniões; reserva de transição (15%) = 52 min; capacidade_liquida_minutos = 293; carga_pendente_minutos = 90; saldo_minutos = 203; status_carga = "equilibrada".

Formato de saída:
Antes de criar qualquer arquivo, mostre apenas:
1. Árvore de pastas e arquivos propostos
2. Assinatura das funções principais em src/domain/
3. Casos de teste que serão criados em tests/
Aguarde minha confirmação antes de escrever os arquivos.
```

## 3. O que eu rejeitei e ajustei do plano do agente (Checkpoint 2)

1. **Rejeitei a criação de uma pasta `src/services/` e `src/utils/`:** o plano inicial do agente propunha um `CapacityCalculatorService` e um `dateUtils.ts`. Rejeitei porque criava camadas de passagem desnecessárias (Abstraction Bloat) e pedi funções puras diretas em `src/domain/capacidade.ts` e `src/domain/agendaRepository.ts`.
2. **Ajustei a regra de tarefas concluídas:** na primeira versão da função, o agente somava todas as tarefas do dia na carga pendente. Corrigi para filtrar apenas `!t.concluida`, já que tarefas concluídas não consomem o saldo restante do expediente.
3. **Adicionei o corte explícito de `nota_privada_usuario` no repositório:** garanti por teste automatizado que o mapeamento em `carregarDiaAgenda` constrói um objeto novo apenas com os 6 campos públicos, impedindo vazamento acidental por spread (`...tarefa`).
