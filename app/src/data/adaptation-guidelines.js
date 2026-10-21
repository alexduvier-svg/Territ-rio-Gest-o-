// Diretrizes de adaptação, memória e ação, instaladas na memória do app (model.data.adaptationGuidelines)
// e no backup. Fonte: docs/adaptacao/AGRO_Gestao_Diretrizes_Adaptacao_Memoria_Acao_Codex_Claude_Code.docx
// (v1.0, 21/10/2026). Conhecimento de referência: não é instrução executável e não autoriza vendas,
// baixas, envios ou compras. Auditoria do que já existia: docs/adaptacao/RELATORIO_AUDITORIA.md.
export const ADAPTATION_GUIDELINES = Object.freeze({
  version: 2,
  id: 'adaptation-memory-action',
  authority: 'reference_only',
  sources: ['docs/adaptacao/AGRO_Gestao_Diretrizes_Adaptacao_Memoria_Acao_Codex_Claude_Code.docx v1.0'],
  document: 'knowledge/adaptacao-memoria-acao.md',
  goal: 'Vender, consultar e repor estoque, acessar clientes e recuperar o trabalho em tela pequena e em celular de menor desempenho, preservando a integridade dos registros e as ações essenciais.',
  responsibilities: {
    operationalMemory: 'RAM de telas, imagens e tarefas: reduzir consumo nunca autoriza apagar vendas, rascunhos, documentos ou ações pendentes.',
    persistentMemory: 'Dados, preferências, regras e evidências: registros autoritativos separados de caches reconstruíveis; TTL só para clima, miniaturas e análises.',
    actionEngine: 'Decide, agenda e executa comandos: intenção → validação → identificador estável → comando persistido → transação → resultado → interface.',
  },
  policy: {
    service: 'src/features/adaptation/policy.js (um só serviço: layoutMode, heightMode, effectsMode, workloadMode, imageCacheBudget, heavyTaskConcurrency, reasonCode)',
    signals: 'Janela disponível, escala do texto, preferências de acessibilidade, o que o sistema expõe e o desempenho medido pelo próprio app. Nunca marca ou processador (Snapdragon, Exynos, MediaTek, Unisoc, Apple) por si só.',
    windows: '<360 estreita (subfaixa do produto) · 360–599 compacta · 600–839 média · ≥840 ampla · altura <480 compacta.',
    effects: 'Modo leve automático pelo medidor de quadros (installFrameBudget): >10% de ~150 quadros acima de 20 ms em 4 movimentos; reavaliado a cada 7 dias; decisão guardada só no aparelho. Menos efeitos e reduzir movimento prevalecem.',
    capable: 'Celulares capazes (processadores robustos) ficam com o efeito completo: o ajuste automático só alivia o aparelho que medir lentidão; nada é retirado de quem acompanha (OnePlus: 3,9% de quadros lentos, completo).',
    lightKeeps: 'O modo leve tira desfoque, sombras pesadas e animações decorativas; nunca tira preço, indicação de gravação, validação de quantidade, acesso ao carrinho ou áreas de toque.',
  },
  layout: [
    'Calcular pela área atual da janela (largura, altura, teclado, barras); polegadas, resolução e modelo não decidem.',
    'Alvos de toque de pelo menos 48 × 48 dp; não reduzir letras, preços ou botões para caber; quebrar linha e rolar.',
    'Não cortar nome, condição, peso, unidade, quantidade ou valor; cor de status sempre com texto ou símbolo.',
    'Rotação, tela dividida, teclado e escala preservam produto, carrinho, valores digitados e posição.',
    'Concluir sempre alcançável e acima do teclado; rodapé, carrinho e teclado não disputam espaço.',
  ],
  action: [
    'Agentes sugerem; só o serviço de domínio altera venda, preço, pagamento ou estoque.',
    'Mesma chave de operação nos novos toques e tentativas (operationId); consultar o resultado antes de repetir.',
    'Gravar só depois do disco confirmar (durable); falta de espaço gera erro recuperável, nunca falso sucesso.',
    'Prioridade: venda e reposição pedidas → consulta visível → sincronização → relatórios e análises.',
    'Modo leve não perde nem duplica venda, não muda fórmulas, não tira validação de saldo, não envia mensagem por conta própria.',
  ],
  decisions: [
    'D3 (decidido pelo produtor): Vender mantém três colunas compactas também abaixo de 360 dp (regra salesCards já aprovada); a sugestão de uma coluna da diretriz não se aplica à grade de venda. O nome quebra depois da primeira palavra em cartão estreito.',
    'Detector de aparelho fraco duplicado (interface.js e motion/index.js) consolidado no motor de movimento; a política central lê o resultado.',
  ],
  targets: 'Metas iniciais propostas (a calibrar em aparelho real): toque p95 ≤ 100 ms; abrir tela p95 ≤ 500 ms; início frio útil ≤ 3 s; gravar venda local p95 ≤ 500 ms; rolagem ≤ 5% de quadros fora do prazo; cache de imagens no leve 8–16 MiB; 1 tarefa pesada por vez no leve; zero perdas ou duplicações.',
  pending: [
    'Medições de início frio, gravação de venda e memória em aparelho básico (2–3 GB) ainda não feitas; Reno 16 e OnePlus medidos.',
    'Massa sintética (2500 produtos, 10000 vendas, 1000 clientes) e testes de encerramento no meio da gravação ainda pendentes.',
    'Páginas de memória de 16 KB e ABIs das bibliotecas nativas (voz) a auditar antes da publicação.',
    'iPhone: destino separado; APK não instala no iOS.',
  ],
});
