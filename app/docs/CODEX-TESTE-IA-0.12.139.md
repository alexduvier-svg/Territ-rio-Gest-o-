> A correção de ranking está no código140; o APK140 ainda não foi entregue. Consulte CODEX-TESTE-IA-0.12.140.md.

# Codex Teste 0.12.139 — valores, rastreio e Qwen integrado

O Gerente usa o mesmo `finStatement` da Gestão, incluindo custos rateados de eventos e perdas de estoque. Perguntas sobre valores ou receita financeira consultam o demonstrativo. A seleção de hoje/ontem/mês atual usa os períodos canônicos, inclusive para rateios. Receita, lucro bruto, resultado, caixa, fiado e previsões conservam os rótulos e limites da origem. Custo histórico incompleto não gera afirmação de lucro apurado.

Com o modelo ativado, o próprio app inicializa o Qwen na consulta. O modelo seleciona índices de trechos da resposta calculada; o app valida os índices e exibe somente texto original. Todas as linhas monetárias, o contexto e os avisos são preservados. Saída inválida, troca de produtor/revisão, valores ocultos, perfil Essencial ou cancelamento mantêm a resposta canônica. Isto garante correspondência textual com o demonstrativo, não completude dos lançamentos.

Rastreio e verificação mostra módulo de origem, contexto, horário e critério da conferência. Git é usado apenas no desenvolvimento. O assistente não consulta repositórios, sites ou APIs para gerar valores. Documentação e conceitos locais já seguem nos assets do app; esta versão não treina Qwen nem importa automaticamente todo o histórico do Git como memória.

## Distribuição do modelo

O download externo do Hugging Face e a importação manual foram retirados. O modelo verificado da 138 permanece no mesmo arquivo privado e é reutilizado pela atualização, com o mesmo pacote e certificado.

A instalação completa pela Play Store foi preparada em `android/qwenmodel`, com entrega `install-time`. Exige fornecer, no ambiente de desenvolvimento, os pesos em `qwenmodel/src/main/assets/qwen/model.litertlm` e compilar com `-PincludeQwenAssetPack=true`. Tamanho 977184032 bytes e SHA-256 `2a72330b504a6596d53a2c00923c57173b10f1b83e6a541213ffec08d1fc5de8`; o build recusa arquivo ausente/inválido. Pesos são ignorados pelo Git. O app copia e verifica o asset local automaticamente na primeira consulta; não busca o modelo em servidores externos. A preparação privada exige cerca de 1,3 GB livres além do pacote instalado.

**O APK de teste entregue não contém os pesos.** Atualiza quem já ativou o Qwen na 138. Uma instalação nova deste APK mantém as consultas calculadas e informa a ausência do modelo, sem download externo. O AAB completo com pesos não foi gerado ou publicado: o arquivo de pesos não está neste ambiente. A entrega real via Play deve ser testada antes da publicação.

A voz agora usa exclusivamente `createOnDeviceSpeechRecognizer`, requer Android 12/API31 e serviço/idioma offline instalado. Solicita microfone apenas ao tocar Falar pergunta; não abre um reconhecedor online e não inicia download de idioma. Falta de suporte permite digitar. A disponibilidade no aparelho ainda precisa de teste.

A conexão pode atender recursos opcionais já existentes, como clima e explicação geral consentida/configurada. Isso não transforma a explicação geral em consulta aos registros financeiros, nem cria consulta ao GitHub. Não foi implementada navegação livre na internet pelo Qwen.

## Validação

846 testes de domínio, incluindo a ponte real do Gerente ao demonstrativo, custos ausentes, origem inválida e seleção diária. 6 cenários Java do instalador local: cópia válida, SHA errado, truncamento, excesso, cancelamento e configuração inválida. Fluxo DOM com provedor simulado: preparação local automática, uso do modelo existente, nenhuma chamada de download externo, valores e avisos exatos, rastreio, cancelamento e bloqueios de privacidade/revisão/recursos. Compilação Android, certificado, alinhamento ZIP16KB, CRC, assets e bibliotecas nativas conferidos. Não houve teste de inferência, voz ou instalação em Android físico.

Prova final: `qa/codex-teste-ia3-validation.json`. Pacote `br.com.territorio.gestao2.codexteste`, código180, versão0.12.139-teste.3. O original AGRO Gestão permanece separado.
