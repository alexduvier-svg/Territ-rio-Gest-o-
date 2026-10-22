# AGRO Gestão2 0.12.61/code101 — validação final

## Lista em texto e captura manual

O usuário informou que o WhatsApp recebeu somente a legenda do envio por imagem da60. Os testes anteriores verificaram o seletor Android e o JPEG no cache; não comprovaram a entrega da imagem pelo WhatsApp. Diante do relato, o usuário autorizou retirar o envio automático de imagem e usar texto organizado, propondo também uma janela para captura manual.

Clientes passa a oferecer Enviar Lista em Texto e Enviar Clicável, mantendo Portfólio separado e a hierarquia anterior. A prévia HTML usa os controles, fontes, materiais e rolagem existentes. O produtor pode conferir os selecionados e usar a captura de tela do próprio celular. Lista longa exige rolagem; não se promete captura longa nem que todos os produtos caibam em uma imagem. O app não executa mais Canvas/JPEG/gravação de imagem/compartilhamento de anexo neste fluxo. Não precisa de ferramenta, pacote de ícones ou plugin externo adicional.

Enviar Texto compartilha o conteúdo real: marca, horário, nomes, apresentação, preço e disponibilidade, com símbolos das famílias e linhas separadoras. Os símbolos no texto são caracteres do sistema/WhatsApp; não são os vetores de contorno da interface. O app não controla a fonte, alinhamento justificado ou desenho do WhatsApp. A escolha do destinatário e a confirmação do envio continuam manuais. Não marca a mensagem como entregue, não cria pedido/venda/reserva automaticamente e não exige cliente cadastrado no AGRO. Navegador sem compartilhamento mostra texto selecionável/copiável.

## Seleção

Busca com separação de20px até Selecionar Tudo, agora checkbox com quadrado à esquerda, estado parcial e orientação Marque uma ou mais opções. A seleção considera os produtos disponíveis da busca, permite desmarcar e mantém escolhas fora do filtro. Mantém o limite24porenvio; caso Selecionar Tudo exceda esse limite, mostra explicação para filtrar/enviar em partes, sem selecionar só parte silenciosamente. Esgotados permanecem desabilitados. Preços e disponibilidade são revalidados antes de compartilhar; alterações exigem nova conferência. Regras de carga da feira, reservas locais/online do produtor, privacidade de saldo/custo e registros reais preservadas.

Vender continua sem ícones de família; Estoque mantém os contornos e a banana em cacho. Clima27, servidor59, motor de recolhimento60s e identidade AGRO2 preservados. Interface31/documento offline atualizados. Sem mudanças de servidor, nova permissão ou dependência.

## Verificação

463testes unitários do app passaram. Quatro jornadas de navegador: claro/escuro393normal e320ampliado/leve/reduzido, rede externa bloqueada. Busca/seletor/espaçamento, estado parcial, preservação ao filtrar, indisponíveis, prévia HTML, texto com nomes/preços/símbolos, revalidação e registros fictícios inalterados. Dois cenários2500produtos preservam limite60cards; seleção maior que24não é truncada silenciosamente. Rodapé e controles inteiros, rolagem e margens comuns.

PKJ nos dois temas PASS: prévia, controles, seletor Android e conteúdo completo do texto na chamada nativa, sem files/url. Reno permaneceu bloqueado e a espera normal expirou. Falta apenas a conferência no Reno após desbloqueio humano. Fixtures removidos e principais60reabertos; nenhum61instalado ainda. Nenhuma mensagem real enviada ou ERP principal acessado. Não afirmar entrega ao WhatsApp, FPS/GPU/bateria, aparelho básico físico ou TalkBack sem evidência. O texto real na chamada nativa será conferido além da simples abertura do seletor.

## Distribuição

APK5.198.327bytes,SHA256 `59927e1a13f81d9d781fffba54155a9f0f45d31d088adb3163c04bc9a7c1a428`, pacote br.com.territorio.gestao2,code101/0.12.61, mesmo tamanho total da60. Assinatura original v2/v3 e alinhamento16KB conferidos no build; verificação final de assets/cópia/instalação ainda pendente. Gitbase99c16a0/Claudecffe32b/main956fddc conferidos; publicar só no ramoAGRO2 autorizado. Não houve submissão à Play Store nem deploy do servidor.
