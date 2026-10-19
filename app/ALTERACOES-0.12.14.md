# AGRO Gestão 2 — 0.12.14 / código 54

Integra a abertura e o fechamento aprovados pelo produtor no APK 0.12.14 fornecido, mantendo a base funcional do AGRO Gestão 2 0.12.11.

- A janela nasce da forma e posição do card/ícone tocado e retorna inteira para ele. O conteúdo não se desfaz no trajeto; o desaparecimento acontece ao chegar à origem.
- Páginas de venda, cadastro e ajustes também usam uma superfície visual única, sem deslocar a âncora das barras fixas reais.
- Subjanelas crescem da linha tocada na janela anterior. Ao voltar, o pai reaparece na posição rolada e a subjanela se recolhe por cima dele.
- Fundo atenuado com desfoque fixo e discreto no modo normal; modos leve/reduzido simplificam ou retiram esse acabamento. Texto e superfícies preservam tema e contraste.
- Mantém as melhorias da 0.12.11: física acompanha tempo efetivo dos quadros, fallback das abas com pivô comum, alturas/rolagem estáveis na saída e opções da venda sem apagar o visual no close.
- Contagem de elementos antes de clonar evita duplicar uma lista grande para depois rejeitá-la. Sem novas dependências.
- Inclui o espaçamento seguro acima de Voltar na página Venda, presente na referência. Premissas de interface revisão 4 instaladas no modelo/backup.

Identidade preservada: br.com.territorio.gestao2, nome AGRO Gestão 2 e assinatura release original. Não importa configurações de depuração, assinatura, produtos ou dados do aplicativo de referência. Publicação somente no ramo codex/atualizacao-agro-gestao2. main e o aplicativo sem 2 permanecem independentes.

Ver docs/INTEGRACAO-MOVIMENTOS-0.12.14.md para origem, comparação, verificações e limites.
