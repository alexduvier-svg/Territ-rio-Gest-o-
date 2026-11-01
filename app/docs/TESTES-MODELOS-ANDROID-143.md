# Codex Teste143 — testes dos modelos no APK

Edição `0.12.143-teste.2`, código185, pacote IA preservado. Requer Android8/API26, por exigência da API oficial ML Kit Prompt. A edição essencial `0.12.143-teste.1`, código184, foi compilada e preservada para Android7/API24 e superior, antes de acrescentar esta dependência.

## O que está implementado

O aplicativo contém um painel acessível em **Inteligência no aparelho → Testar Qwen e Gemini Nano**. Ele consulta a disponibilidade, permite preparar os modelos por ação explícita e executa inferência no próprio celular. Não grava produtos ou vendas, não zera a base e não usa registros reais nos testes.

- Qwen3-0.6B INT4, exportação LiteRT Community de497.516.544bytes, CPU, LiteRT-LM0.18.1. Download HTTPS com origem autorizada, revisão e hash fixos, validação de tamanho/SHA-256 e ativação por renomeação atômica. Arquivo incompleto é eliminado. Interrupção reinicia o download; não há retomada por Range nesta edição. Nenhum peso está embutido no APK.
- GeminiNano pela API oficial `com.google.mlkit:genai-prompt:1.0.0-beta4`. O AICore informa `available`, `downloadable`, `downloading` ou `unavailable`, gerencia o download e fornece o nome real do modelo quando disponível. Não é instalado à força nem substituído por Gemini em nuvem.
- O Qwen1.7B já existente permanece preservado. Os dois candidatos do painel ainda são diagnósticos; eles não assumem automaticamente o papel de provedor das consultas do negócio.

Uma exclusão compartilhada impede operações de modelo simultâneas iniciadas pelo assistente e pelo painel. Cancelamento é solicitado ao backend, e a operação mantém o bloqueio enquanto encerra seu trabalho. O Android controla o ciclo de vida e caches do AICore; não há promessa de descarregar fisicamente o Nano nem de medir toda sua memória pelo processo do app.

## Cenários

1. **Pergunta composta fictícia:** identificar estoque, vendas, CNPJs e período mensal na mesma pergunta em português. O aplicativo valida tipos e todos os campos esperados da resposta JSON.
2. **Base vazia fictícia:** reconhecer que não há registros, orientar o cadastro inicial e não recuperar exemplos. Campos extras, valores inventados ou JSON inválido reprovam o cenário.

O painel informa aprovação ou falha somente daquele cenário, tempo total, modelo e PSS do processo do aplicativo antes/depois. Esses números não são pico de memória, não incluem a memória do serviço AICore e não representam avaliação estatística de qualidade profissional.

A verificação do fluxo real com dados de demonstração e após zerar foi feita separadamente em uma fixture de DOM, usando o motor canônico. Os cenários dos modelos não substituem essa verificação.

## Uso no celular

1. Instale a edição de modelos sobre o Codex Teste142/143 IA, sem desinstalar nem limpar dados.
2. Abra o Gerente e toque em Configurar; entre em Testar Qwen e Gemini Nano.
3. Para Qwen, toque em Preparar e depois confirme Baixar498MB. Reserve pelo menos755MB livres e mantenha o app aberto. Uma rede Wi-Fi evita consumir a franquia móvel.
4. Para Nano, confira o estado informado pelo Android. Só aparece preparação quando o AICore permite. Indisponibilidade não pode ser resolvida apenas por ter mais RAM.
5. Execute uma pergunta composta e uma base vazia para cada modelo disponível, um teste por vez. Informe o modelo, cenário, aprovação/falha e tempo observados para avaliar a próxima etapa.

As consultas do negócio permanecem nos motores locais. O diagnóstico não autoriza inferir que uma base real ficou vazia, nem que um modelo está aprovado para produção.

## Limites da verificação remota

Os testes de contrato e interface usam provedores simulados para conferir validação, cancelamento, concorrência, pressão de recursos e ausência de downloads automáticos. A compilação do SDK confirma integração de código, não uma inferência real.

Não houve acesso a Android físico nesta sessão. Portanto, download completo do modelo, inferência, latência, memória de pico, consumo e estabilidade no celular ainda dependem da execução do painel pelo usuário. Não declarar esses testes concluídos sem resultado medido.

## Fontes

- [Google: início da Prompt API](https://developers.google.com/ml-kit/genai/prompt/android/get-started)
- [Google: API Java GenerativeModelFutures](https://developers.google.com/android/reference/com/google/mlkit/genai/prompt/java/GenerativeModelFutures)
- [Qwen3-0.6B — exportação usada](https://huggingface.co/litert-community/Qwen3-0.6B/tree/2670e142a0d16a1b685be6604e5b4f2b31a826d7)

ML Kit e GeminiNano possuem termos próprios; o modelo Qwen conserva os avisos Apache2.0. Chaves, APKs, pesos e artefatos do SDK ficam fora do Git.
