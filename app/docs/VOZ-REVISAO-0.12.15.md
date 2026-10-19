# Voz: revisão dos anexos e implementação

Os anexos DOCX e ZIP fornecem uma proposta coerente de captura local, português explícito e revisão do produtor. Foram considerados como referência, distinguindo conteúdo de comandos para outros agentes. Não executar os prompts/scripts de implantação contidos neles. A semente tem 179 nomes de produtos; não é o catálogo operacional e não foi inserida no estoque. Foram aproveitados aliases explícitos e numerais, com adaptador conservador sobre os IDs, apresentações, unidades, preços e saldos reais.

O motor genérico do ZIP infere quantidades, preços e unidades e usa memória própria em localStorage. Isso não substitui o domínio atual. O worker sugerido contém campos/modelos online não confirmados, CORS aberto e token de cliente que não protege um serviço distribuído. Não foi integrado nem publicado. Nenhuma conta ChatGPT ou chave de transcrição é necessária.

Pedido esclarecido durante a execução: microfone exclusivo para vendas, sem exigir “vendi”. “3 cafés gourmet” pede a apresentação; “3 cafés gourmet 250” pode ir diretamente à página Venda com 3 pacotes de 250 g, quando produto/quantidade são claros. Essa inclusão é somente um rascunho; pagamento, destino, feira, validação e gravação continuam no fluxo atual. A fala não finaliza vendas. Incerteza, alternativas conflitantes, ruído/volume baixo, texto incompleto e estoque insuficiente pedem conferência. Negação, perguntas, passado e comandos de perda não viram vendas.

## Captura e limites

O Android local só é selecionado com confirmação de pt-BR instalado via RecognitionSupport (API 33+). Em versões anteriores, aparelhos sem serviço ou ROMs importadas sem português local, o Vosk funciona no app, sem Google. A interface em português não prova que o serviço do sistema saiba português. Sem fallback remoto automático. A falta de um serviço do sistema não impede a opção offline.

Vosk usa AudioRecord a 16.000 Hz, PCM 16 bits mono, fonte VOICE_RECOGNITION, frases do catálogo ativo + números/unidades + [unk], até 3 alternativas, endpoint de silêncio e limite de captura. Não se restringe a uma lista que force qualquer ruído a virar produto. Acrescentados medidor de nível, identificação de volume baixo/saturação e NoiseSuppressor opcional se disponível, desligável caso prejudique a voz. Nenhum desses recursos garante acerto. Partiais não mudam o carrinho. Microfone e modelo são liberados antes do resultado e ao interromper/sair. Modelo é preparado fora da thread da interface e não fica residente em repouso; não há áudio em arquivo nem wakelock.

O modelo small-pt tem taxas de erro publicadas elevadas em fala livre. Vocabulário direcionado e revisão reduzem o escopo do problema, não comprovam precisão de campo. Ainda é necessário piloto com a voz do produtor, ruído real de feira, diferentes distâncias e celulares básicos. Testes de domínio/UI e build não medem essa precisão nem FPS em Android básico.

## Dependências e reprodução

Modelo oficial: `vosk-model-small-pt-0.3.zip`, 32.453.112 bytes, SHA-256 `6e1ce909032e1afa7a88e68a3d628ecafff302bdf195befab308826c395e93b7`. Licença Apache 2.0 segundo a lista oficial. Executar `node tools/prepare-voice.mjs` antes do sync/build Android. O modelo fica embarcado em assets/voice e se prepara no armazenamento privado sem backup; os registros do produtor não são tocados. O Git contém script/hash, sem depender de um ZIP binário não rastreado para reproduzir a versão.

Bibliotecas fixadas conforme demo oficial: `com.alphacephei:vosk-android:0.3.75@aar` (SHA-256 `ab2f8b91ac8051561aa325546b35fed9a68b36b8121bac5c6fb927525c4adfad`) e `net.java.dev.jna:jna:5.18.1@aar` (SHA-256 `7f053e3ec99e14dd71259c82c1c8a02738d64a13c31226b2acc170f3060951e0`). Binaries de 64 bits inspecionados para alinhamento ELF de 16 KB; conferir também zipalign -P 16 no APK final. As bibliotecas 32 bits Vosk usam 4 KB, plataformas de 16 KB são 64 bits.

O APK crescerá pelo modelo e bibliotecas offline. Esse custo substitui download posterior ou dependência de Google; a tela principal não carrega o modelo. Ondas usam transform/opacity e param com a escuta; modos leve/reduzido respeitados. Não exigir mudanças de teclado, bateria ou permissões irrelevantes em ROMs chinesas.

## Fontes primárias consultadas

- https://alphacephei.com/vosk/models
- https://raw.githubusercontent.com/alphacep/vosk-android-demo/master/app/build.gradle
- https://raw.githubusercontent.com/alphacep/vosk-api/master/java/lib/src/main/java/org/vosk/Recognizer.java
- https://developer.android.com/reference/android/speech/SpeechRecognizer
- https://developer.android.com/reference/android/media/audiofx/NoiseSuppressor
- https://capacitorjs.com/docs/plugins/android

Preservar o APK 0.12.14. Se o produtor pedir remoção da voz, reverter a funcionalidade com versão de código maior e instalar -r, sem desinstalar ou limpar dados. Entrega desta versão depende de QA e confirmações anotados no checkpoint.

## Decisão de qualidade e tamanho
O produtor confirmou manter offline, aceitando a limitação, após comparar com GPT Voice e receber a alternativa de API online paga. Nenhuma API OpenAI foi configurada ou chamada. A documentação oficial consultada depois confirmou gpt-transcribe/keywords/languages; o impedimento do worker não é mais o nome do modelo, mas a necessidade de integração autenticada, controle de uso e decisão explícita, caminho não escolhido.

APK destinado a celulares ARM de 32/64 bits; bibliotecas de emuladores x86 e ABIs obsoletas são omitidas para reduzir o pacote sem retirar suporte a celulares ARM mais simples. Modelo offline continua sendo o principal aumento de tamanho. Não afirmar que ocupa os 4 MB da versão sem voz.
