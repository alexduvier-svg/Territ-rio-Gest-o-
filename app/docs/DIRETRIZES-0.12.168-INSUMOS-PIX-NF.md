# Diretrizes — AGRO Gestão 0.12.167 → 0.12.168
## Insumos, fornecedores, Pix protegido e nota fiscal, com melhorias

Autor do pedido: Alex Duvier · 09/11/2026

Destino: Claude no desktop, trabalhando no repositório local da linha Claude (versão atual 0.12.167).

---

## 0. Como usar este documento

Você (Claude) vai atualizar a versão **0.12.167** do AGRO Gestão, que está no repositório local deste computador, para **0.12.168**. Siga as fases na ordem: **A, B, C e D**. Ao final de cada fase, rode os testes, faça um commit e registre o que foi feito no documento de entrega.

Regras que valem para todo o trabalho:

1. **Aplicar por diferença, nunca substituir arquivos inteiros.** A referência vem de outra linha (Codex), e a 0.12.167 tem correções próprias que precisam ser preservadas.
2. **Preservar a identidade da 0.12.167:** pacote, nome, ícone, chave de assinatura, interface, navegação, componentes de vidro, fontes e temas.
3. **Nenhum dado do produtor pode ser perdido.** Toda estrutura nova é opcional, é criada só quando o produtor grava algo e entra no backup e na restauração.
4. **Nada de valor presumido.** Ausência de dado aparece como ausência, nunca como zero ou estimativa.
5. **Todo texto visível em português do Brasil correto.** Use maiúscula só na primeira palavra dos títulos ("Se trocar ou perder o celular"), sem anglicismos ("Percepções", não "Insights").
6. **Não adicionar modelos de IA, serviços em segundo plano nem sincronização.**
7. Se alguma função desta lista **já existir** na 0.12.167, compare as duas e fique com a melhor. Nunca duplique.

---

## 1. Fontes no GitHub

Repositório: `https://github.com/alexduvier-svg/Territ-rio-Gest-o-`

| Fonte | Ramo | Commit | Uso |
|---|---|---|---|
| Funções novas (Codex Teste 142) | `codex/agro-gestao-teste-142-insumos-pix-nf` | `7f475a8` (base `92d67bf`) | Fase A |
| Correções da linha de testes | `claude/agro-gestao-148-teste` | `90b50c2` | Fase C |

Comandos para ler a referência sem misturar com o seu código:

```sh
# se o remoto ainda não existir:
git remote add ref https://github.com/alexduvier-svg/Territ-rio-Gest-o-.git
git fetch ref codex/agro-gestao-teste-142-insumos-pix-nf
git fetch ref claude/agro-gestao-148-teste
git diff 92d67bf 7f475a8 --stat
git show 7f475a8:app/docs/TESTE142-INSUMOS-PIX-NOTA-FISCAL.md
git show 7f475a8:app/src/features/input-stock/model.js
```

Leia primeiro `app/docs/TESTE142-INSUMOS-PIX-NOTA-FISCAL.md`: ele descreve as regras de cada função.

---

## 2. Fase A — trazer as quatro funções do Codex Teste 142

### A1. Arquivos novos (copiar e adaptar aos nomes da 0.12.167)

- `app/src/features/input-stock/model.js`, `index.js` e `input-stock.css`: estoque de insumos.
- `app/src/features/pix/payload.js`, `index.js` e `pix.css`: BR Code estático e telas do Pix.
- `app/src/features/fiscal/index.js`: tela de nota fiscal.
- `app/android/.../AgroPixVaultPlugin.java` e `PixPasswordCrypto.java`: cofre da chave Pix.
- `app/android/app/src/test/.../PixPasswordCryptoTest.java`: teste da criptografia.
- `app/tests/input-stock142.test.mjs`: renomeie para `input-stock168.test.mjs` e mantenha os 17 testes.

### A2. Pontos de ligação nos arquivos existentes

- `main.js`: chamar `installInputStock()`, `installPix()` e `installFiscal()` depois do ERP.
- Ponte `TerritorioWorkflowBridge`: expor `exportRows`.
- Estoque: o título vira o seletor **Estoque para vendas · Estoque de insumos · Fornecedores** (`TerritorioInputs.heading`). `stockPage` mostra insumos quando a área estiver ativa. "Validades e Revisões" não aparece na área de insumos.
- Fornecedores: `TerritorioSuppliers.select()`. Compras novas gravam `inputReceiptTracked:true`. O histórico da compra mostra `TerritorioInputs.purchaseEntry(p)`.
- Finalização da venda: `TerritorioPix.checkoutAction(...)` aparece acima das formas de pagamento. `finalizePayment` chama `TerritorioPix.beforeFinalize(...)` antes de concluir.
- Ajustes: nova linha **Minha chave Pix** (ação `pix-settings`).
- Gestão → Operação: nova linha **Nota fiscal** (ação `fiscal-open`).
- Backup: `applyBackupData` chama `TerritorioInputs.validate(data)`. Zerar dados (`reset/safety-copy.js`) considera `inputStock` antes de dizer que não há dados.
- Android:
  - dependência `androidx.biometric:biometric:1.1.0`;
  - permissões `USE_BIOMETRIC` e `USE_FINGERPRINT`;
  - `registerPlugin(AgroPixVaultPlugin.class)` em `MainActivity`;
  - `"loggingBehavior": "none"` em `capacitor.config.json`.
- **Não trazer** o sabor `codexTeste142`, o sufixo `.teste142`, o esquema `agrogestaoteste142` nem a variável `VITE_AGRO_TEST142`. Eles servem só para o app de teste do Codex. A 0.12.168 usa o pacote e a assinatura da 0.12.167.

### A3. Regras que não podem mudar

- Insumos: quantidades em milésimos inteiros. Bloquear uso acima do saldo, data futura e conversão que exigiria arredondamento. Caixa, saco e pacote só convertem com o conteúdo informado pelo produtor.
- Registrar uma compra **não** aumenta o estoque; só "Receber como insumo" aumenta. Recebimento parcial: numa compra de 100, recebendo 60 e depois 40, o saldo fica em 100 e o pendente em 0. Compras antigas exigem conferir quanto já tinha chegado.
- Recebimento não gera despesa e não altera o custo de vendas passadas.
- Pix:
  - a senha nunca passa pela ponte JavaScript;
  - AES-GCM com PBKDF2 (210 mil iterações), mais uma chave do Android Keystore;
  - o arquivo fica em `getNoBackupFilesDir()`;
  - o QR cobra só a parte paga em Pix;
  - mudar a venda invalida o QR;
  - o app nunca afirma que o pagamento caiu: o produtor confirma em "Conferi no banco e recebi".
- Nota fiscal: só abre páginas oficiais e só por toque do produtor. Não envia dados, não guarda senha do governo e não emite documento.

**Fim da Fase A:** todos os testes passando, incluindo os 17 testes de insumos e Pix. Commit: `feat(168): insumos, recebimento de compras, Pix protegido e nota fiscal`.

---

## 3. Fase B — melhorias sobre as funções trazidas

### B1. Custo do insumo (prioridade alta)

- Cada entrada pode ter **valor pago** (opcional). No recebimento de compra, o valor vem da compra, proporcional à quantidade recebida (custo unitário da compra × quantidade).
- O insumo guarda o **custo médio ponderado**. Uso não muda o custo médio.
- Entradas sem valor não entram no custo médio. Se nenhuma entrada tiver valor, o insumo mostra "Custo não informado", nunca R$ 0,00.
- Os detalhes do insumo mostram: saldo, custo médio, valor em estoque e data do último custo.

### B2. Produção: insumo vira produto pronto (prioridade alta)

Nova ação **Produzir** no Estoque de insumos e nos detalhes de um produto do Estoque para vendas.

1. O produtor escolhe o produto pronto (por exemplo, Café Especial Torrado 250 g) e a quantidade produzida (por exemplo, 50 pacotes).
2. Informa os insumos usados e as quantidades (por exemplo, 1 saca de café verde, 50 embalagens com válvula e 50 rótulos).
3. Pode salvar a combinação como **receita** daquele produto, para repetir depois só ajustando a quantidade, com proporção automática.
4. Antes de confirmar, a tela mostra:
   - cada insumo, a quantidade usada e o saldo depois;
   - o custo total;
   - o **custo por unidade produzida**, com aviso se algum insumo não tiver custo.
5. Ao confirmar, numa única gravação:
   - baixa os insumos (movimento `production`, ligado ao id da produção);
   - dá entrada no produto pronto **pela mesma função de reposição do Estoque**, para que lotes, validade e histórico continuem coerentes;
   - oferece **atualizar o custo do produto** com o custo calculado. Só com confirmação, e sem alterar vendas passadas.
6. Se faltar saldo de qualquer insumo, nada é gravado.
7. Repetir a confirmação (toque duplo ou retomada do app) não pode baixar duas vezes: use id da operação e assinatura, como já faz `move()`.

### B3. Estorno de lançamento

- Cada movimentação (entrada, uso, produção ou recebimento) pode ser **estornada uma única vez**, com motivo obrigatório.
- O estorno cria um movimento inverso que aponta para o original. Nunca apaga.
- O estorno de um recebimento devolve o pendente da compra.
- O estorno de uma produção desfaz a baixa dos insumos e a entrada do produto, e só é permitido se o produto ainda tiver saldo suficiente.
- `validate()` precisa conferir: um estorno por movimento, saldo nunca negativo e soma do histórico igual ao saldo.

### B4. Interface dos insumos

- Unidades na lista principal: Unidade, kg, g, Saca, Caixa, Pacote, Dúzia, Litro, ml, Metro e Rolo, além de "Outra unidade".
- Atividades: botões de marcar e um campo "Nova atividade", em vez de texto separado por ponto e vírgula.
- Topo da área de insumos: resumo **Em dia · Baixo · Esgotado**, igual ao Estoque para vendas, usando o mínimo cadastrado.
- Motivo do recebimento: "Compra de [fornecedor] em [data]", nunca o código interno da compra.
- Título "Estoque de insumos": a setinha fica colada ao fim do texto, também quando o título quebra em duas linhas.
- Sugestões por atividade:
  - **Café (torra):** Café verde (Saca 60 kg), Embalagem com válvula, Rótulo, Gás ou lenha para torra.
  - **Doces:** Açúcar, Leite, Pote com tampa, Rótulo.
  - **Panificação:** Farinha de trigo, Ovos, Fermento, Embalagem.
  - **Laticínios:** Coalho, Sal, Embalagem a vácuo.
  - **Artesanato:** Madeira, Tecido, Verniz.
  - Remover "Adubo" das sugestões de Café: é insumo de lavoura, não de produção.
- A pasta do projeto tem a diretriz de insumos `AGRO_Gestao_Diretriz_Insumos_Custos.md` e `insumos_por_familia.json` (30 famílias, 288 linhas, 22 embalagens). Se estiver disponível, use-a como base das sugestões. Ela sugere nomes; nunca cria saldo nem preço.

### B5. Insumos na inteligência do app

- **"Pergunte sobre seu negócio"** responde sem internet:
  - "quanto açúcar eu tenho?" e "quais insumos estão acabando?";
  - "quanto gastei com embalagem este mês?" e "qual o custo do pacote de 250 g?";
  - "quando chegou a última saca de café verde?" e "quanto falta receber do fornecedor X?".
- A Inteligência do Negócio e a Gestão (Operação, Análise e Decisão) passam a ver insumos com estoque baixo, valor parado em insumos e custo de produção. Essas informações devem acompanhar todo o sistema.
- CSV: exportar insumos, movimentos e produções (`exportRows`).

### B6. Pix

- Juntar o botão "Cadastrar chave Pix" ao primeiro card, sem card vazio só com o botão.
- Títulos com maiúscula só na primeira palavra.
- Na janela do QR: mostrar o nome do recebedor e a cidade cadastrados, para o produtor conferir antes de mostrar ao cliente.
- O registro da venda guarda só "Pix (QR gerado no app)" e o valor, nunca a chave.

### B7. Nota fiscal

- Manter Nota Fiscal Fácil e NFA no Siare.
- Acrescentar o card **Emissão Especial de NFA-e**: pode ser feita pelo próprio produtor ou por **sindicato, associação ou cooperativa autorizados por ele no Siare** (menu Produtor Rural › Autorizar emissão de NFA-e). Isso conversa com o Sindicato Rural parceiro.
- Antes de publicar, conferir se cada endereço oficial ainda é o atual. A Fazenda de MG tem uma página nova de NFA-e: `https://www.fazenda.mg.gov.br/servicos/empresa/nfa/emitir-nota-fiscal-avulsa-eletronica-nfa-e/`.
- Novo botão em cada venda concluída: **"Copiar dados para a nota"**. Copia produto, quantidade, unidade, valor, data e comprador (nome e CPF/CNPJ, se cadastrados) para colar no serviço oficial. Nada é enviado automaticamente.

### B8. Ajustes

- Ícones próprios: "Modo Teste" com um frasco de teste e "O que o app faz" com um livro aberto. Não repita o ícone "i".
- "Diretrizes, Insights e Explicações" passa a "Diretrizes, Percepções e Explicações".

**Fim da Fase B:** testes novos para custo médio, produção (incluindo falta de saldo e repetição), estorno, as perguntas de insumos e o "Copiar dados para a nota". Commit: `feat(168): custo, produção, estorno e insumos na inteligência`.

---

## 4. Fase C — correções da linha de testes (conferir antes de aplicar)

Confira cada item na 0.12.167. **Aplique só o que ainda falhar.** A referência está no ramo `claude/agro-gestao-148-teste` (`app/docs/ENTREGA-TESTE-148.md`).

| Problema | Como testar | Correção de referência |
|---|---|---|
| Carrinho some depois de Continuar comprando → tocar outro produto → Voltar | Fazer o caminho e tocar em Retomar | Aviso considera os itens já confirmados (`additionBase`); Retomar descarta a rodada vazia e reabre o carrinho com Finalizar ativo |
| Toque duplo vira venda com intervalo de 0,28 s | Dois toques com 0,3 s de intervalo | `PRODUCT_TAP_MS = 350` |
| Gerente fica preso em "Não consegui identificar" depois de uma dúvida | Pergunta confusa seguida de "qual meu lucro?" | Pergunta nova com rota própria não é tratada como resposta à dúvida anterior |
| Perguntas comuns sem resposta offline | `qa/questions148.json` (50 perguntas) | `features/agent/offline-answers.js` |
| "Café verde" sugere Pacote | Cadastrar "Café verde" | Café verde, cru, em coco ou beneficiado sugere Saca (60 kg) |
| Faltam embalagens | Cadastrar doce ou hortaliça | Pacote, Pote, Sacola, Saco, Bandeja, Litro, Garrafa, Vidro, Caixa, Lata, Balde, Cesta, Kit, Maço, Molho, Dúzia, Saca, Fardo e Engradado em Mais opções |
| Histórico do estoque não mostra a apresentação | Abrir o histórico | Mostrar tipo, formato, peso e unidade em cada linha; a pesquisa entende "1 kg" e "meio quilo" |
| Compra não mostra o que falta chegar | Fornecedores › Histórico | "Aguardando · chegou X · falta Y" |
| Plantas regionais | Hortifruti | Mangarito, Major-gomes, Bredo, Língua-de-vaca, Tanchagem, Boldo, Poejo, Mastruz, Dente-de-leão, Picão, Arruda, Guaco, Melissa, Carqueja, Folha de bananeira e Urucum |

Não traga nada relacionado ao Qwen: ele foi retirado e não deve existir na 0.12.168.

Commit: `fix(168): correções conferidas da linha de testes`.

---

## 5. Fase D — verificação, versão e entrega

### Testes de aceite (fazer na tela, largura de 360 px, temas claro e escuro)

1. Cadastrar "Café verde", Saca, com saldo inicial de 2 e custo de R$ 1.500,00 por saca. Cadastrar "Embalagem com válvula 250 g", Unidade, 200, R$ 0,90.
2. Produzir 50 pacotes de Café Especial 250 g usando 0,25 saca e 50 embalagens. Conferir:
   - insumos baixados;
   - 50 pacotes a mais no Estoque para vendas;
   - custo por pacote calculado: (0,25 × 1.500 + 50 × 0,90) ÷ 50 = **R$ 8,40**.
3. Tocar duas vezes em Confirmar: a produção acontece uma única vez.
4. Estornar a produção: saldos voltam ao que eram.
5. Registrar uma compra de 100 embalagens e receber 60: aparece "falta 40". Receber 40: aparece "Recebida".
6. Perguntar "quanto café verde eu tenho?" e "qual o custo do pacote de 250 g?" sem internet.
7. Venda com pagamento dividido entre dinheiro e Pix: o QR cobra só a parte do Pix. Mudar a quantidade invalida o QR.
8. Backup e restauração: insumos, produções e estornos voltam iguais.
9. Zerar dados com insumos cadastrados: o aviso de cópia de segurança aparece.
10. Nota fiscal: os botões abrem as páginas oficiais; "Copiar dados para a nota" copia o texto certo.

### Versão e documentos

- `package.json`: `0.12.168`. Android: `versionCode` da 0.12.167 + 1, mesmo pacote, mesma chave.
- Criar `app/docs/ENTREGA-0.12.168.md` com: o que entrou, o que foi conferido, o que ficou de fora e como testar.
- Acrescentar a entrada 0.12.168 ao `AGENTS.md`, no mesmo estilo das anteriores.

### APK e instalação

- Compilar com a chave da 0.12.167 e instalar **por cima** (`adb install -r`), sem desinstalar, para preservar os dados.
- Teste físico obrigatório do Pix: cadastrar a chave, gerar um QR de **R$ 0,01** e pagar com outro banco. Conferir a digital, o bloqueio e o QR apagado ao sair do app.
- Registrar no documento de entrega o que foi e o que não foi testado no celular.

---

## 6. O que não fazer

- Não substituir arquivos inteiros da 0.12.167 pelos do Codex.
- Não trazer o pacote, o nome ou a numeração do Codex Teste 142.
- Não criar despesa automática ao receber uma compra, nem mudar o custo de vendas passadas.
- Não gravar a chave Pix fora do cofre, nem em backup, log, venda ou CSV.
- Não emitir nem simular nota fiscal dentro do app.
- Não usar preço, custo ou saldo inventados em sugestões ou dados de exemplo do modo real.
