# Codex Teste 146 — Gemini no Gerente e pergunta única na Gestão

A versão145 guardava a chave do Gemini para o laboratório, mas não a utilizava nas perguntas do Gerente. A146 conecta o Gemini online ao caminho real de interpretação do Gerente, mediante autorização específica. A interpretação propõe um plano validado; consultas, estoque e cálculos continuam nos motores locais. Esta entrega não comprova compreensão universal nem execução autenticada no aparelho do usuário.

## APK e instalação pelo celular

[Baixar Codex Teste 146](https://chatgpt.com/library?file_id=libfile_f0436d21208c8191b101b83775bdc85b&account_id=personal).

| Dado | Valor |
|---|---|
| Arquivo | Codex_Teste_146_Gemini_Gerente.apk |
| Versão / código | 0.12.146-teste.1 / 188 |
| Compilação | 01/11/2026, UTC |
| Tamanho | 36.166.137 bytes |
| Pacote | br.com.territorio.gestao2.codextesteia |
| Android mínimo | 8 / API26 |
| SHA-256 | 3c4abf8423a88be2bc96b8c7deff78b9112f11d8e20373b4aeb076d0c6da5011 |
| Certificado SHA-256 | b1b8f2c74ebbb75adb5de6abfca5f740bfbf9c3d2b02a0ce8479338e45670c86 |

Instalar como atualização do Codex Teste IA143/144/145, sem desinstalar nem limpar dados. O pacote e o certificado são os mesmos. A chave já guardada mantém os mesmos nomes de preferências, cifragem e alias do Android Keystore. A confirmação física da atualização e da recuperação da chave cabe ao teste no celular. Não atualiza o aplicativo original nem o pacote antigo `.codexteste`.

1. Baixar o APK acima no Android e abrir pelo navegador ou Arquivos. Autorizar a instalação desse arquivo, se o Android solicitar, e confirmar a atualização.
2. Na Gestão, usar o único campo de perguntas, imediatamente abaixo de Receita por dia. O card seguinte reúne Inteligência do Negócio, orientações, comparativos, guias e preferências; o botão de cérebro e a pergunta duplicada foram retirados.
3. Nesse segundo card, abrir **Guias e Preferências → Configurar inteligência e conexão → Autorizar Gemini no Gerente**. A autorização adicional explica o uso de pergunta, referências anteriores válidas e rótulos mínimos dos cadastros. A permissão145 cobria testes fictícios. Não é preciso informar novamente uma chave que continue guardada.
4. Tocar **Verificar conexão do Gerente**. O diagnóstico faz uma chamada real ao Gemini pelo mesmo método usado nas perguntas do Gerente, com uma pergunta e registros fictícios, valida o plano retornado e consulta o motor local. Falhas de acesso, quota, transporte e formato são mostradas. Um teste do laboratório ou chave presente não substitui esse diagnóstico.
5. Consultar, por exemplo, **Qual café acabou?**, **Quantas empresas compraram de mim?**, **Tem produto pra chegar?** e perguntas de continuidade. Consultas diretas usam os registros locais. Perguntas que exigem interpretação adicional podem usar o Gemini autorizado, com internet e quota disponíveis. Dúvidas específicas exigem esclarecimento; números e resultados não são presumidos.

Não enviar chaves pela conversa. O modelo online não é instalado no aparelho. Gemini Nano é uma integração local separada; sua indisponibilidade não bloqueia o Gemini online. O APK leve não inclui novos pesos Qwen: preserva a integração anterior e reutiliza um arquivo privado já preparado. Qwen0.6B permanece restrito ao laboratório, sem aprovação automática pelo tamanho da RAM.

## Origem e preservação

Repositório **alexduvier-svg/Territ-rio-Gest-o-**. Origem confirmada: branch **codex/agro-gestao-145-interpretacao-real**, commit final preservado **cbeea5c22f058c857459964e231dc320e02091c2**, árvore **8a3c4eb019f101fe59164479dbe0e90841d479bc**. Essa referência inclui o registro da entrega145; a fonte compilada daquela entrega é **d7e7fff3f85a70ce697feea0c93d6f300e692b4f**, documentada no relatório145. Os APKs145 e seus links permanecem disponíveis naquele relatório, sem substituição.

Branch independente **codex/agro-gestao-146-gemini-gerente**, criada a partir do commit final145 acima. Commits publicados:

- **03f9b784d21f4c1837c58ecca212ac993b4ae671**: consultas de estoque zerado, referências, contrato e serviço de interpretação online.
- **f0b150dc5ef780608c7e0a5d7327a392f2834fbe**: fonte do APK146; integração nativa, autorização, diagnóstico, interface única e versão.
- O registro final de entrega e provas é um commit posterior, somente documental/QA, nessa mesma branch.

O APK foi compilado da referência local **c98d448ebf2d3aacb612765e55e8a9b9160207ce**, árvore **44e0d7834fdf17ecb9836d9c1e04647642e94bbc**, idêntica à árvore do commit remoto **f0b150dc5ef780608c7e0a5d7327a392f2834fbe**. Metadados diferentes entre os commits locais e do conector não alteram o código compilado.

A versão136 permanece identificada pela branch **codex/atualizacao-agro-gestao2**, commit **78edfb5e2a44fc0819e5cf904420d4cb5f85c535**. Os projetos e branches históricos do Claude e do Codex não receberam escrita nesta rodada. Somente a nova branch146 recebeu commits. Não houve exclusão de histórico, substituição de APK anterior, force push, reset destrutivo, mesclagem entre projetos, migração destrutiva ou geração de chave de assinatura. Credenciais, pesos, bases reais e APKs não foram adicionados ao Git.

## Correções e auditoria

- O Gerente chama `interpretQuestion`, com origem de negócio validada, em vez de reutilizar um resultado fictício do laboratório. Usa a chave existente e distingue chave guardada, autorização e última tentativa HTTP. Cancelamento, mudança de contexto, revogação e chamadas repetidas são protegidos.
- Gemini online é independente da RAM exigida pelos modelos locais e da disponibilidade do Nano. O perfil Essencial continua permitindo o serviço online autorizado. Uma falha real não é atribuída a uma suposta pergunta incorreta ou à ausência do Nano.
- O adaptador REST real utiliza saída estruturada, filtra partes internas e rejeita resposta truncada, bloqueada ou inválida. Mensagens públicas não expõem chave nem texto bruto de erro do provedor. Nenhum cálculo financeiro ou alteração de registro é delegado ao modelo.
- “Qual café acabou?” usa estoque canônico, filtra somente apresentações zeradas e preserva as referências dos produtos efetivamente respondidos. Saldo, unidade ou cadastro ausentes não são inventados. Referências seguintes consideram o contexto válido.
- A Gestão apresenta **Receita por dia → card exclusivo de pergunta → card de inteligência com o restante das informações**. Comparativos e orientações anteriores foram preservados em seções recolhíveis; há um único campo. O painel de informações não substitui o texto digitado durante uma atualização.
- A base de demonstração e a base zerada seguem a mesma consulta. Após zerar uma fixture, contexto e referências antigos não reaparecem. Nenhum dado real foi zerado para testar.
- A regressão cobre carrinho, entradas e recebimento parcial: 60 recebidos e 40 pendentes, com saldo físico distinto da compra pendente. Contas da banca permanece uma simulação de preço; Gestão usa os registros do negócio. São complementares nesse fluxo; não criam outro estoque nem lançam vendas pela simulação.

## Evidências e limites

| Verificação executada | Resultado | Limite da evidência |
|---|---|---|
| Testes de código | 911 aprovados, zero falhas | Motores e contratos; não comprova inferência de serviço externo |
| ERP e fluxo do Gerente em DOM | 20 verificações aprovadas | Interface e controladores reais; fronteira do provedor simulada |
| Adaptador Java REST real | 22 verificações aprovadas | Requisições e respostas de fixture; nenhuma chamada autenticada ao Google |
| Compilação Android/Capacitor | Aprovada, ambiente isolado | Não equivale a instalação física |
| APK | Assinatura v2, pacote, versão, CRC e64 assets conferidos | Assets comparados com a fonte compilada |
| Alinhamento | ZIP16KB e ELF ARM64 com segmentos16KB | Não mede execução em hardware16KB; há biblioteca auxiliar ARMv7 |

Os testes DOM incluem autorização sem envio prévio, pergunta exata das capturas, fluxo Gerente→Gemini→plano→consulta, continuidade, erro de quota sem repetição, base zerada e toques repetidos com uma chamada. O adaptador Java foi verificado para HTTP400/401/403/404/429/503, bloqueios de segurança, resposta incompleta e separação da pesquisa pública.

**Não foram executados aqui:** chamada real do Gemini com a chave do usuário, instalação e inferência em Android físico, Nano/AICore real, pesquisa pública autenticada, medição de bateria, pico de memória ou latência no celular. A chave está no aparelho. O diagnóstico incluído permite confirmar a conexão real pelo celular; sucesso com uma pergunta não garante entendimento de todas as perguntas. Não se concluiu superioridade do Gemini sobre o Qwen apenas por estes testes.

A auditoria dos nove ajustes reutiliza os motores e regressões existentes; não transforma testes históricos ou simulados em testes físicos novos. Operações offline continuam disponíveis nas consultas locais suportadas; uma interpretação que dependa do Gemini exige rede. A busca pública continua separada, com revisão e autorização, sem substituir os dados do produtor.

Provas versionadas: `qa/android146-delivery.json`, `qa/intelligence146-dom.json`, `qa/intelligence146-dom.mjs`, `qa/gemini146-response-audit.json`, `qa/java/GeminiResponseAudit.java` e `qa/verify-apk146.py`.
