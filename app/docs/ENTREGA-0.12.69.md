# Entrega 0.12.69 — Alinhamento do Estoque e Avisos de Esgotamento

Concluída tecnicamente em23/10/2026. AGRO Gestão2, pacote br.com.territorio.gestao2, code109. Git em fechamento.

## Resultado

- Em Estoque, somente saldo zerado mostra triângulo vermelho de contorno com exclamação, sem preenchimento, à esquerda do0 e com a altura do numeral. Retiradas as setas desta área. Produtos disponíveis não exibem o aviso; Vender mantém a indicação anterior.
- Quantidade, triângulo e seta de navegação ficam na mesma linha central. Nome/apresentação mantêm sua coluna e não se sobrepõem ao saldo. Linhas não aumentaram em relação à referência68 na matriz de telas.
- Totais Em Dia, Baixo e Esgotado centralizados dentro das pills para1,2ou3dígitos tabulares. A coluna automática antes podia ser alargada pelo rótulo Esgotado. Agora tem limite real, sem deslocar o número. Rótulos compactos abaixo359px, sem alterar o material comum.
- Auditoria do aviso já existente encontrou estado único que permitia ao aviso de baixo suprimir o de esgotado e ignorava zero sem referência inicial. Corrigido com estados separados baixo/zero, persistência por produtor e fila serial de mudanças.
- Cada novo esgotamento gera um aviso local quando autorizado. Reposição positiva rearma o próximo esgotamento mesmo abaixo30%; gravações iguais não repetem o aviso. Falha nativa não marca entrega. Legado de baixo não suprime zero. Inativos/arquivados ficam fora da checagem.
- Canais normais e Feira preservados; Feira exige evento ativo dentro do horário. Toque no aviso confere produtor atual antes de abrir reposição. Sem polling/serviço novo ou pedidos automáticos de permissão em gravações. Consentimento inicial existente menciona estoque esgotado. Android/permissão/canais controlam visibilidade, som e entrega.
- Memória39/documento offline registram os refinamentos. Removida a premissa antiga que ainda citava setas também no Estoque; Vender e Estoque têm regras atuais explícitas sem conflito. Movimentos comuns, calendário, clima27/servidor59, Firebase Spark/App Check e identidade preservados. Nenhum serviço contratado.

## Verificação

552unit/8browser/4Capacitor: PASS. Navegador claro/escuro em320ampliado/leve/reduzido,360,393,412normal. Nos dois celulares e dois temas: ícone sem preenchimento, altura20px igual ao numeral, alinhamento com a seta, distância de bordas, ausência de sobreposição, remoção após reposição e centralização com1,12,123.

Dez regressões de notificações incluem baixo→zero, zero sem referência, reposição1→novo zero, checagens simultâneas/repetidas, legado, recusa sem pedidos automáticos, falha recuperável, isolamento de produtor/reabertura e canal de evento. Nos quatro cenários físicos, chamadas de baixo→zero→repetição→reposição pequena→zero totalizaram1/2/2/2/3; mesma identificação por produto, canais conferidos e notificação realmente entregue/listada pelo Android. Memória persistida e limpeza de avisos no fixture verificadas.

Somente br.com.territorio.gestao2.motionfixture e produtos fictícios. Permissão pelo diálogo oficial; o OEM recusou grant do ADB. Um teste foi retomado porque o app principal entrou em primeiro plano e suspendeu o fixture. Captura final do PKJ exige fixture em primeiro plano. Nenhuma transação real ou banco ERP principal acessado pelos testes, nenhum WhatsApp real/agenda pessoal/chamada geral Gemini. Não medidos FPS/GPU/bateria/celular básico físico/TalkBack/runtime16KB; simulação de perfil leve não comprova desempenho físico básico.

## APK e instalação

9123762bytes, mesmo tamanho da68. SHA256:e63177bd1090b66bd11d339c5e33de0c912e42976b3d211ffa497ea00fe3f5a4. Certificado original:f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68, assinaturasv2/v3.48assets web e2pontes iguais ao dist e ao fixture final(exceto injeção sintética). ZIP16KB/ELF LOAD16KB conferidos, sem comprovar execução em aparelho16KB.

Cópia original conferida:C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.69.apk. Reno14/CPH2737 atualizado23/10 às11:52:00; PKJ110 às11:52:06, via adb install-r.109/0.12.69/Statusok; firstInstallTime preservados(Reno21/10 18:58:01; PKJ14/10 18:17:06). Fixtures removidos, capturas XML/PNG e encaminhamentos temporários retirados dos dois aparelhos. Nenhuma alteração do tempo de bloqueio normal. NÃO repetir build/verificador/cópia/instalação desta entrega.

## Git

Somente codex/atualizacao-agro-gestao2. Fetch no início, marco e antes da publicação:Claude cffe32bd60e0a4385ad9194ca1f5ac5e3e0c0e6b/main956fddceec2b994e32c154c5197424a4f56df7f2 preservados. Publicar fontes/documentação e QA sintético; excluir APK/credenciais/registros pessoais/capturas. Commit/push em fechamento; confirmar remoto ao retomar, sem refazer APK. Automação excluída: não recriar.
