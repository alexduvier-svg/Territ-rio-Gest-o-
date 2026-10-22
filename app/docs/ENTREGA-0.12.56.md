# Entrega — AGRO Gestão2 0.12.56/code96

Mova os cards tem respiro acima do plano de produtos nos dois temas. Desconto manual usa o teclado numérico já existente no sistema, com inputmode none, na entrada principal e na subjanela; não invoca o teclado numérico do Android. O botão da finalização agora diz Continuar vendendo.

Continuar vendendo preserva o pedido original. O próximo produto inicia uma rodada com quantidade zero e apenas os itens novos; limpa os estados da seleção anterior. Carrinho valida o conjunto e soma apresentações idênticas:1+2=3. Outras apresentações/produtos permanecem separados. Mantém operação, destinatário e pagamento anteriores; descontos por item são somados em centavos, desconto geral permanece no pedido. Cancelar a adição restaura a base. Considera quantidades já pendentes ao limitar estoque. Nenhum saldo/venda real muda antes da confirmação normal. Recuperação guarda e valida os dois rascunhos.

## Validação

428 testes unitários PASS.4 jornadas de navegador claro/escuro359normal e320texto ampliado/leve/movimento reduzido PASS;4 jornadas físicas Capacitor nosDOIS (Reno14 CPH2737 e PKJ110),2temas PASS. Seleção múltipla inicial real, nova rodada sem os anteriores, botão Carrinho habilitado, soma1+2, quarto produto, cancelamento preservando base, teclado manual comum, respiro do controle mover. Testes usam registros fictícios, fetch externo bloqueado e pacote separado. Nenhuma transação real de teste ou banco principal lido. O roteiro usa toque CDP nos WebViews, que não expõem a opção hasTouch do navegador. Fixtures/capturas/forwards removidos após os testes.

Sem FPS/GPU/bateria ou celular básico físico medidos; sem matriz histórica inteira de janelas repetida. Visual e motor atuais preservados, nenhum novo layout. Servidor/clima27/AGRO3 preservados. Sem deploy/Play Store.

## Artefato

5173751bytes; SHA256 `23275ab89bbff43a0dc0a502015a2ca31204b55e0b5b21f8944c29dd733266ad`;41assets iguais ao dist, fixture com apenas seed/bloqueio externo/EOL do HTML diferentes. Pacote/certificado originais, v2/v3 e alinhamento16KB; sem voz/microfone/GPS. Cópia original conferida em `C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.56.apk` e install-r local nos dois:

- Reno14: 2026-10-22 10:13:45; firstInstallTime 2026-10-21 18:58:01 preservado, abertura ok.
- PKJ110: 2026-10-22 10:13:50; firstInstallTime 2026-10-14 18:17:06 preservado, abertura ok.

Android96/0.12.56/Statusok, sem desinstalar/limpar principal. NÃO repetir build/cópia/verificador/instalação por este registro. Reversão somente via correção de código maior, mesma identidade e dados, sem downgrade forçado.

Git: somente codex/atualizacao-agro-gestao2, basee365a892717b1a3ebe3711bd3eea9e58d4eb57f8. Consultado no início e antes da entrega; Claude cffe32bd60e0a4385ad9194ca1f5ac5e3e0c0e6b e main956fddceec2b994e32c154c5197424a4f56df7f2 preservados. Implementação commit/push `ac4f236ed27959885463383253fe1c3e13cb7e51` confirmados no remoto, worktree limpo. Encerramento documental posterior não muda o APK. Não repetir entregas históricas. Arquivos em ARQUIVOS-0.12.56.md.
