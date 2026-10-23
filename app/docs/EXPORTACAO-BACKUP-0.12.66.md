# Exportação e recuperação dos dados

CSVs são arquivos de análise por área. O backup JSON completo é o arquivo de restauração do app. Um não substitui o outro.

Dados mantém as planilhas individuais e reúne Exportar Tudo por Área em um ZIP com16CSVs, guia de leitura e manifesto de formato, colunas, contagens e CRC32 por arquivo. Áreas: Vendas/Financeiro, Produtos/Estoque, Clientes/Pedidos e Eventos/Agenda. Inclui descontos no contrato de vendas, Fiado, baixas, pedidos sincronizados, itens, carga registrada e agenda local. O pacote geral usa todo o histórico disponível do aparelho; os botões individuais respeitam o local selecionado. Não inclui credenciais, fotos, configurações ou arquivos de referência e não promete representar pedidos ainda não sincronizados.

CSV UTF-8 com BOM, separador ponto e vírgula, aspas e proteção de fórmulas de planilha. Vendas/itens preservam IDs relacionáveis e a informação de custo conhecido; custo desconhecido não é preenchido com zero histórico. Receita, pagamentos e recebimentos de Fiado são visões do mesmo negócio e não devem ser somados como receitas diferentes. O ZIP usa armazenamento sem compressão, evitando uma biblioteca ou processo de compressão adicional; acima do limite de64MB a operação orienta exportar por área sem truncar registros.

## Três mecanismos distintos

1. **Cópias locais duráveis:** slots A/B verificados e cópias diárias existentes. Protegem contra gravação interrompida; não sobrevivem sozinhas à perda do aparelho ou desinstalação.
2. **Backup automático do AGRO Gestão:** opt-in existente, criptografia AES-256-GCM no aparelho e armazenamento no servidor do app. Exige guardar o código de recuperação fora do celular. Mantém comparação de hash/confirmacão de armazenamento, envio manual e restauração por código. A primeira utilização em operação real oferece proteção quando o app estiver ocioso, sem ativar upload sozinho nem interromper uma venda.
3. **Backup Android/conta Google:** `allowBackup=true` preservado e regras explícitas incluindo apenas os dois slots duráveis, com requisito de criptografia para a nuvem. Exclui duplicação de14cópias diárias, cache, WorkManager e estado dos SDKs. Android/conta/fabricante controlam ativação, horário e restauração; não há chamada direta à API do Drive nem confirmação de cópia Google dentro do AGRO. Capacidade documentada de25MB por app; sem promessa de backup instantâneo ou ilimitado. Transferência entre aparelhos inclui os slots nas regras Android12+.

O app permite Fazer Backup Agora a qualquer momento. No Android o arquivo segue para o seletor de compartilhamento, onde a pessoa pode escolher Drive, Arquivos ou outro destino disponível. A conclusão do compartilhamento é registrada como **arquivo exportado**, não como prova de armazenamento externo. Cancelamento não altera o registro de exportação. O arquivo contém dados do negócio; o usuário deve conferir o destino. Os testes não abriram nem salvaram dados em conta Google pessoal.

Para troca de aparelho: conferir a última cópia confirmada do serviço automático e guardar seu código; fazer também um arquivo manual, verificar que abre como arquivo no destino escolhido e usar Importar ou Restaurar no novo app. Não desinstalar ou apagar o aparelho antigo antes de conferir a restauração. Dados são privados por produtor/origem; os controles nativos em noBackup, incluindo opt-in/limites Gemini, não são transportados como autorização automática de uso da IA.

Referência técnica oficial: [Android Auto Backup](https://developer.android.com/identity/data/autobackup). A presença das regras no APK não comprova que uma conta Google fez backup ou que uma restauração entre aparelhos ocorreu; esse teste não foi executado nesta entrega.
