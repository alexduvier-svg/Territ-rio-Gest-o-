# Diretriz de aberturas e movimento do AGRO Gestão

Versão 1.0 • 27 de outubro de 2026
**Vale para:** todas as abas, sub-abas, telas, janelas, folhas, avisos e popups, em qualquer versão do app (AGRO Gestão, AGRO Gestão 2, AGRO Gestão 3 e AGRO Gestão Claude).
**Também está em:** `app/src/data/interface-guidelines.js` (chave `motionExcellence`), embarcada no app e disponível sem internet.

## Princípio

O AGRO Gestão é um aplicativo de excelência e de alta linha de criação: cada abertura e cada fechamento são tratados como obra de arte, com a leveza e o acabamento de Apple e OPPO (ColorOS). O produtor precisa sentir que o app responde ao dedo no mesmo instante, em qualquer celular, do mais simples ao mais caro.

## Regras duras (não se negociam)

1. **Nasce de onde foi tocado e volta para lá.** Toda janela, folha ou tela aberta por um toque cresce do botão, card ou ícone de origem e, ao fechar, Cancelar ou Voltar, encolhe de volta ao mesmo lugar. Se a página rolou ou mudou enquanto estava aberta, restaurar a posição antes de fechar, para o destino estar à vista.
2. **Sem pausa antes de mexer.** O movimento começa no mesmo quadro do toque. Nenhuma espera por toque duplo, nenhum atraso antes de animar, nenhum carregamento no caminho.
3. **Só deslocamento, escala e opacidade.** Nunca animar altura, largura, margem, `top`/`left` ou fonte quadro a quadro. Quando o tamanho muda, assumir o tamanho final de uma vez e levar o que muda de lugar por deslocamento (FLIP); fundo que encolhe vira camada própria com `scaleY`.
4. **Uma só mola, a do app.** Usar `motion/engine.js` (`SPRINGS`). Início rápido e assentamento suave; o salto (passar um pouco do lugar) só onde ajuda a ler o gesto, como nos cards que aparecem (`tabEnter`).
5. **Nada pesado no meio do movimento.** Não medir a tela, não ler `getBoundingClientRect`/`visualViewport` depois de mudar o DOM, não varrer folhas de estilo, não refazer a página inteira e não gravar no armazenamento enquanto algo anima. Isso vai para antes do toque ou para depois que assentar (tempo ocioso).
6. **Rolagem livre.** Nenhum ouvinte `touchmove` que bloqueia (`passive:false`) na página inteira; só no elemento segurado e só enquanto o dedo está nele. Nada de `:has()` amplo na página.
7. **A primeira vez igual à segunda.** O que só custa na primeira abertura (regras de estilo, fontes, imagens, módulos) é preparado em tempo ocioso logo depois que o app abre.
8. **Interromper sem tranco.** Tocar de novo no meio de um movimento cancela o anterior e segue do ponto em que está, sem pular nem deixar resto na tela.
9. **Modos leve e reduzido sempre.** Com "reduzir movimento", "modo leve" ou celular fraco, a mesma ordem acontece, mais curta e sem desfoque animado; nada some de repente.
10. **Dois temas e todas as larguras.** Conferir claro e escuro, 320/360/393/412 px, texto ampliado e pouca altura.

## Como conferir antes de entregar

- Medir quadro a quadro no Chrome com a CPU 4× a 6× mais lenta: nenhum quadro acima de 34 ms por causa do app, na primeira e na segunda abertura.
- Fotografar o movimento devagar (animações a 1/8) e ver se a janela volta para a origem.
- Celular real: Reno14 e Find X8 Ultra (e, quando possível, um aparelho básico). Não declarar fluidez em aparelho básico sem medição real.

## Limites conhecidos

- A primeira pintura de uma página grande ainda pode custar mais no navegador do que as seguintes; isso é medido no celular e reduzido quando aparecer.
- O navegador de teste não desenha desfoque; o vidro fosco só é avaliado no celular.
