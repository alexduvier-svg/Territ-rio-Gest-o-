# AGRO Gestão 2 — Entrega 0.12.79

O Reno iniciava apenas parte da interface: Vender podia ficar vazio e Clientes, Eventos, Gestão e Estoque permaneciam com componentes anteriores, sem Fornecedores. O erro vinha de quatro referências a uma variável inexistente, introduzidas na alteração 0.12.77. Um cadastro de produto pendente durante a abertura acionava esse caminho e interrompia os instaladores seguintes. A causa foi confirmada no app principal do Reno com diagnóstico técnico local, sem ler ou copiar o banco de dados.

## Correção e comportamento

- As quatro referências agora usam o produto do próprio contexto: lista de vendas, produtos já cadastrados, sugestões de nomes e revisão de possíveis duplicidades.
- A navegação monta o HTML antes de retirar a página anterior. Se a montagem falhar, mantém os mesmos elementos e o estado anterior; a alternância Estoque/Fornecedores também desfaz seu estado temporário. A transição continua usando o motor existente, sem clonar a página.
- TC, TM e TE têm espaço próprio junto ao nome nos cards de vendas, sem ficarem escondidos pelo limite de linhas. Três colunas, dimensões dos cards e temas foram preservados. O estoque mantém a informação junto ao nome.
- Campos já registrados como Clara/Média/Escura, Torra Clara/Média/Escura ou TC/TM/TE são reconhecidos explicitamente. Produto sem torra continua sem classificação: conforme a escolha do usuário, o produtor deve editar cada café e selecionar sua torra real. Não foi criada torra padrão nem alterado histórico.
- O diagnóstico de inicialização registra somente fase técnica, tipo do erro e posições dos arquivos do próprio app; a confirmação final registra seis indicadores booleanos de módulos. Não inclui mensagem de exceção, produto, cliente, valor ou credenciais; não envia dados pela rede.

## Validação

625 testes unitários e oito jornadas no navegador passaram, nos dois temas e larguras 320 (texto ampliado, modo leve e movimento reduzido), 360, 393 e 412. Quatro jornadas Capacitor passaram, claro e escuro no Reno 14 e PKJ110, com dados fictícios em pacote separado.

A regressão inclui um cadastro com revisão pendente renderizado DURANTE a inicialização, reproduzindo o caminho que faltava nos testes anteriores. Foram conferidos os seis módulos, as cinco abas, fornecedores, telas atuais de eventos, gestão/orientação, histórico de vendas, sugestões de cadastro, siglas visíveis, escolha manual da torra e retorno após falha simulada na montagem de página. Saldos, preços, custos, vendas e movimentos fictícios permaneceram preservados.

Após instalar o APK final, o app principal foi iniciado a frio nos dois aparelhos. O registro AGRO.UI confirmou agent, motion, workflows, events, suppliers e training iguais a true: Reno às 20:53:14.894 e PKJ às 20:53:16.220 de 23/10/2026. A interface principal do Reno foi inspecionada para diagnóstico; o cadastro pendente foi preservado. Não foram lidos ou copiados bancos, criadas transações reais ou enviadas mensagens WhatsApp. Capturas privadas da interface real não foram publicadas e foram removidas. O ensaio extra por UIAutomator não concluiu (processo Android encerrou o dump); a cobertura das cinco abas nos dois temas corresponde ao pacote isolado, além da confirmação de inicialização no app principal.

Não foram medidos FPS, GPU, bateria, TalkBack ou aparelho básico físico. A verificação de alinhamento ZIP/ELF de 16 KB é estrutural, sem ensaio de execução em dispositivo de páginas de 16 KB. Não se promete fluidez ou desempenho absoluto.

## Instalação e integridade

Versão 0.12.79, código 119, pacote `br.com.territorio.gestao2`. APK com 9,193,587 bytes e SHA-256 `ceeeb21d47a903e10faabcbb9586ee14d19297fceb93233ddf1a132de47d1c76`. Certificado original `f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68`, assinaturas v2/v3, 50 arquivos web e duas pontes nativas conferidos contra a compilação e o pacote de teste, alinhamento ZIP/ELF de 16 KB. Sem permissão de microfone ou GPS.

Cópia conferida em `C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.79.apk`. Instalações com `adb install -r`, sem reset:

- Reno14 (CPH2737): atualização 2026-10-23 20:52:24; primeira instalação preservada 2026-10-21 18:58:01; abertura confirmada.
- PKJ110 (PKJ110): atualização 2026-10-23 20:52:30; primeira instalação preservada 2026-10-14 18:17:06; abertura confirmada.

Pacotes de teste, capturas temporárias dos aparelhos e encaminhamentos ADB próprios removidos. Identidade do AGRO Gestão 2, dados de cada aparelho, clima, servidor de pedidos, Firebase Spark/App Check e calendário preservados. Não foram copiados dados de negócio entre celulares. Publicação somente no ramo AGRO2 autorizado; Claude e main preservados.

Implementação publicada no ramo `codex/atualizacao-agro-gestao2`, commit `8294bee1b972552ace0766b2a4be68ef6cf3faf8`, com hash confirmado no remoto. O pedido posterior de classificar os cafés existentes depende da torra real informada pelo produtor; nenhuma classificação foi inventada ou aplicada aos cadastros reais nesta entrega.
