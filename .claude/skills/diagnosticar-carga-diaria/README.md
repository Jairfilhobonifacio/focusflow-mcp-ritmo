# Skill: diagnosticar-carga-diaria

Esta skill analisa a agenda do FocusFlow / Zenway e calcula a capacidade cognitiva líquida do dia (descontando reuniões fixas e 15% de reserva de transição), apontando quando o excesso de tarefas de alta energia exige renegociar o plano. Ela aplica Progressive Disclosure mantendo as regras rápidas de gatilho no `SKILL.md` e carregando a tabela de limites, critérios de corte de Eisenhower e template formal a partir de `reference.md` apenas quando necessário.

Como usar em outro projeto: copie a pasta `.claude/skills/diagnosticar-carga-diaria/` para dentro do diretório `.claude/skills/` do seu repositório (ou `~/.claude/skills/` para uso global), reinicie o Claude Code e peça `"diagnostique se minha agenda de hoje cabe no dia"` ou invoque `/diagnosticar-carga-diaria`.
