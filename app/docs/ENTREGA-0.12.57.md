# Entrega — AGRO Gestão2 0.12.57/code97

Produtos esgotados ficam no fim da grade de Vender, mantendo Sem estoque. Um SVG decorativo de duas setas circulares, sem caixas, indica reposição em vermelho (cor adaptada ao tema). Tamanho de12–16px, pelo menos10px de recuo das bordas; procura espaço vazio junto dos detalhes ou entre os textos, sem sobrepor nome, unidade, aviso ou controles. Também aparece nas linhas esgotadas de Estoque, inclusive nas famílias expansíveis. O símbolo é absoluto: não cria linha nem altera as dimensões dos cards. A grade continua em três colunas, com o mesmo material e motor de movimento. Posicionamento limitado ao render, redimensionamento e carregamento de fonte; sem laço ocioso ou nova dependência.

Regra geral de seleção: estoque disponível zero impede escolher em Vender, seleção múltipla, Carrinho, + Produtos e Continuar Vendendo. Considera reservas e unidades já no pedido base antes de iniciar outra rodada; valida novamente quantidade e finalização. Consultar/repor continua permitido. Pedido reservado pode usar sua própria reserva, sem consumir a de outro pedido. Prévias do agente e pontes de pedidos verificam a disponibilidade atual. O bloqueio não depende de nome, categoria, aprendizado ou internet: abrange o catálogo inteiro e futuros cadastros. Memória de interface27/documento offline registram a premissa; apagar registros não remove o código da regra, mas registros reais continuam dependendo de backup.

Botão da finalização: **Continuar Vendendo**. Preserva a rodada isolada56, soma de quantidades, pagamentos, descontos e identidade da operação.

## Validação

428 testes unitários PASS.4 jornadas de navegador nos temas claro/escuro,359normal e320texto ampliado/leve/movimento reduzido PASS.4 jornadas Capacitor físicas no Reno14 CPH2737 e PKJ110, nos dois temas PASS. Conferidos: ícone pequeno/só setas/recuo/sem sobreposição, dimensões com e sem a decoração, ordenação, reposição, ícones em Estoque, bloqueio de ações/seleção com UI antiga, estoque reservado, pedido pendente consumindo a última unidade, + Produtos desabilitado, Carrinho revalidado e reserva própria preservada. A regra foi exercitada com os2.479nomes do catálogo e um produto futuro, tanto zerados quanto disponíveis. Zero errosJS nos resultados finais.

Dados fictícios isolados, rede externa bloqueada, pacote de teste separado. Nenhuma transação real de teste/banco principal acessado. Pacote temporário e capturas no aparelho removidos. Sem FPS/GPU/bateria ou celular básico físico medidos; a matriz histórica inteira de janelas não foi repetida. Nenhuma alteração de servidor/clima27/AGRO3, sem deploy ou submissão à Play Store.

## Artefato

5177847bytes; SHA256 `0c429dda0cbb6789e5727db9d0bdc8eafa02e4d9408a7c88203012801f315dae`;41assets iguais ao dist e ao teste físico (HTML do teste difere só por seed/bloqueio externo/EOL). Pacote/certificado originais, v2/v3 e alinhamento16KB; sem voz/microfone/GPS. Cópia original conferida: `C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.57.apk`.

- Reno14: 2026-10-22 11:07:50; firstInstallTime 2026-10-21 18:58:01 preservado; abertura ok.
- PKJ110: 2026-10-22 11:07:56; firstInstallTime 2026-10-14 18:17:06 preservado; abertura ok.

Android97/0.12.57/Statusok nosDOIS, firstInstallTime preservados e sem limpar/desinstalar o app principal. NÃO repetir build/cópia/verificador/instalação por este registro. Metadata em APK-0.12.57.json; arquivos em ARQUIVOS-0.12.57.md.

Git: publicar somente codex/atualizacao-agro-gestao2, basebf54ea04aa7ef8fd290428edcb43cddd30afbfd7. Fetch no início/marco/pré-publicação; Claude cffe32bd60e0a4385ad9194ca1f5ac5e3e0c0e6b e main956fddceec2b994e32c154c5197424a4f56df7f2 preservados. Publicação em conclusão; confirmar commit/remoto no log antes de retomar, sem refazer APK.
