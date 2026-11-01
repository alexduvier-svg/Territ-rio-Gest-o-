# AGRO Gestão — evolução do Codex Teste

**Estado: implementação parcial verificada em código; entrega Android não concluída.**

Referência da sessão: 31/10/2026, horário de Brasília. Não há novo APK gerado, assinado ou disponibilizado nesta sessão. A versão 0.12.142-teste.6/código 183 é uma configuração candidata, não uma entrega instalável.

## 1. Base identificada e preservação

Repositório: `alexduvier-svg/Territ-rio-Gest-o-`.

A última entrega instalável localizada é `Codex_Teste_0.12.139.apk`, pacote `br.com.territorio.gestao2.codexteste`, versão 0.12.139-teste.3/código 180. O arquivo disponível tem 37.456.955 bytes e SHA-256 `eb415a62c75514f0af6c39f10a759719af7f6055d50ed2ee0968d50fe9ed05f7`. O tamanho e o hash foram calculados novamente e coincidem com `qa/codex-teste-ia3-validation.json`, já presente no commit de origem:

`4e7fb28e451f98cc0b73b0a52a05be6778098968`, da branch `codex/gerente-local-preview`.

Também foi conferido o APK 138, de 37.035.726 bytes, SHA-256 `7c3e7c6f8b7291919cfa79ee1913552fce827ed4c944c4c3a8fc49cf33ebe479`. Os certificados extraídos dos blocos de assinatura v2 dos dois arquivos são iguais. A extração/comparação do certificado não substitui uma nova validação criptográfica completa por apksigner.

A branch experimental avançou depois para código 141, mas o histórico registra falha na entrega desse APK e não foi localizado seu arquivo instalável. Ela não foi escolhida automaticamente como base. Nenhuma alteração posterior à entrega 139 foi mesclada automaticamente. Somente os arquivos de licença do Qwen, já existentes no checkpoint posterior, foram reaproveitados como documentação de terceiros.

Nova branch: `codex/agro-gestao-teste-evolucao`, criada exatamente a partir do commit 139 acima. Foi criado ainda `codex/preservado-apk-139-4e7fb28`, que continua apontando para esse commit. A identificação imutável é o SHA do commit; não foi configurada proteção administrativa contra movimentação da branch de preservação.

Referências históricas conferidas e não modificadas:

| Linha | Branch | Commit |
|---|---|---|
| Codex 136 | `codex/atualizacao-agro-gestao2` | `78edfb5e2a44fc0819e5cf904420d4cb5f85c535` |
| Experimental posterior | `codex/gerente-local-preview` | `5b37c4119650dcbfbc9e55a523a916a485603eff` |
| Principal | `main` | `956fddceec2b994e32c154c5197424a4f56df7f2` |
| Claude no repositório territorial | `claude/agro-gestao3` | `22e38139aa091364b5bc0048e639bdad68caea4e` |
| Claude, repositório próprio | `agro-gestao-claude:claude/agro-gestao-claude` | `4a15376e31589d01dc1aa645a243513e82dd3a06` |
| Principal do Claude | `agro-gestao-claude:main` | `f03317b116730f968fd1aebe778db91755d0029f` |

Não houve exclusão de repositórios, versões, branches, tags, APKs ou dados. Não houve force push, reset destrutivo, instalação ou desinstalação de aplicativos. O projeto do Claude permaneceu intacto.

## 2. Commits de desenvolvimento

1. `ead4309723ee8b6aeeca95108e94fb4834f51930` — gestos, validação do carrinho e pesquisa de entradas, com a integração de interface.
2. `76cdda9ea09986f1c13d678cef579659b79f6e0c` — recebimentos parciais e vínculo com movimentação canônica.
3. `63f04f831dd580cd3916ab86c6c20b031899c8bb` — consultas compostas, alerta de compras, registro dos adaptadores e testes.
4. Commit posterior de fechamento — corrige o escopo das integrações da interface, configura a candidata 142 e registra estas evidências. Consultar o histórico da nova branch para seu SHA definitivo.

Os commits intermediários não são versões entregues. O erro de escopo encontrado no fechamento foi corrigido e a inicialização da interface foi executada novamente no teste DOM.

## 3. Os nove ajustes

| Item | Código preparado | Evidência e pendência |
|---|---|---|
| 1. Gestos | Reativado o módulo que espera resolver o gesto antes de abrir a venda. Duplo toque consulta estoque; seleção mantém até três itens e pode restaurar sua lista. Rolagem e cancelamento descartam o toque pendente. Atalho de teclado para estoque preservado. | Testes do controlador com relógio controlado passaram. Gestos físicos Android e acessibilidade por leitor de tela ainda precisam de teste. |
| 2. Entradas | Pesquisa no histórico existente e no Gerente. Lê movimentos iniciais/reposições, quantidades, datas, apresentação e fornecedor quando registrado. Não usa compromissos de compra como saldo físico. | Testes de origem, duplicação, datas, nomes e fornecedor passaram; entrada disponível no DOM real do histórico. Apresentação atual é identificada como recurso de fallback quando não foi preservada historicamente. |
| 3. Carrinho | Corrigida a condição em que a marca de seleção múltipla permanecia bloqueando um carrinho reduzido a um produto. Quantidades/descontos e identificação original da operação são mantidos. | DOM: três produtos reduzidos a um, editar, continuar comprando e retomar habilitaram os botões. Testes de rodadas e idempotência existentes passaram. Matriz de pagamentos/cancelamentos em Android ainda pendente. |
| 4. Português | Corrigidos texto de confirmação e cabeçalho com codificação incorreta do registro do motor. Novos textos em português brasileiro. Varredura de `app/src` não encontrou sequências típicas de mojibake ou caractere de substituição. | Revisão linguística integral de todas as telas ainda não concluída. Dados e nomes inseridos pelo produtor não foram reescritos. |
| 5. Fornecedores | Compra nova registra recebimentos com identificação própria, comprado/recebido/pendente, datas e situação. Recebimento parcial permite confirmação separada de entrada no estoque por `ERPModel.move`, na mesma cópia transacional do ERP. | Testes de 100/60/40, reinício/repetição, excesso e vínculo inválido passaram; formulário real executado no DOM. Históricos antigos exigem conferência explícita da quantidade já recebida e não geram reposição retroativa. |
| 6. Duplicidades/indicadores | Consultas reutilizam `finance.productMargins`, `rankProductRows`, `kpi.periodChange`, os demonstrativos e as regras existentes. Nenhum estoque ou banco de indicadores paralelo foi criado. | Auditoria integral de todos os indicadores e possíveis redundâncias ainda pendente. O reaproveitamento de motores não comprova por si só ausência de todas as divergências do aplicativo. |
| 7. Posição da Inteligência | A entrada de pergunta aparece imediatamente depois de Receita por dia e aciona o mesmo Gerente. Orientações e preferências continuam acessíveis. | Presença única da entrada e posição relativas passaram no DOM. Aparência, molas e legibilidade ainda precisam de conferência visual. |
| 8. Inteligência integrada | Adaptador local para estoque, entradas, vendas/devoluções, compradores identificados, CNPJs documentados, ranking por apresentação, compras/recebimentos, produtos parados e comparação de receita por demonstrativos. Consulta composta de peixes/quantidade vendida/CNPJs usa o mesmo filtro. Clima usa o módulo existente e seus limites. | Testes de pergunta composta, unidade, custo ausente e devolução por data passaram. Cobertura de linguagem continua limitada. Perguntas complexas de calendário/eventos pedem consulta à área ou seleção da feira. Não existe garantia de compreender qualquer frase, e dados ausentes não são preenchidos pelo modelo. |
| 9. Proatividade/Qwen | Compra com entrega esperada vencida e quantidade pendente entra no motor existente de prioridades, dispensar/adiar e revisão. Qwen preservado; arquivo, hash, runtime e proteções existentes foram auditados no código. Licença/NOTICE incluídos. | Não houve inferência real, teste de memória, desempenho ou aquecimento no aparelho. Qwen continua selecionando trechos de respostas determinísticas; não foi transformado em interpretador irrestrito. |

## 4. Fontes, cálculos e limites

A consulta opera sobre as tabelas originais do produtor. Quantidades de unidades diferentes permanecem separadas. Vendas e devoluções são consideradas em suas próprias datas. Lucro usa custo histórico conhecido; custo ausente não vira zero. CNPJs sem documento registrado são explicitamente excluídos da contagem de documentos distintos, com indicação das vendas sem identificação suficiente. Não se trata de verificação cadastral externa de CNPJ.

O ranking implementado classifica os produtos com atividade no recorte. Produtos sem vendas não entram nessa classificação, e isso consta da resposta. Meses comparados são identificados; a resposta avisa que o atual pode estar incompleto e que o anterior compreende o mês completo. Não afirma causa ou tendência.

Compras históricas preservam a fonte `supplierBook`. Receber uma compra não cria despesa nem altera custo de vendas passadas. O lançamento físico exige confirmação separada. Insumos sem produto vinculado podem registrar recebimento sem criar produto ou estoque vendável.

A consulta direta tem limite de tamanho para histórico conjunto. A implementação ainda precisa de medição em celulares modestos; não há garantia universal de fluidez. Demonstração continua identificada e separada. Os ensaios usaram apenas dados sintéticos locais.

## 5. Qwen auditado

Qwen3-1.7B INT4, LiteRT-LM 0.18.1. Arquivo esperado: 977.184.032 bytes; SHA-256 `2a72330b504a6596d53a2c00923c57173b10f1b83e6a541213ffec08d1fc5de8`. A documentação de origem registra revisão `d6678881da6181864bbc893c80e10aa1ee0d3731` e licença Apache 2.0. Nenhum outro modelo foi instalado.

A variante herdada é arm64. O código usa CPU com dois threads e contexto 2048 e recusa execução com memória disponível inferior a 3 GiB, pouca memória, economia de energia ou aquecimento relevante. Estes são limites configurados; não são medidas obtidas nesta sessão. As consultas determinísticas continuam disponíveis sem o modelo.

A entrega 139 não contém pesos; reutiliza o modelo já preparado na instalação anterior. O arquivo de pesos não está disponível neste ambiente. Não foi preparado AAB completo para publicação na Play Store.

## 6. Testes e evidências

- **860 testes automatizados de domínio passaram**, sem falhas ou testes ignorados. Incluem 14 cenários novos em `app/tests/evolution.test.mjs`.
- **6 verificações DOM passaram** em `qa/evolution-dom.mjs`: inicialização da interface, carrinho reduzido e retomado, posição da pergunta, pesquisa no histórico, formulário de recebimento parcial e chamada ao Gerente pela Gestão.
- **Compilação web passou**. Permanece o aviso sobre tamanho de alguns bundles. Não se afirma que houve redução de memória ou melhoria de FPS.
- `git diff --check` passou.
- O ensaio Playwright está em `qa/evolution-browser.mjs`, mas **não foi executado**: o navegador não estava instalado e sua obtenção terminou em arquivo truncado. Isso está registrado como bloqueio, não como aprovação visual.
- Não houve teste físico Android, instalação, inferência real ou compilação Android nesta sessão. SDK/ambiente Android não foi estabelecido para a compilação; antes disso, a assinatura compatível permanece bloqueada.

Evidências: `qa/evolution-validation.json`, `qa/evolution-dom.json` e `qa/evolution-browser.json`.

## 7. Bloqueio da assinatura e do APK

Certificado público dos APKs 138/139:

`2fb95cc1aa0aaf55ae607941e666099b81be35196f4dbbda6d99d45fd1346ef0`

O único keystore localizado foi `Codex_Teste_IA_assinatura.jks`, de 2.682 bytes. Seu certificado é:

`b1b8f2c74ebbb75adb5de6abfca5f740bfbf9c3d2b02a0ce8479338e45670c86`

São chaves distintas. O arquivo disponível pertence à experiência IA posterior e não permite atualizar o pacote 139 instalado. A chave privada original 139 não foi localizada; o certificado público não permite reconstruí-la. Nenhum keystore foi publicado no Git, nenhuma chave nova foi gerada e nenhuma instalação foi apagada ou substituída.

Foi preparado `.github/workflows/codex-test-android.yml`, de acionamento manual e restrito à nova branch. Ele exige a chave original e confere seu certificado antes de compilar exclusivamente CodexTeste, testar e verificar o APK. Interrompe sem gerar chave se as credenciais estiverem ausentes. O fluxo não foi executado nem validado no GitHub Actions. Segredos esperados: `AGRO_CODEX_TEST_KEYSTORE_B64`, `AGRO_SIGNING_STORE_PASSWORD`, `AGRO_SIGNING_KEY_ALIAS` e `AGRO_SIGNING_KEY_PASSWORD`. Nunca colocar seus valores em commits, issues ou relatórios.

## 8. Pendências para concluir a solicitação

1. Recuperar a chave privada original 139 e suas credenciais, ou obter autorização expressa para uma distribuição separada com outro identificador. A chave já disponível da experiência IA não foi utilizada como substituição silenciosa.
2. Completar a revisão linguística e a auditoria de indicadores; ampliar e verificar os caminhos de interpretação ainda limitados.
3. Executar a matriz visual e Android: gestos, seleção, todos os meios de pagamento, cancelamentos, múltiplos produtos, recebimentos, histórico, perguntas e operações offline.
4. Medir inferência e uso de recursos no Android quando o Qwen estiver disponível.
5. Compilar e assinar a nova branch, verificar pacote/versão/certificado/integridade e registrar o commit efetivamente compilado.
6. Disponibilizar o APK verificado para download no celular. **Esse link ainda não existe.**

Não há instrução de instalação de uma versão nova neste momento. Não desinstalar, limpar ou substituir o aplicativo anterior para contornar o certificado. A entrega só poderá ser declarada concluída depois de existir um APK verificável e das validações pendentes.
