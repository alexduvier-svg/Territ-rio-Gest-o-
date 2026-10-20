# AGRO Gestão 2 — 0.12.20/code60

O toque em um produto abre a Venda imediatamente. Antes havia uma espera deliberada para distinguir o duplo toque, somada à preparação de cópias da tela. O segundo toque físico no mesmo ponto ainda consulta o saldo exato: somente uma prévia de venda intocada pode ser desfeita. Seleção longa, carrinho, estoque e registros de negócio são preservados.

## Motor de movimento

O motor comum aplica posição, escala e opacidade pelo Web Animations API. A trajetória da mola é calculada uma vez e entregue ao compositor do navegador. Não há recorte recalculado por quadro, cópia completa de página ou leitura de estilo de cada descendente antes de iniciar. A abertura anima os painéis reais com um mesmo pivô; o retorno retém e move os nós originais, mantendo teclado, rodapé, texto e material juntos. O Android explicita aceleração de hardware; a disponibilidade efetiva depende do WebView e do aparelho.

Subjanelas usam o mesmo mecanismo, preservando o pai e sua rolagem. Reversões mantêm posição e velocidade; uma recarga do conteúdo durante a abertura continua a trajetória. O fechamento conserva o conteúdo original mesmo quando uma função antiga limpa imediatamente o diálogo. Camadas temporárias e animações são liberadas ao terminar. Ícones físicos pequenos e a pressão dos botões mantêm suas simulações leves; não são apresentados como computação gráfica nativa de todo o aplicativo. Os modos leve e de movimento reduzido permanecem ativos.

O alcance é TODAS AS ABAS, subabas e janelas aninhadas, nos temas claro e escuro, por integração central do motor. Material, contraste, margens, rolagem, profundidade e degradê discreto aprovados anteriormente são preservados. Premissas permanentes de interface passam à versão 7, separadas da base comercial.

## Venda, estoque e Ajustes

Na compra múltipla, cada confirmação fecha a seção e avança; na última aparece Ver resumo. Os três produtos ficam recolhidos e o Carrinho só então é habilitado. Confirmar pelo Enter também funciona. Digitação de múltiplos dígitos não é encerrada por temporizador. Reabrir uma quantidade bloqueia novamente o Carrinho até confirmar; quantidade superior ao saldo disponível continua impedida.

Cada família do Estoque tem seu próprio + à direita, como Cafés e Bananas. O seletor abre no contexto daquela família, permitindo repor ou cadastrar outra variedade. O cadastro de produto novo continua sem categoria marcada automaticamente. Esta orientação posterior substitui a antiga regra de + único. Permanecem três apresentações visíveis por família e a seta para expandir as demais. A grade de Produtos continua em três colunas compactas.

Os contadores Em dia/Baixo/Esgotado foram medidos com a mesma base e recuo. Numerais lineares/tabulares e altura de linha explícitos mantêm a tipografia consistente. A logo oficial do AGRO Gestão aparece junto da versão em Ajustes, usando o próprio recurso já embarcado, sem novo download.

## Validação

- 302 testes unitários passaram, incluindo continuidade da mola, reversão e descarte do compositor.
- 96 checagens de interface em 16 configurações: claro/escuro, 320/360/393/412 px e texto normal/ampliado.
- 174 sequências de movimentos nos modos normal, leve e reduzido: cinco abas, Venda, Ajustes, Estoque, reposição, histórico, entrada, calculadora, clientes, eventos, aparência, resumo e cérebro/guia/tópico.
- 36 checagens aprofundadas em quatro configurações: compra múltipla, cliente/estado/bairros, quatro níveis de diálogo, identidade dos nós, atualização durante o movimento, limpeza imediata do conteúdo, alinhamento, logo e + contextual.
- 12 checagens de resumo diário/escopo em quatro superfícies e 15 de gestos, catálogo local, pedido, reserva e vínculo com a venda. Os testes usam somente dados sintéticos; nenhum envio real de mensagem ou transação de teste no aparelho.

Na fixture com CPU quatro vezes mais lenta e 12/120 produtos, a primeira resposta observável da Venda no DOM passou de 422–519 ms para 89–156 ms; o caminho quente ficou em 15–27 ms. As leituras de estilo passaram de 139–571 para 1. São medidas de navegador isolado, sujeitas ao ambiente; quadros frios ainda podem atrasar. A tentativa de captura sob bloqueio de JavaScript não produziu evidência conclusiva; não é usada para afirmar desempenho físico.

O ensaio físico isolado por CDP não concluiu a comunicação de forma confiável. Auxiliares e túneis foram removidos e o app devolvido ao primeiro plano. Não há FPS Android básico, equivalência nativa Apple/ColorOS ou ausência absoluta de engasgos comprovados.

## Entrega

APK release 5.095.628 bytes, pacote br.com.territorio.gestao2, versão 0.12.20/code60, mesmo certificado original v2/v3, alinhamento 16 KB. Todos os 38 arquivos públicos conferem byte a byte com o build final. Sem voz, modelo ou permissão de microfone.

SHA256: d27a5973f5a69ded6b344abf45004e5235d2ce581a4ffcdcc15c742dd1b6c912.

Cópia idêntica na pasta original como AGRO-Gestao-2-0.12.20.apk. Instalação adb install -r confirmada em 2026-10-20 14:00:55; Android confirmou versão 60/0.12.20 e abertura Status ok. firstInstallTime 2026-10-14 18:17:06 preservado. Fontes, testes e evidências publicadas somente no ramo codex/atualizacao-agro-gestao2; main independente preservado. Lista em ARQUIVOS-0.12.20.md.
