# Codex Teste144 — contexto, hipóteses e esclarecimento

## Download e compatibilidade

[Baixar Codex_Teste_144_Contextual.apk](https://chatgpt.com/library?file_id=libfile_9c7ef24e5eb88191904a323809f972fb&account_id=personal)

Versão0.12.144-teste.1, código186, 36.533.030bytes. Android8/API26 ou superior. Pacote `br.com.territorio.gestao2.codextesteia`, mesma assinatura IA do142/143. Instale como atualização, sem desinstalar nem limpar dados. O Qwen0.6B já preparado na143 usa o mesmo arquivo e verificação privados; não precisa ser baixado novamente. Nenhum peso está embutido no APK.

## Problema e mudança

A pergunta real “Tem produto pra chegar?” caía em uma resposta genérica. Agora consulta pedidos e recebimentos canônicos, incluindo recebimentos parciais, previsão ausente, atraso registrado e saldo anterior não conferido. Pendência não é estoque físico; previsão não comprova chegada. Pedidos antigos ainda abertos não desaparecem pelo mês selecionado das vendas.

A regra permanente agora prioriza contexto e referências. Resposta desconhecida não é substituída por resumo do negócio. O Gerente e o Orientador pedem esclarecimento; referências válidas já identificadas são preservadas quando possível.

## Interpretação contextual experimental

Qwen0.6B ou GeminiNano local pode propor um plano JSON para perguntas não reconhecidas, referências e hipóteses. O aplicativo valida o plano antes de consultar os motores. Há contratos para estoque, entradas, vendas, classificações, finanças, compras, clientes/CNPJs, eventos, clima existente e desconto hipotético.

A memória é curta, em RAM, por produtor, origem e revisão dos registros. Uma referência singular ambígua não escolhe um dos produtos. Hipótese não vira fato, causa comprovada ou alteração cadastral. Desconto hipotético usa o simulador de Contas da banca; não muda o preço.

O modelo recebe pergunta, seleção e rótulos/IDs mínimos dos cadastros. Não recebe saldos, preços, documentos ou telefones dos cadastros. O texto digitado pelo próprio usuário faz parte da pergunta. Não há ferramentas livres, SQL, gravação pelo modelo, alternativa automática em nuvem ou download silencioso. Um modelo por consulta; a etapa de interpretação evita carregar outro modelo para resumir a mesma resposta.

“Como entendi sua pergunta” mostra o plano aceito; “Ajustar pergunta” retorna ao mesmo campo para correção. A interpretação pode ser desativada em Inteligência no aparelho. Sem modelo disponível ou em perfil Essencial, as consultas diretas permanecem disponíveis. A interpretação não é universal e não garante ausência absoluta de erros; filtros e cálculos sem contrato são esclarecidos ou recusados.

## Uso e teste no Android

1. Instale o144 sobre o143/142 IA compatível.
2. Abra Inteligência no aparelho. O estado do intérprete contextual aparece separado do complemento antigo Qwen1.7B.
3. Se necessário, prepare Qwen0.6B em Testar Qwen e GeminiNano; Nano só é usado se o AICore oficial permitir.
4. Consulte um produto e depois uma hipótese, como “E se eu baixar dois reais?”. Confira o produto e o cenário em Como entendi.
5. Teste formulações variadas, referências singulares/plurais e perguntas compostas. Não use um resultado experimental como prova de compreensão geral.

Não houve instalação ou inferência física nesta sessão. A qualidade de linguagem, a latência e o consumo no celular ainda dependem desse teste real.

## Verificações

- 889 testes de domínio aprovados.
- 12 verificações de DOM, incluindo consulta exata da captura, contexto anterior, hipótese de desconto sem alterar preço, esclarecimento sem resumo genérico e base zerada.
- Painéis do assistente e dos modelos verificados com provedores simulados.
- Compilação Android: BUILD SUCCESSFUL,227tarefas,24executadas.
- Assinatura, identidade, CRC, alinhamento ZIP/ELF16KB e60assets web conferidos.
- Método nativo interpretQuestion e SDK Prompt encontrados no DEX.
- Testes semânticos usam planos/provedores simulados; não são evidência de inferência real de Qwen/Nano.

SHA-256 APK: `fc28fd8535ad07658ed16eb75c44db0df590c11cd37f4f92925d25ce30d9ee20`.
Certificado SHA-256: `b1b8f2c74ebbb75adb5de6abfca5f740bfbf9c3d2b02a0ce8479338e45670c86`.

Um teste histórico de recebimentos dependia da data atual e falhou após a virada do dia; a fixture passou a fixar o relógio. As regras de datas da aplicação não foram relaxadas. O teste que esperava um resumo para pergunta vazia foi atualizado conforme a nova regra do produtor.

## Git e preservação

Branch nova `codex/agro-gestao-144-consultas-entregas`, base143 `bb421815bfa2b576d13f6169fdab3619b95db7da`. Código publicado em `ce89ad940533df183dbd52799a76f92e12e111a2`; compilação local `555af1b38b8c91fdae68a254cd793fab3e447b0f`. As duas referências possuem a árvore integral idêntica `ed3c26d9b91df8835cdab13d71b953b9fb3a5352`, conferida na publicação.

Commits públicos:495248f (esclarecimento e consulta de pendências), ce89ad9 (interpretação contextual). As referências e APKs143,142,139,136 e o projeto Claude permanecem preservados. Não houve force push, exclusão de histórico, chave nova, mesclagem com Claude ou migração de dados reais.

As demais limitações já documentadas do projeto não foram declaradas concluídas por esta entrega. A cobertura de linguagem e casos financeiros específicos exige evolução e avaliação contínua; o objetivo desta versão é estabelecer interpretação validada com contexto e esclarecimento, sem prometer resposta correta para qualquer pergunta possível.
