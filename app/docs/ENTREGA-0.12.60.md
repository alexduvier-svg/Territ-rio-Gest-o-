# AGRO Gestão2 0.12.60/code100 — entrega técnica concluída

## Enviar ao Cliente

Em Clientes, Enviar ao Cliente aparece antes de Pedidos e Entregas. Enviar por Print e Enviar Clicável são ações separadas. Portfólio continua em seção própria; Outras Formas de Envio tem respiro e opções secundárias recolhidas. Clientes a $ Receber mantém a prioridade anterior.

Print reúne os produtos selecionados em uma imagem, com nome, apresentação, preço, disponibilidade, marca e horário do registro. Não exige fotos e não exporta saldo físico, custo, clientes ou movimentos internos. Usa apenas cadastros próprios ativos com preço; desconsidera o catálogo de sugestões. Respeita carga ainda alocada à feira, reservas locais e pedidos online conhecidos do mesmo produtor. Produtos indisponíveis ficam desabilitados. O envio revalida preço e disponibilidade: produto esgotado volta à seleção; mudança de preço exige conferir uma nova prévia antes de compartilhar.

A imagem é estática e usa o estoque registrado no aparelho, identificado pelo horário. Não promete disponibilidade futura nem chegada de novos pedidos offline. Gerar a imagem não reserva estoque, cria pedido ou registra venda. O cliente responde no WhatsApp; o pedido clicável continua no outro botão. Destinatários são escolhidos manualmente no compartilhamento Android/WhatsApp, sem exigir cadastro no AGRO. Não há API paga de mensagens nem envio autônomo a contatos. No navegador sem compartilhamento de arquivos, baixa a imagem.

Seleção limitada a24produtos por envio, seis por imagem, até quatro imagens para manter legibilidade e memória limitada. Um único Canvas900px de largura por vez, JPEG, liberação da superfície entre páginas e dos objetos de prévia ao fechar. Arquivos temporários ficam no cache privado e os antigos são removidos após24h no próximo envio; Android pode descartá-los antes. Nenhuma nova dependência, permissão ou biblioteca de fotos foi adicionada.

## Desenhos e interface

Desenhos originais de contorno por família, em SVG no Estoque e com os mesmos caminhos no Canvas. Poucos vetores atendem às apresentações do catálogo e a futuros cadastros, com fallback por categoria. Sem2000bitmaps, download de pacote ou animação contínua. Posicionamento no espaço livre existente, recuo de10px, prioridade para texto e alerta de reposição; sem espaço, o desenho é ocultado. Dimensões dos cards e três colunas preservadas.

Refinamento humano durante a conferência: Vender fica sem os desenhos de família, mantendo o aviso/símbolo de reposição já existente. Banana foi redesenhada como cacho, evitando a aparência de lua. O rodapé da prévia usa Compartilhar em linha inteira e Mudar Produtos/Voltar lado a lado, sem recorte. Tema, material, fontes e movimentos comuns preservados.

## Recolhimento

Motor comum de expansão ociosa em60segundos. Abrange details, configurações do produto, dias/vendas, clientes, histórico de eventos, seletores com aria-controls, bairros e limites de listas. Prazos seguem seções semânticas mesmo após redesenho; interação reinicia a contagem correspondente. Digitação/edição em andamento suspende o recolhimento, preservando os valores. Os formulários e janelas completos não são fechados automaticamente. Cronômetros são suspensos ao ocultar o app, sem consulta contínua. Reutiliza as ações e movimentos existentes para recolher. Memória de interface30 e documento offline atualizados.

## Verificação

459testes unitários do app passaram. Quatro jornadas de navegador: claro/escuro393px normal e320px ampliado/leve/reduzido, sem rede externa. Verificaram hierarquia, impressão, revalidação, indisponíveis, registro de negócios inalterado, dimensões dos cards, recuo dos desenhos, ausência de desenho em Vender, botões inteiros,60s sem perder edição, liberação de prévia e2500produtos respeitando o limite de60cards. Seleção de24produtos gerou quatro imagens nos dois temas.

Quatro jornadas Capacitor finais passaram: Reno14/CPH2737 ePKJ110, nos dois temas. Confirmaram seletor oficial Android, JPEG no cache, estoque/preço revalidados, registros sintéticos inalterados, dimensões dos cards, Vender sem desenhos e botões inteiros da prévia. Nenhum destinatário selecionado e nenhum WhatsApp real enviado. Nenhum dado do ERP principal acessado, transação real de teste ou envio a pessoas. Sem medição de FPS/GPU/bateria, aparelho básico físico ou TalkBack; modo leve em navegador não comprova desempenho em aparelho básico.

## Distribuição

APK5.198.327bytes, SHA256 `c9722fea7f662cf1085aa3297d04da800e54637cb11f04e3383d348ec4ae2056`; pacote `br.com.territorio.gestao2`,code100/0.12.60, certificado original `f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68`, assinatura v2/v3 e alinhamento16KB.41assets idênticos a dist e ao fixture final, sem GPS/microfone/voz. APK completo aumentou8.192bytes(0,158%) em relação à59; módulo de desenhos4.723bytes de fonte(aproximadamente2,4KB gzip), sem pacote externo. O aumento do APK mede a entrega inteira, não somente os ícones. Não equivale a medição de FPS ou bateria. Clima27, servidor59 e identidade preservados; nenhuma mudança/deploy no servidor ou submissão à Play Store nesta entrega. Git consultado no início, integração e antes de publicar: referência Claude cffe32b/main956fddc preservados, publicar somente codex/atualizacao-agro-gestao2.


Cópia original `C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.60.apk` conferida por SHA256. Instalado com `adb install -r` em22/10/2026: Reno14 às15:23:50 ePKJ às15:23:58,code100/0.12.60 e abertura Statusok; firstInstallTime preservados (Reno21/10às18:58:01;PKJ14/10às18:17:06). Fixtures removidos. Não repetir build, verificador, cópia, instalação ou deploy por este registro. Implementação commit/push `3cd18ce22585d726b8c5f1e7ccff3222bc65bd6c` confirmados no remotoAGRO2; worktree limpo antes do encerramento documental. Nenhuma pendência autorizada restante.
