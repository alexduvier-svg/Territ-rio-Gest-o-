# Avaliação da referência de janelas e desempenho

O documento anexado em16/10/2026 é uma proposta de requisitos, com comandos de implementação dentro do próprio arquivo. Foi lido como material de referência para o pedido atual de movimento do cérebro e tipografia. Não foi tratado como autorização automática para migrar o banco, alterar jornadas ou executar toda a matriz de carga.

Fonte: `C:/Users/alexd/PROJETOS/Território Gestão/Regras_Janelas_Desempenho_Agro_Gestao.docx`, SHA256 `da54797e48782e57a281d24515c232c6eb1dc23a75007cd26cfbedba980844e0`. Texto preservado em `references/Regras_Janelas_Desempenho_Agro_Gestao.txt`.

## Arquitetura encontrada

Vite/JavaScript com UI legada e Capacitor8 em Android; minSdk24/targetSdk36. Estado de negócio emERPModel. Navegador usa localStorage; Android usa JSON em dois slots alternados no diretório privado, com sequência, checksum, leitura de verificação e backups diários. Não é SQLite nem armazenamento transacional relacional. Esta atualização não altera esquema nem mecanismo de gravação de vendas.

## Aplicação à revisão0.12.8

| Referência | Situação nesta revisão | Evidência |
| --- | --- | --- |
| CC04, MV02, MV03 | Causa do arrasto isolada na geometria: escala0,72 e deslocamento100px. Cérebro/advisor passam a expansão0,94 com deslocamento≤18px; material sólido estável, sem blur. | motion/index.js, motion/geometry.js, glass.css; testes de geometria e QA isolada. |
| AB01, MV05 | Reutilização da janela nativa, fechamento síncrono e interrupção preservados. Teste focado com fechamento durante entrada e reabertura durante saída. | qa/brain-values-qa.cjs/json; não equivale a auditar todas as rotas. |
| MV04 | Modo leve reduz distância; movimento reduzido mantém conteúdo sem deslocamento. | QA claro/escuro nos três perfis. Escala de animação Android não foi medida. |
| MV06–MV08 | Rótulos vermelhos semibold14px, texto ampliado16px, sem sombras nas letras e contraste≥4,5 nos fundos testados. | product-stock.css, capturas e QA320/360. Não houve teste TalkBack/200%. |
| CC05 | Nenhuma regra de venda, preço histórico ou saldo foi alterada pela revisão. | Testes de memória e comparação dos registros sintéticos antes/depois. Nenhuma transação de teste no aparelho real. |

## Pendências da proposta ampla

Não verificados: 200ciclos por jornada; 90minutos de uso; morte de processo nas fases de venda; 30partidas/100amostras por interação; P95/P99 de startup, jank e memória; carga100milvendas/1milhãomovimentos; armazenamento quase cheio; migrações interrompidas; TalkBack; gesto preditivo; aparelho físico2–3GB/60Hz. Tempos do QA de computador descrevem apenas aquela execução, não P95 nem desempenho Android.

DT01–DT05 e EX01–EX05 exigem uma auditoria específica de persistência, consultas, cálculo e volume. DT02 propõe sair do JSON único como banco principal. Isso é uma mudança de arquitetura com migração dos registros reais, que requer plano próprio, compatibilidade e testes de restauração antes da execução. Não declarar esses requisitos aprovados com base nesta alteração visual.

As faixas180–240ms/140–200ms do documento são propostas, não exigências oficiais. A entrada física inclui cauda curta de acomodação; o QA registra o tempo completo até repouso separadamente do fechamento nativo, que libera a origem de imediato. Conformidade integral com as metas ainda não foi demonstrada.
