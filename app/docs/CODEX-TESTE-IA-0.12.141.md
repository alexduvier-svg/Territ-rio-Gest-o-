# Codex Teste IA 0.12.141 — consultas integradas

Versão de teste independente, código 182, pacote `br.com.territorio.gestao2.codextesteia`. Não atualiza a instalação 137–139, cuja chave privada não está disponível. Instalação anterior e seus dados devem ser preservados. A nova chave foi salva separadamente, fora do Git.

## Comportamento

Português, nomes/apelidos e apresentações encaminham consultas aos registros do produtor atual. Produtos reutilizam a agregação de vendas/devoluções/descontos e custos históricos já usada na Gestão. Não há fórmulas financeiras inventadas pelo modelo. Preço e saldo atuais aparecem identificados separadamente. Clientes consultam histórico, itens, fiado, recebimentos e pedidos locais. Eventos usam agenda e conferência operacional existentes. Fornecedores usam cadastro/vínculos; clima usa a previsão já armazenada no módulo do app, com seus limites.

O Qwen interpreta apenas uma área de leitura de um conjunto fechado; resposta fora do esquema é recusada. Explicação seleciona trechos da resposta canônica; não escreve valores novos. Informação externa não confirmada e dados ausentes não são completados pelo modelo. Períodos ainda não interpretados pedem seleção manual. Nomes/apresentações ambíguos pedem esclarecimento. Mudança dos registros, contexto, finanças, pedidos ou fornecedores invalida respostas em andamento.

O Gerente apresenta mensagens interativas baseadas em estoque mínimo, fiado e próximos eventos. Botões continuam a conversa; referências como “dele” só são resolvidas com um único sujeito reconhecido e registros inalterados. Não há envio de mensagens a clientes. A resposta completa pode ser ouvida pela voz offline portuguesa instalada no Android, com controle para parar e interrupção ao sair. Valores ocultos ou respostas antigas não são lidos. Voz de entrada continua pelo reconhecedor offline do Android, quando disponível, com revisão antes de consultar.

## Modelo e distribuição

Qwen3-1.7B INT4, LiteRT-LM 0.18.1, revisão `d6678881da6181864bbc893c80e10aa1ee0d3731`, 977184032 bytes, SHA256 `2a72330b504a6596d53a2c00923c57173b10f1b83e6a541213ffec08d1fc5de8`. Pesos e licença Apache incluídos no APK de teste; não incluídos no Git. Preparação privada na primeira consulta; sem baixar modelos no aparelho e sem consulta ao Git. Aproximadamente 1,3 GB livres adicionais para preparar a cópia privada, além do espaço de instalação. Sujeito às verificações de memória/energia/temperatura já existentes. Se o modelo não puder funcionar, a resposta determinística permanece disponível.

## Validação e limites

Após recuperação do ambiente: 877 testes de domínio aprovados, compilação web e fluxos DOM reais do Consultar/continuação/leitura aprovados. Compilação Android e conferência do APK ainda em andamento neste checkpoint. Não houve teste físico de voz, inferência, instalação ou desempenho no celular do produtor. Este checkpoint não comprova aprovação ou prontidão para publicação na Play Store.

Para usar registros da instalação anterior, o usuário deve exportar uma cópia em Backup e dados e restaurá-la na nova instalação. Nenhuma cópia automática, desinstalação ou alteração dos registros anteriores foi executada.
