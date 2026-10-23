# Entrega 0.12.70 — Zero na Reposição e Contagem por Feira

Instalada em23/10/2026. AGRO Gestão2, pacote br.com.territorio.gestao2, code110. Git em fechamento.

## Resultado

- Na janela Repor Estoque usada pelo aviso, o0 da quantidade e o saldo atual0 aparecem em vermelho quando o produto está esgotado. Apenas numerais: unidade e demais textos preservados. Digitar quantidade positiva usa a cor normal; o saldo atual só deixa de estar zerado depois da reposição gravada. Reabrir após a reposição mostra saldo/campo normais. Nenhuma alteração de dimensão, teclado, material ou motor de abertura.
- Gestão → Estoque e Sobras mostra Reposições Registradas por feira. Contagem derivada de eventLoads.items.restocks já persistidos; sem contador paralelo, nova tabela, migração ou serviço. Uma confirmação com vários produtos conta uma vez; identificações explícitas de operação ou horário da confirmação agrupam a gravação. Carga inicial, abertura/digitação, consultas e repetições não incrementam.
- Relatório local inclui frequência por apresentação, total e indicador de histórico completo. Informações antigas que indicam reposição sem dizer quantas vezes ficam parciais; não há estimativa inventada. O servidor existente aceita os novos totais numéricos pelo contrato atual; nenhum deploy ou alteração de servidor.
- Reposição no estoque geral não transfere automaticamente a quantidade para a feira. Para contar na feira, ela deve ter sido incluída na carga. Isso preserva o estoque em casa, a carga, as reservas, vendas e sobras. Quantidades e receita mantêm os cálculos anteriores.
- Premissas40/documento offline atualizados. Clima27/servidor59/Firebase Spark/App Check/Calendar, identidade, registros reais e engine de notificações69 preservados.

## Validação

559unit/8browser/4Capacitor: PASS. Claro/escuro ×320ampliado/leve/reduzido,360,393,412normal; Reno14/CPH2737 e PKJ110 nos dois temas. Sete regressões novas cobrem carga inicial, confirmação multiprodutos, deduplicação, horários legados, IDs simultâneos distintos, histórico parcial, totais preservados, repetição idempotente e reabertura.

UI: zero vermelho, quantidade positiva normal, saldo reposto normal, unidade sem vermelho, um movimento para duplo acionamento, nenhuma alocação silenciosa, contador1→2 e mesma contagem após reabrir. Gestão mostra o recorte da feira correto e botões inteiros/margens/rolagem. Mesma função chamada pela notificação verificada; não repetido teste de tocar na notificação do Android nesta versão.

Só fixture br.com.territorio.gestao2.motionfixture e dados fictícios; rede externa bloqueada. Teste simula consentimento já respondido apenas no armazenamento do fixture, sem alterar permissão principal. Nenhum banco ERP principal/transação real/WhatsApp real/agenda pessoal acessado, sem chamada geral Gemini. Sem FPS/GPU/bateria/celular básico físico/TalkBack/runtime16KB medidos; perfil leve simulado não comprova desempenho físico básico.

## APK e instalação

9127858bytes(+4096sobre69). SHA256:343d8fb980271df0a61f1e5761bbf127d769423b6cff36f2862361f82fa82c05. Certificado original:f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68; assinaturasv2/v3,48webassets+2pontes iguais ao dist/fixture(exceto injeção de teste). ZIP16KB/ELF LOAD16KB conferidos, sem executar aparelho16KB.

Cópia original conferida:C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.70.apk. Instalações adb install-r em23/10: Reno12:25:03/PKJ12:25:12,110/0.12.70/Statusok. firstInstallTime preservados(Reno21/10 18:58:01; PKJ14/10 18:17:06). Fixtures, captura temporária e encaminhamentos removidos dos dois aparelhos. NÃO repetir build/verificador/cópia/instalação70 por este registro.

## Git e retomada

Somente codex/atualizacao-agro-gestao2. Fetch início/marco/antespublicação:Claude cffe32bd60e0a4385ad9194ca1f5ac5e3e0c0e6b/main956fddceec2b994e32c154c5197424a4f56df7f2 preservados. Código e QA sintéticos; sem APK/segredo/capturas/dados pessoais na publicação. Commit/push pendentes; confirmar no remoto antes de concluir. Automação excluída, não recriar.
