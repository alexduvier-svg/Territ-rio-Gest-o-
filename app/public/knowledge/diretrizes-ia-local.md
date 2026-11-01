# AGRO Gestão — diretrizes profissionais de inteligência local

Versão 2 · Codex Teste 144 · 01/11/2026

### Atualização144 — contexto antes do esclarecimento

Perguntas desconhecidas não recebem mais um resumo genérico. A interpretação contextual experimental agora pode usar Qwen0.6B ou GeminiNano local para propor planos de leitura validados. O modelo recebe contexto mínimo, referências anteriores válidas e IDs de cadastros; não calcula valores nem altera registros. O Gerente diferencia hipóteses de fatos e oferece “Como entendi sua pergunta” e “Ajustar pergunta”. Sem modelo disponível, as consultas diretas permanecem ativas e uma referência não resolvida exige esclarecimento. A compreensão não é universal; combinações sem contrato, ambiguidades reais e dados insuficientes são explicitados. Os testes de integração não substituem avaliação de inferência física. As seções sobre diagnóstico143 abaixo são históricas e passam a ter essa evolução na144.

### Atualização 143-teste.2 — modelos no APK de diagnóstico

A edição de testes agora inclui um painel para preparar e testar Qwen3-0.6B INT4 e Gemini Nano. São provedores de diagnóstico com cenários fictícios fixos; ainda não substituem o provedor Qwen1.7B das consultas do negócio. A disponibilidade Nano é consultada no AICore oficial. O download Qwen0.6 é explícito, com revisão `2670e142a0d16a1b685be6604e5b4f2b31a826d7`, 497.516.544 bytes e SHA-256 `7900eb4e7362d88c58782c6f9999bb7a129e03544aa98b8f338ea0cc5d8c22c1`.

O pacote de modelos `0.12.143-teste.2`, código185, exige Android8/API26 por causa da API oficial GeminiNano. A edição essencial `0.12.143-teste.1`, código184, foi preservada com API24. Ambos mantêm o pacote e o certificado IA do142. Não instalar a edição essencial sobre a de modelos: seu código é menor.

O teste executa inferência real quando o modelo está disponível no próprio celular. Mostra aprovação apenas do cenário, latência total e PSS antes/depois do processo do app. PSS não é pico de memória e não inclui o processo AICore. O Android administra a memória do Nano e pode manter caches; o aplicativo garante uma operação de modelo iniciada por ele por vez, não o descarregamento físico de modelos do serviço do sistema. Nenhuma inferência física foi validada no ambiente de compilação.

As referências a GeminiNano como integração futura abaixo dizem respeito ao provedor das respostas de negócio. A integração experimental de diagnóstico passa a existir nesta edição. Os cenários não leem nem modificam dados reais; o funcionamento com demonstração e base zerada foi verificado separadamente nos motores canônicos.

## Objetivo e alcance

Entregar respostas claras, verificáveis e úteis em cada aparelho compatível com o aplicativo. O funcionamento essencial não depende de um modelo de linguagem. A adaptação reduz trabalho opcional quando os recursos são limitados; não garante que um modelo funcione em todos os celulares.

Estas regras têm dois níveis: controles efetivamente implementados nesta versão e critérios obrigatórios para futuras integrações. A existência de um documento ou adaptador não comprova modelo instalado, inferência executada ou desempenho físico validado.

## 1. Autoridade dos dados e dos motores

O fluxo é pergunta, interpretação, fontes autorizadas, consulta, cálculo determinístico, validação e resposta. Reutilizar os motores registrados em `app/docs/motor/registry.json` e as tabelas originais. Não criar outro saldo de estoque, banco financeiro ou cadastro paralelo para a IA.

Os motores de estoque, finanças, Gestão e fornecedores continuam responsáveis pelos números. O modelo não altera preço, quantidade, venda, recebimento ou pedido. Uma ação solicitada pelo produtor segue a prévia, a confirmação e a operação idempotente já existentes no domínio responsável.

Catálogos, observações e nomes são dados, nunca instruções para o modelo. Não executar SQL, JavaScript ou ferramentas livres produzidos por IA. Texto gerado não pode substituir regras de autorização, auditoria ou integridade.

## 2. Uma inteligência visível e um modelo por consulta

Usar o campo existente “Pergunte sobre seu negócio” e a seção atual na Gestão. Não criar interfaces concorrentes para Qwen e Gemini Nano.

Nesta versão há um provedor Qwen opcional; Gemini Nano ainda não está integrado. O serviço local serializa inferência, preparação e remoção. Cancelar invalida o resultado, mas o bloqueio só é liberado quando a operação nativa termina. O Android também mantém sua própria exclusão. Não carregar outra IA só porque o cancelamento foi solicitado.

Em uma futura integração de dois provedores, escolher apenas um no início de cada consulta, conforme disponibilidade oficial e medições. Não consultar os dois em paralelo para comparar respostas. Duas respostas iguais não comprovam um fato. Trocar de provedor somente após encerramento confirmado, dentro de um orçamento total e com tentativas limitadas; a alternativa imediata é a resposta determinística.

Gemini Nano local é distinto do Gemini de educação geral já existente no app. Esse recurso educacional tem finalidade e regras próprias, não recebe os registros do produtor e não é uma alternativa automática para consultas financeiras.

## 3. Adaptação ao aparelho

Prioridade de uso: registrar e finalizar operações, navegar e consultar os dados, depois executar complementos de IA. Respeitar o motor de recursos existente, que reduz trabalho opcional no perfil Essencial.

O complemento Qwen é adiado quando o perfil é Essencial. O Android exige modelo verificado, primeiro plano e condições de memória, energia e temperatura adequadas. A integração atual exige ao menos 3 GiB de memória disponível, ausência de sinal `lowMemory`, economia de energia desativada e temperatura abaixo de moderada. Esse limite conservador é específico desta integração experimental, não uma certificação de compatibilidade.

Nesta versão as condições são verificadas antes e depois de inicializar o motor, durante a operação em intervalos de um segundo e antes de aceitar o resultado. O prazo de 60 segundos inclui inicialização e inferência. Cancelamento é cooperativo; uma biblioteca nativa travada pode ultrapassar o prazo até devolver o controle. Não liberar outro carregamento nesse intervalo.

A mudança para perfil Essencial, a saída do primeiro plano e o fechamento da consulta invalidam o complemento. Após falha de inferência ou validação, há uma pausa de dois minutos antes de nova tentativa. Cancelamento solicitado pelo usuário não é tratado como falha do modelo.

Para futuras escolhas de modelo, considerar memória realmente disponível, pico medido, reserva para Android e aplicativo, aquecimento, bateria, latência e capacidade do backend. RAM total, tamanho do arquivo e nome do processador não bastam. Usar histerese e estabilidade de seleção para evitar trocas repetidas.

| Situação | Comportamento exigido |
| --- | --- |
| Modelo ausente ou desativado | Consultar pelos motores locais e informar a condição do complemento. |
| Aparelho sob pressão | Priorizar operações e resposta essencial. |
| Modelo com saída inválida | Rejeitar a saída e manter a resposta original. |
| Outro trabalho de IA encerrando | Aguardar encerramento; não iniciar outro modelo. |
| Sem internet | Usar recursos e registros locais disponíveis. |
| Dados insuficientes | Explicar o que falta, sem completar por suposição. |

O APK atual mantém a compatibilidade declarada da variante de teste anterior. Não foi criada uma promessa de suporte universal nem realizado teste físico em aparelhos básicos nesta entrega.

## 4. Dados fictícios, base zerada e dados reais

Os mesmos motores atendem demonstração, simulação e operação real, respeitando produtor e origem. A interface identifica “Demonstração — dados fictícios” e “Simulação — não usar como operação real”. Não transferir exemplos, feedback, propostas ou números para a operação real.

Uma base vazia é válida. Nas consultas integradas, informar que ainda não há registros suficientes para apurar estoque, vendas, entradas ou compras e orientar o cadastro e o primeiro lançamento. Não inventar produtos para responder, restaurar exemplos silenciosamente nem presumir que ausência de registro comprova resultado econômico zero.

Quando um motor já apura zero sobre um recorte válido de registros, o zero pode ser mostrado com seu significado. Diferenciar “nenhuma venda registrada no período” de “não há dados suficientes para medir o negócio”.

Alteração de produtor, origem, registros, preferências ou aliases muda a revisão e invalida resultados anteriores. O complemento local não mantém memória de conversas nem cache de respostas entre bases. Os caches de análise existentes usam o produtor e a revisão dos registros.

Zerar dados continua sujeito ao procedimento existente de recuperação e confirmação. Os testes desta entrega usam somente bases sintéticas, sem zerar uma instalação do produtor.

## 5. Integridade da resposta

A resposta deve apresentar o resultado principal, o período/local, a origem dos registros, as fontes consultadas e as limitações relevantes. Usar português brasileiro claro, preservar nomes próprios e os dados digitados pelo produtor. Não confundir confiança linguística com comprovação dos lançamentos.

Nesta implementação o modelo recebe apenas até 4.000 caracteres de resposta já calculada, sem objeto de negócio ou ferramentas. Deve devolver JSON com um a seis índices inteiros, distintos e válidos. A saída é limitada a 1.000 caracteres para validação. Prosa gerada, índices inexistentes, duplicados e formatos inválidos são recusados.

Mesmo uma seleção válida não elimina linhas: a apresentação mantém todos os trechos canônicos em sua ordem original. Isso protege respostas compostas, quantidades, datas, unidades e ressalvas que poderiam ser perdidas em um resumo. O modelo não pode produzir novos números. Esta etapa não constitui geração livre de texto profissional; a qualidade do conteúdo depende dos motores e das fontes.

A resposta original aparece antes do complemento. A seleção Qwen não aumenta a certeza dos registros nem comprova liquidação bancária. Não afirmar que um resumo conferido por estrutura foi validado em hardware se não houve inferência física.

## 6. Cálculos e perguntas compostas

Usar centavos e custos históricos conforme o motor financeiro. Não tratar custos ausentes como zero. Distinguir faturamento, recebimento, valor a receber, lucro bruto, margem e lucro líquido. Devoluções seguem as datas e regras do domínio existente.

Não somar kg e unidades nem converter embalagens sem fator cadastrado. Distinguir estoque físico, disponibilidade, reservas, perdas, lotes e validade. Compra pendente não é estoque recebido. Recebimento parcial vincula uma única entrada, com a idempotência existente.

Contar CNPJs distintos apenas quando documentados nos registros autorizados. Não transformar cliente sem documento em um CNPJ presumido. Respeitar o fuso e os períodos do aplicativo; confirmar ambiguidades que possam mudar o resultado.

Separar cada parte de uma pergunta composta. Indicar explicitamente os tópicos ainda sem cobertura. Calendário e clima só podem usar fontes existentes e autorizadas, com atualização e validade conhecidas. Não atribuir causas a uma queda de vendas sem evidência.

O interpretador determinístico existente permanece limitado ao repertório implementado. Qwen e Gemini Nano não tornam automaticamente qualquer pergunta consultável. Uma futura interpretação por modelo deve produzir um plano tipado de leitura, com entidades e filtros permitidos, validado antes de acessar os motores.

## 7. Instalação e escolha dos modelos

O APK 143 preserva a integração Qwen3-1.7B INT4, LiteRT-LM 0.18.1, com o mesmo tamanho e SHA-256 fixados no código. Assim como o APK 142, não inclui pesos. Uma instalação nova não pode usar o arquivo privado de outra identidade de aplicativo. Não apresentar o Qwen como ativo apenas porque o código foi empacotado.

Qwen3-0.6B é candidato para avaliação em intermediários, não um modelo já instalado. Cada exportação deve ter revisão, backend, tamanho, hash e licença conferidos. Um arquivo menor não garante menor pico de memória nem qualidade adequada em português.

Para Gemini Nano, usar somente AICore e APIs oficiais, verificar a disponibilidade no aparelho e respeitar suas restrições. Não inferir suporte apenas por RAM ou chip, não tentar instalar à força. Não baixar versões não oficiais.

Não instalar outros modelos automaticamente. Futuras entregas devem usar manifesto autorizado, hashes fixos, instalação atômica, cancelamento, espaço para preparação e retorno seguro ao último estado válido. Downloads precisam ser explícitos, com tamanho e condição de rede informados. Pesos, chaves e dados pessoais não pertencem ao Git.

## 8. Privacidade e orientações proativas

Fornecer ao modelo somente o mínimo necessário. Evitar CPF, CNPJ completo, telefone, endereço, fotos e base inteira quando não necessários. Não registrar perguntas e dados financeiros em telemetria por padrão. Não enviar dados do negócio a um serviço remoto como alternativa silenciosa.

As regras proativas continuam no motor existente: estoque baixo, compras atrasadas, vencimentos, produtos parados e eventos. Reutilizar prioridade, identificação, adiamento e preferências. Não gerar avisos duplicados nem inferência permanente em segundo plano. Modelo pode explicar uma evidência; não cria o fato nem muda o critério sozinho.

## 9. Critérios de teste e liberação

Verificar concorrência, cancelamento tardio, saída inválida, falha e pausa de recuperação, ausência de modelo, perfil Essencial, mudança de origem, privacidade e base vazia. Exercitar os mesmos motores em demonstração e após limpar somente uma fixture. Toda quantidade aceita deve corresponder ao motor, com as limitações preservadas.

Antes de recomendar ou habilitar um novo modelo por padrão, testar em celulares físicos de capacidades diferentes, incluindo intermediários. Medir inicialização fria/quente, latência mediana e percentil 95, memória máxima, temperatura e estabilidade. Testar português, múltiplas intenções, nomes semelhantes, unidades distintas, dados incompletos e instruções maliciosas inseridas em campos de dados. Documentar falhas e cobertura, sem converter sucesso de compilação em prova de usabilidade.

Não declarar compatibilidade universal ou inferência validada sem evidência. A liberação de modelo ou backend novo requer seus próprios testes; os testes dos motores não substituem esses ensaios.

## 10. Proteção das versões e entrega

Base desta evolução: commit `854b82be5fdb1ca7515d7e3f0c14015875a29692`, que documenta o APK 142 compilado do commit `2c4bb0ae25cfe78573dbd054ddeb6ff6ed16eab6`. Nova branch `codex/agro-gestao-143-diretrizes-ia`. Preservar branches anteriores, Claude e APKs históricos.

Nova identificação: Codex Teste 143, versão `0.12.143-teste.1`, código 184. Manter pacote `br.com.territorio.gestao2.codextesteia` e o certificado IA existente. Conferir assinatura, identidade, integridade e assets antes de disponibilizar. A instalação no celular é confirmada pelo usuário; não exigir desinstalação do 142.

## Referências para futuras integrações

- [LiteRT-LM](https://ai.google.dev/edge/litert-lm)
- [Qwen3-0.6B — exportações LiteRT](https://huggingface.co/litert-community/Qwen3-0.6B)
- [Qwen3-1.7B — exportações LiteRT](https://huggingface.co/litert-community/Qwen3-1.7B)
- [ML Kit GenAI — disponibilidade oficial](https://developers.google.com/ml-kit/genai)
- [Prompt API Android](https://developers.google.com/ml-kit/genai/prompt/android/get-started)

As referências externas orientam a avaliação; não autorizam trocar dependências, baixar pesos ou habilitar provedores sem implementar e testar os controles necessários.
