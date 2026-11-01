# Codex Teste 145 — comparação Qwen e Gemini

Entrega para **avaliar os modelos**, sem declarar resolvida a compreensão geral do Gerente. O Gemini online permanece no laboratório nesta versão. Não foi conectado automaticamente aos registros reais.

## APKs para Android

Versão **0.12.145-teste.1**, código **187**, compilação de **01/11/2026**. Pacote `br.com.territorio.gestao2.codextesteia`, Android 8/API26 ou superior. Mesma assinatura IA dos APKs 143/144, certificado SHA-256 `b1b8f2c74ebbb75adb5de6abfca5f740bfbf9c3d2b02a0ce8479338e45670c86`.

| Edição | Tamanho | Conteúdo e download |
|---|---:|---|
| Comparação leve | 36.160.781 bytes | [Baixar APK](https://chatgpt.com/library?file_id=libfile_fa31881a5e608191b5194afd222711bc&account_id=personal). Reaproveita o Qwen 0.6B privado já preparado; também oferece sua preparação na área de testes. |
| Com Qwen 0.6B | 481.447.327 bytes | [Baixar APK](https://chatgpt.com/library?file_id=libfile_65d44712791c8191994b560af8801bf9&account_id=personal). Inclui os pesos; a preparação no aparelho não exige outro download do modelo. |

SHA-256 leve: `c30b6db358206a1de10fc4f11b9eb00c0be45ec4b52315b0a4768bd0f47e8b19`.

SHA-256 com Qwen: `66fd518b6e5dd2f5d4ea8fe8f78fcc5d9f60bc6dc913f2d2256401d4277a8a86`.

Escolha uma edição. Instale como atualização do Codex Teste IA 143/144, **sem desinstalar nem limpar dados**. Não substitui o aplicativo original nem o pacote antigo `.codexteste`. A instalação final e o funcionamento físico devem ser confirmados pelo usuário no Android.

## Origem, commits e preservação

Repositório `alexduvier-svg/Territ-rio-Gest-o-`. Base identificada na entrega anterior: branch `codex/agro-gestao-144-consultas-entregas`, commit preservado **`cf71aaeae1bcf730cf3a0381a2bc3778791c1f68`**. A entrega144 registra APK versão0.12.144-teste.1/código186, SHA-256 `fc28fd8535ad07658ed16eb75c44db0df590c11cd37f4f92925d25ce30d9ee20`.

Nova branch independente: **`codex/agro-gestao-145-interpretacao-real`**.

- `a617c2fdb20ace0190475bfea7426f3e6df4c25b`: compradores empresariais, contagem distinta e testes de escopo/período.
- **`d7e7fff3f85a70ce697feea0c93d6f300e692b4f`**: fonte publicada dos APKs145, laboratório, consentimento, compatibilidade de template e bloqueio do Qwen 0.6B para uso automático não aprovado.
- A compilação utilizou a mesma árvore **`08bf7ddff2c771a9f839bf6bef9bf8d25991c40e`**, verificada contra o commit publicado. Referência local correspondente: `5ba3302e9dc7c05bbe638edbea19f3ad2eebcf87`. Diferenças de metadados de commits entre o Git local e o conector não alteraram a árvore de código.

A versão136 continua identificada por `codex/atualizacao-agro-gestao2`, commit `78edfb5e2a44fc0819e5cf904420d4cb5f85c535`. Os projetos/branches históricos do Claude e do Codex não receberam escrita neste trabalho. Não houve exclusão de repositório, branch, tag, release ou APK histórico, force push, reset destrutivo, mesclagem automática, migração de dados ou nova chave de assinatura. Pesos e credenciais não foram publicados no Git. Somente a branch nova recebeu os commits remotos.

## Mudanças desta rodada

1. “Empresas”, “pessoas jurídicas” e “CNPJs” consultam compradores empresariais documentados distintos, respeitando produto, local e período. Vendas repetidas não multiplicam a contagem; devoluções e identificações insuficientes permanecem explícitas.
2. Uma pergunta nova e clara supera o esclarecimento pendente de outra pergunta. Falhas do intérprete preservam a última referência válida e são apresentadas como falhas de execução/validação, com acesso ao laboratório.
3. Template Qwen compatível com as mensagens por partes do LiteRT-LM0.18.1, preservando os pesos. O bloco legado1.7B fica recolhido; arquivo presente não é anunciado como entendimento comprovado.
4. Comparação de18 perguntas fictícias, com o mesmo contrato de consulta, avaliação por intenção/referência/filtros, tempo, saída e falhas. Inclui contexto anterior, hipótese, pergunta composta e base vazia.
5. Gemini3.1 Flash-Lite online para testes pessoais. Autorização inicial, credencial cifrada com Android Keystore, revogação e cancelamento. Nenhum registro real é enviado pelo laboratório. O acesso usa a quota e as condições da conta do usuário; não há chave embutida no APK.
6. Pesquisa pública separada, com autorização adicional, revisão do texto antes de enviar, Google Search grounding, fontes e data da consulta. Não substitui dados locais. Não faz parte da pontuação comparativa.
7. Qwen0.6B incluído na edição completa, verificado por tamanho/SHA-256 antes da preparação. O arquivo privado existente é reutilizado. A integração1.7B anterior continua preservada.

## Testes e resultados

- **897 testes de código aprovados, zero falhas**.
- **14 verificações de interface ERP em DOM simulado**, incluindo a pergunta exata das capturas, contexto pendente, carrinho, recebimento parcial e zerar uma fixture com consulta posterior sem recuperar demonstração.
- **6 verificações de interface do laboratório em DOM simulado**: abertura sem envio, consentimento sem consulta automática, parada na quota/erro, revisão antes da pesquisa, fontes/data e revogação. Provedores simulados nesses testes não comprovam inferência do Gemini.
- **Inferência real Qwen0.6B em Linux/CPU: 0 de18 planos aprovados na configuração testada**. Perguntas, saídas e tempos em `qa/interpreter-comparison/qwen06-linux-results.json`. O Qwen0.6B ficou restrito ao laboratório, sem qualificação automática pelo tamanho da memória. Isso não mede a precisão de todos os modelos Qwen nem substitui Android físico.
- **Gemini real ainda não executado**: o usuário informou não possuir projeto e não havia acesso configurado no ambiente. Não há evidência para concluir que ele é melhor. A ativação pessoal e a execução no celular permitem produzir essa comparação.
- Ambos os APKs passaram: compilação, certificado, pacote/versão, CRC,64 assets públicos comparados byte a byte, classes nativas novas presentes, alinhamento ZIP16KB e alinhamento ELF16KB das bibliotecas ARM64. A edição completa teve o modelo extraído do APK e conferido por tamanho e SHA-256. Há também biblioteca auxiliar ARMv7; a execução do Qwen exige ARM64.

As primeiras tentativas encontraram SDK de compilação incompleto e um arquivo temporário incompleto no empacotamento incremental. A compilação final ocorreu em diretório isolado, com fonte idêntica, SDK compatível e verificação dos APKs concluídos. A edição leve foi reconstruída com intermediários limpos para remover o espaço residual do modelo.

Não houve instalação física, inferência em Android, teste real do AICore/Nano, execução real do Gemini, pesquisa online autenticada ou medição de pico de memória/bateria nesta sessão. Cifragem e permissões foram implementadas e compiladas; seu funcionamento no aparelho ainda requer confirmação. A compreensão geral solicitada permanece em avaliação, sem conclusão de troca de modelo.

## Como testar pelo celular

1. Baixar e instalar uma edição acima como atualização. Se o Android solicitar, autorizar a instalação desse arquivo pelo navegador ou Arquivos.
2. Abrir **Ajustes → Inteligência no aparelho → Comparar Qwen e Gemini online**.
3. Em Gemini, tocar **Autorizar testes do Gemini → Abrir Google AI Studio**. Entrar na própria conta e configurar o acesso pessoal. Colar a chave somente no campo protegido do aplicativo e autorizar uma vez. Não enviar a chave pela conversa.
4. Executar **Testar18 perguntas no Gemini**. O lote usa até18 chamadas, exige internet e para no primeiro erro de acesso/transporte/quota. O modelo online não é instalado como o Nano.
5. Em Testes dos modelos, preparar o Qwen incluído ou reutilizar a cópia já verificada. Depois executar o mesmo lote no Qwen. A guarda experimental exige ARM64, cerca de3GiB de RAM disponíveis no momento e condições adequadas de energia/temperatura; RAM total sozinha não aprova o modelo.
6. Abrir os resultados de cada modelo. São mantidos na sessão do aplicativo; guardar os resultados antes de encerrá-lo. Comparar acertos, erros de intenção/referência/filtro e tempo. Uma aprovação parcial não habilita automaticamente o Gemini nos dados reais.
7. Para informação externa, usar **Pesquisar informação pública na internet**, conferir o texto e autorizar a pesquisa. O aplicativo exige fontes verificáveis para apresentar a resposta externa.

O laboratório não zera o negócio, não cria vendas nem cadastra dados de demonstração na base do produtor. O teste “base vazia” é inteiramente fictício. Os testes de zerar usaram somente fixtures, sem acesso aos dados do usuário.

Provas: `qa/android145-delivery.json`, `qa/intelligence145-dom.json`, `qa/interpreter-comparison/dom-results.json` e `qa/interpreter-comparison/README.md`.
