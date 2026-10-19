# Premissas permanentes de interface — AGRO Gestão

Versão 3, atualizada em 19/10/2026. Aplica-se a todos os títulos, subtítulos, rótulos, controles e superfícies, inclusive em novas telas.

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
