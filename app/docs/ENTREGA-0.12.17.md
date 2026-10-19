# AGRO Gestão 2 0.12.17 · code57

Versão validada e instalada no Android em 19/10/2026 às 19:51:27, preservando a instalação original e os dados. Pacote br.com.territorio.gestao2, assinatura original. Main é outra linha e não deve ser substituída.

## Lista solicitada

| Item | Resultado |
|---|---|
| 0 | Concluir produtos recolhe todas as opções da venda múltipla, inclusive a última, com resumos uniformes e só a quantidade em vermelho. |
| 1 | Nome e escolha de cliente na mesma linha; Estado e Carangola juntos; bairros de Carangola em escolha própria, sem município/bairro genérico na janela de Estado. |
| 2 | Dois toques no produto abrem seu estoque; orientação vermelha. Toque simples continua abrindo a venda; toque longo preserva seleção múltipla. |
| 3 | Cancelar no rodapé de criar evento. |
| 4 | ADIADO expressamente pelo produtor. A revisão geral das janelas de Gestão fica para outra consulta. |
| 5 | Após evento com esgotamento registrado, o produtor informa procura e estimativa de pessoas. Três feiras do mesmo grupo com observação sustentam sugestão de teste, sem inventar vendas/unidades. |
| 6 | Preparação mostra resumo da feira anterior: quantidade e valor dos mais/menos vendidos. Registros tardios entram pelo vínculo ao evento; horário de digitação não mede procura. |
| 7 | Excesso de quantidade informa exatamente o saldo disponível e preserva o valor anterior. Reservas de pedidos são consideradas na venda. |
| 8 | Loja por produtor, pedido sujeito a confirmação, reserva atômica, venda confirmada no carrinho, etapas de preparo/pronto/em rota/entregue, link privado e aviso WhatsApp revisado. Sem cobrança ou envio automático. Indisponíveis ficam sem compra. |
| 9 | Clientes não oferece criar evento. |
| 10 | Selecionar todos/específicos entre clientes com WhatsApp e consentimento; revisar texto e cada envio. |
| 11–12 | Editor dentro do app: nome/marca, história, fotos escolhidas ou câmera, montagem a partir dos próprios produtos. Salvar local é separado de Publicar. Sem conta em ferramenta externa nem IA paga obrigatória. |
| 13 | Histórico de eventos finalizados recolhido em superfície expansível. |
| 14 | Carga da feira com campos em volume, teclado numérico interno e rolagem do conteúdo; título e ações permanecem dentro da janela. |
| 15 | Expansões recolhem após 15s e terminam sua mola. Interação reinicia o prazo; edição ativa pausa o recolhimento e valores não são descartados. Não fechar uma janela inteira nem cancelar um formulário por tempo. |
| 16 | Eventos usa identidade do produtor no topo, sem seletor Loja. |
| 17 | + Produtos no lado direito da grade de pagamento; Outro continua disponível. |
| 18 | Venda registrada sem QR; Nova venda no rodapé acessível. PDF permanece opção de apoio. |
| 19 | Resumo realmente agrupa por categoria, preservando quantidades em suas unidades; sem links Ver cada venda, Análise completa na Gestão e Enviar WhatsApp. |
| 20 | Retorno do histórico Loja preserva movimento de página inteira e fecha a visualização dos valores na página de produtos. |
| 21 | “Houve algum custo a mais hoje?” com campo. Gasto entra em Finanças; confirmação pendente não duplica o custo. |
| 22 | Cinco apresentações por família, restante expansível na mesma ordem canônica do estoque. |
| 23 | Voltar no rodapé de Ajustes. Checkpoint persistente para retomada. |

## Pedidos posteriores

Gerente consolidado sobre o agente local existente: consulta geral e bloco “Especialistas consultados”. Finanças usa o demonstrativo canônico, estoque usa o modelo, feiras usam carga/conferência e clientes usam histórico com consentimento. Não foram criados múltiplos LLMs. Ver GERENTE-AVALIACAO-0.12.17.md.

Abas voltaram a expandir a partir do toque, com leve ultrapassagem e acomodação de mola. Painéis compartilham a física; rodapé fixo permanece estável. Modo leve usa expansão menor/amortecida e movimento reduzido continua respeitado. Sem clonar uma página inteira para trocar abas.

Cada instalação nova começa com dados de negócio vazios e contexto próprio. Demonstração é uma escolha explícita e não pode ser publicada como loja real. Apresentações são memorizadas após três entradas confirmadas; escolhas, feedback e observações pertencem ao produtor e acompanham os backups. Não é treino de um modelo de linguagem nem garantia de recomendações certas.

## Loja e disponibilidade

Infraestrutura é do aplicativo. O produtor não usa Cloudflare, chaves ou ferramentas de desenvolvimento; monta/publica/acompanha no AGRO Gestão. Cliente usa o link, sem conta. WhatsApp abre um rascunho por ação do produtor.

Vendas, estoque, memória e consultas essenciais funcionam offline. Receber pedidos/atualizar acompanhamento exige conexão. Mudanças do saldo sincronizam em primeiro plano; o servidor bloqueia novos pedidos após 30min sem disponibilidade atualizada. Estoque offline pode ficar defasado: pedido é uma solicitação, nunca uma promessa automática de estoque ou venda paga. Nenhum plano pago foi contratado e não se promete tráfego ilimitado em planos gratuitos.

Retirar a página exige concluir/recusar os pedidos ativos. Histórico local e vendas são preservados. Dados de entrega encerrados têm limpeza diária após 90dias no servidor; retirar uma loja concluída remove sua cópia do servidor. Os links de acompanhamento são privados; não são índice público de clientes.

## Validação e limites

285 testes do app + 15 do servidor passaram. Matriz com 53 verificações/36 superfícies nos temas claro/escuro, larguras320/360/393/412, texto ampliado e pouca altura. Resumo imediato da feira anterior revisado depois em5verificações/8superfícies com teclado. Regressão do agente4/4superfícies; voz8/4superfícies simuladas; gravação pendente1/1. A jornada de loja tem9verificações e usa dados fictícios em localhost, incluindo formulário do cliente, confirmação de venda, etapas e reinício. Portfólio13, painelorganizador10, feiras6, backup7 e SQLite11 passaram; verificações condicionais de chave do organizador não foram exercidas quandoKEY ausente.

Não houve transação de teste no aparelho real nem publicação de dados reais de produtor. Captura acústica, equivalência ao GPT Voice, FPS e desempenho em Android básico não foram medidos. APK verificado: pacote e assinatura originais, assets idênticos à compilação, alinhamento 16KB e versão confirmada pelo Android.

Servidor publicado e verificado: agro-gestao.agro-gestao.workers.dev, versão a0bc4495-141e-4daf-a80f-db26d63eb49b; capabilities respondeu version1/availabletrue. Sem publicar uma loja real automaticamente.

## Entrega local e Android

APK: `C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.17.apk`, 56.361.404 bytes. SHA256 `834c567df889161721ecbaa9fff8797c2443978b2546db9e572474129e351491`.

Instalado por Wi-Fi com `adb install -r`: versionName0.12.17/versionCode57, lastUpdateTime19/10/2026 19:51:27; firstInstallTime14/10/2026 18:17:06 preservado. Publicação de fontes limitada ao ramo codex/atualizacao-agro-gestao2; main preservado.
