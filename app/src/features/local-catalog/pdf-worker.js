import {makeCatalogPDF,readCatalogPDF} from './pdf.js';
self.onmessage=async({data})=>{try{const result=data.kind==='generate'?await makeCatalogPDF(data.catalog):await readCatalogPDF(data.bytes,data.catalogs);self.postMessage({result},result instanceof Uint8Array?[result.buffer]:[]);}catch(e){self.postMessage({error:e.message||'Não foi possível ler o PDF. Use resposta por texto.'});}};
