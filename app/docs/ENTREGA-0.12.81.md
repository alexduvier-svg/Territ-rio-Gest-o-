# AGRO Gestão 2 — Entrega 0.12.81

A sigla de torra aparecia ao lado de “Café”, antes do tipo. Agora ela vem depois da segunda palavra em Produtos e Estoque: **Café Especial TC**, **Café Gourmet TM**, **Café Superior TE**. A regra também ordena o rótulo dos nomes compostos, sem reescrever o nome cadastrado.

O título do card usa o fluxo normal do texto: primeira palavra, segunda palavra, sigla inteira e demais palavras quando existirem. Em telas estreitas ou com texto ampliado, a sigla pode passar inteira para a linha seguinte. Não há diminuição forçada da fonte, recorte da sigla, mudança de material, novas margens externas ou alteração das três colunas. As dimensões continuam adaptadas ao conteúdo com as regras existentes.

O Estoque usa o mesmo formatador de rótulo. A regra não atribui uma torra a produtos sem informação, não altera preço, custo, quantidade, ID ou histórico. Os 36 modelos fictícios de café da80 e os demais exemplos permanecem no Modo Teste, assim como o catálogo completo por tipo/torra/peso. Os exemplos são abertos em Ajustes → Modo Teste → Usar Exemplos do Sistema.

Premissa de interface51 e documento offline atualizados. Nenhum serviço ou motor de movimento foi acrescentado.

## Validação

630 testes unitários passaram. A nova verificação cobre o rótulo depois da segunda palavra em nomes simples e compostos, sigla já presente no nome, ausência de torra e preservação do objeto original.

Oito jornadas de navegador passaram em claro e escuro, larguras320 com texto ampliado/modo leve/movimento reduzido,360,393e412. Quatro jornadas Capacitor passaram: Reno14 ePKJ110, nos dois temas. Os36exemplos foram conferidos com a sigla após a segunda palavra, dentro do card, na mesma linha quando há largura suficiente e em três colunas. A ordem e os rótulos no Estoque foram conferidos. A regressão da79 e os fluxos da80 (cinco abas, catálogo com torra, Superior, modo teste e saída preservando o negócio fictício) também passaram.

Testes isolados com dados fictícios; nenhum banco real lido/copiado, transação real criada, WhatsApp enviado ou agenda pessoal usada. Após instalar o pacote definitivo, a inicialização fria confirmou os seis módulos no app principal dos dois aparelhos. Não foram medidos FPS/GPU/bateria/TalkBack/aparelho básico físico ou execução real em páginas16KB; ZIP/ELF16KB foi verificação estrutural.

## APK e instalação

Versão 0.12.81, código 121, pacote `br.com.territorio.gestao2`. APK 9,193,587 bytes; SHA-256 `0fcd46d6006744c6978ae925287fa813d00b1a944ed4abaa478b97936834983b`. Certificado original `f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68`, assinaturas v2/v3, 50 arquivos web e duas pontes nativas conferidos contra a compilação e o fixture, ZIP/ELF16KB. Sem permissão de microfone ou GPS.

Cópia original conferida: `C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.81.apk`. Instalação com adb install -r, sem reset:

- Reno14 (CPH2737): 2026-10-23 21:34:35; primeira instalação preservada 2026-10-21 18:58:01; abertura e seis módulos confirmados.
- PKJ110 (PKJ110): 2026-10-23 21:34:44; primeira instalação preservada 2026-10-14 18:17:06; abertura e seis módulos confirmados.

Pacotes de teste, capturas temporárias dos aparelhos e forwards próprios removidos. Identidade, dados reais, clima, Firebase Spark/App Check, servidor de pedidos e Calendar preservados. Publicação somente no ramo AGRO2 autorizado; Claude e main preservados.
