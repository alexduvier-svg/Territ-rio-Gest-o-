# AGRO Gestão 2 — Entrega 0.12.80

Os exemplos de café mostravam somente tipo e peso e não representavam o cadastro que o produtor usará no dia a dia. Agora os Exemplos do Sistema usam apenas o padrão tipo + torra + peso em Produtos e Estoque, com as siglas em espaço próprio nos cards existentes, sem alterar suas dimensões ou as três colunas.

## Modelos e sequência

São 36cafés fictícios: Especial, Gourmet, Superior e Tradicional. Dentro de cada tipo: TC250g/500g/1kg, depois TM250g/500g/1kg e depois TE250g/500g/1kg. O Modo Teste mantém os outros cinco produtos e seis clientes, totalizando 41produtos. Os IDs de exemplo são estáveis; o primeiro permanece training-coffee. O modelo antigo do café de demonstração foi substituído. O treino com produtos próprios continua limitado a cinco cópias sanitizadas; nenhuma torra é inventada para uma cópia sem essa informação.

Para abrir os novos exemplos: Ajustes → Modo Teste → Usar Exemplos do Sistema. Uma sessão de treino antiga já aberta mantém suas edições; sair dela e abrir os exemplos novamente carrega o conjunto atualizado. O treino permanece separado da operação real e não permite concluir vendas, nem simuladas. Preços, custos e saldos dos novos exemplos são explicitamente fictícios e não entram no negócio real.

## Catálogo e torra

A auditoria encontrou outra causa para a perda das siglas: nas sugestões originais, a torra estava no nome e no campo sabor, e não era transferida para coffeeRoast ao cadastrar. A adaptação agora preserva a torra explicitamente selecionada no campo próprio, separada de sabor, e apresenta Café + Tipo com a sigla correspondente. Não se deduz a torra pelo nome de um produto do produtor.

O catálogo original de 2479referências e seus IDs permanecem preservados. Foram acrescentadas 18sugestões de Café Superior, com três torras, três pesos e dois formatos (Moído e Em Grãos). Junto aos tipos originais são 72modelos de café, 36 por formato. Total geral 2498referências: 2479originais e 19 adições do app, incluindo o Queijo Ralado50g anterior. As sugestões de café ficam em quatro famílias por tipo, com as apresentações ordenadas pelo motor compartilhado. Selecionar uma referência continua sem preencher preço, custo ou estoque.

Para registros antigos que já guardavam exatamente “Torra Clara”, “Torra Média” ou “Torra Escura” no antigo campo sabor, a exibição reconhece essa informação explicitamente registrada. Isso não reescreve o cadastro nem usa um nome genérico para adivinhar a torra. Registros sem informação continuam desconhecidos. Não foram excluídos ou criados produtos reais, redistribuídos saldos, alterados preços/custos ou apagados históricos.

Premissas embarcadas: interface50, catálogo de estoque3 e conhecimento de catálogo1.0.3. Documentos offline atualizados. Não foi criado outro layout, serviço de rede ou motor de ordenação.

## Validação

629 testes unitários passaram, incluindo toda a matriz de 36, ordenação com entrada invertida, identidade independente entre torras, adaptação dos 72modelos, roundtrip dos 2479registros originais, importação idempotente, exemplos fictícios e proteção do treino próprio.

Oito jornadas de navegador passaram em claro/escuro e larguras 320 (texto ampliado, modo leve e movimento reduzido), 360, 393 e 412. Quatro jornadas Capacitor passaram: Reno 14 e PKJ110, cada um nos dois temas. Foram verificadas as siglas dos 36 cards, as três colunas, dimensões e limites, mesma ordem no Estoque, Café Superior no catálogo, transferência da torra para o formulário sem valores financeiros, bloqueio de vendas do Modo Teste e restauração dos produtos/vendas/movimentos/clientes originais fictícios ao sair do treino.

A regressão da inicialização com cadastro pendente da79, cinco abas, fornecedores, históricos, eventos/gestão e rollback de navegação também passou. Os testes usaram pacote isolado e dados fictícios. Após a instalação final, a inicialização a frio do app principal confirmou os seis módulos em ambos os aparelhos. Não foram lidos ou copiados bancos reais, criadas transações reais, enviadas mensagens WhatsApp ou usadas agendas pessoais.

Não foram medidos FPS/GPU/bateria/TalkBack/aparelho básico físico. Alinhamento ZIP/ELF16KB é verificação estrutural, sem ensaio de execução em aparelho de páginas16KB.

## Artefato e instalação

Versão 0.12.80, código120, pacote `br.com.territorio.gestao2`. APK9193587bytes, SHA-256 `14832e6f49aa8bee0972aece1201d5f7cc1b792df8e97469a2a09a7744f9e612`. Certificado original `f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68`, assinaturas v2/v3,50arquivos web e duas pontes nativas conferidos contra a compilação e o fixture, ZIP/ELF16KB. Sem permissão de microfone ou GPS.

Cópia original conferida em `C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.80.apk`. Instalações com adb install -r, sem reset:

- Reno14 (CPH2737): 2026-10-23 21:22:21; primeira instalação preservada 2026-10-21 18:58:01; abertura e seis módulos confirmados.
- PKJ110 (PKJ110): 2026-10-23 21:22:32; primeira instalação preservada 2026-10-14 18:17:06; abertura e seis módulos confirmados.

Fixtures, imagens temporárias dos aparelhos e forwards próprios removidos. Clima, Firebase Spark/App Check, servidor de pedidos, Calendar, identidade do APK e dados reais preservados. Git somente no ramo AGRO2 autorizado; Claude e main preservados.
