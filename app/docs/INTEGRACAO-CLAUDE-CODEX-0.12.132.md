# AGRO Gestão Codex 0.12.132 — integração completa do Claude

Pedido de 28/10/2026: atualizar o Codex com todas as atualizações do Claude disponíveis no Git e no computador.

## Fontes e identidade

- Base Codex: `0d29c22ef617e46ff0bb6b036da06142310372b4`, branch `codex/atualizacao-agro-gestao2`, repositório `alexduvier-svg/Territ-rio-Gest-o-`.
- Fonte Claude: `d170ef9b6d573eb192e9fb5ac88f14f0a7525a3b`, branch `claude/agro-gestao-claude`, repositório `alexduvier-svg/agro-gestao-claude`.
- Ancestral comum: `a4dab1f7f44f4448340dbb896b1422a9d727c04a` (0.12.87). A integração inclui os 59 commits posteriores da fonte Claude; a `main` dela ficou na 0.12.97, 50 commits atrás.
- Destino: **AGRO Gestão Codex 0.12.132**, código Android **172**, pacote **`br.com.territorio.gestao2`**, namespace e certificado originais do Codex.
- A cópia local em `New project`, incluindo o trabalho 0.12.93 não entregue, foi preservada. Os detalhes compatíveis desse trabalho foram adaptados ao renderer atualizado, sem instalar dois sistemas de seções.

O merge utiliza o histórico comum e conserva as alterações exclusivas do Codex. O repositório e o pacote Claude permanecem separados. A conferência final do remoto confirmou a mesma ponta `d170ef9`.

## Conferência das atualizações

| Área | Conteúdo integrado |
| --- | --- |
| Vendas | Seções verticais por tipo de café/categoria, seis cards iniciais e expansão, linhas para famílias pequenas, seções de ornamentais, reordenação por arraste e mapa com miniaturas, um toque para vender e retorno ao card/rolagem ao cancelar. |
| Estoque | Áreas → Subgrupos → Produtos, famílias, busca e contadores, estados textuais, ornamentais separados, posição de Validades e Revisões, restauração de navegação/rolagem e Voltar uma tela por vez. |
| Calculadora | Básica, científica e Contas; sete assuntos completos: Preço, Vendas, Descontos e Taxas, Fornecedores, Estoque e Caixa, Produção Rural, Crédito e Investimento. Busca de produto por seções, campos nomeados, Graus/Rad e ordem dos botões. |
| Finanças | Custo zero confirmado, origem das taxas, decimal corrigido, retirada por mês, demonstrativo reutilizado, revisão dos atalhos e participação dos fornecedores sem dupla contagem no Resultado. |
| Validade | Aviso por produto de 1–90 dias, perda do lote vencido selecionado, custo da perda, avisos compactos com torra e plural, datas reutilizadas na agenda e nos lembretes. |
| Fornecedores | Comparação de até três propostas, à vista/a prazo, rascunhos de compra/entrada/custo, calculadora e navegação de volta ao Estoque. |
| Interface | Topos, perfil, foto, ícone de Tempo, telas de Clientes, calendário de seis semanas, ícone animado de Eventos, rótulo Clientes a Receber $ e aviso de finalização apenas quando há quantidade positiva. |
| Movimento | Diretriz de aberturas, origem/destino do toque, molas e FLIP, cancelamento durante rolagem, caches, listeners limitados, preparação ociosa e preservação das molas no modo leve. |
| Exemplos | Nome e registros fictícios atualizados, vendas/custos de demonstração e migração única de peixes/ornamentais, restrita ao contexto de demonstração. O Modo Teste continua isolado. |

## Melhorias Codex preservadas e correções da integração

- Limite de carga elegível em eventos e reservas; indisponíveis não entram na carga por consequência do merge.
- Uma única interface de calculadora, acrescida da composição Codex de custos e tributos, ajuda por campo e fontes canônicas. Preço sugerido continua sendo um rascunho e exige produto/contexto inalterados.
- Comparação com frete desconhecido mostra resultado parcial, sem apontar vencedor.
- Perda de lote e antecedência restauram o modelo se a gravação falhar. A perda aguarda durabilidade, protege contra toque repetido e não baixa novamente uma operação pendente.
- Caixa calculado com lançamentos separado de caixa projetado após fixos e retirada previstos; resultado contábil preservado. Taxas/impostos continuam identificados como estimativas quando aplicável.
- Preferências locais compatíveis mantidas: Ativar Tempo, privacidade expansível, Toque + para Repor, Voltar ao Topo, Mova os Cards separado e recolhimento em 60 segundos.

## Validação

- **812 testes unitários**, zero falhas, incluindo regressões de lotes, caixa, fórmulas e fontes da calculadora.
- **8 cenários no navegador**: 320/360/393/412 px em claro/escuro; 320 px também com texto ampliado, modo leve e redução de movimento.
- **4 cenários físicos**: Reno14 e Find X8/PKJ, ambos em claro/escuro, em pacote de teste separado, com dados sintéticos e rede bloqueada. Fluxos de navegação, venda/cancelamento, Estoque, Fornecedores e calculadoras aprovados.
- APK release não depurável, assinatura v2/v3 igual à 0.12.92, ZIP íntegro, 58 arquivos compilados idênticos aos embarcados, alinhamento ZIP e ELF 16 KB estrutural.

APK: `AGRO-Gestao-Codex-0.12.132.apk`, **9.292.596 bytes**.

SHA256: `d067918ff7afb82d6ab6827942caf71a4bb5f21699423e36a0cc874ca84bb7b0`.

As evidências técnicas ficam em `qa/codex132-unit.txt`, `qa/codex132-package-review.json`, `qa/codex132-final-review.json` e no diretório de visualizações desta tarefa. O inventário `qa/codex132-source-manifest.json` relaciona todos os commits e arquivos da fonte.

Não foram medidos FPS, bateria ou aparelho básico, nem executado um Android com páginas de memória de 16 KB. A validação de 16 KB é estrutural. Nenhum banco real foi lido nos testes e nenhum serviço de backend precisou de publicação.

## Entrega

O registro final de instalação, preservação da primeira instalação, hashes dos aparelhos e cópias do APK está em `qa/codex132-delivery.json`. A publicação é feita somente na branch Codex do repositório original.

Instalação final confirmada nos dois aparelhos: Reno14 atualizado da 0.12.92, com a primeira instalação preservada; Find X8/PKJ recebeu uma instalação nova, pois o pacote Codex estava ausente. Ambos abriram, mantiveram o processo ativo e apresentaram o mesmo hash do APK validado. O APK também foi copiado para as pastas `New project` e `PROJETOS/Território Gestão`. O pacote sintético desta tarefa foi removido dos celulares após a validação.
