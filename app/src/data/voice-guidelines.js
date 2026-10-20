// Product knowledge, never a business record or a recognition accuracy promise.
export const VOICE_GUIDELINES = Object.freeze({
  version: 2,
  enabled: false,
  currentDecision: 'Voz retirada por pedido explícito em20/10/2026. Sem botão, serviço, permissão ou modelo empacotado. As especificações abaixo são históricas e só podem ser retomadas mediante novo pedido.',
  language: 'pt-BR',
  placement: 'Microfone ao lado de Todos em Produtos: cinza parado, azul com ondas durante a captura, cinza ao terminar.',
  engines: 'Android no aparelho somente com português instalado confirmado; alternativa Vosk small-pt-0.3 embarcada, sem Google ou internet. Sem transcrição remota automática.',
  quality: 'O produtor escolheu manter offline aceitando a limitação após solicitar precisão do GPT Voice. Não prometer equivalência. Voz experimental. Mostrar a transcrição editável e pedir escolha quando produto, apresentação ou quantidade forem ambíguos. Dicionário ajuda a interpretar, não recupera áudio ausente. Nunca prometer precisão sem piloto real.',
  safety: 'Microfone exclusivo para venda; não precisa dizer vendi. Um produto por fala. Três cafés gourmet pede a apresentação; três cafés gourmet 250 escolhe 250 g e prepara a página Venda com quantidade 3, se entendido com segurança. Somente produtos reais, preço atual e unidade do cadastro. A finalização é sempre no fluxo normal. Parcial, silêncio, ruído, erro e cancelamento não movimentam estoque nem criam venda.',
  audio: 'Captura em primeiro plano, PCM 16 bits mono a 16 kHz no Vosk; medidor de nível e aviso de volume baixo/saturação. Redução de ruído opcional quando suportada. Encerrar e liberar microfone/modelo ao sair, interromper ou terminar. Sem guardar áudio.',
  persistence: 'Diretrizes e léxico linguístico embarcados, separados do catálogo de sugestões e dos registros reais; preservados em atualizações e backup. Nenhum aprendizado automático por transcrição incerta.',
  rollback: 'Preservar o APK 0.12.14 e seu certificado. Se o produtor pedir remoção, publicar versão de código maior sem voz, mantendo dados; nunca desinstalar ou limpar para retornar.',
});
