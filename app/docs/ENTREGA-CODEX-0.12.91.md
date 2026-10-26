# AGRO Gestão Codex — 0.12.91

Em 26/10/2026, o usuário pediu que a base final 0.12.88 passasse a 0.12.91, identificada como AGRO Gestão Codex, mantendo a separação do Claude no Git.

## Escopo

Somente nome e versão foram alterados. Nome no Android e em Ajustes: **AGRO Gestão Codex**. Identificação em Ajustes: **Versão 0.12.91 · Codex**. Pacote interno `br.com.territorio.gestao2` e assinatura original preservados para atualizar a instalação existente sem apagar registros.

Esta entrega deriva da base final 0.12.88 do commit `4bf346ee64ea79b23db6b2793930985ffe5d8827`. A comparação de 210 arquivos de execução web e Java confirmou igualdade, admitindo apenas os textos de nome e identificação em Ajustes. Não houve merge, mudança de funções/layout ou alteração do aplicativo Claude. A calculadora Contas da base88 permanece incluída.

## Verificação

- Oito conferências atuais do nome e da versão nos assets compilados: 320, 360, 393 e 412 px, temas claro e escuro. Em 320 px foi usado texto ampliado e modo leve. Nome e número ficaram visíveis sem transbordamento.
- 57 assets web conferidos entre dist e APK. ZIP íntegro, assinatura original v2/v3 e alinhamentos ZIP/ELF 16 KB verificados estruturalmente.
- A validação funcional de referência é a entrega88: 769 testes unitários, oito jornadas compiladas e quatro jornadas físicas nos dois temas. Esses testes não são apresentados como novos testes91, pois a alteração é de identificação.
- Instalação com `adb install -r` nos dois aparelhos, hash dos binários e primeiras datas conferidos; abertura a frio e processo em execução confirmados.
- Reno entregou sinal técnico de prontidão dos seis módulos. PKJ não entregou esse sinal; foi confirmada a abertura nativa e a manutenção do processo. A confirmação humana anterior é da88, não é alegada como nova confirmação91.

Não houve leitura de banco real, reset, venda/pagamento de teste no principal, WhatsApp ou agenda pessoal. Nenhuma publicação de servidor. Não foram medidos FPS/GPU/bateria, TalkBack, aparelho básico físico ou execução em runtime Android de página16KB nesta renomeação.

## APK e instalação

Arquivo: `AGRO-Gestao-Codex-0.12.91.apk`.

Pasta: `C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-Codex-0.12.91.apk`.

Versão Android: 0.12.91; código131; 9.259.733 bytes.

SHA256: `5dc2292bcaf4026f5edd3f19125c2fd8588cdcfd79f8b174ad7f94f4e79975f4`.

Certificado SHA256: `f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68`.

| Aparelho | Atualização em 26/10/2026 | Primeira instalação preservada |
|---|---|---|
| Reno14 | 19:12:05 | 2026-10-21 18:58:01 |
| PKJ110 | 19:12:12 | 2026-10-14 18:17:06 |

## Git separado

Codex: repositório `alexduvier-svg/Territ-rio-Gest-o-`, ramo `codex/atualizacao-agro-gestao2`, código em `app/`. O nome histórico do ramo e o pacote interno são mantidos para continuidade.

Claude: repositório `alexduvier-svg/agro-gestao-claude`, pacote `br.com.territorio.gestaoclaude`. O nome, os dados, os APKs e o histórico do Claude permanecem separados.

Scripts locais: `qa/build-codex091.ps1`, `qa/verify-codex091.py`; evidência de identificação em `qa/codex091-identity-smoke.json`. O instalador de produção permanece local, por conter identidades dos aparelhos. Metadados locais: `native-apk-validation-codex-0.12.91.json`; não repetir o verificador após instalar, pois ele inicia o estado pré-instalação.

Código, identificação, verificação e comparação publicados no commit `d968043361ad1c73e4629dc131bcc7e1ec7645d1`, confirmado no remoto exclusivo do Codex em26/10/2026.
