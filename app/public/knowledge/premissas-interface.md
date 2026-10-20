# Premissas permanentes de interface — AGRO Gestão

Versão 5, atualizada em 20/10/2026. Aplica-se a todos os títulos, subtítulos, rótulos, controles e superfícies, inclusive em novas telas.

- **Volume:** hierarquia coerente por tamanho, peso e espaçamento. Não simular volume com excesso de negrito ou relevo nas letras.
- **Nitidez:** leitura clara e contraste nos temas claro e escuro. Sem blur ou brilho nas letras. Rótulos de formulário com pelo menos 14 px, respeitando texto ampliado.
- **Estilo:** manter Inter e Inter Tight nos papéis e tokens já usados pelo sistema. Não inventar tipografias isoladas por seção.
- **Textura:** acabamento pertence às superfícies; letras preservam preenchimento limpo, sem gradientes ou sombras decorativas.
- **Profundidade:** bordas, luz e sombras discretas nos painéis e controles. Preservar desempenho em celulares mais simples.

Abertura e fechamento usam expansão curta e física contínua, com leve acomodação de mola, sem trocar material durante a animação. Respeitar modo leve, Reduzir efeitos e movimento reduzido do sistema.

Janelas de informação e edição abrem centralizadas, com margens reais nas laterais, no alto e embaixo. O conteúdo longo rola dentro de uma altura limitada; a janela não ocupa a tela inteira. Títulos, textos e botões não podem ficar cortados. Ações do rodapé precisam caber ou quebrar linha, inclusive Enviar no WhatsApp. O cérebro e os relatórios acompanham o tema claro/escuro escolhido. O fundo externo é atenuado e o material tem acabamento liquid glass discreto, sem blur nas letras nem custo alto de desfoque durante a animação. Verificar pouca altura e teclado aberto, além das larguras e fontes habituais.

O padrão deve funcionar em celulares de 6,3, 6,5 e 6,8 polegadas. A diagonal não substitui a área útil: considerar resolução, escala, barras do Android e tamanho de fonte. Conferir larguras lógicas de 320, 360, 393 e 412 px e adaptar a altura disponível, preservando margens, rolagem e acesso às ações.

Antes de entregar, conferir claro/escuro, largura de 320 px, texto ampliado, contraste, quebras de linha e fluidez. Cor de destaque não substitui hierarquia tipográfica. Em Valores e estoque, os quatro rótulos de preço, custo, estoque inicial e estoque mínimo usam vermelho com contraste adequado; valores digitados mantêm a cor de texto do sistema.

Esta premissa também está instalada na memória local `interfaceGuidelines` e acompanha o modelo salvo e seu backup. É orientação de interface, separada de produtos, saldos, vendas e conhecimento financeiro.

Referência de desempenho recebida: `Regras_Janelas_Desempenho_Agro_Gestao.docx` (SHA256 da54797e48782e57a281d24515c232c6eb1dc23a75007cd26cfbedba980844e0). Suas metas são propostas de engenharia, não resultados medidos. A matriz completa, o histórico ampliado e um aparelho físico básico continuam sem validação nesta revisão visual.

Revisão 3: páginas usam uma única simulação e pivô comum para manter os cards coesos. Janelas conservam as alturas das seções e a posição rolada durante a saída. Não animar fontes, sombras ou desfoque por frame. Finalizar a animação quando o app fica inativo; respeitar modos leve e reduzido.

Revisão 4: incorporar o comportamento aprovado no APK de referência0.12.14: a janela nasce do card/ícone e retorna inteira à origem. Em uma subjanela, a origem é a linha da janela anterior. A tela anterior recua; a superfície em movimento mantém texto, material e posição rolada. Navegação entre abas sem abertura de card mantém uma mola curta e comum. Respeitar o movimento reduzido e simplificar acabamento no modo leve.

Todas as áreas, seções, janelas e subjanelas usam material comum de vidro, volume e resposta ao toque. Reflexo curto na superfície; nenhuma animação ociosa. Temas claro e escuro são critérios obrigatórios. Cards de venda identificam cada variação com nome, condição, peso/unidade e preço reais; sequência por família/apresentação/medida crescente em grade contínua, sem reservar linhas incompletas para cada tipo. Manter três colunas de cards compactos na venda, inclusive em tela estreita. Com texto ampliado, permitir altura natural, sem cortar informações. No Estoque, mostrar três apresentações da mesma família e uma seta para expandir as restantes. Manter o botão + inferior à direita, sem duplicar no cabeçalho. Voz retirada por escolha do produtor.


Premissa v7: motor comum de compositor em TODAS AS ABAS, subabas e subjanelas de qualquer profundidade. Mover superfícies reais, sem clonar páginas ou recalcular recortes por quadro. Preservar velocidade em reversões e acomodação de mola, continuidade quando conteúdo recarrega e os modos leve/reduzido. Venda no primeiro toque, duplo toque reverte apenas prévia intocada. Validar os dois temas e medir sob carga; aceleração disponível depende do WebView/GPU, sem promessa universal de FPS.

Pedido posterior de20/10: cada seção/família do Estoque tem seu próprio + à direita para adicionar outra variedade. Supera a regra anterior de +global único. Limite de três itens por seção permanece; cadastro novo continua sem categoria automaticamente marcada. Logo oficial junto da versão em Configurações, nos dois temas.

Premissa v8: o Estoque mantém também um + geral junto do relógio no cabeçalho, para entrada rápida de produtos de qualquer família, sem filtro prévio. Os + contextuais de cada seção continuam. Cabeçalho pode quebrar em duas linhas em telas estreitas; título e botões permanecem íntegros e a lupa no canto direito.

Premissa v9, correção posterior: Estoque e os quatro botões permanecem sempre na mesma linha. Ordem: +, Relógio, Calculadora, Lupa. O + geral fica antes do relógio. Supera a permissão anterior de duas linhas; ajustar tamanho do título e espaçamento sem cortar texto ou reduzir os controles de 40 px. Os + das famílias continuam.

Premissa v10: 1 toque abre Finalizar Venda com 1 unidade padrão; 2 toques selecionam até três produtos; 3 toques consultam o estoque exato. Só reverter a prévia intocada; preservar rascunhos/quantidades/pagamentos editados. Nenhum gesto conclui a venda. Em Organizar produtos, segurar e arrastar salva a ordem visual individual das vendas no modelo e backup, com cancelar/restaurar família e alternativa por setas. Isso não modifica o agrupamento do Estoque. Nova instalação começa sem ordem personalizada. Rodapé grafite no escuro/branco no claro, discretamente translúcido e com base protegendo a leitura. Aviso de cancelamento curvo, texto nítido e material discreto nos dois temas.

Premissa v11: normalizar nomes dos produtos existentes e novos com inicial maiúscula em cada palavra (Queijo Meia Cura), sem modificar IDs/saldos. Preços com base alinhada por fileira e espaço consistente para moeda/valor, mantendo três colunas. Tempo em Loja e Eventos via MET Norway e referência municipal IBGE, sem GPS; cache local/servidor, crédito CC BY 4.0, idade dos dados e ausência de valores tratados explicitamente. Não enviar dados de negócio; não interpretar previsão como chuva realmente ocorrida, acurácia comprovada ou causa de vendas menores.
