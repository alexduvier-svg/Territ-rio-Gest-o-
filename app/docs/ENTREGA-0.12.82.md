# AGRO Gestão 2 — Entrega 0.12.82

As configurações do produto agora mantêm palavras inteiras. Os rótulos e valores podem ocupar linhas separadas quando a largura é pequena; as opções textuais se adaptam à largura, sem reduzir a fonte para caber. Material, tipografia, profundidade, três colunas de Produtos e movimentos existentes foram mantidos.

O cadastro de café usa **Espécie do Grão, Variedade/Grupo, Torra e Processo**. O campo Fermentação saiu do formulário; **Anaeróbico** aparece em Processo, junto de Tradicional, Natural, Cereja Descascado e Lavado. Novo Produto, sugestões do catálogo e exemplos do Modo Teste usam a mesma configuração. Informação desconhecida permanece vazia para o produtor escolher. As 2.479 referências originais e 19 adições do app continuam 2.498; os 72 modelos de café por tipo/torra/peso/formato mantêm seus IDs. Não houve criação nem classificação automática de produtos reais.

Os dados anteriores de fermentação continuam preservados como legado para identidade, backup e exportação. Ao editar, a informação explicitamente registrada como Anaeróbica aparece em Processo como Anaeróbico. Se já havia outro processo, a combinação é mantida. Abrir ou cancelar não altera o registro original; a adaptação passa ao cadastro apenas quando o produtor salva. Uma escolha posterior é respeitada. Aeróbica antiga não é convertida por dedução.

O X do nome se deslocava cerca de 22,7 px durante a pressão: o efeito de toque substituía a transformação usada para centralizá-lo. O centro agora é definido sem essa transformação. Em um novo cadastro, limpar o nome também limpa o contexto anterior de categoria, catálogo e apresentação, preservando os números digitados em cada opção. Na edição, o X limpa o nome do formulário sem apagar a identidade ou alterar o produto salvo. O teclado numérico fecha e o campo de nome recebe o foco. Nome apagado não reaparece ao recuperar o rascunho.

Premissa de interface 52, memória de estoque 4 e conhecimento do catálogo 1.0.4 atualizados, com o documento offline correspondente.

## Validação

634 testes unitários passaram. Oito jornadas de navegador passaram nos temas claro e escuro, em 320 com texto ampliado/modo leve/movimento reduzido, 360, 393 e 412. Quatro jornadas Capacitor passaram: Reno14 e PKJ110 nos dois temas. Os testes incluem palavras inteiras dentro das pills, ausência de Fermentação no formulário, escolha de Anaeróbico em Processo, toque real no X por CDP, limpeza de identidade/reabertura, custo zero e cadastro por sugestão. O desvio relativo do X ficou abaixo de 1 px nas medições finais (limite de teste 3 px), incluindo 0 com movimento reduzido.

A compatibilidade com registros antigos foi conferida ao abrir, cancelar, salvar e reabrir, mantendo IDs, estoque, preços, custos, vendas e movimentos fictícios. A revisão de identidades incompletas continua exigida antes de criar outra apresentação; o teste confirma essa ação existente, sem enfraquecer a guarda. Também passaram as regressões das cinco abas, Fornecedores, rollback da navegação, inicialização com revisão pendente, 36 modelos com sigla após a segunda palavra em três colunas e isolamento do Modo Teste.

Os testes usaram exclusivamente dados fictícios no pacote isolado, sem acessar/copiar bancos reais, registrar transações reais, enviar WhatsApp ou usar agendas pessoais. Capturas do próprio fixture foram inspecionadas nos dois temas. Após instalar o APK definitivo, o início frio confirmou agente, movimento, workflows, eventos, fornecedores e modo teste nos dois apps principais. Não foram medidos FPS/GPU/bateria/TalkBack/aparelho básico físico nem execução em páginas de 16 KB; ZIP/ELF de 16 KB é verificação estrutural.

## APK e instalação

Versão 0.12.82, código 122, pacote `br.com.territorio.gestao2`. APK 9.197.683 bytes; SHA-256 `15bc174a12f08578bdc8c438033dd3888329728ae919fbb20005f61e42530461`. Certificado original `f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68`, assinaturas v2/v3; 50 arquivos web e duas pontes conferidos contra dist e fixture; ZIP/ELF de 16 KB. Sem permissão de microfone ou GPS.

Cópia original conferida: `C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.82.apk`. Instalação com adb install -r, sem reset:

- Reno14 (CPH2737): 2026-10-23 22:40:54; primeira instalação preservada 2026-10-21 18:58:01; abertura fria com os seis módulos confirmada.
- PKJ110 (PKJ110): 2026-10-23 22:41:04; primeira instalação preservada 2026-10-14 18:17:06; abertura fria com os seis módulos confirmada.

Fixtures, capturas temporárias nos aparelhos e forwards próprios removidos. Dados reais, identidade, clima, Firebase Spark/App Check, servidor e Calendar preservados. Publicação somente no ramo `codex/atualizacao-agro-gestao2`; Claude cffe32b e main 956fddc não tiveram novidades na consulta e não foram alterados. Encerramento documental não exige repetir build, testes ou instalações.

Implementação publicada no commit `68fd2045887834bfbe6cadb9c685c5f207c1ed90`, confirmado no remoto AGRO2. Nenhuma pendência autorizada restante. O encerramento documental posterior não altera o APK.
