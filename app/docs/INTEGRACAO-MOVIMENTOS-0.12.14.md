# Integração dos movimentos da referência 0.12.14

## Origem verificada

O produtor aprovou o comportamento de abertura/fechamento do APK AGRO-Gestao-0.12.14.apk, fornecido em 19/10/2026, e pediu incorporá-lo ao AGRO Gestão 2 antes 0.12.11. A referência usa o pacote br.com.territorio.gestao, versão 0.12.14 / código 54. Os 30 arquivos web do APK são idênticos aos da compilação local correspondente. Hashes do APK e dos módulos estão em REFERENCIA-MOVIMENTOS-0.12.14.json. O projeto original foi consultado para leitura; não foi alterado nem enviado para main por esta tarefa.

Foram incorporados o módulo de movimento, sua geometria e estilos relacionados, incluindo a transição entre janelas e subjanelas. O destino permanece br.com.territorio.gestao2, nome AGRO Gestão 2, certificado release original e dados próprios. Não se copia a base do outro aplicativo, a identidade Android ou sua configuração de depuração. A nova versão da variante2 usa 0.12.14 / código 54 para acompanhar a referência.

## Comportamento

Janelas abertas por toque começam na forma e posição do card/ícone tocado. A superfície cresce mantendo texto e material unidos, com acomodação de mola. Ao fechar, volta inteira à origem e se apaga apenas no final. A origem é reencontrada quando a página do fundo se redesenha.

Páginas abertas por cards usam uma superfície visual única. As barras fixas reais preservam sua âncora; a transição usa uma representação temporária inerte e não interativa. Em subjanelas, a janela anterior recua; ao voltar, a filha se recolhe à linha que a abriu, por cima do pai restaurado na posição rolada. O desfoque externo é fixo no modo normal, sem blur nos textos, e omitido no modo leve/reduzido.

Foram mantidas as correções da 0.12.11: tempo efetivo dos quadros no integrador, uma mola/pivô comum no fallback das abas, estabilidade de alturas/rolagem no close e visual das opções da venda preservado depois de fechar. A captura temporária conta os nós antes de clonar, evitando duplicar uma lista enorme para só depois rejeitar a cópia. Não houve alteração de domínio, finanças ou armazenamento, nem inclusão de dependências.

A correção da área segura acima de Voltar na página Venda veio da mesma referência. Premissas de interface foram atualizadas para revisão 4 e seguem no modelo/backup, separadas dos registros de negócio.

## Validação isolada

- 200 testes de lógica aprovados: inclui física, geometria do recorte, preservação de velocidade, opacidade final, catálogo, estoque, eventos, finanças, relatórios e persistência.
- Referência executada a partir dos arquivos extraídos do APK: 30 sequências, claro/escuro, sem erros JS.
- Versão integrada: 90 sequências em claro/escuro e modos normal/leve/reduzido, sem erros JS. Ajustes e Venda abrem/retornam como páginas; estoque, cérebro e resumo abrem/fecham; custos, guia e tópicos exercitam subjanelas até dois níveis. Reabertura durante o fechamento, substituição do corpo fechado e repouso também aprovados.
- Comparação dos 30 quadros iniciais correspondentes: diferença de posição/tamanho 0 px; recortes idênticos nos 30. É comparação dos estados iniciais, não uma afirmação de igualdade de cada quadro em tempos reais distintos.
- qa/morph014-qa.json, morph014-reference.json e morph014-comparison.json registram a evidência. O ensaio de integração registrou uma long task de 50 ms no modo normal e nenhuma nos modos leve/reduzido; isso não é FPS/P95 de Android.
- A matriz complementar aprovou 85 superfícies e 12 sequências em 320/360/393/412 px, texto ampliado, área curta e ambos os temas, sem erros JS/locais. Inclui estoque, reposição, carrinho, cliente/estado, aparência, resumo, cérebro e eventos. Evidência em qa/stock-dialog-fixes-qa.json.

Os testes usam uma base fictícia e bloqueiam serviços externos. Não efetuam transações no aparelho, compartilham relatórios ou exportam bases reais. Nenhum APK de referência ou seus dados foi publicado no Git.

## Limites e entrega

O comportamento visual foi comparado em Chrome com os assets reais do APK e com o bundle de destino. Isso não mede todos os caminhos de negócio, permissões Android, TalkBack, teclado real ou desempenho em um aparelho básico. Não há garantia absoluta de ausência de engasgos em todo hardware. Os arquivos do build final serão comparados byte a byte ao APK assinado, seguido de instalação por adb install -r e confirmação de versão/horários no Android.

Publicação somente no ramo codex/atualizacao-agro-gestao2. main e o aplicativo sem 2 são preservados. Estado confirmado do APK/instalação consta no checkpoint local RETOMADA-PENDENTE-0.12.14.md.

## Transparência, degradê e entrega confirmada

O produtor ressaltou também a transparência discreta e o degradê da referência. Esse acabamento foi preservado: o CSS completo compilado é idêntico byte a byte ao do APK aprovado (index-XqiuYXSo.css, SHA2564392f3ef5cf5509158754d9e74fbecd9d750fb5efd67c19fe840df1105b1d519). O desfoque externo fixo não desfoca os textos, e o modo leve conserva sua simplificação.

APK final:4.254.487bytes, SHA25606f9da60d30b7c4976bb5ffdf97df5e31b229b74f3c47b649227da989d3f81c5. Certificado original v2/v3, release sem debug e30assets iguais ao dist. Build offline22s. Cópia conferida na pasta original como AGRO-Gestao-2-0.12.14.apk.

Instalado por adb install -r com Success; Android confirmou0.12.14/código54 em19/10/2026às11:42:46, preservando firstInstallTime14/10/2026às18:17:06. Não houve desinstalação, limpeza, transação de teste ou exportação da base real. O app foi trazido à frente.
