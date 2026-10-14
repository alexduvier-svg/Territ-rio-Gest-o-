# Instruções para IA: relatórios da Feira do Inventário Rural e Cultural

**Para quem é:** a equipe da Secretaria que vai gerar os relatórios da feira com a ajuda de uma inteligência artificial (Gemini, ChatGPT, Claude ou outra).
**O que faz:** transforma os dados de vendas enviados pelos produtores, pelo app AGRO Gestão, em dois relatórios:

- **Relatório VERDE:** relatório analítico descritivo, em PDF A4 retrato, completo.
- **Relatório AZUL:** apresentação executiva, em PDF 16:9 com 16 slides, com o essencial do Verde.

**Regra de ouro:** os dois relatórios saem dos **mesmos números**, calculados uma única vez. Nenhum número é digitado à mão nem estimado. O Azul nunca diverge do Verde.

---

## Parte 1: como configurar a IA (uma vez só)

Este documento é o "manual" da IA. Você o carrega uma vez e, a cada feira, só envia os dados.

| IA | Onde configurar | O que fazer |
|---|---|---|
| **Gemini** | Gems → Novo Gem | Nome: "Relatórios da Feira". Em *Instruções*, cole o bloco da Parte 2. Em *Conhecimento*, envie este arquivo. |
| **ChatGPT** | Projetos → Novo projeto (ou GPTs → Criar) | Em *Instruções*, cole o bloco da Parte 2. Em *Arquivos*, envie este arquivo. |
| **Claude** | Projetos → Novo projeto | Em *Instruções do projeto*, cole o bloco da Parte 2. Em *Conhecimento do projeto*, envie este arquivo. |

Envie também, uma vez, os **logotipos** da Prefeitura, da Secretaria e o **selo da Feira do Inventário** (PNG). A IA usa esses arquivos na capa e na assinatura.

**A cada feira:**
1. Abra o link do organizador e baixe **"dados do dia"** (arquivo `.json`). Se ele não estiver disponível, baixe as duas planilhas (`resumo.csv` e `produtos.csv`).
2. Abra a conversa da IA configurada, anexe o arquivo e escreva: *"Gere o relatório Verde e o relatório Azul da feira de 12/12/2026. Esta é a 5ª edição."* (troque pela data e pelo número certo da edição)
3. Confira os PDFs com a lista da Parte 9 antes de divulgar.

> Os dados contêm nomes e vendas dos produtores. Use somente a IA oficial da Secretaria e não compartilhe o arquivo fora da equipe.

---

## Parte 2: instruções para colar na IA

```
Você gera os relatórios oficiais da Feira do Inventário Rural e Cultural de Carangola/MG
(Prefeitura Municipal de Carangola · Secretaria de Cultura, Turismo e Patrimônio Histórico).

Siga à risca o documento "Instruções para IA: relatórios da Feira do Inventário" que está no
seu conhecimento. Sempre que receber dados de uma feira (JSON "dados do dia" ou os CSVs
resumo/produtos), gere OS DOIS relatórios: VERDE (PDF A4 retrato) e AZUL (PDF 16:9, 16 slides).

Regras que nunca podem ser quebradas:
1. Todos os números vêm dos dados recebidos, calculados conforme a Parte 4. Nunca invente,
   estime ou arredonde para "ficar bonito". Se faltar um dado, escreva "sem dados".
2. Calcule os números UMA vez (tabela de métricas) e use a mesma tabela nos dois relatórios.
   Se puder executar código, use o script do Apêndice A.
3. Português do Brasil, tom institucional, positivo e exato. Valores no formato R$ 1.234,56.
4. Texto corrido sempre justificado. Tabelas, cards e caixas de destaque nunca quebram entre
   páginas, nunca se sobrepõem e nunca são cortados.
5. Ícones sempre pictogramas que façam sentido (café, queijo, relógio, Pix, cesta...).
   Nunca use quadrados coloridos vazios como enfeite.
6. Diferença entre o que o app calcula e a contagem do produtor é "vendas não registradas
   ou perdas". Nunca culpe o produtor.
7. Antes de entregar, confira o relatório com a lista da Parte 9 e informe os alertas.
```

---

## Parte 3: os dados de entrada

### 3.1 Arquivo completo: "dados do dia" (.json), o preferido

Baixado no link do organizador. Contém tudo o que é preciso para os dois relatórios.

```json
{
 "evento": {"id": "feira-2026-12-12", "edicao": null, "data": "2026-12-12",
            "nome": "Feira do Inventário Rural e Cultural", "local": "Praça da Matriz",
            "cidade": "Carangola/MG", "inicio": "09:00", "fim": "14:00"},
 "produtores": [{"id": "p-1a2b", "nome": "Maria Rita de Oliveira Santos", "nome_curto": "Maria",
                 "comunidade": "Borboleta", "tenda": null}],
 "estoque": [{"produtor_id": "p-1a2b", "produto_id": "b1", "produto": "Goiabada 500g",
              "categoria": "Doces", "unidade": "Unidade", "preco": 18.0, "qtd_inicial": 8,
              "reposicoes": [{"hora": "11:00", "qtd": 4}]}],
 "vendas": [{"id": "v1", "produtor_id": "p-1a2b", "hora": "2026-12-12T09:14:32-03:00",
             "itens": [{"produto_id": "b1", "qtd": 2, "preco_unit": 18.0}],
             "total": 36.0, "pagamento": "PIX", "cancelada": false,
             "sincronizada_em": "2026-12-12T17:40:00Z"}],
 "fechamento": [{"produtor_id": "p-1a2b", "produto_id": "b1", "contado": 0}],
 "feedback": [{"produtor_id": "p-1a2b", "observacao": "Faltou sombra perto das 11h",
               "citacao_autorizada": false}],
 "situacao": {"relatorio_preliminar": false, "finalizados": 18, "preliminares": [],
              "gerado_em": "2026-12-14T09:00:00Z"}
}
```

**Significado de cada parte:**

| Parte | O que é |
|---|---|
| `evento` | Data, local e horário oficial da feira. `edicao` pode vir vazio: use a edição informada no pedido. |
| `produtores` | Uma linha por banca. `nome_curto` é o nome para gráficos. `comunidade` é a localidade do produtor. |
| `estoque` | O que cada produtor **levou**: `qtd_inicial` é o que chegou de manhã; `reposicoes` é o que entrou depois, com horário. |
| `vendas` | **Cada venda**, com o horário real em que aconteceu, itens, total e forma de pagamento: `PIX`, `DINHEIRO`, `CARTAO_DEBITO`, `CARTAO_CREDITO` ou `OUTRO`. |
| `fechamento` | Contagem física do que sobrou, feita pelo produtor ao finalizar a feira (opcional). |
| `feedback` | O que o produtor escreveu em "Algo para a organização?" (opcional). |
| `situacao` | Quantos produtores finalizaram a feira no app e quais só enviaram a **prévia automática**. |

**Campos especiais:**
- `cancelada: true`: venda devolvida. Não conta em nenhum total; aparece só como "vendas canceladas" na Metodologia.
- `lancada_depois: true`: venda que o produtor esqueceu de registrar e lançou ao finalizar a feira. O horário é aproximado. Conta nos totais, mas **não** entra em "esgotou às" nem na curva de horários. Informe a quantidade na Metodologia.
- `pagamentos` (lista): venda com pagamento dividido. O campo `pagamento` traz a forma de maior valor. Para valores por forma de pagamento, use a lista quando existir.
- `situacao.relatorio_preliminar: true`: algum produtor ainda não finalizou. Escreva **"RELATÓRIO PRELIMINAR"** na capa dos dois relatórios e cite os nomes em `situacao.preliminares` na Metodologia.

### 3.2 Alternativa: as duas planilhas (.csv)

Use quando não houver o JSON. São separadas por ponto e vírgula, com valores em reais no formato brasileiro.

- **resumo.csv:** uma linha por produtor, com faturamento, número de vendas, ticket médio, valores por forma de pagamento, mais vendido, menos vendido, saída por faixa de preço, tempo para esgotar, reposição, produtos sem venda e "Vendas por hora".
- **produtos.csv:** uma linha por produto de cada produtor, com levou, vendeu, restou, repôs, faturamento, "esgotou às" e "tempo para esgotar".

**Limites das planilhas** (avise no relatório):
- Não têm cada venda separada. A curva de 30 em 30 minutos vira **curva por hora**, a partir da coluna "Vendas por hora".
- Não têm categoria de produto. A seção "Categorias" agrupa pelo **nome** do produto (café, queijo, doce...) e avisa que é um agrupamento por nome.
- Não têm contagem de fechamento nem observações dos produtores. Essas seções saem do relatório.

---

## Parte 4: como calcular (a tabela de métricas)

Se a IA puder executar código, **rode o script do Apêndice A** e use só a saída dele. Se não puder, siga estes passos exatamente.

**Preparação**
1. Ignore as vendas com `cancelada: true` (conte quantas são).
2. Ordene as vendas pelo horário.
3. Para cada produto de cada produtor: **disponível = qtd_inicial + soma das reposições**.

**Por produto**
- **Vendido** = soma de `qtd` desse produto em todas as vendas válidas.
- **Faturamento** = soma de `qtd × preco_unit`.
- **Restou** = disponível − vendido.
- **Taxa de venda** = vendido ÷ disponível × 100, com uma casa decimal.
- **Esgotou às** = horário da venda que fez o vendido chegar ao disponível. Só existe se o saldo chegou a zero e não vale para vendas `lancada_depois`.
- **Minutos para esgotar** = esgotou às − horário de início da feira.
- **Faixa de preço**: dentro de cada produtor, ordene os produtos pelo preço e divida em terços: barato, médio e caro. Produtor com um só produto fica como "faixa única", fora dessa comparação.

**Por produtor**
- Levou, vendeu, restou, taxa, faturamento, número de vendas e **ticket médio** (faturamento ÷ número de vendas).
- Forma de pagamento principal (a de maior valor), primeira e última venda, **horário de pico** (a hora cheia com mais vendas).
- **Estoque zerado**: vendeu tudo o que levou. Informe o horário em que o último produto acabou.
- **Primeiro produto esgotado**, mais vendido (em quantidade), menos vendido (menor taxa) e produtos sem venda.

**Geral da feira**
- Participantes, comunidades distintas, levou, vendeu, restou.
- **Taxa geral de vendas** = total vendido ÷ total disponível. Não confunda com a **média das taxas individuais**: se citar esta, use exatamente esse nome.
- Faturamento total, número de vendas, vendas canceladas, ticket médio.
- Formas de pagamento: em valor (R$ e %) e em número de vendas (quantidade e %).
- **Curva do dia**: número de vendas e R$ a cada 30 minutos (09:00, 09:30, 10:00...).
- **Categorias**: disponível, vendido, taxa, faturamento e número de bancas com aquela categoria.
- **Rankings**: por taxa de venda (empate: maior quantidade vendida) e por faturamento.
- **Produtos esgotados**, em ordem de horário.

**Conferências obrigatórias** (se falharem, refaça os cálculos):
- levou − vendeu = restou, no geral e por produtor.
- A soma do faturamento dos produtores é igual ao faturamento total.

---

## Parte 5: alertas

Antes de escrever, liste os problemas dos dados:

| Tipo | Quando | O que fazer |
|---|---|---|
| **BLOQUEANTE** | Vendido maior que o disponível (reposição não lançada no app?) | Gere mesmo assim, marque o produto com "*" e explique na Metodologia. |
| **BLOQUEANTE** | Venda de produto que não está no estoque | Idem: o produtor vendeu algo que não marcou como levado. |
| AVISO | Venda fora do horário (30 min antes do início ou 60 min depois do fim) | Cite na Metodologia. |
| AVISO | Total da venda diferente da soma dos itens | Cite na Metodologia. |
| AVISO | Contagem final diferente do saldo do app | Seção "Estoque e reposição": "vendas não registradas ou perdas". |
| AVISO | Produtor só com prévia (não finalizou) | "RELATÓRIO PRELIMINAR" na capa. |

Ao entregar, informe numa lista curta os alertas encontrados.

---

## Parte 6: regras de redação

- **"Taxa geral de vendas"** = vendidos ÷ disponíveis. Nunca chame a média das taxas individuais de "taxa geral".
- **"Esgotou"** só quando o saldo chegou a zero. Banca que zerou tudo: "estoque zerado às HH:MM". Caso contrário: "o primeiro produto a esgotar foi X, às HH:MM".
- **Faixa de preço** é relativa ao portfólio de cada produtor, nunca comparando produtores diferentes.
- **Presença de uma categoria** (ex.: "café") = bancas com algum produto dela ÷ total de bancas.
- **Queda de movimento** (ex.: "após as 13h") só se a curva do dia mostrar, citando os números.
- **Demanda reprimida**: produto que esgotou antes de 60% da duração da feira. Pode dizer "esgotou com X minutos de feira pela frente". Estimativa de vendas perdidas só se estiver escrita como **estimativa**.
- **Citações entre aspas** só de observações com `citacao_autorizada: true`, com o nome do produtor. Sem isso, resuma a ideia sem aspas e sem nome. Nunca escreva "consenso geral".
- **Comparativo com edições anteriores**: liste todas as edições do ano, em ordem. Edição sem dados aparece como "s/ dados", nunca omitida. Edições antigas feitas por formulário não têm faturamento: mostre "—".
- **Comunidades**: conte valores distintos. Se uma for localidade de outra, explique.
- **Nomes de lugares** sempre completos (ex.: "São Manoel do Carangola"), nunca cortados.

---

## Parte 7: perguntas que os relatórios respondem

Use estas perguntas para guiar a análise. Cada resposta precisa de um número dos dados.

**Visão geral**
1. Quantos produtores participaram e de quantas comunidades?
2. Quanto foi levado, quanto foi vendido e quanto sobrou? Qual a taxa geral de vendas?
3. Qual foi o faturamento total, o número de vendas e o ticket médio?

**Movimento**
4. Em que horário a feira teve mais movimento? Houve queda? A partir de quando?
5. A feira começou forte ou demorou a engrenar? (primeira meia hora × pico)

**Produtos**
6. Quais produtos esgotaram e em quantos minutos de feira? Houve demanda reprimida?
7. Quais categorias tiveram melhor taxa de venda e maior faturamento?
8. Quais produtos não venderam nada?
9. Produtos caros, médios ou baratos: qual faixa vendeu melhor e qual trouxe mais faturamento?

**Produtores**
10. Quem teve a maior taxa de venda? E o maior faturamento?
11. Quem zerou o estoque e a que horas?
12. Quem repôs durante a feira e quem esgotou sem repor?

**Pagamentos**
13. Qual a participação do Pix, do dinheiro e do cartão, em valor e em número de vendas?

**Organização e próximas edições**
14. O que os produtores relataram para a organização?
15. Quais ajustes os dados sugerem? (horário, infraestrutura, mix de produtos, meios de pagamento) Cada recomendação precisa se apoiar num número.
16. Como esta edição se compara às anteriores?

---

## Parte 8: modelos dos relatórios

### 8.1 Relatório VERDE: descritivo, PDF A4 retrato

**Identidade visual:** verde #2E6B33 (títulos), verde escuro #1F4D24, dourado #C5A028 (réguas e destaques), caixa de destaque #EEF3EE com barra lateral dourada, texto #333333, cinza #666666. Fonte Helvetica ou Arial. Margens de 2 cm.
- **Cabeçalho:** "Relatório – Nª Feira do Inventário Rural e Cultural | Local | Carangola-MG".
- **Rodapé:** "Página X de Y".
- **Cores do ranking por taxa:** ≥95% #1F6B2E · 80–94% #7FB069 · 60–79% #E2B53C · <60% #C0504D.

**Capa:** selo dourado da Feira, PREFEITURA MUNICIPAL DE CARANGOLA, Secretaria de Cultura, Turismo e Patrimônio Histórico de Carangola - MG, RELATÓRIO ANALÍTICO, régua dourada, "Nª FEIRA DO INVENTÁRIO RURAL E CULTURAL", local, data, faixa "Dados registrados pelo app AGRO Gestão", linha "N Produtores | N Vendas | R$ faturamento | N Comunidades" e mês/ano.

**Sumário**, com as páginas reais, depois:
1. Introdução
2. Metodologia: fonte (app AGRO Gestão: estoque levado e cada venda registrada), horário da feira, número de vendas e de canceladas, reposições, contagem de fechamento, alertas e prévias.
3. Resultados gerais: cards com produtores, disponível, vendido, restante, taxa geral, faturamento, vendas e ticket médio.
4. Curva de movimento do dia: vendas e R$ a cada 30 minutos, com pico e queda.
5. Ranking por taxa de venda e por faturamento, com os totais.
6. Velocidade: linha do tempo dos produtos esgotados (horário e minutos de feira).
7. Meios de pagamento: por valor e por número de vendas.
8. Categorias de produto: disponível, vendido, taxa, faturamento e número de bancas.
9. Faixas de preço: participação no faturamento.
10. Análise individual de cada produtor: card com comunidade; tabela por produto (inicial, reposição, vendido, restou, taxa, R$); faturamento, ticket médio, horário de pico, primeiro produto esgotado e um **destaque** de 3 a 4 frases só com números do próprio produtor.
11. Estoque e reposição: quem repôs, quem esgotou sem repor (demanda reprimida), diferenças da contagem.
12. Observações dos produtores (se houver).
13. Comparativo com edições anteriores.
14. Conclusões e recomendações, com um quadro de destaques.
- **Assinatura institucional** com os logotipos.

### 8.2 Relatório AZUL: apresentação, PDF 16:9 (1920 × 1080)

**Identidade visual:** azul-marinho #1B2A4A, dourado #C9A84C, fundo #F8F9FB, cards brancos com sombra suave e filete dourado, texto #5A6478. Fonte Inter, ou Helvetica/Arial.
- **Capa e conclusão:** fundo marinho. Demais slides em fundo claro.
- **Títulos:** em maiúsculas e marinho, com subtítulo cinza e régua dourada.
- **Rodapé:** "SECRETARIA DE CULTURA, TURISMO E PATRIMÔNIO HISTÓRICO DE CARANGOLA/MG" à esquerda, e "FEIRA DO INVENTÁRIO RURAL E CULTURAL • ANO • SLIDE NN" à direita.
- **Gráficos:** rosca e barras em marinho, dourado e cinza #9AA3B5.

1. Capa: faixa dourada lateral, "APRESENTAÇÃO EXECUTIVA", título com INVENTÁRIO em dourado, selo, data, órgão e local.
2. Visão geral: 6 cards (produtores, vendidos, faturamento, vendas, ticket médio, restantes) e a rosca da taxa geral.
3. Comparativo geral: barras Disponível/Vendido/Restou por produtor, mais cards de maior faturamento e estoque zerado.
4. Ranking de eficiência: pódio e barras horizontais, com a linha da taxa geral.
5. Curva do dia: vendas a cada 30 minutos, com o pico destacado.
6. Quem esgotou mais rápido: linha do tempo dos produtos esgotados.
7. Meios de pagamento: rosca por valor e cards.
8. Categorias e produtos campeões.
9. Faixas de preço: participação no faturamento.
10. Estoque e reposição: demanda reprimida.
11. Os 5 destaques, em cards (taxa, vendido/disponível, R$, hora do esgotamento, pagamento principal).
12. Voz dos produtores (sem observações: "Oportunidades" tiradas dos dados).
13. Comparativo cruzado: tabela completa por produtor.
14. Evolução entre edições: taxa geral, volume e faturamento.
15. Recomendações estratégicas: grade 2 × 3, cada uma apoiada num número.
16. Conclusão e próximos passos, em fundo marinho.

---

## Parte 9: conferência antes de entregar

- [ ] levou − vendeu = restou, no geral e por produtor.
- [ ] O faturamento total é igual nos dois relatórios e à soma dos produtores.
- [ ] Todos os números do Azul existem no Verde.
- [ ] Nenhum texto cortado, nenhuma tabela ou card partido entre páginas, nenhum elemento sobreposto.
- [ ] O sumário bate com as páginas reais.
- [ ] Datas, local, edição e nomes completos corretos.
- [ ] "RELATÓRIO PRELIMINAR" na capa, se algum produtor não finalizou.
- [ ] Alertas listados na Metodologia e informados na resposta.
- [ ] Citações entre aspas só com autorização.

Na resposta final, entregue os 2 PDFs e um resumo de 3 números: taxa geral, faturamento e o principal destaque, além dos alertas.

---

## Parte 10: pedidos prontos

- *"Gere o relatório Verde e o Azul da feira de 12/12/2026, 5ª edição. Dados em anexo."*
- *"Gere só o relatório Azul, para a reunião de amanhã."*
- *"Refaça o slide 5 com a curva por hora em vez de 30 minutos."*
- *"Compare esta edição com a de 14/03/2026 (dados em anexo)."*
- *"Liste os alertas dos dados antes de gerar os relatórios."*

---

## Apêndice A: script de cálculo (para IAs que executam código)

Rode com o arquivo "dados do dia": `python metricas.py dados.json`. Ele gera `metricas.json`, que é a única fonte dos números dos dois relatórios, e `alertas.txt`.

```python
import json, sys, statistics as st
from collections import defaultdict, Counter
from datetime import datetime, timedelta

D = json.load(open(sys.argv[1], encoding='utf-8'))
ev = D['evento']; dia = ev['data']
# Tudo no fuso de Brasília: a hora das vendas vem com -03:00.
T = lambda h: datetime.fromisoformat(h if 'T' in h else f"{dia}T{h}-03:00")
abre, fecha = T(ev['inicio']), T(ev['fim']); dur = (fecha - abre).total_seconds() / 60
prod = {p['id']: p for p in D['produtores']}
alertas = []
E = {}
for e in D['estoque']:
    k = (e['produtor_id'], e['produto_id'])
    e['repos'] = sum(r['qtd'] for r in e.get('reposicoes', []))
    e['disp'] = e['qtd_inicial'] + e['repos']; e['vend'] = 0; e['fat'] = 0.0
    E[k] = e
vendas = sorted([v for v in D['vendas'] if not v.get('cancelada')], key=lambda v: v['hora'])
canc = sum(1 for v in D['vendas'] if v.get('cancelada'))
depois = sum(1 for v in vendas if v.get('lancada_depois'))
for v in vendas:
    h = T(v['hora'])
    if not v.get('lancada_depois') and not (abre - timedelta(minutes=30) <= h <= fecha + timedelta(minutes=60)):
        alertas.append(f"AVISO venda {v['id']} fora do horário ({v['hora']})")
    soma = 0
    for it in v['itens']:
        k = (v['produtor_id'], it['produto_id'])
        if k not in E:
            alertas.append(f"BLOQUEANTE venda {v['id']}: produto sem estoque cadastrado {k}"); continue
        e = E[k]; e['vend'] += it['qtd']; e['fat'] += it['qtd'] * it['preco_unit']; soma += it['qtd'] * it['preco_unit']
        if e['vend'] >= e['disp'] and 'hora_esgotou' not in e and not v.get('lancada_depois'):
            e['hora_esgotou'] = h
    if abs(soma - v['total']) > 0.01:
        alertas.append(f"AVISO venda {v['id']}: total {v['total']} diferente da soma dos itens {soma:.2f}")
fech = {(f['produtor_id'], f['produto_id']): f['contado'] for f in D.get('fechamento', [])}
for k, e in E.items():
    e['restou'] = e['disp'] - e['vend']
    if e['restou'] < 0:
        alertas.append(f"BLOQUEANTE {e['produto']} ({prod[k[0]]['nome_curto']}): vendido {e['vend']} > disponível {e['disp']} (reposição não lançada no app?)")
    if k in fech and fech[k] != e['restou']:
        e['divergencia'] = e['restou'] - fech[k]
        alertas.append(f"AVISO {e['produto']} ({prod[k[0]]['nome_curto']}): saldo do app {e['restou']} × contagem {fech[k]} (diferença {e['divergencia']})")
    e['taxa'] = round(100 * e['vend'] / e['disp'], 1) if e['disp'] else 0
    if 'hora_esgotou' in e: e['min_esgotar'] = round((e['hora_esgotou'] - abre).total_seconds() / 60)
for pid in prod:
    itens = sorted([e for e in E.values() if e['produtor_id'] == pid], key=lambda e: e['preco'])
    n = len(itens)
    for i, e in enumerate(itens):
        e['faixa'] = 'unica' if n == 1 else ('barato' if i < n / 3 else ('caro' if i >= 2 * n / 3 else 'medio'))
def pagamentos_da_venda(v):
    return [(p['forma'], p['valor']) for p in v['pagamentos']] if v.get('pagamentos') else [(v['pagamento'], v['total'])]
P = []
for pid, p in prod.items():
    it = [e for e in E.values() if e['produtor_id'] == pid]
    vs = [v for v in vendas if v['produtor_id'] == pid]
    L = sum(e['disp'] for e in it); V = sum(e['vend'] for e in it); fat = sum(e['fat'] for e in it)
    pag = defaultdict(float)
    for v in vs:
        for forma, valor in pagamentos_da_venda(v): pag[forma] += valor
    hs = Counter(T(v['hora']).strftime('%H:00') for v in vs if not v.get('lancada_depois'))
    esg = [e for e in it if 'min_esgotar' in e]
    fx = defaultdict(float)
    for e in it: fx[e['faixa']] += e['fat']
    P.append({**p, 'levou': L, 'vendeu': V, 'restou': L - V, 'taxa': round(100 * V / L, 1) if L else 0,
      'faturamento': round(fat, 2), 'transacoes': len(vs), 'ticket_medio': round(fat / len(vs), 2) if vs else 0,
      'pagamento_valor': dict(pag), 'pagamento_principal': max(pag, key=pag.get) if pag else None,
      'primeira_venda': vs[0]['hora'] if vs else None, 'ultima_venda': vs[-1]['hora'] if vs else None,
      'hora_pico': hs.most_common(1)[0][0] if hs else None,
      'estoque_zerado': L > 0 and L == V,
      'min_estoque_zerado': max(e['min_esgotar'] for e in it) if it and all('min_esgotar' in e for e in it) else None,
      'primeiro_produto_esgotado': min(esg, key=lambda e: e['min_esgotar'])['produto'] if esg else None,
      'repos': sum(e['repos'] for e in it), 'faturamento_por_faixa': dict(fx),
      'mais_vendido': max(it, key=lambda e: e['vend'])['produto'] if it else None,
      'menos_vendido': min(it, key=lambda e: e['taxa'])['produto'] if it else None,
      'sem_venda': [e['produto'] for e in it if e['vend'] == 0],
      'itens': [{k: e[k] for k in ('produto', 'categoria', 'preco', 'qtd_inicial', 'repos', 'disp', 'vend', 'restou', 'taxa', 'fat', 'faixa')}
                | ({'min_esgotar': e['min_esgotar']} if 'min_esgotar' in e else {}) for e in it]})
L = sum(p['levou'] for p in P); V = sum(p['vendeu'] for p in P); FAT = sum(p['faturamento'] for p in P)
curva = defaultdict(lambda: [0, 0.0])
for v in vendas:
    if v.get('lancada_depois'): continue
    h = T(v['hora']); b = h.replace(minute=0 if h.minute < 30 else 30, second=0).strftime('%H:%M')
    curva[b][0] += 1; curva[b][1] += v['total']
pagv = defaultdict(float); pagn = Counter()
for v in vendas:
    for forma, valor in pagamentos_da_venda(v): pagv[forma] += valor
    pagn[v['pagamento']] += 1
cat = defaultdict(lambda: [0, 0, 0.0, set()])
for e in E.values():
    c = cat[e['categoria'] or 'Outros']; c[0] += e['disp']; c[1] += e['vend']; c[2] += e['fat']; c[3].add(e['produtor_id'])
M = {'evento': ev, 'situacao': D.get('situacao', {}), 'participantes': len(P), 'comunidades': sorted({p['comunidade'] for p in P if p['comunidade']}),
 'levou': L, 'vendeu': V, 'restou': L - V, 'taxa_global': round(100 * V / L, 1) if L else 0,
 'taxa_media_individual': round(st.mean(p['taxa'] for p in P), 1) if P else 0, 'taxa_mediana': round(st.median(p['taxa'] for p in P), 1) if P else 0,
 'faturamento_total': round(FAT, 2), 'transacoes': len(vendas), 'canceladas': canc, 'lancadas_depois': depois,
 'ticket_medio': round(FAT / len(vendas), 2) if vendas else 0,
 'pagamento_valor': {k: [round(v, 2), round(100 * v / FAT, 1) if FAT else 0] for k, v in pagv.items()},
 'pagamento_transacoes': {k: [v, round(100 * v / len(vendas), 1)] for k, v in pagn.items()},
 'curva_30min': {k: {'transacoes': a, 'valor': round(b, 2)} for k, (a, b) in sorted(curva.items())},
 'categorias': {k: {'disp': a, 'vend': b, 'taxa': round(100 * b / a, 1) if a else 0, 'faturamento': round(f, 2), 'bancas': len(s)} for k, (a, b, f, s) in cat.items()},
 'ranking_taxa': [p['nome_curto'] for p in sorted(P, key=lambda p: (-p['taxa'], -p['vendeu']))],
 'ranking_faturamento': [p['nome_curto'] for p in sorted(P, key=lambda p: -p['faturamento'])],
 'produtos_esgotados': sorted([{'produtor': prod[e['produtor_id']]['nome_curto'], 'produto': e['produto'], 'min': e['min_esgotar'],
                               'hora': e['hora_esgotou'].strftime('%H:%M')} for e in E.values() if 'min_esgotar' in e], key=lambda x: x['min']),
 'duracao_min': dur, 'produtores': P}
assert M['levou'] - M['vendeu'] == M['restou']
assert abs(sum(p['faturamento'] for p in P) - FAT) < 0.01
json.dump(M, open('metricas.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1, default=str)
open('alertas.txt', 'w', encoding='utf-8').write('\n'.join(alertas))
print({k: M[k] for k in ('participantes', 'levou', 'vendeu', 'restou', 'taxa_global', 'faturamento_total', 'transacoes', 'ticket_medio')})
print('\n'.join(alertas) or 'sem alertas')
```

---

*Documento preparado para a Secretaria de Cultura, Turismo e Patrimônio Histórico de Carangola/MG. Os dados vêm do app AGRO Gestão. Versão de outubro de 2026.*
