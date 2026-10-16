# AGRO Gestão 2 0.13.1

Registro histórico de uma numeração de teste anterior (código Android 44). A sequência posterior foi consolidada em 0.12.x; a versão atual usa código 49. Decisões visuais abaixo podem ter sido substituídas nos changelogs posteriores.

Revisão instalada como atualização do pacote br.com.territorio.gestao2, com a assinatura original e código 44. A data da primeira instalação foi preservada.

Vender possui três colunas nos estilos Feira e Clássico. O rodapé recebeu fundo mais opaco e uma pílula baixa envolvendo ícone e nome, conforme a última referência, com tonalidade própria nos temas claro e escuro. Estoque recebe uma maçã que cai na caixa, Clientes troca as pessoas de posição e Gestão anima as barras por molas.

Janelas abrem a partir do controle tocado, expandem com mola e recolhem ao fechar. A troca de conteúdo de uma janela aberta também recebe transição; digitar na reposição não a reinicia. Páginas internas usam conteúdo em fluxo, mantendo barras fixas ancoradas, e uma cópia inerte durante a saída. Acordeões e listas expandem e recolhem com altura física. Redução de movimento e modo leve são respeitados.

A revisão foi verificada em 136 telas e janelas sem erros JavaScript ou overflow, além da matriz 360/375px, Feira/Clássico e claro/escuro. Os três ícones foram exercitados por cliques reais no navegador. A reposição apresentou acomodação máxima de aproximadamente 0,95% de escala, e os clones de saída foram removidos ao repousar. O fechamento nativo, foco e retorno de valores foram preservados.

O APK release tem depuração desativada, assinatura v2/v3 válida e todos os 32 arquivos web idênticos ao dist. No aparelho foram confirmados versão 0.13.1, abertura, grade em 3 colunas, tema claro e aba Estoque. A reposição e a varredura abrangente foram verificadas na prévia compilada; o celular mudou de tela durante a navegação manual.

Código em src/features/motion, src/motion.css, src/glass.css e src/selling-grid.css; integração em src/main.js, src/features/interface.js e hooks centrais de src/legacy/erp-ui.js. A chave original permanece no projeto anterior e não foi copiada para esta entrega.

Compilação reproduzível neste computador: executar qa/build-final.ps1 na pasta pai; o script usa SDK local, runtime fornecido e a chave existente. O build temporário do módulo Android fica na pasta de visualizações para evitar bloqueios de cache pelo OneDrive.
