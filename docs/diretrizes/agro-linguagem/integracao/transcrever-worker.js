/**
 * Cloudflare Worker — ponte segura de transcrição de voz do AGRO Gestão.
 * O APK NUNCA guarda a chave da OpenAI: ele envia o áudio para cá.
 *
 * Deploy:  wrangler secret put OPENAI_API_KEY
 *          wrangler secret put APP_TOKEN        (token simples do app para barrar abuso)
 *
 * ⚠ Os modelos gpt-transcribe / gpt-live-transcribe são de jul/2026. Antes de publicar,
 *   confira na documentação oficial (developers.openai.com/api/docs/guides/speech-to-text)
 *   o nome exato dos campos multipart para listas (keywords / languages) e o preço por minuto.
 *
 * Requisição do app (multipart/form-data):
 *   audio:    arquivo (m4a, mp3, wav, webm; até 25 MB)
 *   keywords: JSON string com array — motor.gerarKeywordsVoz()
 *   prompt:   motor.gerarPromptVoz()
 * Resposta: { texto }
 */
export default {
  async fetch(request, env) {
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return new Response('Método não permitido', { status: 405, headers: cors });
    if (request.headers.get('authorization') !== `Bearer ${env.APP_TOKEN}`) return new Response('Não autorizado', { status: 401, headers: cors });

    const entrada = await request.formData();
    const audio = entrada.get('audio');
    if (!audio || typeof audio === 'string') return json({ erro: 'Áudio ausente' }, 400, cors);
    if (audio.size > 25 * 1024 * 1024) return json({ erro: 'Áudio maior que 25 MB' }, 413, cors);

    let keywords = [];
    try { keywords = JSON.parse(entrada.get('keywords') ?? '[]'); } catch { keywords = []; }
    keywords = keywords.filter((k) => typeof k === 'string' && k && !/[<>\r\n]/.test(k)).slice(0, 60);

    const form = new FormData();
    form.append('file', audio, audio.name || 'fala.m4a');
    form.append('model', env.MODELO_TRANSCRICAO || 'gpt-transcribe');
    form.append('prompt', String(entrada.get('prompt') ?? '').slice(0, 1000));
    // Campos de lista — CONFIRMAR o formato na doc (ex.: "keywords[]" repetido ou JSON):
    keywords.forEach((k) => form.append('keywords[]', k));
    form.append('languages[]', 'pt');

    const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST', headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` }, body: form,
    });
    if (!r.ok) {
      // Fallback automático para modelo anterior com prompt (sem keywords)
      const f2 = new FormData();
      f2.append('file', audio, audio.name || 'fala.m4a');
      f2.append('model', 'gpt-4o-transcribe');
      f2.append('language', 'pt');
      f2.append('prompt', `${String(entrada.get('prompt') ?? '')} Produtos: ${keywords.join(', ')}.`.slice(0, 1000));
      const r2 = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` }, body: f2 });
      if (!r2.ok) return json({ erro: 'Falha na transcrição', detalhe: await r2.text() }, 502, cors);
      return json({ texto: (await r2.json()).text, modelo: 'gpt-4o-transcribe' }, 200, cors);
    }
    const dados = await r.json();
    return json({ texto: dados.text, modelo: env.MODELO_TRANSCRICAO || 'gpt-transcribe' }, 200, cors); // áudio não é armazenado
  },
};
const json = (obj, status, cors) => new Response(JSON.stringify(obj), { status, headers: { ...cors, 'content-type': 'application/json; charset=utf-8' } });
