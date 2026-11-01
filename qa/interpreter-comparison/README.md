# Comparação de interpretação — Codex Teste 145

A comparação avalia os planos que serão consultados pelos motores do app. Não mede a qualidade de conversa livre nem autoriza modelos a calcular vendas, estoque ou lucro.

Os 18 casos fixos e fictícios estão em `app/public/ai/interpreter-benchmark.json`. Incluem empresas/CNPJs, estoque, vendas, entradas, mercadorias pendentes, rankings, lucro, clientes, receita, agenda, clima, pergunta composta, desconto hipotético, referência anterior, ambiguidade, pergunta fora do escopo e base vazia. O mesmo texto, catálogo e contexto são enviados a cada provedor. Não há acesso ao ERP no laboratório.

`evaluateBenchmark` usa o validador de planos do Gerente e confere intenção, referências e os filtros especificados pelos cenários. JSON válido para outra consulta reprova. Estrutura válida não basta para aprovar a interpretação. Esse conjunto é limitado e não certifica entendimento universal ou cálculos do negócio.

## Execução real realizada

Qwen3-0.6B mixed INT4, SHA-256 `7900eb4e7362d88c58782c6f9999bb7a129e03544aa98b8f338ea0cc5d8c22c1`, LiteRT-LM 0.18.1, Linux x86_64, CPU com 2 threads, contexto 2048, máximo 512 tokens de saída, amostragem determinística e thinking desativado. Template oficial correspondente ao runtime; saída limitada pelo mesmo JSON Schema do laboratório.

Resultado: **0 de 18 planos aprovados nesta configuração**. Saídas brutas, perguntas, tempos e hash do conjunto estão em `qwen06-linux-results.json`. Isso reprova a configuração para o uso automático pretendido; não é uma medida geral de todos os modelos Qwen. O arquivo e a integração foram preservados. O Qwen 0.6B fica restrito à comparação nesta versão.

No ensaio inicial, o template embutido no export antigo esperava `content` como string, enquanto o runtime fornece partes. O modelo respondia como se não recebesse a pergunta. O template oficial `models/qwen3/chat_template.jinja` do runtime 0.18.1 corrige essa passagem. A correção permitiu responder em português no ensaio simples, mas não aprovou os 18 planos completos.

O script Linux inicializa o engine uma vez; seus tempos por pergunta excluem essa inicialização única. O APK inicializa e encerra a execução por pergunta, incluindo a preparação no tempo total. Linux não substitui teste em Android e esses tempos não estimam a latência no celular.

## Gemini pendente

Nenhuma inferência real do Gemini foi executada neste ambiente: não há projeto nem credencial configurados. Não existe resultado comparativo aprovado e não se concluiu que o Gemini é melhor. Os testes DOM usam provedores simulados somente para validar autorização, cancelamento, avaliação e pesquisa pública.

O APK oferece Gemini 3.1 Flash-Lite online com autorização no primeiro uso e chave pessoal fornecida somente no aparelho, cifrada com Android Keystore. A área não envia os registros reais do produtor. O teste usa até 18 chamadas e a quota da conta; erros de transporte/quota interrompem o lote sem novas tentativas automáticas. O provedor online usa máximo 1024 tokens de saída e thinking MINIMAL. Não fica instalado como o Nano.

A pesquisa pública é separada da pontuação, exige autorização própria e conferência do texto antes de cada envio. Utiliza Google Search grounding, mostra fontes e data da consulta e não consulta nem substitui os registros do negócio. Sem fontes verificáveis, não aprova a resposta externa. O Gemini permanece no laboratório; não foi conectado automaticamente ao Gerente.

## Reproduzir no ambiente de engenharia

Instalar `litert-lm-api==0.18.1`. Executar `run.py --provider qwen --model-path <modelo verificado> --output <execucao.json>` e `node evaluate.mjs <execucao.json> <avaliacao.json>`.

Para Gemini, configurar `AGRO_GEMINI_API_KEY` por um mecanismo privado e executar `run.py --provider gemini --output <execucao.json>`. O script recusa executar sem acesso; não usa substitutos simulados. Não colocar credenciais, pesos ou APKs no Git.

No celular, abrir Ajustes → Inteligência no aparelho → Comparar Qwen e Gemini online. Autorizar/configurar o acesso pessoal e executar os dois lotes. Guardar os resultados antes de encerrar o aplicativo; a interface mantém esses resultados apenas na sessão. A disponibilidade do Nano pelo AICore é independente desse teste online.
