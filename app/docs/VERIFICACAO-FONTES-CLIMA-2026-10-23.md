# Fontes meteorológicas — verificação de23/10/2026

Pedido humano: avaliar Google/Climatempo/INMET após relato de chuva local antes do horário previsto. Não ativar faturamento nem fonte paga.

## Constatações

- Google Weather API oficial oferece condições atuais/previsão; exige projeto com faturamento. Franquia mensal10mil eventos, primeira faixa excedenteUS$0,15/mil, compartilhada pelo projeto. Não ativado. https://developers.google.com/maps/documentation/weather/usage-and-billing e https://developers.google.com/maps/billing-and-pricing/pricing#environment-pricing
- Climatempo Advisor anuncia teste e contratação; gratuidade comercial permanente não confirmada. Não integrado. https://advisor.climatempo.com.br/
- INMET informa dados públicos e gratuitos, observações horárias de estações, possibilidade de ausência/falha e dados brutos. Não representam automaticamente a chuva na sede municipal ou na banca. https://portal.inmet.gov.br/noticias/saiba-como-acessar-os-dados-meteorol%C3%B3gicos-dispon%C3%ADveis-no-site-do-inmet
- A API direta de dados é objeto de solicitação ao canal api@inmet.gov.br, publicado em https://portal.inmet.gov.br/fale-conosco . Documento oficial descreve liberação de chaves: https://portal.inmet.gov.br/uploads/notastecnicas/V.5_Planejamento_Estrategico_INMET.pdf . Não enviar e-mail sem autorização explícita. Não confundir publicação gratuita no portal com contrato/limites de API já concedidos.
- Link RSS publicado pelo próprio portal: https://apiprevmet3.inmet.gov.br/avisos/rss . GET público testado:HTTP200,application/rss+xml,23/10. Cabeçalho informa reprodução com fonte/public domain, exceto conteúdo de terceiros. Isso é aviso de risco, não medição nem detector de chuva atual. Integração futura deve validar vigência, área/códigos municipais, fonte e não tratar ausência/falha de feed como ausência de risco. Não foi instalado novo provedor nesta entrega.
- Catálogo público existe; página monta as estações por JavaScript. Estação atual mais próxima/operante e distância para Carangola não confirmadas nesta verificação; não presumir que Muriaé é a mais próxima nem substituir a cidade por ela.

## Verificação operacional atual

Consulta somente ao endpoint público do AGRO para Carangola/MG às10h22(Brasília):issuedAt23/10 10h17min49,retirada10h18min34,expira10h50min29,stale=false. Ponto10h:24,2°C,nublado,0mm/1h;11h:26°C,chuva fraca,0,1mm/1h. A divergência com chuva observada pelo usuário pode persistir após atualização porque a fonte não é observação local. Nenhum banco ERP/posiçãoGPS consultado.

## Encaminhamento

Manter MET para previsão e cache econômico. Avaliar INMET em camada separada: avisos oficiais por município e observações com nome da estação/distância/horário/falhas. Não fazer média ingênua de fontes, não inventar chuva, não inserir chave no APK. Integração de observações depende de acesso/documentação e cobertura válidos; RSS sozinho não resolve a condição atual.

## Manhuaçu indicada pelo usuário

Confirmada a referência MANHUACU/A556 no portal Tempo do INMET: https://tempo.inmet.gov.br/TabelaEstacoes/A556 . Catálogo de localização do INPE lista estação INMET em-20,2636/-42,1828: https://data.inpe.br/docs/dissm/spdrad/latest/locations/ . Isso confirma a referência, não que os dados de hoje estejam chegando nem que seja a estação mais representativa da banca. Leitura atual utilizável permanece não confirmada.

## Clima&Radar/WetterOnline indicada pelo usuário

Aplicativo confirmado pela listagem https://play.google.com/store/apps/details?id=de.wetteronline.wetterapp&hl=pt_BR . Termos oficiais https://www.wetteronline.de/agb determinam contato prévio para reutilização dos conteúdos; widget web limitado não equivale a API para incorporar dados no APK. Nenhuma autorização/API comercial gratuita confirmada. Não confundir WetterOnline GmbH com WorldWeatherOnline, fornecedor diferente. Não copiar dados, mapas nem endpoint interno do app.
