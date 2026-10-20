# AGRO Gestão 2 — 0.12.19/code59

Correção da grade de Produtos, organização do Estoque, movimentos e Resumo do dia, a partir dos pedidos e referências de 20/10/2026.

Produtos usa uma grade contínua de três colunas compactas. A sequência de categorias, famílias, apresentações e pesos é mantida, preenchendo a próxima posição disponível; não há linhas vazias reservadas para cada tipo de café ou banana. Cada card conserva seu ID, nome, apresentação e preço. Café, banana, queijo e salame compartilham face, borda, profundidade e resposta ao toque, inclusive quando há indicação de estoque zerado. O botão da seleção múltipla mostra apenas “Continuar”.

Estoque mantém seções por família. O pedido posterior de três produtos visíveis por seção prevalece sobre o limite anterior de quatro: o restante fica sob uma seta expansível. Há um único botão +, junto da primeira seção à direita, também disponível no estoque vazio; o cabeçalho usa Relógio, Calculadora e Lupa, nesta ordem. O plano de vidro ao redor de Em dia/Baixo/Esgotado e das famílias ganhou contraste de fundo, borda e profundidade.

O acabamento segue a referência a21.mp4/a22.jpeg: degradê, aresta iluminada, volume arredondado e translucidez discreta nos dois temas. As janelas de leitura usam um material mais firme para que nomes e preços da tela de trás não se confundam com seu conteúdo. Vendendo em e as listas antigas acompanham a paleta atual. Editar produto, Histórico e as demais ações de rodapé têm rótulos centralizados; linhas de seleção conservam alinhamento próprio.

O retorno reduz a superfície inteira até a origem, mantendo conteúdo, teclado embutido e máscara estáveis, em vez de apagar faixas de informação. Subjanelas preservam o pai rolado. A geometria de abertura é medida depois de terminar a montagem síncrona do rodapé. A reposição aberta por um card da Entrada de estoque mantém a lista atrás, evitando duas animações simultâneas. O efeito de toque preserva a posição absoluta/fixa de controles flutuantes, incluindo o olhinho. Foram retirados filtros de desfoque vivo sobre a tela inteira e sobre cópias em movimento; mola, modos leve/reduzido, material e resposta ao toque continuam ativos. No modo leve, a troca de páginas usa uma expansão curta e coesa, evitando capturar centenas de estilos para uma cópia da página; janelas conservam seu retorno inteiro.

A primeira carga do catálogo offline de 2.480 apresentações agora é preparada em pequenas tarefas, permitindo quadros e entrada do usuário entre elas. O índice completo é publicado de uma vez: consultas não recebem um catálogo parcialmente montado, e o carregamento continua compartilhado entre chamadas simultâneas. Não há nova dependência ou serviço online.

## Resumo do dia

A janela reúne as vendas registradas no dia, de todos os locais. O total diário usa o mesmo motor financeiro: vendas, devoluções pela data de devolução, taxas e custos registrados; contas fixas mensais continuam na Gestão. Quando há atividade de evento, cada seção contém seu subtotal, quantidade de vendas, categorias, recebimentos e produtos:

- Nome do evento e horário previsto: início incluído, término excluído, seguindo a janela de venda já usada pelo app.
- Fora do horário do evento: identifica o evento e mostra os registros anteriores ao início ou a partir do término.
- Loja e demais locais: suas próprias seções, sem atribuir uma venda a um evento só pela coincidência de horário.

Exemplo: em uma feira das 09:00 às 14:00, o registro às 09:00 entra na seção da feira e o das 14:00 entra em Fora do horário. Usa o horário salvo, em Brasília; uma venda anotada depois pode aparecer fora do intervalo. Os vínculos e registros originais são preservados. Devoluções usam seu horário de registro e os subtotais reconciliam com o total diário. O olhinho oculta os valores de todas as seções. Custos adicionais mostram o local em que serão lançados. A janela mantém margens, rolagem interna e Voltar acessível.

## Validação e entrega

Validação concluída: 299 testes unitários; 96 checagens de interface em 16 configurações (temas claro/escuro, 320/360/393/412 px, texto normal/ampliado); 174 sequências de movimento nos modos normal, leve e reduzido; 12 checagens de resumo/escopo em quatro superfícies; quatro cenários de carga do catálogo. Relatórios e testes compact019 em qa usam somente dados sintéticos isolados. Os testes de carga mantiveram quadros e respostas à entrada durante a preparação dos 2.480 registros. A simulação com CPU quatro vezes mais lenta ainda registrou tarefas pontuais de 70–146 ms na primeira abertura; não é evidência de ausência absoluta de engasgos em qualquer aparelho.

APK release de 5.091.532 bytes, pacote br.com.territorio.gestao2, versão 0.12.19/code59, certificado original v2/v3 e alinhamento 16 KB conferidos. Todos os 38 arquivos públicos empacotados conferem byte a byte com o build final. SHA256: d220cdfcdbc1bf60c119a3a72518dcc7c726ec2fba7b161e8714d7f5bb9374e7. Sem modelo/plugin de voz ou permissão de microfone.

Cópia idêntica confirmada na pasta original como AGRO-Gestao-2-0.12.19.apk. Instalação com adb install -r concluída em 20/10/2026 às 12:26:02; Android confirmou versão 59/0.12.19, abertura com Status ok e firstInstallTime de 14/10/2026 às 18:17:06 preservado. Fontes e evidências de QA publicadas somente no ramo codex/atualizacao-agro-gestao2; main é uma linha independente. Lista da alteração em ARQUIVOS-0.12.19.md.

Desempenho de WebView/Android básico e equivalência ao compositor nativo Apple/ColorOS não são garantidos por testes de navegador. Não foram criadas transações de teste na base real do aparelho.
