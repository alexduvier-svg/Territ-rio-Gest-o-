# AGRO Gestão 2 — 0.12.77 / código 117

## Comportamento entregue

- Estoque e Fornecedores alternam pela seta do título, usando o motor comum e os mesmos nós da superfície de saída. Retorno e toques rápidos encerram a transição anterior. A lupa em linha fica abaixo dos indicadores; busca tem Voltar comum e ícone separado do campo.
- Conhecer com Exemplos entra explicitamente no Modo Teste: três fornecedores, uma comparação com duas propostas e três compras fictícias. Exemplos não são inseridos no negócio real. Sair recupera os dados reais guardados; não conclui vendas no treino.
- O Que Vou Levar usa teclado em card arredondado, recuo lateral e duas ações abaixo: Salvar verde e Adicionar Depois vermelho, separadas por 12 px. Próximo avança com rolagem automática, preservando quantidades; no último campo, Concluir recolhe o teclado sem salvar a carga.
- Identificação, data, local, horário e status do evento ficam no mesmo card. Cancelar Evento fica fora, abaixo. Concluir Revisão fica no rodapé. Perdas pós-evento não mostram reposição, correção, edição ou histórico. Os três acertos do encerramento reutilizam as seções auditadas existentes, sem duplicar movimentos/vendas.
- Gestão começa pela orientação resumida; o restante é expansível. Diagnóstico Completo e Guia da Banca ficam em Consulta e Preparação. Dicas educativas de Marca/PDV/CRM/KPI variam por dia e contexto; o produtor pode ativar um aviso silencioso por dia. A tarefa Android diária existente é reutilizada, sem ERP no arquivo de configuração, rede, serviço permanente ou promessa de horário exato. Desativar cancela o próprio aviso.
- Cafés têm espécie, variedade/grupo, tipo Superior, torra, processo e fermentação. Ordem padrão prioriza Especial, Gourmet, Superior e Tradicional; dentro do tipo, Clara/TC, Média/TM, Escura/TE e peso crescente. Ordem manual explícita continua disponível. Torra desconhecida do legado não é inventada e Café Verde não exige torra.
- Vendas mostram TC/TM/TE junto do nome; Estoque acrescenta origem em texto menor e legenda. Identidade, perfis, memória de cadastro, cópias para treino e CSV preservam os atributos. IDs, preços, custos e vendas históricas não são reescritos. Processo e fermentação são independentes; cadastro não concede certificação.

Memória de interface 47 e documento offline experiencia-cafes-diretriz.md. Os testes usam registros fictícios e pacote isolado. Clima 27, servidor 59, Firebase Spark/App Check, agenda e dados reais preservados. Nenhum WhatsApp real ou agenda pessoal usados.

## Limites da verificação

Reno 14 e PKJ110 não comprovam desempenho em celular básico. Não foram medidos FPS/GPU, consumo de bateria, TalkBack ou execução em dispositivo físico de páginas de memória de 16 KB. Validade estrutural ZIP/ELF é distinta de execução. Trabalho periódico depende de permissão e políticas do Android; dicas são educativas e não conclusões financeiras.

## Validação e distribuição

625 testes locais, oito jornadas no navegador (320 px com texto ampliado/modo leve/movimento reduzido, 360/393/412 px; claro/escuro) e quatro jornadas Capacitor nos dois celulares e dois temas: PASS. Retorno rápido sem camada residual; exemplos/saída isolados; sequência dos nove campos por Próximo e Concluir, campo ativo visível, raio/recuo/gap de ações verificados. Fluxos de fornecedores/calendário/compra/Pareto e edição dos cafés também conferidos.

Aviso nativo: primeira chamada publica, segunda não duplica, desativar remove. Estado ativo conferido no NotificationManager do próprio pacote. Arquivo privado noBackup verificado nos dois fixtures: apenas textos públicos e contexto opaco; nenhuma base ERP. Quatro conferências adicionais dos acertos da feira confirmaram três seções e rodapé abaixo do teclado. Nenhuma medição de execução da tarefa diária por 24 horas foi feita.

APK 9193587 bytes; SHA256 `d7998da45ba99bf08d31520bc2f8b511c9ceb078e22cf2352883e9fb3b650f47`. Certificado original/v2 e v3; 50 assets web e duas pontes conferidos com dist e fixture; ZIP/ELF com alinhamento estrutural de 16 KB. Acréscimo de 24675 bytes sobre 0.12.76.

Cópia original confirmada: `C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.77.apk`. Instalação com `adb install -r`, sem limpar dados, código117/versão0.12.77 e abertura Status ok:

- Reno14: atualização 2026-10-23 19:56:36; instalação inicial 2026-10-21 18:58:01 preservada.
- PKJ110: atualização 2026-10-23 19:56:43; instalação inicial 2026-10-14 18:17:06 preservada.

Fixtures removidos dos dois aparelhos. Encerramento Git somente no ramo AGRO2; conferir hash final no log. Não repetir build, verificador, cópia ou instalação desta versão por registros documentais posteriores.

Implementação publicada e confirmada no ramo `codex/atualizacao-agro-gestao2`: `55c67bbc02ed866a28fba02af0c504a6053e4e2b`. Capturas temporárias e forwards 9341/9342 removidos; nenhuma pendência de implementação autorizada restante. Encerramento documental posterior não exige novo APK.
