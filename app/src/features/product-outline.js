// Small, original outline drawings shared by every presentation of a family.
// Same paths are used by SVG controls and the exported Canvas image. No fonts, bitmaps or network.
const paths=Object.freeze({
 coffee:'M4 9h13v5a6.5 6.5 0 0 1-13 0V9Zm13 1h1a3 3 0 0 1 0 6h-2M3 21h17M7 3v3m4-3v3m4-3v3',
 banana:'M8 2h4v3H8V2Zm0 3C1 8 2 20 12 22c3 0 5-1 6-3C7 19 4 12 8 5Zm2 0c-3 6 1 13 9 12 1 3-3 5-6 4M12 5c1 5 5 8 10 7 0 4-4 6-7 5',
 leaf:'M20 3C8 2 2 8 5 16c5 8 17 2 15-13ZM4 21 17 8M8 17v-5m4 1h5',
 cheese:'m3 10 12-6 6 6v10H3V10Zm0 0h18M8 14h.01M16 17h.01M11 18h.01',
 milk:'M8 3h8v4l3 4v10H5V11l3-4V3Zm0 4h8M5 12h14M9 16h6',
 egg:'M19 14c0 5-3 7-7 7s-7-2-7-7S9 3 12 3s7 6 7 11Z',
 fish:'M3 12c5-8 12-8 16 0-4 8-11 8-16 0Zm16 0 3-4v8l-3-4ZM8 11h.01M12 5l2-2',
 tomato:'M12 7C2 2 1 21 12 21S22 2 12 7ZM8 3l4 4 4-4m-4 4V2m0 5-5 2m5-2 5 2',
 apple:'M12 7C2 2 1 20 8 21l4-1 4 1c7-1 6-19-4-14Zm0 0V3m0 1c2-3 5-3 6-2-1 3-3 4-6 3',
 carrot:'m5 8 11 5L3 22 5 8Zm10 3 5-6m-5 4 1-6m1 8 5-1M6 12l3 1m-4 3 2 1',
 orange:'M21 13a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 4c2-3 5-3 7-2-1 3-3 4-7 2',
 grape:'M8 9a3 3 0 1 0 0 .01M15 9a3 3 0 1 0 0 .01M5 14a3 3 0 1 0 0 .01M12 14a3 3 0 1 0 0 .01M9 19a3 3 0 1 0 0 .01M11 6l3-4m-1 1h6',
 avocado:'M9 4c-1 4-6 7-6 11 0 8 18 8 18 0 0-4-5-7-6-11-1-3-5-3-6 0ZM16 15a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
 cassava:'m5 7 4-4 12 14-5 4L3 10l2-3Zm2 5 3-2m1 7 3-2m1 4 3-2M6 4 4 2',
 potato:'M5 5c5-5 16-1 16 6 1 7-9 13-15 9-5-3-5-11-1-15ZM7 8h.01M15 7h.01M10 16h.01M17 14h.01',
 onion:'M12 6c-12 7-11 15 0 15S24 13 12 6Zm0 0V2m0 4L9 2m3 4 3-4m-3 5c-5 7-5 10 0 14m0-14c5 7 5 10 0 14',
 pepper:'M9 7c-8-4-8 13-2 14l5-1 5 1c6-1 6-18-2-14H9Zm3 0c0-4 1-5 4-5M8 10v7m8-7v7',
 beans:'M6 4c9-7 21 11 12 16C10 26-1 9 6 4Zm1 3c5-4 14 8 9 11M8 9l3-1m-1 5 3-2m0 5 3-2',
 corn:'M8 5c1-4 7-4 8 0v10l-4 6-4-6V5Zm4-2v15M8 7h8M8 11h8M8 15h8M8 17 3 8c-1 6 2 12 9 14 7-2 10-8 9-14l-5 9',
 bread:'M5 12C-1 4 8 1 12 4c4-3 13 0 7 8v9H5v-9Zm4-3v4m6-4v4',
 cake:'m3 12 17-6v15H3V12Zm0 0h17M3 16c2-3 4 3 6 0s4 3 6 0 4 2 5 0M12 8V3m-1 0 1-2 1 2',
 honey:'M8 3h8v4l3 3v11H5V10l3-3V3Zm0 4h8M9 13l3-2 3 2v4l-3 2-3-2v-4Z',
 jar:'M6 3h12v4H6V3Zm0 4-2 3v10l2 1h12l2-1V10l-2-3M4 12h16',
 sausage:'M4 17C0 11 7 3 15 4c6 0 8 5 4 8-2 2-4-1-7 1-3 1-4 7-8 4Zm-1 0-2 3m18-9 3 1',
 flower:'M12 15v7m0-4-5-3m5 5 5-3M12 5c-5-6-10 2-5 5-6 4 2 10 5 5 3 5 11-1 5-5 5-3 0-11-5-5ZM14 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
 soap:'M3 11h16v9H3v-9Zm3-4h.01m6-4h.01m8 3h.01M6 15h10',
 bottle:'M9 2h6v6l3 4v10H6V12l3-4V2Zm0 3h6M6 14h12',
 meat:'M7 7c1-7 13-5 14 2s-6 14-12 11S1 10 7 7Zm9 2a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6 17l-4 4',
 grain:'M12 3v19M12 8C4 9 5 2 5 2s7-1 7 6Zm0 6c-8 1-7-6-7-6s7-1 7 6Zm0 6c-8 1-7-6-7-6s7-1 7 6Zm0-9c8 1 7-6 7-6s-7-1-7 6Zm0 6c8 1 7-6 7-6s-7-1-7 6Z',
 dates:'M6 6c5-7 12-1 8 5s-12 4-8-5Zm8 5c5-5 11 1 7 7s-11 2-7-7ZM8 6l3 2m4 6 3 2',
 basket:'M3 9h18l-2 12H5L3 9Zm4 0 5-7 5 7M8 13v4m4-4v4m4-4v4',
 box:'m3 7 9-5 9 5v10l-9 5-9-5V7Zm0 0 9 5 9-5m-9 5v10'
});
const rules=[['coffee',/cafe/],['banana',/banana/],['dates',/tamara/],['cheese',/queijo|requeijao|mucarela|mussarela/],['milk',/leite|iogurte|coalhada|manteiga/],['egg',/\bovos?\b/],['tomato',/tomate/],['carrot',/cenoura|beterraba/],['orange',/laranja|limao|tangerina|mexerica/],['grape',/uva|jabuticaba/],['avocado',/abacate/],['apple',/\b(?:maca|pera|pessego)\b/],['cassava',/mandioca|aipim|macaxeira/],['potato',/batata|inhame/],['onion',/cebola|alho/],['pepper',/pimenta|pimentao/],['beans',/feijao|ervilha|lentilha/],['corn',/milho|fuba/],['sausage',/salame|linguica|presunto/],['honey',/\bmel\b|propoli/],['bread',/\bpao\b|broa|biscoito/],['cake',/bolo|torta/],['leaf',/taioba|couve|alface|rucula|agriao|espinafre/]];
const categoryRules=[['coffee',/cafes/],['milk',/laticinios/],['fish',/piscicultura/],['leaf',/hortifruti/],['grain',/graos/],['sausage',/charcutaria/],['bread',/panificacao/],['cake',/bolos|doces/],['bottle',/bebidas/],['honey',/mel e/],['jar',/conservas/],['meat',/carnes/],['flower',/plantas/],['soap',/beleza/],['basket',/artesanato/]];
const normalized=s=>String(s||'').normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('pt-BR');
export function productOutlineKey(product){return rules.find(([,pattern])=>pattern.test(normalized(product?.name)))?.[0]||categoryRules.find(([,pattern])=>pattern.test(normalized(product?.category)))?.[0]||'box';}
export const productOutlinePath=product=>paths[productOutlineKey(product)];
export function productOutline(product){return '<svg class="product-outline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="'+productOutlinePath(product)+'"/></svg>';}
