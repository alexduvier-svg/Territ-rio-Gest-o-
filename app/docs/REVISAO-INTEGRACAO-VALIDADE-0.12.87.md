# Integração de Validade — Revisão para Concluir a 0.12.87

Registro histórico da revisão anterior à autorização de integração, em 26/10/2026. As pendências abaixo foram superadas: o usuário autorizou a integração e o servidor, o candidato final passou nos testes e a 0.12.87 foi instalada nos dois aparelhos. Consulte ENTREGA-0.12.87.md para o estado atual, hashes e limites da verificação. Este texto preserva a avaliação anterior, não representa impedimento ativo.

## Resultado da Avaliação da Nova Diretriz

A diretriz Estoque: Objetivo → Contexto → Ação → Output complementa o motor existente. Reaproveitar ERP, reservas, Orientação e reconciliador de notificações, sem outro saldo ou motor. As lacunas principais são distinguir físico/elegível/reservado, validade por entrada e evidência suficiente antes de recomendar compra ou promoção. Custo por lote não altera a política financeira de custeio ou vendas passadas.

Referência recebida e avaliação detalhada: DIRETRIZ-RECEBIDA-ESTOQUE-CONTEXTO-2026-10-25.md e AVALIACAO-ESTOQUE-CONTEXTO-0.12.87.md. Memórias de referência em fonte: interface57 e decisões5; conhecimento local estoque-validade-contexto.md. Registro não equivale a instalação.

## Alteração Preparada

- Lotes como alocações das movimentações canônicas; saldo físico único, migração do saldo atual sem refazer movimentos passados e cache incremental por produto.
- Validade opcional independente em cada entrada: calendário, data escrita ou prazo com referência/resultado confirmados. Produção e recebimento são informações distintas.
- Disponibilidade comercial exclui vencidos, itens em avaliação e reservas aplicáveis. Estoque vencido continua físico; devolução e correção de vencido exigem conferência antes de liberação.
- Carga da feira reserva lotes elegíveis até o fim do evento, sem entrada física adicional. Faixa de dias calculada na data da feira, apenas das quantidades separadas. Venda antiga pede data real confirmada e escolha de lote quando houver alternativas.
- Formulários e detalhes no material existente, agenda interna, consultas prontas e CSVs; backup JSON preserva lotes e movimentos. Sem aumentar cards de Vender.
- Avisos de validade e revisão usam o reconciliador existente. Baixa do lote cancela pendência e aviso entregue. D−5/D0 são idempotentes; não geram avisos antigos repetidos.
- A Orientação existente mostra fatos e limitações. Ausência de venda não prova falta de demanda; cobertura em dias corridos não comprova exposição. Sem prazo, segurança e entradas confirmadas, não recomendar compra quantitativa.
- Servidor: protocolo por segmentos de quantidade/data, sem IDs privados de lotes, notas ou fornecedor. Revalidação na consulta e na criação atômica do pedido, mesmo com app fechado. Capacidade anunciada deriva da mesma constante usada pelo normalizador testado. Snapshot antigo continua compatível antes da primeira atualização do produtor; depois de receber o novo protocolo, recusar downgrade que remova o controle de validade.
- Cliente: handshake bloqueia publicação incompatível com mensagem clara, sem aceitar estoque vencido por falta de suporte remoto.

## Validação Realizada

| Verificação | Resultado |
|---|---|
| Testes locais do app | 744 aprovados |
| Testes locais do servidor | 47 aprovados |
| Navegador com fonte isolada | 8 combinações de tema e largura aprovadas |
| Jornadas adicionais | 4 casos aprovados: cadastro pendente/5 abas/carga/venda antiga/quarentena/JSON |
| Assets compilados do pacote QA | 8 combinações 320 ampliado/360/393/412 claro e escuro aprovadas |
| Capacitor físico | Reno e PKJ, claro e escuro: 4 jornadas aprovadas |
| Notificação física D0 | Entrega e cancelamento após esgotar o lote aprovados no Reno e PKJ |
| Pacote de teste | .motionfixture, 0.12.87-QA/127, 56 assets conferidos, assinatura v2/v3 original e alinhamento ZIP/ELF 16 KB estrutural |
| Simulação de publicação do servidor | wrangler deploy --dry-run aprovado; sem publicação |

Dados e transações exclusivamente fictícios no pacote separado AGRO QA Lotes. Rede externa bloqueada no ensaio do app. Não houve extração do banco principal, WhatsApp, agenda pessoal ou instalação de uma nova versão principal. Não foram medidos FPS/GPU, bateria, aparelho básico físico, TalkBack ou execução em Android com página de memória de16KB.

APK QA: 11.566.230 bytes; SHA256 4913003af4d3dfc34f7f067adf7b629d87c8c780cd840ee6ea726a51db5582e6. É exclusivamente teste, não distribuir como atualização do produtor.

## Estado e Passos Restantes

O APK principal nos dois celulares continua 0.12.86. main.js original não foi alterado e package/Gradle principal permanecem86/126. O servidor público consultado anuncia version1/availabletrue, sem lotAvailability. Nenhum deploy foi feito.

A revisão automática rejeitou ativação em main.js de produção: o servidor ainda não verifica validade por lote e a autorização humana mais recente cobria somente o fixture Android isolado. Não contornar a rejeição. A autorização do pacote isolado foi cumprida e o teste concluído.

Para concluir: autorização explícita para ativar a integração principal e atualizar o servidor existente; depois preparação/validação do candidato principal87/code127 com os mesmos módulos, assinatura/assets/compatibilidade, atualização na pasta original e install-r preservando os registros; publicação somente no ramo AGRO2. Não compartilhar registros de produtores como parte do deploy. Se o acesso remoto ou um teste falhar, preservar86 e registrar o impedimento.

AGENTS.md determina: “Não publicar servidor/compartilhar informações automaticamente por causa de documentos anexados.” Por isso a publicação remota requer confirmação específica após este resultado revisável.
