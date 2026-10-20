# AGRO Gestão 2 0.12.18

Atualização de Produtos, Estoque, material visual e catálogo local. APK assinado e instalado em20/10/2026 às09:17:20, preservando os dados e a instalação original.

## Interface e movimentos

Material comum em áreas, seções, janelas e subjanelas: superfícies com profundidade, plano de vidro e contraste claro/escuro; texto opaco e nítido. Reflexo curto acompanha o toque e se encerra; pressão usa mola existente, sem blur ou sombra recalculados a cada quadro. Navegação tem entrada direcional por aba (Vender entra da esquerda), mola discreta e ícones físicos preservados. Modos leve e movimento reduzido respeitados. Não equivale ao compositor nativo Apple/ColorOS nem é medição de FPS em Android básico.

Produtos segue as imagens3/4: título e ações compactas, pill Loja com olho que apenas alterna visibilidade; toque no valor abre vendas. Sem microfone, busca ou pills de categoria na home. Cada variação tem card próprio com nome, condição, medida/unidade e preço reais. Ordem por categoria/família/apresentação/medida física; blocos não misturam famílias na sobra da linha. Três colunas quando legíveis; duas em320px e texto ampliado. Sem estoque continua legível e em sua posição.

Um toque prepara a venda; segurar seleciona até três; dois toques mostram saldo exato em consulta compacta, incluindo saldo zero. Não registra venda nem altera carrinho na consulta. Aviso vermelho retirado. Shift+Enter/Menu de contexto oferece consulta por teclado. Estoque usa o mesmo material e ordem, primeiras cinco apresentações e restante expansível.

Voz retirada da execução e do APK: sem registro do plugin, permissão RECORD_AUDIO, Vosk/JNA ou modelo de reconhecimento empacotados. Fontes históricas e dados existentes preservados para eventual retomada explícita.

## Catálogo e pedidos no aparelho

Entrada em Clientes: Catálogo e pedidos. Preparar catálogo, Pedidos e entregas e Importar resposta em evidência. Marca/fotos opcionais em detalhes; mensagem para vários clientes e loja online anterior preservadas. Nenhum novo servidor, API de WhatsApp ou IA remota é obrigatório neste fluxo. Loja anterior não foi apagada nem publicada automaticamente.

Catálogo usa IDs estáveis das apresentações e cópia dos preços, sem custos, margens ou saldo interno no arquivo. PDF AcroForm real, sem JavaScript, com seleção, quantidade, nome, recebimento e observações; alternativa por texto/código curto. PDF gerado/lido em Worker local para preservar a interação. Limites:150apresentações por oferta,8MB e30páginas na importação,20s de processamento. Nome/unidade/preço no próprio PDF. A prévia abre o arquivo real em leitor compatível, e compartilhar usa documento binário/URI content com permissão temporária. O produtor escolhe destino e conversa.

Resposta por PDF/texto/manual abre conferência; nome no PDF não comprova identidade. O produtor confirma cadastro do cliente, quantidade/unidade, recebimento, preço atual e frete. O total é mostrado antes da reserva. Divergência de preço fica explícita; esta versão usa o preço atual confirmado para manter o motor de vendas único. Arquivo corrompido/protegido/achatado não produz reserva silenciosa; há alternativa por texto.

Reserva e venda compartilham o saldo central. Pedido não é pagamento; converter pelo carrinho consome estoque físico uma vez. Reimportação idêntica abre a conferência anterior; nova gravação do arquivo é vinculada por catálogo/cliente e só revisa com confirmação explícita. Revisar quantidades ajusta apenas a diferença disponível; cancelar libera uma vez; etapas preservam histórico e não reaplicam baixa. Reservas locais também reduzem a oferta enviada à loja online já existente, quando ativada; sem internet não se promete sincronismo global instantâneo.

Acompanhamento horizontal no APK: Confirmado, Em preparo, Pronto, Em rota ou Disponível para retirada, Concluído. Horários reais do aparelho. Avançar e avisar salva etapa/aviso pendente antes de abrir a composição. Atualizar sem avisar, corrigir e cancelar são ações explícitas. Ao voltar do WhatsApp, aviso permanece pendente até Enviei no WhatsApp; isso é declaração do produtor, sem prova de entrega/leitura. PDF enviado não muda de etapa.

Dados locais acompanham o backup já existente. Não há upload automático novo; perder aparelho sem backup perde dados locais. Não foram enviados avisos nem criadas transações no celular do produtor para testar.

## Referências e validação

Vídeos1.mp4 e2.mp4 analisados por quadros locais; imagem3/4 e DOCX/MD anexados orientam layout e fluxo, sem importar exemplos como dados reais. Referência oficial do link: [Meet Liquid Glass — Apple](https://developer.apple.com/videos/play/wwdc2025/219/), em especial resposta ao toque, luz e material coerente. Técnicas locais: [PDF-LIB AcroForm](https://pdf-lib.js.org/docs/api/classes/pdfform), [Android documentos](https://developer.android.com/training/data-storage/shared/documents-files), [compartilhamento Android](https://developer.android.com/training/sharing/send).

293testes do app passaram. PDF multipágina com54campos terminais e54widgets, aparências válidas; preenchimento/salvar/reabrir/importar mantém ID e quantidade da última página. Matriz inicial25verificações/16superfícies em claro/escuro393px e texto ampliado320/412px passou, incluindo retorno de arquivo real, revisão, duplicação e reinício. Ver relatóriosQA finais após congelamento. Auditoria de dependências de produção: zero vulnerabilidades reportadas.

Limites: percurso completo WhatsApp entre dois aparelhos/leitores reais ainda não executado. Compatibilidade AcroForm depende do leitor; prévias de chat podem ser estáticas. Não declarar medição de FPS, desempenho de aparelho básico ou validação acústica. O fluxo local não mostra uma página remota sincronizada para o cliente.

## Resultado final de validação

293 testes de unidade PASS; matriz25verificações/16superfícies PASS em claro/escuro e texto ampliado; gerente4/4PASS; gravação pendente1/1PASS;78sequências de movimento PASS nos dois temas em normal/leve/reduzido, incluindo reversão rápida e retorno de subjanelas. Teste final8verificações/4superfícies PASS sobre assets finais, incluindo resposta por linguagem natural reaproveitando o parser local existente. Não se trata de FPS medido em Android básico.

APK de5.091.532bytes (aproximadamente5,1MB, anterior56,4MB), pacote br.com.territorio.gestao2/code58, certificado original.38assets correspondem à compilação; sem bibliotecas/modelo de voz e sem permissão de microfone. SHA256 `14a3a4a3bf7178d19b770a2506b7516598b038dd8e938e8d02b810679316d221`. Cópia conferida em `C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.18.apk`. Atualização por adb install-r: versão0.12.18/code58 e lastUpdateTime20/10/2026 09:17:20 confirmados; firstInstallTime14/10/2026 18:17:06 preservado.

A interface e os fluxos foram exercitados no Chrome desktop em fixtures isoladas. No Android17 do produtor, atualização e abertura do app foram confirmadas. O APK auxiliar de testes URI/WebView compilou, porém sua instalação não concluiu em duas tentativas; as instalações auxiliares foram encerradas e o pacote de teste não ficou instalado. Portanto os testes instrumentados não foram executados no aparelho. Não houve transação fictícia na base real. Leitor externo e ida/volta WhatsApp entre aparelhos continuam sem validação.

Para reproduzir os testes instrumentados em ambiente próprio: instalar dependências do app, executar `node qa/catalog018-files.mjs`, copiar o PDF preenchido para `app/android/app/src/androidTest/assets/catalog-fixture.pdf` e `app/node_modules/pdf-lib/dist/pdf-lib.min.js` para a mesma pasta, compilar o APK de testes com certificado compatível e executar somente DocumentsInstrumentedTest e CatalogWebViewInstrumentedTest. Assets de teste são gerados, não pertencem ao APK de produção.

A reserva de pedido entregue permanece ativa enquanto não houver venda explícita; entrega não devolve disponibilidade ao estoque. Registrar depois pelo carrinho consome o saldo uma vez. Correção coberta por teste de unidade. Subtotal de produtos e frete são exibidos separadamente no pedido; o carrinho registra a venda dos produtos, sem lançamento financeiro automático do frete.
