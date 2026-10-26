# AGRO Gestão 2 — 0.12.88

Instalada em26/10/2026 no Reno14 e PKJ110, com arquivo idêntico na pasta original. Código, QA e documentação publicados no commit 4bf346ee64ea79b23db6b2793930985ffe5d8827, confirmado no remoto exclusivamente no ramo codex/atualizacao-agro-gestao2.

## Comportamento entregue

Contas na mesma calculadora: pills Científica e$, sem perder expressão ou memória. Acesso em Estoque, Fornecedores e Finanças. Preço, Vendas e Descontos e Taxas têm objetivo, ajuda por campo, resultado explicado, limites e fórmula; outras áreas continuam explicitamente Em Breve.

Composição expansível de custo por unidade: fixos mensais, produção mensal e variáveis por unidade, com seleção e aplicação explícitas. Lista interna de custos e tributos com nomes, tipos, explicações e fontes; nenhuma alíquota presumida. Itens digitados ficam na simulação. DAS mensal entra como custo fixo. Taxas confirmadas diferem de padrões do sistema; custos ausentes diferem de zero conhecido.

Simulações locais, somente leitura das fontes canônicas, sem IAonline e sem lançar vendas, despesas ou estoque. Usar Este Preço abre rascunho do editor e exige salvar. Receita, devoluções, Fiado, custos históricos, períodos e unidades mantêm os limites declarados.

O Que Vou Levar usa o mesmo limite do domínio de lotes até o fim da feira. Campos sem capacidade ficam indisponíveis; digitar6com limite5 abre aviso no material do app, mantém o valor digitado e orienta conferir/repor. Próximo e Salvar revalidam; a carga não duplica estoque.

## Validação

- 769 testes unitários do app,25novos.
- Oito jornadas com assets finais compilados:320com texto ampliado/modo leve/reduzido,360,393,412, claro/escuro.
- Quatro jornadas completas no Capacitor: Reno14 e PKJ110 nos dois temas, incluindo as regressões das cinco abas, cafés, cadastro, fornecedores, teclados, clima fictício, tarefas, lotes e os novos fluxos.
- Conteúdo digitado600inteiro verificado após corrigir a largura interna do grid. Composição1200÷400+7=10e preço15,38 no cenário de taxas3+5+7e margem20.
- 57assets web e2pontes idênticos entre dist/APK/fixture; apenas2scripts HTML sintéticos adicionais no fixture. Assinatura original v2/v3 e alinhamentos ZIP/ELF16KB estruturais.

QA exclusivamente em pacote separado, dados fictícios e rede externa bloqueada. A espera da Orientação foi sincronizada com os resumos periódicos e a animação sem remover asserções; fontes históricas83/84 preservadas. Nenhuma medição de FPS/GPU/bateria, aparelho básico físico, TalkBack ou runtime Android16KB.

Servidor não alterado. Os47testes de servidor e o avisoD0 entregue/cancelado nos dois aparelhos são evidências da87, preservadas; não são novos testes físicos de notificação88.

## Arquivo e instalação

Arquivo: AGRO-Gestao-2-0.12.88.apk; pacote br.com.territorio.gestao2; código128;9.259.733bytes.

SHA256:29ba1f09d723b63a68a8a21d206362089beb5cf6dbe6727fb3e4deff0ceae053.

Certificado SHA256:f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68.

Pasta original:C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.88.apk.

| Aparelho | Atualização26/10 | Primeira instalação preservada | Abertura |
|---|---|---|---|
| Reno14 | 18:19:04 | 2026-10-21 18:58:01 | Sinal técnico dos seis módulos confirmado |
| PKJ110 | 18:19:14 | 2026-10-14 18:17:06 | Lançamento a frio; usuário confirmou abertura normal |

PKJ não entregou sinalAGRO.UI; não se afirma confirmação técnica no principal. A confirmação humana desta88 foi explícita. Install-r preservou primeiras datas, assinatura e registros; hash instalado conferido nos dois. Fixtures e captura própria removidos; nenhum banco real foi lido, nenhuma mensagemWhatsApp enviada e nenhuma agenda pessoal usada. O forward9354 já não existia na limpeza; não houve falha de instalação.

Relatórios:qa/accounts088-final-review.json, accounts088-native-{reno,pkj}-{light,dark}.json. Metadados locais:native-apk-validation-0.12.88.json. Não executar novamente o verificador pré-instalação sobre esses metadados finais.

## Claude — revisão separada

Revisão89 em REVISAO-CLAUDE-0.12.89-2026-10-26.md:763testes do commitd051181 passaram, com casos adicionais que expuseram falha de rollback e caixa previsto misturado. Não houve merge. O Claude publicou depois90e91 no repositório agro-gestao-claude. A91corrige cards por grid-auto-rows:auto; esse ajuste já estava em andamento no checkoutClaude e foi preservado, com autoria do Claude. Ele não faz parte do APKAGRO2 desta entrega.

A correção dos cards do Claude foi conferida no APK final0.12.91, SHA2561612dc9c5ec5fd516935c14d8e1f83aacd4f9d7c211e4fbb0f044c60caf42250, com ZIP íntegro. Oito casos de layout compilado aprovados,320/360/393/412nos dois temas, comparados com a90: três colunas, preços e produtos preservados, sem overflow e sem esticar todas as fileiras pelo nome mais longo. Hash instalado idêntico nos dois aparelhos. Commit do Claude f3c6fca69bf1ce980895df31e7321f3486de9fcd confirmado no repositório próprio. Não fizemos outro build/commit no Claude nem substituímos seu trabalho em andamento.
