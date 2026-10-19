/**
 * Campo de lançamento por texto/voz com barra de sugestões — exemplo de referência (React).
 * Adapte ao design system do AGRO Gestão. Trata composição de IME (teclados chineses) e voz.
 */
import { useEffect, useRef, useState } from 'react';
import { motor } from '../linguagem/instancia'; // instância criada no boot (ver diretrizes 3.2)

export default function CampoLancamento({ onConfirmar, urlTranscricao, tokenApp }) {
  const [texto, setTexto] = useState('');
  const [sugestoes, setSugestoes] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [gravando, setGravando] = useState(false);
  const compondo = useRef(false);
  const timer = useRef(null);
  const gravador = useRef(null);

  const atualizarSugestoes = (valor) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSugestoes(motor.prever(valor).sugestoes), 80);
  };

  const aoDigitar = (e) => {
    const valor = e.target.value;
    setTexto(valor);
    // teclado chinês/Gboard em composição: espera terminar
    if (compondo.current || e.nativeEvent?.isComposing || e.nativeEvent?.keyCode === 229) return;
    atualizarSugestoes(valor);
  };

  const usarSugestao = (s) => {
    const novo = texto.slice(0, s.substituir.inicio) + s.texto + ' ' + texto.slice(s.substituir.fim).trimStart();
    setTexto(novo);
    atualizarSugestoes(novo);
  };

  const interpretar = (valor = texto) => {
    const r = motor.interpretar(valor);
    setResultado(r);
    if ('speechSynthesis' in window && r.itens.length) {
      const fala = new SpeechSynthesisUtterance(motor.fraseParaFalar(r));
      fala.lang = 'pt-BR';
      window.speechSynthesis.speak(fala);
    }
  };

  const confirmar = () => {
    motor.aprender(resultado, { textoDigitado: texto });
    onConfirmar?.(resultado);
    setTexto(''); setResultado(null); setSugestoes([]);
  };

  // Voz: apertar e falar → Worker (nuvem); se offline, o app pode usar o SpeechRecognizer nativo
  const iniciarVoz = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, noiseSuppression: true, echoCancellation: true } });
    const partes = [];
    const rec = new MediaRecorder(stream);
    rec.ondataavailable = (ev) => partes.push(ev.data);
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const form = new FormData();
      form.append('audio', new Blob(partes, { type: rec.mimeType }), 'fala.webm');
      form.append('keywords', JSON.stringify(motor.gerarKeywordsVoz()));
      form.append('prompt', motor.gerarPromptVoz());
      try {
        const r = await fetch(urlTranscricao, { method: 'POST', headers: { authorization: `Bearer ${tokenApp}` }, body: form });
        const { texto: falado } = await r.json();
        setTexto(falado); interpretar(falado);
      } catch { /* sem internet: acionar reconhecimento nativo do aparelho */ }
    };
    gravador.current = rec; rec.start(); setGravando(true);
  };
  const pararVoz = () => { gravador.current?.stop(); setGravando(false); };

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div className="lancamento">
      {resultado && (
        <div className={`cartao-confirmacao ${resultado.pendencias.length || resultado.confianca < 0.85 ? 'atencao' : ''}`}>
          <p className="frase">{resultado.textoCorrigido}</p>
          {resultado.total != null && <p className="total">Total: R$ {resultado.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>}
          {resultado.pendencias.map((p) => <p key={p} className="pendencia">{p}</p>)}
          <div className="acoes">
            <button onClick={confirmar}>Confirmar</button>
            <button onClick={() => setResultado(null)}>Corrigir</button>
          </div>
        </div>
      )}
      <div className="barra-sugestoes" role="listbox">
        {sugestoes.map((s) => <button key={s.tipo + s.texto} className="chip" onClick={() => usarSugestao(s)}>{s.texto}</button>)}
      </div>
      <div className="linha-entrada">
        <input
          value={texto}
          onChange={aoDigitar}
          onCompositionStart={() => { compondo.current = true; }}
          onCompositionEnd={(e) => { compondo.current = false; atualizarSugestoes(e.target.value); }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) interpretar(); }}
          lang="pt-BR" inputMode="text" enterKeyHint="done"
          autoComplete="off" autoCorrect="off" spellCheck={false} autoCapitalize="sentences"
          placeholder="Ex.: vendi 3 cafés especiais a 25 no Pix"
        />
        <button className={`microfone ${gravando ? 'ativo' : ''}`} onPointerDown={iniciarVoz} onPointerUp={pararVoz} aria-label="Apertar e falar">🎤</button>
      </div>
    </div>
  );
}
