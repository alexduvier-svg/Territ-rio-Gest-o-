# AGRO Gestão 2 — 0.12.87

Entrega instalada em 26/10/2026 no Reno14 e PKJ110, com cópia conferida na pasta original. Código e QA no commit fd7d81bc32fb73e877c6b3d045128107fa79730b, push e hash remoto confirmados exclusivamente no ramo codex/atualizacao-agro-gestao2. A calculadora Contas foi avaliada separadamente; ainda não integra esta versão.

## Comportamento entregue

Validade opcional por entrada/lote, antes de Valores e Estoque no cadastro e também na reposição. Aceita data digitada, calendário ou prazo em dias/meses com referência e confirmação. Uma nova entrada não herda automaticamente a validade anterior. Saldo antigo é preservado com validade não informada, sem inventar datas ou refazer movimentações.

O saldo físico continua único. Lotes e reservas são alocações das movimentações canônicas, com validação e reversão na mesma transação. Vendas usam lotes elegíveis por vencimento; vencidos e itens em avaliação continuam visíveis fisicamente e ficam indisponíveis comercialmente. Devoluções mantêm a origem e passam por conferência. Não há mudança retroativa do custo das vendas.

Estoque, entrada, detalhe do produto, agenda, consultas e exportações mostram as informações dos lotes atuais. A carga da feira reserva quantidades reais, sem acrescentar estoque, e informa a faixa de validade na data do evento. Acertos de vendas antigas exigem data confirmada e escolha de lote quando houver alternativas. JSON preserva metadados e CSVs incluem lotes, alocações e agenda.

O reconciliador de notificações existente trata D−5/D0; esgotar o lote cancela sua pendência. Avisos ocasionais de validade não informada respeitam dispensa e cadência. A Orientação usa as mesmas fontes e hierarquia, sem outro motor ou promessa de demanda. Não recomenda compra quantitativa sem dados suficientes ou promoção de itens em avaliação/vencidos.

O servidor foi atualizado com autorização humana. Anuncia lotAvailability=1 e revalida os segmentos de estoque por data ao consultar e criar pedidos, mesmo com o app fechado. Não foram alterados esquema, migrações ou bindings. Informações privadas de lote/fornecedor não entram no protocolo público.

Últimos ajustes humanos: símbolo vermelho $ antes de Receber no cartão e no título; Adicionar Depois vermelho à esquerda e Salvar verde à direita em O Que Vou Levar; removido Inserir Quantidade, mantendo somente Próximo/Concluir no teclado, números verdes e espaçamento do sistema.

## Validação do candidato exato

- 744 testes locais do app e 47 do servidor aprovados.
- Oito jornadas com assets finais compilados: claro/escuro, larguras 320 com texto ampliado/modo leve/efeitos reduzidos, 360, 393 e 412.
- Quatro jornadas completas no Capacitor: Reno14 e PKJ110, nos dois temas. Incluem regressões das cinco abas, cafés, fornecedores, navegação, teclado, clima com localização fictícia, tarefas, cadastro pendente, reservas, acertos antigos, quarentena e restauração JSON. Sem erros de página.
- Aviso D0 entregue e cancelado após zerar o lote nos dois aparelhos isolados. D−5 validado pelo planejador/testes; não se aguardou cinco dias no aparelho.
- 56 assets web e duas pontes conferidos entre dist, APK principal e fixture compilado. No fixture, apenas duas injeções HTML sintéticas e configuração de pacote diferem.
- Assinatura original v2/v3; alinhamento ZIP e segmentos ELF 16 KB verificados estruturalmente. Não houve medição de FPS/GPU/bateria, aparelho básico físico, TalkBack ou execução em Android de página 16 KB.

O ensaio usa exclusivamente AGRO QA Lotes, pacote separado e dados fictícios, com rede externa bloqueada. A espera por fechamento do teclado e pela animação foi ajustada no QA para não medir controles durante a transição. O problema técnico de ZIP inválido no fixture foi resolvido com reconstrução completa e escrita explícita dos bytes; não foi instalado no app principal. Os relatórios finais são posteriores ao APK e exigem os últimos ajustes humanos.

## Arquivo e instalação

APK: AGRO-Gestao-2-0.12.87.apk; pacote br.com.territorio.gestao2; versão 0.12.87, código 127; 9.243.258 bytes.

SHA256: 19846277f6b785f75ca6fb632ef713e4948ebe4190756b2358cdf062d148bc12.

Certificado SHA256: f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68.

Pasta original: C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.87.apk. Hash idêntico ao candidato e aos dois APKs instalados com adb install -r.

| Aparelho | Atualização | Primeira instalação preservada | Abertura principal |
|---|---|---|---|
| Reno14 CPH2737 | 26/10/2026 13:41:17 | 21/10/2026 18:58:01 | Sinal técnico agent/motion/workflows/events/suppliers/training confirmado |
| PKJ110 | 26/10/2026 13:41:31 | 14/10/2026 18:17:06 | Lançamento a frio concluído; usuário confirmou abertura normal |

No PKJ o sinal AGRO.UI de prontidão não chegou; não se afirma confirmação técnica dos módulos no app principal desse aparelho. A regressão isolada completa dos mesmos assets passou nos dois temas. A primeira checagem foi interrompida por outro app em primeiro plano; a reabertura não reinstalou nem zerou dados.

Fixtures, captura própria no armazenamento compartilhado e forwards 9351/9352 removidos. Não houve extração do banco principal, reset de dados, venda/pagamento real, envio de WhatsApp ou uso de agenda pessoal para QA. A migração normal do app preserva registros e acrescenta os metadados de lotes.

Servidor publicado: 7ad6bebd-5e5e-4f08-b139-f68c456ef5f4. Metadados locais: native-apk-validation-0.12.87.json. Relatórios finais em qa/validity087-final-review.json e qa/validity087-native-{reno,pkj}-{light,dark}.json.

## Calculadora — próxima implementação

PDF de oito páginas e módulo do Claude no commit 22e3813 revisados; sem merge de arquivos financeiros do AGRO3. O link privado exigiu login e seu artefato não foi visualizado. A avaliação está em AVALIACAO-CALCULADORA-CONTAS-2026-10-26.md.

É viável manter a aparência atual e adicionar $ ao lado da Científica, transformando a mesma janela em Contas, com explicações locais e integração às fontes canônicas de Finanças. Precisam ser respeitados custo ausente versus zero, taxas confirmadas versus defaults, sobras versus perdas, contribuição versus lucro líquido e recortes equivalentes. Não declarar o modo Contas como instalado nesta entrega.
