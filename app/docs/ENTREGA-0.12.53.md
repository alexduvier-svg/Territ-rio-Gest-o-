# AGRO Gestão 2 — 0.12.53 / código93

Revisão pontual de organização, mantendo o layout aprovado: três colunas nas vendas, cards e materiais, textura/profundidade, gestos, quantidade explícita, Cliente, origem, Desconto e pagamentos. Não houve redesenho de Clientes ou Gestão.

## Alterações

- Estoque usa o nome da família inteira: **Bananas, Cafés, Fubás e Mandiocas**. Antes, a primeira variedade determinava o título, como Banana Caturra/Nanica ou Aipim. Não foram renomeados nem mesclados os cadastros; categorias, ordenação, nomes, medidas e saldos permanecem. As três apresentações iniciais e a seta das demais continuam iguais.
- O **+ de cada família** mantém uma busca normalizada separada do título plural. Bananas encontra suas quatro variedades no cenário sintético; Mandiocas inclui Aipim. Não escolhe categoria automaticamente nem cadastra sugestões como estoque real.
- Aviso de conferência de perdas inicia **recolhido**, mostrando a quantidade de feiras pendentes. Expande com os mesmos details, material, motor e timer comum de15s. Todas as feiras continuam disponíveis. Abrir/fechar não conclui revisão nem registra perdas. O procedimento existente é preservado.
- Ajustes mantém **um único Voltar inferior**. O cabeçalho reutiliza a estrutura existente e o título permanece centralizado. O ícone **Resumo do dia** ganhou nome acessível; aparência e ação permanecem.
- Corrigido o nome da seção Sobre deste APK para **AGRO Gestão 2**, que havia recebido o texto 3 na integração anterior. Pacote, certificado e rótulo nativo continuam os originais. **O APK do Claude/AGRO Gestão 3 e seu ramo não foram alterados.**
- Interface25 e documento offline registram essas premissas separadas dos dados de negócio.

## Validação

- **398 testes unitários PASS**, quatro novos casos de títulos abrangentes, ordem/variedade filtrada, aliases e separação de categorias. Produtos não sofrem mutação.
- **4 jornadas de interface PASS**, claro/escuro em393px normal e320px com texto ampliado, sinais de2núcleos/2GB e movimento reduzido. Três colunas preservadas, famílias/+ corretos, revisão sem alteração de registros, retorno e controle único em Ajustes, nome AGRO2, ausência de transbordamento. Recolhimento de15s executado no cenário normal claro.
- A referência52 em393px tinha cards de105px/gap8px; a versão final mantém exatamente essas medidas. Aviso de perdas passou de271.58px para52px no cenário normal; com texto ampliado quebrou linha e manteve acesso.
- **4 jornadas físicas Android System WebView PASS**: Reno14/CPH2737 e PKJ110, dois temas em cada aparelho, assets finais idênticos ao APK. App temporário separado, dados fictícios e rede externa bloqueada. Nenhum acesso ao banco principal ou transação real de teste.
- **2 regressões de checkout PASS**, claro/escuro: três produtos, todos os métodos visíveis, gap18px, calendário comum, dividido/Fiado/baixa/reabertura sem duplicação. Registros apenas sintéticos.
- Revisão visual dos cards, aviso, cadastro por família e Ajustes. Não foram medidos FPS/GPU, consumo, TalkBack, aparelho básico físico nem runtime16KB. Sinais de pouca capacidade não substituem um aparelho básico. A matriz histórica de todas as abas/movimentos não foi repetida.

## APK e instalação

**5,157,250bytes**, SHA256 `bb72c9352b0437b39240f258db435c4e5745fb48c14a8ac08b8fc976e7f5bcef`. Assinatura original v2/v3, pacote `br.com.territorio.gestao2`, código93.40arquivos de produção iguais a dist e ao fixture físico final, zipalign16KB, sem voz/microfone/GPS.

Cópia conferida: `C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.53.apk`. Atualização por `adb install -r` sem modo incremental, sem limpar/desinstalar o principal. Código/versão, abertura Statusok e datas iniciais preservadas confirmados:

|Aparelho|Atualizado|Instalação original preservada|
|---|---|---|
|Reno14 / CPH2737|2026-10-21 20:32:26|2026-10-21 18:58:01|
|PKJ110 / PKJ110|2026-10-21 20:32:32|2026-10-14 18:17:06|

Fixtures removidos dos dois aparelhos. O teste no PKJ inicialmente ficou preso na transferência incremental; a tentativa foi interrompida pelo PID/comando exatos do fixture, e a instalação por streaming concluiu. A revisão final passou; não há instalação de teste pendente.

## Clima no Reno

Pedido adicional de conferir indicador que não estava sendo visto. O principal foi trazido à frente após sair do fixture. Na versão instalada0.12.53, às20:35, a nuvem+19° apareceu junto a Área de vendas; a janela abriu Carangola/MG,19,4°C previstos/nublado, atualização da fonte20:10. Reno foi desbloqueado pelo usuário para a última conferência; não se alteraram bloqueio nem tempo normal para apagar a tela. Fonte/cache/validade/mínimo30min/WorkManager econômico permanecem iguais; não houve consulta MET forçada nem alteração de servidor. Capturas reais ficam apenas localmente, fora do Git.

## Git

Claude consultado no início, marco e antes da publicação, permanececffe32b/0.12.62. Publicar somente `codex/atualizacao-agro-gestao2`, a partir de080d0d3. Main956fddc e ramo do Claude preservados. Nenhuma publicação Play Store ou deploy de servidor. Confirmação do commit remoto consta no checkpoint/registro local da entrega.
