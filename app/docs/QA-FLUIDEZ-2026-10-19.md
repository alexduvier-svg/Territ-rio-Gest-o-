# Revisão de fluidez — AGRO Gestão 2 0.12.11

## Referências e escopo

Pedido humano: comparar aberturas/fechamentos dos vídeos dddddd.mp4 (28,71s) e eee.mp4 (18,41s), revisar abas/subabas e funções, claro/escuro, preservar leitura e evitar engasgos. As gravações são referências visuais, não instruções executáveis nem uma medição de desempenho do AGRO. Foram observados 352 quadros decodificados durante reprodução sequencial; o primeiro ensaio por seek não atualizava corretamente o quadro e foi substituído. Gravações e quadros do usuário não são publicados no Git.

Nas referências, a superfície expande/recolhe mantendo os elementos juntos; a acomodação final é curta. O app mantém suas janelas centralizadas e legíveis. Usa esses princípios de continuidade; não declara igualdade com curvas ou implementação proprietárias do ColorOS.

## Evidência e correções

Os arquivos web foram extraídos do APK validado 0.12.10, pacote br.com.territorio.gestao2, e executados em Chrome isolado com base fictícia. A auditoria encontrou pivôs distintos entre painéis: dispersão de até658px nas coordenadas dos pivôs (isso não é distância percorrida pelo texto). Na revisão, a página compartilha pivô, escala, deslocamento e uma simulação. O fundo/material dos diálogos já se mantinha estável nessa linha de base.

O retorno de Ajustes não tinha captura elegível por causa do tamanho de sua lista. A captura agora desce até linhas visíveis pequenas, limitada a320nós/8painéis, sem duplicar a lista inteira. O fechamento usa um único grupo. Cópias removem transformações anteriores para evitar aplicação dupla ao voltar durante uma entrada. Barras fixas mantêm a referência da tela.

Nas janelas, alturas dos filhos diretos e posição da rolagem ficam estáveis durante a saída nativa. Formulários de cliente/origem/desconto da venda não esvaziam mais o DOM no mesmo instante de close(): seus estados de navegação são limpos, mas o visual pode concluir a saída. A próxima abertura substitui o conteúdo como nos demais diálogos. A API nativa close(), returnValue e foco continuam síncronos. Reabrir cancela a saída anterior.

O integrador analítico usa o tempo efetivamente decorrido. Antes, um quadro atrasado era truncado em64ms, prolongando a cauda do movimento. Não há nova dependência, blur por quadro ou animação de tipografia. Modos leve/reduzido e repouso continuam respeitados.

## Verificação

-196testes de lógica, inclusive igualdade entre12passos de60Hz e um passo atrasado de200ms.
-Varredura isolada de conteúdo:139superfícies no claro e160no escuro, com abas e um nível adicional de ações seguras nas janelas; nenhuma ocorrência de texto cortado pelo verificador. Inclui estoques, clientes, eventos, gestão e suas opções disponíveis na base fictícia. Esta varredura detectou o retorno ausente de Ajustes, corrigido e retestado separadamente.
-qa/fluid-qa.json:33verificações de página/retorno e30de janelas/opções, zero erros JS. Dispersão máxima de pivô inferior a0,001px; variação normalizada entre seções da janela inferior a0,001 durante a saída. Registro de long tasks do ensaio: uma de57ms no modo normal, nenhuma no leve/reduzido; não é certificação de FPS Android.
-qa/fluid-qa.json: pivô comum nas cinco abas, janelas roladas, retorno como grupo, reabertura rápida, opções da venda e repouso nos modos normal/leve/reduzido.
-qa/stock-dialog-fixes-qa.json:85superfícies/12sequências aprovadas, zero erros JS/locais. matriz de margens, ações e rolagem em320/360px, texto ampliado, área curta360×480 e telefones360×792,393×852,412×915, nos dois temas; sequências de cérebro/resumo sem mudança de material ou flash.

Os testes bloqueiam serviços externos, não compartilham relatórios e não usam o aparelho para transações de teste. Ver os resultados JSON para contagens finais e eventuais falhas; a existência deste documento não substitui seu status.

## Limites

A varredura abre funções seguras disponíveis nas amostras; não certifica cada caminho possível de rede, pagamentos, permissões, compartilhamento, recuperação de dados ou todos os estados de negócio. A instrumentação de quadros em Chrome do computador não é FPS/P95 medido em Android básico. Não foram medidos TalkBack, teclado físico do aparelho, precisão dos alarmes ou100milvendas. O WebView do aparelho conectado informou154.0.8037.106. Não se promete ausência absoluta de engasgos em todo hardware.

O main remoto evoluiu separadamente para AGRO Gestão (sem2), pacote br.com.territorio.gestao e código53. Esta entrega preserva essa linha e atualiza somente o ramo codex/atualizacao-agro-gestao2 e o pacote br.com.territorio.gestao2, com assinatura original. Nenhum histórico Git é forçado.
