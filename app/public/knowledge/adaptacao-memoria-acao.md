# Adaptação, memória e ação — versão 1

Referência offline das diretrizes de 21/10/2026 para telas pequenas e aparelhos com recursos limitados.
É conhecimento de consulta: não autoriza vendas, baixas, envios ou compras.

## Objetivo

O produtor vende, consulta e repõe estoque, acessa clientes e recupera o trabalho em tela pequena e em
celular de menor desempenho, sem perder nem duplicar registros.

## Uma política central

Um só serviço (`features/adaptation/policy.js`) decide, separadamente:

- **Janela:** abaixo de 360 dp estreita; 360–599 compacta; 600–839 média; 840 ou mais ampla; altura
  abaixo de 480 dp compacta. Texto ampliado numa janela compacta conta como estreita.
- **Efeitos:** completo, leve ou reduzido. O app mede os próprios quadros nos primeiros movimentos e liga o
  modo leve sozinho se o aparelho não acompanhar; a medida é refeita a cada 7 dias. Menos efeitos e
  reduzir movimento prevalecem.
- **Carga:** padrão ou leve (economia de dados ou aparelho limitado): uma tarefa pesada por vez e cache de
  imagens menor.

Nunca pela marca ou pelo processador (Snapdragon, Exynos, MediaTek, Unisoc, Apple) por si só.

## O que o modo leve tira e o que nunca tira

Tira desfoque, sombras pesadas e animações decorativas. Nunca tira preço, indicação de gravação,
validação de quantidade, acesso ao carrinho ou áreas de toque.

## Tela

Alvos de toque de pelo menos 48 × 48 dp; letras e preços não encolhem para caber — quebram linha e rolam;
nada de nome, peso, unidade, quantidade ou valor cortados; Concluir sempre acima do teclado.
A grade de Vender mantém três colunas (regra do produtor); em cartão estreito o nome quebra depois da
primeira palavra.

## Memória

RAM serve às telas e pode ser liberada; registros (vendas, movimentos, documentos, consentimentos e
ações pendentes) ficam no armazenamento e nunca são apagados para economizar. Caches (clima, miniaturas,
análises) podem expirar.

## Motor de ação

Intenção → validação → identificador estável → comando persistido → transação → resultado → interface.
A mesma chave de operação vale para novos toques e tentativas; a venda só é confirmada depois que o
disco confirma. Prioridade: venda e reposição → consulta visível → sincronização → relatórios.

## Pendências

Início frio, gravação de venda e memória em aparelho básico; massa de 2500 produtos e 10000 vendas;
encerramento no meio da gravação; páginas de 16 KB; TalkBack e fontes de 150 % e 200 %; iPhone.
