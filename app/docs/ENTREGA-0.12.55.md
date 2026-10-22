# Entrega — AGRO Gestão 2 0.12.55/code95

Inteligência adaptativa incorporada aos serviços existentes: perfis Essencial/Equilibrado, sinais nativos após UI pronta, redução de carga/cancelamento, DTO mínimo Connect, propostas declarativas Action e auditoria determinística obrigatória no domínio. Mesmo layout, venda e pagamentos; nenhuma IA generativa, voz, dependência paga ou novo servidor. Ver ADAPTATIVA-0.12.55.md.

## Validação final

- 423 testes unitários PASS (401 anteriores+22 novos).
- 4 jornadas completas de navegador: claro/escuro,393normal e320texto ampliado/reduzido;2 falhas de Worker (indisponível/lento) PASS.
- 4 jornadas Capacitor físicas: Reno14 CPH2737 e PKJ110, nos2temas. Consulta offline, controles/perfil manual, sinais nativos reais, arquivo noBackup, três produtos, seis pagamentos visíveis, calendário, Fiado, baixa integral e reload PASS; zero erros JS.
- Ensaios físicos em pacote diferente, dados fictícios, fetch externo bloqueado. Nenhum registro real acessado/exportado e nenhuma venda/pedido real de teste.
- Ambos OEMs bloquearam pm clear do teste; recriado somente o pacote sintético. PKJ aceitou instalação local --no-streaming após rejeitar streamed-99. Sem mudança de configurações de segurança. Todos os fixtures removidos.
- Limites: sem aparelho básico físico/outras marcas disponíveis, FPS/GPU/bateria/p95/ANR/OOM não medidos; pressão térmica/memória coberta por regras/testes, sem induzi-la no aparelho. Sem promessa universal de fluidez/precisão. Matriz histórica completa de movimentos não repetida.

## APK e instalação

5173751bytes, SHA256 `2239276b02b6c78c2f1294a83bbd11f0e21ae08aefa14fa15c232c1c711c5386`. Pacote `br.com.territorio.gestao2`, certificado original `f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68`, v2/v3,41assets de produção idênticos ao dist, alinhamento16KB. Assets correntes do fixture iguais, com HTML sintético/EOL normalizado. Sem bibliotecas de voz/microfone/GPS. Ver APK-0.12.55.json.

Cópia e hash conferidos em `C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.55.apk`. Instalado com adb install --no-streaming --no-incremental -r:

-  Reno14 CPH2737: atualização 2026-10-22 09:27:03; primeira instalação 2026-10-21 18:58:01 preservada; abertura ok.
-  PKJ110 PKJ110: atualização 2026-10-22 09:27:10; primeira instalação 2026-10-14 18:17:06 preservada; abertura ok.

Android95/0.12.55/Statusok nos dois, sem limpeza/desinstalação do principal. Não repetir build, cópia, instalação ou verificador por este registro.

## Publicação e preservações

Somente ramo `codex/atualizacao-agro-gestao2`, base e3eb53959856de7bad63b0682771a2a6f255f305; Claude cffe32bd60e0a4385ad9194ca1f5ac5e3e0c0e6b e main956fddceec2b994e32c154c5197424a4f56df7f2 conferidos no início, integração e pré-publicação. Commit final consultar no log. Servidor0a83fdbe-9ecb-4745-b6f2-c46344082c33/clima27 preservados; nenhum deploy ou submissão Play.

Reversão por correção de versão maior, mesmo pacote/certificado/dados; não forçar downgrade. Hardware local fora do backup comercial. Trilha mínima200registros com operações, sem dados pessoais. Referência original incorporada offline com hash na memória adaptação3.
