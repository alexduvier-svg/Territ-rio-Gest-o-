# Codex Teste — assistência local opcional

Base: ramo Codex `78edfb5e2a44fc0819e5cf904420d4cb5f85c535` (0.12.136).
Pedido: preparar um APK separado para baixar no celular, chamado **Codex Teste**.

## Identidade e dados

A variante Android `codexTeste` tem identificador `br.com.territorio.gestao2.codexteste`.
Ela é instalada ao lado do aplicativo existente. Não é uma atualização sobre o certificado original.
Começa com seu próprio armazenamento; não copia dados de outros aplicativos nem incorpora bases reais.
Não desinstalar nem zerar o aplicativo original para experimentar esta versão.
O certificado de teste é gerado no ambiente de compilação e não deve ser enviado ao Git.

## Implementado

- Gerente e cálculos canônicos preservados. O modelo não cria um segundo motor de decisões.
- Acesso à configuração em Ajustes > Inteligência e no Gerente.
- Qwen3 1.7B INT4 opcional por arquivo `.litertlm`, com tamanho e SHA-256 fixados.
- O arquivo de 977.184.032 bytes é baixado separadamente pelo navegador e importado para a área privada, fora do backup automático.
- Runtime LiteRT-LM 0.18.1, CPU, duas threads, contexto máximo de 2.048 tokens e resposta de até 192 tokens.
- A explicação só é solicitada explicitamente depois da resposta calculada do Gerente. A resposta original permanece visível.
- Nenhuma ferramenta do modelo, gravação de venda, alteração de estoque ou execução de código é exposta.
- Checagem de números inéditos, resposta vazia e marcação imprópria. Isso não comprova correção semântica: a explicação permanece experimental.
- Cancelamento por navegação, saída do app e prazo de geração. A carga inicial do executor pode levar tempo; liberação no bloco final.
- Bloqueio conservador por pouca memória disponível, aquecimento e economia de energia. Não presumir desempenho pela RAM total.
- Falar pergunta usa a atividade do reconhecedor de voz instalado no Android, preferindo offline. O serviço pode usar internet; não há garantia de disponibilidade em ROMs sem reconhecedor. Texto retorna ao campo; o usuário confere e toca em Consultar.
- Sem gravação de áudio pelo app, sem API de IA para os registros e sem modelo embutido no APK.

## Modelo fixado

Fonte: `litert-community/Qwen3-1.7B`.
Revisão: `d6678881da6181864bbc893c80e10aa1ee0d3731`.
Arquivo: `Qwen3-1.7B_dynamic_wi4b32_afp32.litertlm`.
SHA-256: `2a72330b504a6596d53a2c00923c57173b10f1b83e6a541213ffec08d1fc5de8`.
Licença base: Apache 2.0. O runtime também é Apache 2.0; dependências retêm suas licenças.
O pacote exige espaço para o download e sua cópia privada, além da memória de execução.

## Como experimentar

1. Instalar Codex Teste como um aplicativo separado e escolher os dados de exemplo.
2. Abrir Gestão > Gerente do negócio e fazer uma consulta.
3. Para IA: Configurar > Baixar modelo compatível; depois Importar arquivo baixado e Ativar assistente.
4. Retornar à consulta e tocar em Explicar com IA local.
5. Para voz: Falar pergunta; conferir a transcrição; Consultar.

## Limites da entrega

É uma experiência de explicação sobre as consultas existentes, não um chatbot irrestrito nem reconhecimento de áudio do Qwen.
Não inclui Gemma, treinamento adicional ou implantação de servidor.
Compilação e testes de código não comprovam inferência, qualidade de português, voz ou desempenho em um aparelho físico de 6 GB.
Verificação física da instalação, reconhecimento e carregamento do modelo permanece necessária.

## Compilação

Com Node, Java 21 e Android SDK configurados:

```sh
cd app
npm ci
npm run sync
cd android
./gradlew assembleCodexTesteDebug
```

A variante `original` mantém o identificador-base; não instalá-la com uma nova chave sobre o app existente.
O APK, o SDK, os pesos, as dependências e os certificados ficam fora do versionamento.

## Verificações de código

- 837 testes de domínio passaram (incluindo quatro testes da fronteira de IA e um teste com relógio congelado para cópias rápidas).
- A checagem DOM da nova interface passou: voz preenche sem consultar; ausência de modelo é explícita; explicação usa os fatos; revisão de dados e valores ocultos bloqueiam envio ao modelo.
- A suíte revelou uma falha preexistente na ordenação de cópias produzidas no mesmo milissegundo. A gravação agora usa marcas temporais estritamente crescentes, mantendo o formato dos arquivos e a fila canônica.
- A tentativa de navegador neste ambiente foi bloqueada por restrição de socket do Chromium. A checagem DOM não substitui revisão visual ou teste físico.

## Pacote gerado e conferido

- Compilação Android: `assembleCodexTesteDebug`, concluída com sucesso.
- Nome no Android: Codex Teste; pacote `br.com.territorio.gestao2.codexteste`.
- Versão Android `0.12.137-teste-ia1`, código178; fonte `0.12.137-teste.1`.
- Arquivo: `Codex_Teste_0.12.137.apk`,36.568.417bytes.
- SHA-256: `13da17a754b26d7ea2a58dd37ef0617c2dba1f00bd6312b727614a6df7538472`.
- Assinatura APKv2 verificada. Certificado de teste, diferente da identidade instalada original.
- CRC do arquivo,62arquivos públicos comparados ao build, classes da ponte e biblioteca de IA presentes.
- Alinhamento ZIP e segmentos ELF de16KB conferidos estruturalmente.
- APK não contém pesos, certificados privados ou bases do produtor.
- Provas públicas: `qa/codex-teste-ia1-validation.json`.
- Nenhuma instalação ou inferência física foi realizada; os resultados de domínio e DOM não comprovam a experiência em um celular.
