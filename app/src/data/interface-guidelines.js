// Local UI premises, separate from the producer's business knowledge and records.
export const INTERFACE_GUIDELINES = Object.freeze({
  version: 2,
  type: 'interface_premises',
  scope: 'Todos os títulos, subtítulos, rótulos, controles e superfícies do AGRO Gestão.',
  principles: {
    volume: 'Hierarquia por tamanho, peso e espaçamento coerentes com o sistema. Evitar excesso de negrito e relevo artificial nas letras.',
    nitidez: 'Texto legível e contrastante nos temas claro e escuro, sem desfoque ou brilho nas letras. Rótulos de formulário com pelo menos 14 px e suporte a texto ampliado.',
    estilo: 'Usar Inter e Inter Tight nos papéis já definidos e os tokens do app. Preservar a mesma linguagem de títulos, subtítulos e campos em todas as telas.',
    textura: 'Aplicar materiais e acabamento às superfícies. Texto mantém preenchimento nítido, sem gradiente, textura ou sombra decorativa.',
    profundidade: 'Criar profundidade com bordas, luz e sombras discretas nos painéis e controles, mantendo baixo custo de renderização.',
  },
  motion: 'Abertura e fechamento contínuos, com expansão curta e mola discreta. Não trocar o material durante o movimento. Respeitar modo leve e movimento reduzido.',
  windows: {
    placement: 'Janelas de informação e edição abrem centralizadas, com espaço real nas laterais e acima/abaixo, sem ocupar a tela inteira.',
    scrolling: 'Altura limitada ao espaço disponível. Conteúdo longo rola dentro da janela, sem cortar títulos, letras ou controles. Rodapé e ações devem caber e quebrar linha quando necessário.',
    material: 'Seguir o tema atual, claro ou escuro. Fundo externo atenuado e superfície com acabamento liquid glass discreto; texto sempre nítido. Evitar desfoque vivo em superfícies densas durante o movimento.',
    consistency: 'Cérebro, resumo do dia, gestão, clientes, estado, estoque e demais janelas compartilham margens, rolagem, profundidade e física de abertura/fechamento.',
    adaptation: 'Adaptar ao espaço útil, resolução e escala, incluindo aparelhos de 6,3, 6,5 e 6,8 polegadas. Conferir larguras de 320, 360, 393 e 412 px, texto ampliado, pouca altura e teclado aberto. Nenhuma ação, inclusive Enviar no WhatsApp, pode ficar cortada ou inacessível.',
  },
  validation: 'Conferir claro e escuro, largura de 320 px, texto ampliado, contraste, quebra de linha e fluidez antes de entregar mudanças de interface.',
  document: 'knowledge/premissas-interface.md',
  performanceReference: {
    name: 'Regras_Janelas_Desempenho_Agro_Gestao.docx',
    sourceSHA256: 'da54797e48782e57a281d24515c232c6eb1dc23a75007cd26cfbedba980844e0',
    status: 'Referência recebida; matriz completa e desempenho em aparelho básico ainda não verificados.',
  },
});
