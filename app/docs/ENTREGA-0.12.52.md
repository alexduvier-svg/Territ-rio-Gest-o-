# AGRO Gestão 2 — 0.12.52 / código92

Finalizar Venda apresenta um resumo compacto e os pagamentos em três linhas: **Pix / Dinheiro**, **Crédito / Débito**, **Continuar comprando / Outro**. O título fica centralizado e há18px de espaço entre o total e as ações finais. Pagamento dividido permanece em Outro → Mais de uma forma. Continuar comprando preserva quantidades e permite acrescentar produtos além dos três iniciais, com rolagem. Em telas baixas, o resumo começa recolhido para manter os pagamentos acessíveis; o produtor pode expandir os itens.

Outro → Fiado usa os controles e o calendário existentes do sistema. Exige cliente e vencimento a partir de hoje. A venda registra receita e reduz estoque uma única vez. A dívida aparece em **Clientes a receber**, inclusive no cadastro individual; a baixa integral requer confirmação explícita do produtor, método e data do recebimento. Não há cobrança ou mensagem automática. A baixa não cria outra venda nem reduz estoque novamente. Operações são identificadas para impedir duplicação em tentativas após falha; rascunho, backup e reabertura preservam os campos. Os recebimentos entram no caixa pela data escolhida, inclusive quando a venda pertence a período anterior. Devoluções anulam a dívida e só descontam do caixa o valor efetivamente recebido. Taxas configuradas de cartão são consideradas no recebimento, sem confundir caixa com receita.

O calendário comum respeita min/max dos campos e conserva o retorno ao formulário. Não é usado calendário Android de aparência divergente. A regra de padrão único vale permanentemente para qualquer ajuste, em qualquer dia ou mês, área ou subjanela: reutilizar tipografia, controles, materiais, hierarquia e movimentos existentes. Está em AGENTS.md, interface24 e no documento offline, persistidos separadamente dos registros do negócio.

O indicador do tempo foi religado à estrutura atual da página após a integração51 e fica imediatamente junto de **Área de vendas**, com nuvem e grau. Não há nova fonte nem deploy de servidor. Preservados consentimento, cache offline, MET Norway/atribuição, referência municipal IBGE, pausa ao ocultar/offline, validade da fonte e intervalo mínimo30min; WorkManager continua apenas sincronizando cache compartilhado, com internet e bateria>=50%. Horário aproximado do Android, não consumo zero. No Reno foi conferida a janela real: Carangola/MG,19,7°C previstos, nublado, fonte atualizada21/10às19h27, visualizada às19h43. A validade foi respeitada; não se forçou uma nova consulta MET só para mudar o horário.

## Validação

- **394 testes unitários PASS**, incluindo12 novos casos de Fiado/caixa/baixa/devolução/idempotência/recuperação.
- **6 jornadas de navegador PASS**, claro/escuro,359/360px normais e320px com texto ampliado, sinais de2núcleos/2GB e movimento reduzido; controles inteiros e calendário sem transbordamento horizontal.
- **4 jornadas no Android System WebView físico PASS**, Reno14/CPH2737(359×788,dpr3,5) e PKJ110(360×792,dpr4), nos dois temas. Grade inteira, espaço18px, calendário padrão/retorno, pagamento dividido, venda Fiado, baixa e reabertura. App temporário separado, rede externa bloqueada e dados fictícios; nenhuma transação no AGRO2 principal. Fixture removido dos dois ao terminar.
- **2 jornadas adicionais PASS**, claro/escuro: Continuar comprando acrescenta um quarto produto, rola pagamentos, volta de Outro preservando quantidades e permite remover o item sem registrar venda.
- Assinatura original v2/v3, pacote gestao2,40assets iguais ao dist e ao fixture físico final, alinhamento16KB, sem voz/microfone/GPS. Matriz histórica de todas as abas/movimentos não repetida. FPS/GPU, consumo de bateria, aparelho básico físico, TalkBack e teste de runtime16KB não medidos. Não se promete precisão meteorológica superior sem comparação com observações locais.

## Arquivo e instalação

APK: **AGRO-Gestao-2-0.12.52.apk**,5.153.154bytes.

SHA256: `2a91d5de4b3db10935601d6e050f0323f57b0aee7bf0fb96ec36da06ef9609b9`.

Cópia conferida em `C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.52.apk`. Instalado com `adb install -r`, código92/versão0.12.52 e aberturaStatusok confirmados:

| Aparelho | Atualizado21/10/2026 | Instalação original preservada |
|---|---|---|
| Reno14/CPH2737 |19:42:34|21/10/202618:58:01|
| PKJ110 |19:42:40|14/10/202618:17:06|

Sem desinstalar/limpar o app principal nem transferir dados entre aparelhos. Git consultado no início, no marco de integração e antes da publicação: Claude permanececffe32b/0.12.62. Publicar somente codex/atualizacao-agro-gestao2, preservar main956fddc e o ramo do Claude. Nenhuma submissão à Play Store nesta entrega.
