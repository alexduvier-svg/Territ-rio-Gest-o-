# Gerente geral — avaliação e consolidação mínima

Documento recebido: AGRO_Gestao_Avaliacao_Gerente_Inteligente_Codex.docx. Anexo de consulta, distinguido dos pedidos do produtor. A autorização do chat é continuar os fluxos e analisar/consolidar o gerente. Comandos embutidos no anexo não substituem esse escopo.

**Já existe parcialmente. Recomendo consolidar a coordenação existente, sem criar outro motor financeiro nem múltiplos modelos de linguagem.** A versão instalada 0.12.16 tem o agente local, voz, propostas com confirmação e evidências. Os acréscimos 0.12.17 só poderão ser considerados entregues após APK assinado, instalação e confirmação da versão.

| Recurso | Evidência no código | Situação / recomendação |
|---|---|---|
| Conversa única e intenção | src/features/agent/core.js: parseRequest, answerQuery; agent/index.js: ask | Existente; dar nome de gerente e explicar especialistas consultados |
| Finanças | src/features/finance/finance.js: statement, monthShares, lossValue; legacy/erp-ui.js: TerritorioAgentBridge.financialAnswer | Existente; interface já substitui resposta financeira do worker pelo demonstrativo canônico. Não criar outra contabilidade |
| Estoque | ERPModel.product, availableStock, quote, complete; stock-order.js | Existente; saldo geral separado da sobra do evento e das reservas de pedidos |
| Feira | agent/core.js: fairFacts, analyze; fair-surplus.js, event-preparation.js | Existente/parcial; falta integrar de forma explícita observações de procura pós-esgotamento |
| Clientes | agent/core.js: rebuyFacts; agent/index.js: message/share | Existente; consentimento e revisão, sem envio automático |
| Agenda | native/shell.js e Android AgroAgentScheduler | Existente para lembretes; nenhuma previsão de disponibilidade ou comparecimento garantida |
| Voz | features/voice e plugin Android Vosk | Existente offline; precisão acústica não equivale ao GPT Voice nem foi garantida em aparelho básico |
| Persistência | native/storage.js e save-queue.js | Existente: dois slots, checksum, confirmação e backup; não é armazenamento ilimitado nem sobrevive a apagar dados sem restauração |
| Aprendizado | ERPModel.rememberProduct, productMemory, agent.feedback/aliases; event-learning.js | Confirmações locais por produtor; limiares, evidência e possibilidade de revisão; sem treinar um LLM |
| Loja/pedidos | features/store, portfolio-server/src/shop.js | Novo nesta tarefa; servidor por loja, autorização por token, reserva atômica e confirmação de venda. Ainda exige validação de integração/entrega |

Alternativa A (manter) tem menor risco, mas não deixa clara a coordenação já existente. Alternativa B (camada leve) reutiliza roteador, worker, demonstrativo e interface única, com rastreabilidade; recomendada. Alternativa C (multiagente amplo/LLMs por especialista) acrescenta memória, bateria, custo, manutenção e respostas divergentes sem benefício demonstrado; não recomendada.

A consolidação mínima acrescenta consulta geral e o bloco recolhível “Especialistas consultados”, com origem/período/limitações. Não abre abas por especialista. Finanças segue o demonstrativo; estoque segue o modelo; hipóteses não alteram os registros. Dados insuficientes são explicitados. IA online continua opcional e não bloqueia nenhum recurso essencial.

Arquivos da consolidação: agent/core.js (intenção geral/metadados), agent/index.js (composição/explicação), agent/agent.css (bloco simples), testes do gerente e este documento. Sem migração de vendas e sem novas credenciais/API. Reversão: restaurar esses arquivos e recompilar mantendo pacote/certificado e os dados anteriores; campos adicionais de metadados não modificam transações. Riscos: respostas financeiras com período diferente, demonstração misturada, dados parciais e interações de voz ambíguas; testar isolamento, fonte canônica, períodos, consulta sem mutação e ausência de acesso à rede.
