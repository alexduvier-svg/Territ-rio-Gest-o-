# Localização e previsão do tempo — 0.12.85

Esta diretriz atualiza as regras de localização das versões anteriores. A referência municipal continua disponível; GPS é uma opção adicional, não um requisito para vender ou usar o aplicativo.

## Funcionamento

Em Tempo, o produtor expande o cartão de localização e toca em Usar Minha Localização. O Android solicita permissão durante o uso; localização aproximada também funciona. Depois da escolha, uma nova leitura pontual pode ocorrer ao reabrir Tempo. Abrir o app, trocar de aba e executar tarefas em segundo plano não acionam o GPS. Ao fechar a janela, pausar ou encerrar o app, a leitura pendente é cancelada. Não há rastreamento contínuo nem permissão de localização em segundo plano.

O Android usa os provedores disponíveis de rede/GPS, com prazo de até 12 segundos. Falha, GPS desativado, permissão negada ou indisponibilidade da previsão mantêm a cidade cadastrada como alternativa. Eventos continuam consultando o município do evento, sem substituir seu local pela posição atual do produtor. Usar Cidade Cadastrada desativa a preferência por localização.

As coordenadas são arredondadas a três casas decimais antes de chegar à ponte do app, ao cache e à rede. O servidor interno do AGRO Gestão recebe esse ponto por HTTPS e consulta o MET Norway, com identificação e cache por célula. O servidor não encaminha o IP do cliente ao MET. A comunicação de rede ainda envolve IPs técnicos; não se promete anonimato. Vendas, clientes e estoque não fazem parte da consulta.

O último ponto arredondado e sua previsão podem ficar no cache privado nativo, excluído do backup Android do negócio. Não são adicionados ao ERP, CSV ou backup exportado pelo produtor. A preferência por usar localização é apenas um booleano no ERP. O código não registra coordenadas em logs próprios. Logs da infraestrutura precisam continuar sujeitos à revisão de retenção antes da distribuição pública.

## Atualização e limites

Mantidas as regras de validade/cache e tentativas com espera. O WorkManager continua sincronizando somente o cache municipal compartilhado, aproximadamente a cada 30 minutos, com internet e bateria de pelo menos 50%, respeitando o agendamento do Android. Não busca GPS nem dispara uma nova consulta MET no servidor por essa tarefa. Não existe promessa de consumo zero de bateria ou execução exata a cada 30 minutos.

GPS melhora o ponto consultado, mas não transforma previsão em observação. Para o Brasil, a documentação do MET informa modelo global com resolução aproximada de 9 km e quatro atualizações por dia. Sol, lua, nuvens e pancadas agora seguem os símbolos explícitos da fonte; temperatura alta não é usada para inventar sol. O símbolo pode representar chuva prevista no intervalo, mesmo com sol naquele instante. A janela apresenta o período, emissão/atualização e origem.

## Distribuição

Não foi adicionado SDK de localização Google nem serviço pago. Foram adicionadas permissões opcionais COARSE/FINE, respeitando a escolha do Android. Não existe ACCESS_BACKGROUND_LOCATION. Permissões aceitas nos aparelhos de teste não dispensam o pedido normal em novas instalações.

Antes da publicação na Play Store, a política pública e Segurança dos dados devem refletir a transmissão de localização para funcionalidade opcional. Três casas decimais ainda podem se enquadrar como localização precisa segundo a definição do Google; não declarar ausência de coleta só porque há arredondamento. A classificação de compartilhamento/prestadores, retenção e demais funções do app exige revisão do comportamento completo. Esta entrega não é aprovação da Play Store.

RainViewer não foi integrado: a API pública remanescente é destinada a uso pessoal/educacional; o radar futuro foi retirado em janeiro de 2026. Não substituímos previsão por suposta observação nem adicionamos licença comercial não contratada.

## Referências verificadas em 24/10/2026

- MET: https://api.met.no/doc/locationforecast/datamodel
- Android: https://developer.android.com/develop/sensors-and-location/location/permissions/runtime
- AndroidX: https://developer.android.com/reference/androidx/core/location/LocationManagerCompat
- Play: https://support.google.com/googleplay/android-developer/answer/10787469?hl=pt-BR
- RainViewer: https://www.rainviewer.com/api.html
- Transição RainViewer: https://www.rainviewer.com/api/transition-faq.html
