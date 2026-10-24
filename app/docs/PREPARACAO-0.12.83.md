# AGRO Gestão 2 — Preparação 0.12.83

Status: APK pronto na pasta original e validado no computador. **Não instalado nos celulares**, conforme pedido para retornar entre 11h e 12h de 24/10/2026. Falta a conferência isolada no Reno14 e no PKJ110, nos dois temas, antes do adb install -r e da confirmação de inicialização fria do pacote definitivo. A 0.12.82 permanece nos aparelhos durante esta preparação.

## Cafés em Sugestões para Cadastrar

A matriz existente foi conferida e preservada: Especial, Gourmet, Superior e Tradicional, cada um em 250 g/500 g/1 kg, torra Clara/Média/Escura e formatos Moído/Em Grãos. São 72 combinações, sem atribuir espécie, cultivar, processo ou valores comerciais desconhecidos. A ordem de referência já aprovada foi mantida.

Foram acrescentadas 12 referências de Drip Coffee: 10 g, 250 g, 500 g e 1 kg em cada uma das três torras, formato Dose Individual. O peso é o conteúdo total declarado; não se deduz quantidade de filtros ou doses. O produtor confirma a embalagem. A referência genérica original mantém o ID e aparece na mesma família das novas apresentações.

Os cafés verdes Commodity agora oferecem espécie e variedade nos campos próprios: Arábica nas variedades Catuaí, Mundo Novo, Bourbon, Acaiá, Icatu, Catucaí, Topázio e Arara; Canéfora em Conilon e Robusta. Foram acrescentadas 9 referências específicas; as 2 referências genéricas originais de Arábica Verde/Conilon Verde são adaptadas apenas na leitura do catálogo, com IDs preservados. A cultivar da Arábica genérica não é presumida. Verde não recebe torra nem peso fixo. O campo de Torra é omitido quando Verde não tem valor; um valor histórico explícito permanece visível para revisão, sem ser apagado.

A varredura encontrou e corrigiu as buscas no plural por “cafés especiais” e “cafés tradicionais”. Os aliases de referência passam a localizar as famílias completas, sem modificar identidades comerciais ou produtos reais.

Total: 2.519 referências, sendo 2.479 da fonte original e 40 adições do app. Fonte empacotada original e SHA-256 preservados; 1.266 famílias normalizadas. Nada é cadastrado no negócio até o produtor confirmar. Catálogo não fornece preço, custo, estoque ou desempenho. Memória da interface 53, catálogo de estoque 5, conhecimento 1.0.5 e documento offline atualizados.

## Estoque e acabamento das páginas internas

A origem (espécie/variedade) e a apresentação (formato/peso/embalagem) eram forçadas à mesma linha 2 do grid. O conteúdo principal agora usa um grid interno com linhas automáticas distintas; o número, o aviso de zero e a seta ficam centralizados na altura do conjunto. A regra é comum a todos os cafés, sem alterar cadastros, saldos ou históricos. A QA reproduz a sobreposição com o CSS antigo no fixture e confirma a separação após removê-lo.

Entrada de Estoque, sugestões, escolha de apresentação e cadastro reutilizam `event-material-card`, o material usado no Histórico das Feiras. O material comum também se aplica aos painéis de subpáginas e janelas aninhadas. Foram preservados organização, campos, controles e navegação, com cores/bordas/relevo compartilhados. Não foram acrescentados desfoques, dependências, observadores, agendadores ou motores de movimento. Modo leve e redução de transparência mantêm as alternativas existentes.

Orientação ganhou seta no controle expansível existente. O alvo tem pelo menos 44 px; teclado e abertura/fechamento semântico continuam disponíveis. A rotação usa somente transform e respeita movimento reduzido.

## Validação concluída no computador

638 testes unitários passaram. Oito jornadas de navegador passaram nos dois temas, em 320 com texto ampliado/modo leve/movimento reduzido, 360, 393 e 412. Incluem regressões79–82: inicialização com revisão de cadastro pendente, cinco abas, fornecedores, catálogo, retorno seguro quando um render falha, siglas TC/TM/TE, 36 exemplos e isolamento do Modo Teste. Incluem também Drip, verdes, aliases plurais, geometria do Estoque, material compartilhado, seta com teclado e margens das janelas internas do guia e do histórico.

Quatro verificações complementares do carrinho com 3 produtos passaram (claro/escuro, 320 ampliado e 393). Os cinco meios de pagamento e Continuar Vendendo ficaram dentro da área disponível; alvos e margens foram conferidos. Duas inspeções visuais focadas em 320 ampliado confirmaram os cards, o café verde e Orientação nos dois temas. A expansão do Estoque foi conferida com ação de ponteiro e permanência aberta após o clique. Capturas são apenas do cenário fictício, sem publicação de dados de aparelhos.

Esta validação não é uma medição de FPS/GPU/bateria, TalkBack ou desempenho em celular básico físico. A conferência física dos dois aparelhos e a instalação permanecem pendentes por solicitação do usuário. Nenhum celular foi operado nesta preparação; nenhum banco real lido/copiado, venda real registrada, WhatsApp enviado ou agenda pessoal acessada. Clima, Firebase Spark/App Check, Calendar, servidor, identidade e dados reais preservados.

## Pacote preparado

Versão 0.12.83, código 123; pacote `br.com.territorio.gestao2`; 9.197.683 bytes; SHA-256 `ce873701f9fd5b080e8f5f96510f762bb99bd18f0141fe32a615fccd34a22143`. Certificado original `f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68`, assinaturas v2/v3. 50 arquivos web e 2 pontes nativas conferidos contra dist e fixture; ZIP/ELF de 16 KB estrutural verificado. Sem permissão de microfone ou GPS.

Cópia original com hash conferido: `C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.83.apk`.

Fixture isolado atualizado e compilado, ainda sem instalação. Ao retornar, executar `qa/run-catalog083-native.ps1` para Reno/PKJ nos dois temas. Depois de 4 relatórios aprovados, `qa/finalize-catalog083-validation.py` confere o mesmo hash e autoriza `qa/install-catalog083.ps1`. O instalador recusa prosseguir sem essa validação, preserva primeira instalação e exige os seis módulos no início frio. Não recompilar nem mudar versão apenas para instalar um pacote já preparado; se a QA física revelar falha, corrigir e revalidar antes de instalar.
