# AGRO Gestão 2 — 0.12.15 / código 55

Microfone cinza ao lado de Todos em Produtos; azul com ondas durante a escuta. Uso exclusivo para vendas. Não precisa dizer “vendi”. “3 cafés gourmet” pede apresentação; “3 cafés gourmet 250” prepara a página Venda com três pacotes de 250 g quando a leitura é clara. Nada é vendido por áudio: o produtor finaliza pelo fluxo habitual. Produto ambíguo, fala incerta e quantidade inválida pedem revisão.

Português offline embarcado com Vosk; Android local somente se pt-BR instalado for confirmado. Sem serviço pago, Google obrigatório ou envio de áudio para OpenAI. O produtor escolheu manter offline, aceitando a limitação após solicitar qualidade equivalente ao GPT Voice. Não prometer essa equivalência. Acrescentados vocabulário dirigido aos produtos reais, medidor de entrada, detecção de som baixo/saturado e redução de ruído opcional. O modelo e o microfone são liberados depois da captura; repouso não mantém modelo em memória ou tela ligada.

Diretrizes persistidas no modelo/backup e documentação offline, separadas das vendas e estoque. Dicionário do anexo funciona como semente linguística, sem cadastrar seus 179 produtos como registros reais. Worker online anexado não foi integrado.

## Entrega e validação

- 234 testes de domínio/interface passaram, incluindo 34 testes da voz. QA de navegador isolado: 6 fluxos, 4 superfícies, temas claro/escuro, larguras 320/360/393/412, texto ampliado e altura curta; zero erros. Respostas do reconhecedor foram simuladas, não medem precisão acústica.
- APK release: pacote br.com.territorio.gestao2, certificado original v2/v3, sem debug. 33 assets idênticos ao dist. SHA-256 `1c6aa27519f358de257d3862cb4e03ebbdb5638663ae476b81a65efeeb72d167`, 55.909.931 bytes (aproximadamente 56 MB). Modelo e bibliotecas explicam o aumento em relação ao app sem voz. Mantido ARM 32/64 bits; removidos binários de emuladores.
- ELF de 64 bits e ZIP inspecionados para alinhamento de 16 KB. O aparelho conectado usa páginas de 4 KB; isso não é execução em hardware de 16 KB.
- Cópia conferida na pasta original como AGRO-Gestao-2-0.12.15.apk. Android confirmou instalação -r, versão 0.12.15/code55 e firstInstallTime preservado. Nenhuma desinstalação/limpeza do app principal, transação de teste ou exportação da base real.
- Teste instrumentado de JNI/modelo foi compilado, mas não concluído no aparelho: a instalação do pacote temporário ficou pendente e foi encerrada; eventual pacote temporário foi removido. A abertura do app principal foi confirmada. Não afirmar teste de captura, precisão com voz humana, FPS ou desempenho em celular básico. O teste de campo com o produtor continua necessário.

## Arquivos principais

`src/features/voice/{index.js,controller.js,interpret.js,lexicon.json,voice.css}`; `src/data/voice-guidelines.js`; integração em `src/main.js`, `src/legacy/erp-core.js` e `erp-ui.js`; plugin Android `AgroVoicePlugin.java`, registro em `MainActivity.java`, permissão/visibilidade no Manifest, versões/dependências/ABIs em app/build.gradle; `tools/prepare-voice.mjs`; testes em `tests/voice.test.mjs` e androidTest; conhecimento/licenças em `public/knowledge/`; revisão e anexos em `docs/`; versão em package.json/package-lock.json. Evidências sintéticas em qa/voice015-qa.* e qa/unit-voice015.txt.

Modelo oficial/hash: docs/VOZ-REVISAO-0.12.15.md. A versão 0.12.14 e seu APK continuam preservados. Se o produtor pedir remoção, fazer atualização de código maior sem voz, preservando dados; nunca desinstalar para fazer downgrade.
