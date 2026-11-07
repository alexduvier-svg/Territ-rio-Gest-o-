# Agro Gestão Teste 142 — insumos, fornecedores, nota fiscal e Pix

## Base e identidade

Base original: `codex/atualizacao-agro-gestao2`, commit `92d67bfae48243e0cfab2f61c7d69fe75df94490`, versão `0.12.142`, código 183. A antiga linha `0.12.142-teste.6` não foi usada como base.

Esta entrega é `0.12.142-teste.1`, código 184, nome **Agro Gestão Teste 142**, pacote separado `br.com.territorio.gestao2.teste142`. Instala ao lado do original e dos outros aplicativos de teste. Não atualiza nem exige desinstalar o original. O novo pacote possui assinatura própria preservada para suas próximas atualizações; nenhuma chave antiga foi substituída. APKs, chaves e credenciais ficam fora do Git.

## Interface original preservada

Permanecem a navegação Vender, Estoque, Clientes, Eventos e Gestão; os componentes originais de vidro, fontes, temas e janelas; e os cards de Gestão Operação, Análise e Decisão. Os seis arquivos visuais principais comparados com a base são idênticos, conforme o registro em `qa/test142-insumos-pix-fiscal-review.json`.

Na aba Estoque, o título abre Estoque para vendas, Estoque de insumos e Fornecedores. Os títulos maiores quebram entre palavras para permanecerem completos. As regras adicionais de estilo estão limitadas às funções novas e ao seletor do estoque.

## Insumos adaptáveis

Atividades livres, inclusive várias atividades no mesmo insumo. Nome, especificação, unidade livre, categoria livre e informações adicionais permitem trabalhar com café, doces, panificação, artesanato e outras produções. Ingredientes, embalagens e materiais iguais usam um único saldo, mesmo que atendam atividades diferentes. Não há cadastro automático de saldo pelas sugestões.

Entradas e usos são independentes do estoque de produtos prontos, das vendas e das despesas. Quantidades são representadas internamente em milésimos inteiros; uso acima do saldo, datas futuras e conversões que exigiriam arredondamento são bloqueados. Caixa/saco/pacote só converte com conteúdo informado pelo produtor. A janela mostra a conversão e o saldo antes de confirmar.

Lote e validade são opcionais no cadastro. Não foi criado um sistema completo de múltiplos lotes de insumos nem rastreabilidade anterior. Os campos não geram automaticamente custos ou baixa de receitas de produção.

## Compras e fornecedores

Reutiliza o cadastro e o histórico de compras já existentes. Registrar a compra não aumenta o estoque. O botão Receber como insumo vincula a compra ao material correspondente e registra apenas a quantidade efetivamente recebida. Compras novas iniciam com recebimento zero; compras antigas exigem conferência explícita do que já foi recebido, sem relançar esse saldo. O teste 100 / 60 / 40 confirma saldo 100 e pendência zero após o segundo recebimento.

Exige mesma unidade base e mesmo fornecedor. Recebimento não gera despesa nem modifica o custo de vendas passadas. Desconsiderar uma compra no histórico não desfaz fisicamente insumos recebidos; movimentos continuam no histórico para conferência.

## Nota fiscal

Gestão → Operação → Nota fiscal. Acesso às orientações oficiais de Nota Fiscal Fácil e Nota Fiscal Avulsa/SIARE em Minas Gerais. O serviço abre externamente por ação explícita, sem encaminhamento automático dos registros do app. A emissão depende do cadastro e das operações habilitadas no serviço oficial. O app não guarda senhas governamentais nem emite documento fiscal próprio.

Fontes oficiais usadas:
- https://portalsped.fazenda.mg.gov.br/spedmg/nff/
- https://www.fazenda.mg.gov.br/empresas/documentos_fiscais/nfa/nfaorientproced.html

## Pix local protegido

Ajustes → Minha chave Pix. Na finalização original, quando houver valor em Pix, aparece Gerar QR Code Pix. Em pagamento dividido, cobra somente a parcela Pix. O QR estático é produzido localmente no padrão BR Code, com valor e CRC; não consulta o banco nem confirma liquidação. O produtor precisa conferir o crédito no banco. A venda pode seguir pelo fluxo manual original quando não se usar o gerador.

O cadastro de chave e senha acontece em uma janela Android protegida contra captura; a senha não cruza a ponte JavaScript. O conteúdo recebe uma camada AES-GCM derivada da senha por PBKDF2 (210 mil iterações), com sal e IV aleatórios, e outra camada AES-GCM com chave autenticada do Android Keystore. A autenticação combina a senha do app com biometria forte por operação. Quando não há biometria forte compatível no cadastro inicial, usa confirmação do bloqueio do aparelho como segunda etapa; um cofre criado com biometria não é rebaixado silenciosamente para PIN.

Arquivo em `getNoBackupFilesDir()`, fora dos backups comerciais e do FileProvider. Limpar os dados ou desinstalar elimina o cadastro local. Isso não cancela a chave no banco. O QR e o código compartilhado contêm a chave de recebimento. Alterar valor, itens ou contexto invalida a cobrança; o conteúdo sensível em memória é limpo ao sair da janela ou colocar o app em segundo plano. Logs da ponte Capacitor estão desativados.

Sem senha de recuperação ou desbloqueio alternativo: perda da senha ou invalidação da chave pelo Android exige reconfiguração após limpeza dos dados e restauração do backup comercial. Não há promessa de limpeza remota automática do celular perdido.

## Peso e verificações

- Conteúdo web da base: 4.766.092 bytes; teste: 4.804.645 bytes. Crescimento: 38.553 bytes, cerca de 0,8%.
- APK final: 9.543.129 bytes; original histórico registrado: 9.390.897 bytes. Diferença aproximada: 1,62%. Comparação de artefatos, sem atribuir toda a diferença a uma única biblioteca.
- Não foram adicionados modelos de IA, sincronização contínua ou processamento permanente. Listas de insumos usam busca, filtros e paginação. O módulo só copia seu próprio conjunto de dados ao registrar alterações; preserva as demais estruturas do ERP.
- 1.247 testes JavaScript aprovados; cinco testes JVM novos de criptografia aprovados, além do teste JVM já existente.
- Navegador: 320, 360, 393 e 412 px, temas claro/escuro; cenário 320 com texto ampliado, modo leve e efeitos reduzidos. Sem rolagem horizontal nas áreas medidas e com novos controles principais de pelo menos 44 px.
- Build Android release e verificação vital de lint concluídos; assinatura v2/v3, CRC ZIP, alinhamento estrutural de 16 KB e os 58 arquivos web comparados byte a byte com o build.
- SHA-256 do APK: `faa22f4516e291c5fe459f64118ac17123ffa5e375dee6532fd61f540c7df514`.

Ainda precisam de teste no aparelho: prompts de digital e bloqueio do Android, comportamento do Keystore e da limpeza dos dados, leitura do QR pelo aplicativo bancário e desempenho em celular básico. Não foram medidos FPS, RAM ou bateria. A versão é destinada a teste, sem alegar validação em produção.

## Reprodução do build

No diretório `app`, com dependências do lockfile instaladas:

```sh
VITE_AGRO_TEST142=true npm run build
npx cap sync android
```

No diretório `app/android`, com JDK 21 e Android SDK 36 configurados:

```sh
gradle :app:assembleCodexTeste142Release :app:testCodexTeste142ReleaseUnitTest
```

Testes JavaScript: `node --test --test-concurrency=4 tests/*.test.mjs` dentro de `app`. O APK release precisa ser alinhado e assinado com a chave privada do pacote de teste. Os dois flavors mantêm identidade e esquema de links separados.
