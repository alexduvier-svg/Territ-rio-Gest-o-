# AGRO Gestão 2 — 0.12.11 / código 51

- Páginas usam uma simulação e um pivô comum: os cards mantêm suas posições relativas em vez de viajar separadamente. Expansão curta com acomodação discreta.
- A saída das páginas internas usa um grupo visual único e uma cópia limitada de painéis visíveis. Sem transformações independentes em seus cards. Barras fixas conservam sua âncora.
- Opções de cliente, estado e desconto da venda mantêm o conteúdo visual depois de close(), como as demais janelas. Limpar seus dados de navegação não interrompe mais a animação de saída.
- Janelas mantêm as alturas do cabeçalho, corpo e ações e a posição da rolagem durante a saída nativa. Não há mudança de material. O fallback pequeno também preserva a rolagem.
- Física analítica acompanha o tempo efetivo de um quadro atrasado, evitando prolongar artificialmente o movimento. O agendador permanece único e para em repouso.
- Claro/escuro, superfícies centralizadas, texto nítido e modos leve/reduzido preservados. Sem novas dependências ou efeitos de blur por quadro.
- Premissas de interface revisão 3 gravadas no modelo/backup, sem alterar registros de negócio. Diagnóstico somente de contadores de movimento, sem dados pessoais.

Comparação com os vídeos anexados e varredura descritas em docs/QA-FLUIDEZ-2026-10-19.md. Os efeitos seguem os princípios visuais de continuidade; não são uma reprodução da implementação proprietária do sistema operacional. Resultado final de build/instalação consta no checkpoint local.

GitHub: esta é a variante AGRO Gestão 2 (`br.com.territorio.gestao2`), no ramo `codex/atualizacao-agro-gestao2`. O `main` contém a evolução independente do AGRO Gestão sem 2 e não é sobrescrito por esta entrega.
