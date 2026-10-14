---
name: "relatorios-feira-inventario"
description: "Gera os relatórios Verde (descritivo A4) e Azul (apresentação 16:9) da Feira do Inventário Rural e Cultural de Carangola a partir das vendas e estoques registrados no app (Cloudflare) ou de CSV/planilha."
---

# Relatórios da Feira do Inventário Rural e Cultural — Modelos VERDE e AZUL

## Quando usar
Sempre que houver dados de uma edição da Feira do Inventário Rural e Cultural (Carangola/MG) — export do app AGRO Gestão / Território OS no Cloudflare, JSON, CSV ou XLSX — ou quando o usuário disser "relatório verde", "relatório azul", "relatório da feira". Em execução agendada (após o dia de feira), gerar SEMPRE os dois.

- **VERDE** = relatório analítico descritivo, PDF A4 retrato, completo.
- **AZUL** = apresentação executiva, PDF 16:9 (1920×1080), 16 slides com o essencial do Verde.
- **Regra de ouro: os dois saem do MESMO `metricas.json`.** Nenhum número é digitado à mão; o Azul nunca diverge do Verde.

## Origem dos dados (modelo atual)
Os dados NÃO vêm mais de formulário preenchido pelos produtores. Vêm do próprio app:
1. Antes da feira, cada produtor cadastra no app o **estoque do evento** (produto, categoria, preço, quantidade inicial).
2. Durante a feira, cada venda é registrada na **seção de vendas** com horário, itens, quantidades, preço e meio de pagamento; reposições também são lançadas com horário.
3. Ao fechar a feira, o app tem o saldo de cada produto. Opcionalmente o produtor faz a **contagem física de fechamento** e responde ao **feedback rápido** (nota, se volta, observação).
Tudo — quantidade levada, vendida, restante, tempo de esgotamento, pico de movimento, faturamento, meios de pagamento — é **calculado** a partir dessas vendas. Nada é autodeclarado, exceto o feedback.

## Preferências fixas do usuário (obrigatórias)
- Entregável final sempre em **PDF**.
- Todo texto corrido **justificado** (`TA_JUSTIFY` no reportlab; `text-align: justify` em HTML).
- Tabelas, caixas de insight e cards **nunca quebram entre páginas** (`KeepTogether`, `CondPageBreak`); cards nunca se sobrepõem nem são cortados.
- Ícones **sempre pictogramas vetoriais contextuais** (café, queijo, bolo, PIX, relógio, cesta…). Proibido quadrado colorido decorativo vazio.
- Português do Brasil, tom institucional positivo e exato. Valores em R$ no formato brasileiro (R$ 1.234,56).
- Rodapé/assinatura com logos institucionais → skill `logos-institucionais`.

## Contrato de dados do app (export de um evento)
```json
{
 "evento": {"id":"feira-2026-11-21","edicao":9,"data":"2026-11-21","local":"Praça da Matriz","inicio":"09:00","fim":"14:00","clima":"opcional"},
 "produtores": [{"id":"p1","nome":"Maria Rita de Oliveira Santos","nome_curto":"Maria Rita","comunidade":"Borboleta","tenda":3}],
 "estoque": [{"produtor_id":"p1","produto_id":"b","produto":"Goiabada 500g","categoria":"Doces","unidade":"barra","preco":18.0,"qtd_inicial":8,
              "reposicoes":[{"hora":"11:00","qtd":4}]}],
 "vendas": [{"id":"v1","produtor_id":"p1","hora":"2026-11-21T09:14:32-03:00","itens":[{"produto_id":"b","qtd":2,"preco_unit":18.0}],
             "total":36.0,"pagamento":"PIX|DINHEIRO|CARTAO_DEBITO|CARTAO_CREDITO","cancelada":false,"publico":"opcional: JOVEM|ADULTO|IDOSO",
             "sincronizada_em":"2026-11-21T09:40:00-03:00"}],
 "fechamento": [{"produtor_id":"p1","produto_id":"b","contado":0}],
 "feedback": [{"produtor_id":"p1","nota":5,"pretende_voltar":true,"observacao":"texto livre","citacao_autorizada":true}]
}
```
- `hora` da venda = horário do aparelho **no momento da venda** (o app deve funcionar offline e sincronizar depois; `sincronizada_em` é só controle).
- `fechamento`, `feedback` e `publico` são opcionais: a seção correspondente só aparece se houver dados — nunca estimar.
- Edições antigas (1ª a 3ª, via Google Forms): usar o modo legado no fim deste documento.

## Fluxo
1. **Obter o export** (ver Cloudflare). Salvar o bruto em `bruto/<data>.json`; nunca editar o original.
2. **Rodar `metricas.py`** (abaixo) → `metricas.json` + `alertas.txt`.
3. **Alertas BLOQUEANTES** (vendido > disponível, venda de produto não cadastrado): com o usuário presente, perguntar; em execução agendada, gerar mesmo assim, marcando os produtos afetados e listando os alertas na Metodologia e na mensagem final.
4. Gerar **VERDE** (reportlab) e **AZUL** (HTML 1920×1080 → PDF via Chromium/Playwright, ou reportlab em página 16:9), ambos lendo apenas `metricas.json`. Gráficos em matplotlib (300 dpi) ou vetoriais — nunca barras feitas de caracteres.
5. **Conferir**: rasterizar as páginas (pdftoppm) e olhar cada uma; sumário × paginação real; nenhum texto truncado (ex.: "São Manoel do Carangola" inteiro).
6. Entregar os 2 PDFs com uma linha de contexto, resumo de 3 números (taxa geral, faturamento, destaque) e alertas, se houver.

## metricas.py (rodar sempre: `python3 metricas.py bruto/<data>.json`)
```python
import json, sys, statistics as st
from collections import defaultdict, Counter
from datetime import datetime, timedelta
D = json.load(open(sys.argv[1]))
ev = D['evento']; dia = ev['data']
T = lambda h: datetime.fromisoformat(h if 'T' in h else f"{dia}T{h}-03:00")  # tudo com fuso de Brasília (a hora das vendas vem com -03:00)
abre, fecha = T(ev['inicio']), T(ev['fim']); dur = (fecha-abre).total_seconds()/60
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
for v in vendas:
    h = T(v['hora'])
    if not (abre - timedelta(minutes=30) <= h <= fecha + timedelta(minutes=60)):
        alertas.append(f"AVISO venda {v['id']} fora do horário ({v['hora']})")
    soma = 0
    for it in v['itens']:
        k = (v['produtor_id'], it['produto_id'])
        if k not in E: alertas.append(f"BLOQUEANTE venda {v['id']}: produto sem estoque cadastrado {k}"); continue
        e = E[k]; e['vend'] += it['qtd']; e['fat'] += it['qtd']*it['preco_unit']; soma += it['qtd']*it['preco_unit']
        if e['vend'] >= e['disp'] and 'hora_esgotou' not in e: e['hora_esgotou'] = h
    if abs(soma - v['total']) > 0.01: alertas.append(f"AVISO venda {v['id']}: total {v['total']} ≠ soma dos itens {soma:.2f}")
fech = {(f['produtor_id'], f['produto_id']): f['contado'] for f in D.get('fechamento', [])}
for k, e in E.items():
    e['restou'] = e['disp'] - e['vend']
    if e['restou'] < 0: alertas.append(f"BLOQUEANTE {e['produto']} ({prod[k[0]]['nome_curto']}): vendido {e['vend']} > disponível {e['disp']} — reposição não lançada no app?")
    if k in fech and fech[k] != e['restou']:
        e['divergencia'] = e['restou'] - fech[k]
        alertas.append(f"AVISO {e['produto']} ({prod[k[0]]['nome_curto']}): saldo do app {e['restou']} × contagem {fech[k]} (diferença {e['divergencia']})")
    e['taxa'] = round(100*e['vend']/e['disp'], 1) if e['disp'] else 0
    if 'hora_esgotou' in e: e['min_esgotar'] = round((e['hora_esgotou']-abre).total_seconds()/60)
# faixas de preço relativas ao portfólio de cada produtor
for pid in prod:
    itens = sorted([e for e in E.values() if e['produtor_id'] == pid], key=lambda e: e['preco'])
    n = len(itens)
    for i, e in enumerate(itens):
        e['faixa'] = 'unica' if n == 1 else ('barato' if i < n/3 else ('caro' if i >= 2*n/3 else 'medio'))
P = []
for pid, p in prod.items():
    it = [e for e in E.values() if e['produtor_id'] == pid]
    vs = [v for v in vendas if v['produtor_id'] == pid]
    L = sum(e['disp'] for e in it); V = sum(e['vend'] for e in it); fat = sum(e['fat'] for e in it)
    pag = defaultdict(float)
    for v in vs: pag[v['pagamento']] += v['total']
    hs = Counter(T(v['hora']).strftime('%H:00') for v in vs)
    esg = [e for e in it if 'min_esgotar' in e]
    fx = defaultdict(float)
    for e in it: fx[e['faixa']] += e['fat']
    P.append({**p, 'levou': L, 'vendeu': V, 'restou': L-V, 'taxa': round(100*V/L, 1) if L else 0,
      'faturamento': round(fat, 2), 'transacoes': len(vs), 'ticket_medio': round(fat/len(vs), 2) if vs else 0,
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
      'itens': [{k: e[k] for k in ('produto','categoria','preco','qtd_inicial','repos','disp','vend','restou','taxa','fat','faixa') } | ({'min_esgotar': e['min_esgotar']} if 'min_esgotar' in e else {}) for e in it]})
L = sum(p['levou'] for p in P); V = sum(p['vendeu'] for p in P); FAT = sum(p['faturamento'] for p in P)
curva = defaultdict(lambda: [0, 0.0])
for v in vendas:
    h = T(v['hora']); b = h.replace(minute=0 if h.minute < 30 else 30, second=0).strftime('%H:%M')
    curva[b][0] += 1; curva[b][1] += v['total']
pagv = defaultdict(float); pagn = Counter()
for v in vendas: pagv[v['pagamento']] += v['total']; pagn[v['pagamento']] += 1
cat = defaultdict(lambda: [0, 0, 0.0, set()])
for e in E.values():
    c = cat[e['categoria']]; c[0] += e['disp']; c[1] += e['vend']; c[2] += e['fat']; c[3].add(e['produtor_id'])
M = {'evento': ev, 'participantes': len(P), 'comunidades': sorted({p['comunidade'] for p in P}),
 'levou': L, 'vendeu': V, 'restou': L-V, 'taxa_global': round(100*V/L, 1) if L else 0,
 'taxa_media_individual': round(st.mean(p['taxa'] for p in P), 1), 'taxa_mediana': round(st.median(p['taxa'] for p in P), 1),
 'faturamento_total': round(FAT, 2), 'transacoes': len(vendas), 'canceladas': canc,
 'ticket_medio': round(FAT/len(vendas), 2) if vendas else 0,
 'pagamento_valor': {k: [round(v, 2), round(100*v/FAT, 1)] for k, v in pagv.items()},
 'pagamento_transacoes': {k: [v, round(100*v/len(vendas), 1)] for k, v in pagn.items()},
 'curva_30min': {k: {'transacoes': a, 'valor': round(b, 2)} for k, (a, b) in sorted(curva.items())},
 'categorias': {k: {'disp': a, 'vend': b, 'taxa': round(100*b/a, 1), 'faturamento': round(f, 2), 'bancas': len(s)} for k, (a, b, f, s) in cat.items()},
 'ranking_taxa': [p['nome_curto'] for p in sorted(P, key=lambda p: (-p['taxa'], -p['vendeu']))],
 'ranking_faturamento': [p['nome_curto'] for p in sorted(P, key=lambda p: -p['faturamento'])],
 'produtos_esgotados': sorted([{'produtor': prod[e['produtor_id']]['nome_curto'], 'produto': e['produto'], 'min': e['min_esgotar'], 'hora': e['hora_esgotou'].strftime('%H:%M')} for e in E.values() if 'min_esgotar' in e], key=lambda x: x['min']),
 'duracao_min': dur, 'produtores': P}
assert M['levou'] - M['vendeu'] == M['restou']
assert abs(sum(p['faturamento'] for p in P) - FAT) < 0.01
json.dump(M, open('metricas.json', 'w'), ensure_ascii=False, indent=1, default=str)
open('alertas.txt', 'w').write('\n'.join(alertas))
print({k: M[k] for k in ('participantes','levou','vendeu','restou','taxa_global','faturamento_total','transacoes','ticket_medio')})
print('\n'.join(alertas) or 'sem alertas')
```
Depois de rodar, agregar no texto (sem novos números inventados): satisfação = média de `feedback.nota` e % `pretende_voltar`; público = contagem de `vendas.publico` quando preenchido.

## Regras de redação
- "Taxa geral de vendas" = vendidos ÷ disponíveis (inicial + reposições). "Média das taxas individuais" é outra métrica; se citada, com esse nome.
- "Esgotou" só quando o saldo chegou a zero; o horário é o da venda que zerou o produto. Banca que zerou tudo = "estoque zerado às HH:MM"; senão "o primeiro produto a esgotar foi X, às HH:MM".
- Faixa de preço (caro/médio/barato) é relativa ao portfólio de cada produtor (terços por preço); produtor com um só produto entra como "faixa única" e fica fora dessa comparação.
- Presença de uma categoria (ex.: café) = nº de bancas com qualquer produto daquela categoria ÷ total de bancas (campo `categorias.<x>.bancas`).
- Queda de movimento (ex.: "após as 13h") só se a `curva_30min` mostrar isso — citar os números.
- Demanda reprimida: produtos esgotados antes de 60% da duração da feira. Pode-se citar "esgotou com X minutos de feira ainda pela frente"; estimativa de vendas perdidas só se rotulada como estimativa.
- Divergência entre saldo do app e contagem física = "vendas não registradas ou perdas", nunca culpar o produtor.
- Citações entre aspas só de `feedback.observacao` com `citacao_autorizada: true`, com o nome do produtor. Nada de "— Consenso geral".
- Comparativo histórico: todas as edições do ano na ordem; edição sem dados aparece como "s/ dados" (ex.: 2ª Feira, 18/04/2026), nunca omitida. Edições do modo legado não têm faturamento: mostrar "—" nessas colunas.
- Comunidades: contar valores distintos; se uma for localidade de outra (ex.: Teixeira, de Furriel), explicitar.

## Modelo VERDE — relatório descritivo (PDF A4)
Paleta: verde #2E6B33 (títulos), verde escuro #1F4D24, dourado #C5A028 (régua e destaques), caixa de insight #EEF3EE com barra lateral dourada, texto #333333, cinza #666666. Helvetica/Liberation Sans. Margens 2 cm. Cabeçalho "Relatório – Nª Feira do Inventário Rural e Cultural | Local | Carangola-MG"; rodapé "Página X de Y". Ranking: ≥95% #1F6B2E · 80–94% #7FB069 · 60–79% #E2B53C · <60% #C0504D.

- **Capa**: selo dourado do Inventário Rural (~5 cm), PREFEITURA MUNICIPAL DE CARANGOLA, Secretaria de Cultura, Turismo e Patrimônio Histórico de Carangola - MG, RELATÓRIO ANALÍTICO, régua dourada, "Nª FEIRA DO INVENTÁRIO RURAL E CULTURAL", local, data, faixa "Dados registrados pelo app AGRO Gestão", linha "N Produtores | N Vendas | R$ faturamento | N Comunidades", mês/ano.
- **Sumário** gerado da paginação real (dois passes).
1. Introdução
2. Metodologia — fonte (app, estoque do evento + registros de venda), horário da feira, nº de vendas/canceladas, reposições, contagem de fechamento, alertas e correções
3. Resultados gerais — KPIs (produtores, disponível, vendido, restante, taxa geral, faturamento, transações, ticket médio)
4. Curva de movimento ao longo do dia (vendas e R$ a cada 30 min; pico e queda)
5. Ranking por taxa de venda e por faturamento + totais consolidados
6. Velocidade — linha do tempo dos produtos esgotados (horário e minutos de feira)
7. Meios de pagamento — por valor e por nº de transações
8. Categorias de produto — disponível, vendido, taxa, faturamento, nº de bancas
9. Faixas de preço — participação no faturamento
10. Análise individual de cada produtor: card com comunidade/tenda, tabela por produto (inicial, reposição, vendido, restou, taxa, R$), faturamento, ticket médio, horário de pico, primeiro produto esgotado e INSIGHT (3–4 frases só com dados do próprio produtor)
11. Estoque e reposição — quem repôs, quem zerou sem repor (demanda reprimida), divergências da contagem
12. Feedback dos produtores e sugestões (se houver)
13. Comparativo com edições anteriores
14. Conclusões e recomendações + quadro de destaques
- Assinatura institucional com logos (skill `logos-institucionais`).

## Modelo AZUL — apresentação (PDF 16:9, 16 slides)
Paleta: navy #1B2A4A, dourado #C9A84C, fundo #F8F9FB, cards brancos com sombra suave e filete dourado, texto cinza #5A6478. Inter (ou Helvetica). Capa e conclusão em navy; demais em fundo claro. Título em caixa alta navy + subtítulo cinza + régua dourada; rodapé "SECRETARIA DE CULTURA, TURISMO E PATRIMÔNIO HISTÓRICO DE CARANGOLA/MG" à esquerda e "FEIRA DO INVENTÁRIO RURAL E CULTURAL • ANO • SLIDE NN" à direita. Gráficos: donuts e barras em navy/dourado/cinza #9AA3B5.

1. Capa (faixa dourada lateral, "APRESENTAÇÃO EXECUTIVA", título com INVENTÁRIO em dourado, selo, data, órgão, localização)
2. Visão geral — 6 cards KPI (produtores, vendidos, faturamento, transações, ticket médio, retorno/satisfação ou restantes) + donut da taxa geral
3. Comparativo geral — barras Disponível/Vendido/Restou por produtor + cards (maior faturamento, estoque zerado)
4. Ranking de eficiência — pódio + barras horizontais com linha da taxa geral
5. Curva do dia — vendas a cada 30 min com pico destacado
6. Quem esgotou mais rápido — linha do tempo dos produtos esgotados
7. Meios de pagamento — donut por valor + cards
8. Categorias e produtos campeões
9. Faixas de preço — participação no faturamento
10. Estoque e reposição — demanda reprimida
11. Top 5 destaques — cards (taxa, vendido/disponível, R$, hora de esgotamento, pagamento principal)
12. Voz dos produtores (feedback; sem feedback → "Oportunidades" derivadas dos dados)
13. Comparativo cruzado final — tabela completa vinda do metricas.json
14. Evolução entre edições (taxa geral, volume e faturamento por edição)
15. Recomendações estratégicas — grade 2×3, cada uma apoiada num número
16. Conclusão e próximos passos (navy)

## Modo agendado — buscar no Cloudflare
1. **Conector Cloudflare** (Developer Platform): consultar o D1 do app, ex.: `SELECT payload FROM exports WHERE evento_id = 'feira-<AAAA-MM-DD>'`, ou montar o JSON a partir das tabelas `produtores`, `estoque`, `vendas`, `fechamento`, `feedback` filtradas pelo evento.
2. **Endpoint de exportação do Worker** via WebFetch: `https://territorio-portfolio.territorio-portfolio.workers.dev/api/eventos/feira-<AAAA-MM-DD>/export.json?token=<chave do organizador>` (a chave vem no pedido da tarefa agendada; nunca gravar a chave em arquivo nem no relatório).
3. Sem acesso: avisar em uma frase e pedir o export — nunca inventar dados.
Se o evento ainda estiver aberto no app ou houver vendas não sincronizadas, gerar com "RELATÓRIO PRELIMINAR" na capa e avisar. Enviar os PDFs com status proativo.

Campos extras do export do app (ignorados pelo `metricas.py`, mas usados no texto):
- `situacao.relatorio_preliminar: true` → algum produtor só enviou a prévia automática (não finalizou a feira no app); nomes em `situacao.preliminares`. Gerar com "RELATÓRIO PRELIMINAR" e citar na Metodologia.
- `vendas[].lancada_depois: true` (+ `registrada_em`) → venda que o produtor esqueceu de registrar e lançou ao finalizar a feira; o horário é aproximado. Citar a quantidade na Metodologia; não usar essas vendas para "esgotou às".
- `vendas[].pagamentos` → venda com pagamento dividido; `pagamento` traz a forma de maior valor.
- `produtores[].tenda` pode vir `null` (o app não pergunta a tenda).
- Export sem produtores (`produtores: []`) = ninguém enviou ainda: avisar, não gerar.

## Modo legado (edições 1ª a 3ª, formulário Google Forms)
CSV com: Participante, Comunidade, Produtos, Levou, Vendeu, Restou, MaisVendeu, MenosVendeu, Caro, Medio, Barato, TempoEsgoto, Reposicao, MaiorLucro, MetodoPagamento, PublicoAlvo, Gostou, Voltar, Observacoes. Validar Levou − Vendeu = Restou (corrigir e registrar na Metodologia), manter a última resposta de cada produtor, calcular taxa geral = vendidos ÷ levados. Sem faturamento, curva horária ou horários reais: essas seções saem do relatório.