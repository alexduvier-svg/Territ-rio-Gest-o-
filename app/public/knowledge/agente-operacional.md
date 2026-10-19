# Agente operacional local — regras v1

Fonte: Agro_Gestao_Agente_Inteligente_Instrucoes_Codex.md v1.1, recebido em 19/10/2026. Documento de referência, sem autorização executável. Implementação: src/features/agent/core.js. Não usa LLM, API paga, áudio armazenado ou envio automático.

O contexto vem do produtor/origem explícitos do modelo atual. Exemplos e simulações não viram vendas reais. O catálogo de referência sugere nomes; só apresentações do cadastro ativo podem entrar na venda. O índice local guarda versão/hash. Apelidos exigem confirmação e podem ser removidos. A proposta não reserva estoque.

Uma fala final tem uma sessão e um encaminhador. Parciais só atualizam a tela. Produtos mantém o botão de venda; perguntas de estoque, feira e recompra ficam na Inteligência. Produto, peso e unidade ambíguos são esclarecidos. O carrinho e sua confirmação final continuam sendo o único caminho de venda. Operações possuem chave persistida e recibo; replay não duplica baixa. Mudança nos registros invalida a prévia. Valores em centavos, precisão de quantidade até três casas, sem conversões de caixa/cacho não cadastradas.

Estoque baixo exige mínimo configurado. Ausência de vendas refere-se apenas ao recorte observado (padrão 30 dias, configurável), sem provar ausência de procura ou histórico completo. Saldo geral não é sobra de feira. Conferência por apresentação e carga precisam reconciliar vendas, perdas e saldo real. Registros posteriores invalidam a conferência para comparação. Sobra recorrente exige ao menos três feiras do mesmo grupo, duração semelhante e sobra de 50% ou mais. Hipótese não é causa; sugerir teste não muda carga.

Recompra: pelo menos quatro dias distintos de compra do mesmo cliente/produto, três intervalos positivos, mediana e tempo decorrido de ao menos 1,25 vez a mediana. Exige consentimento e saldo; pode ser desligada globalmente ou por produto. Convite é rascunho editável e exige revisão do destinatário; abrir WhatsApp não confirma envio nem entrega.

Finanças reutiliza o demonstrativo do sistema. Custo histórico ausente não vira zero nem lucro líquido. Descontos e devoluções seguem suas datas. Não calcular conversão sem oportunidades medidas nem LTV sem método.

Prioridades: no máximo três, recolhidas, com evidências, período, amostra, hipótese e próximo teste. Permitir dispensar, adiar, útil/não útil e registrar resultado sem autotunar limites financeiros. Cache é invalidado por contexto, período e revisão dos registros. Persistência e backups são os mesmos do app; não há nova base de negócio.

WorkManager diário é aproximado e sinaliza revisão pendente; não abre microfone ou WebView. O cálculo JS ocorre após mudanças e ao reabrir o app. Economia de bateria/Forçar parada podem adiar a tarefa. Não promete análise completa enquanto fechado, notificação financeira, horário exato ou escuta contínua.

Preservar as premissas de movimento, nitidez e volume do sistema, em claro/escuro, texto ampliado e telas estreitas. Áudio e contatos não vão para logs. Auditoria guarda somente IDs e estados; compartilhamentos exigem ação do usuário.
