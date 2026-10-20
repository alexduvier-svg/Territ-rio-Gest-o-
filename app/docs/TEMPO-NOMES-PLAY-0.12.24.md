# Tempo, nomes e distribuição — 0.12.24

A integração de tempo usa MET Norway/Locationforecast, com crédito e CC BY 4.0. Não extrai dados do aplicativo WetterOnline. A API gratuita do Open-Meteo limita uso a fins não comerciais; a consulta anterior do cérebro foi substituída. Não há evidência de comparação local que permita dizer que os provedores empatam ou que algum tem precisão superior em Carangola. O horizonte e os intervalos são os efetivamente recebidos. Probabilidade ausente permanece desconhecida; não equivale a zero.

Fontes verificadas em20/10/2026:
- https://api.met.no/doc/License
- https://api.met.no/doc/TermsOfService
- https://api.met.no/weatherapi/locationforecast/2.0/documentation
- https://open-meteo.com/en/terms
- https://geoftp.ibge.gov.br/organizacao_do_territorio/estrutura_territorial/localidades/Localidades_do_Brasil/2022/
- https://support.google.com/googleplay/android-developer/answer/10787469
- https://support.google.com/googleplay/android-developer/answer/10144311

O produtor ativa a previsão na primeira utilização e pode desativá-la. Não há cadastro em ferramenta externa, GPS, permissão de localização ou chave no APK. Cidade e UF cadastradas vão por HTTPS ao servidor interno do AGRO Gestão. O servidor resolve a sede municipal na base pública IBGE Localidades 2022 e consulta MET com identificação válida, coordenadas de4casas e cache compartilhado. Não encaminha IP do cliente ao MET, nem envia vendas/clientes/estoque. Cloudflare e a comunicação de rede tratam IP técnico; não prometer anonimato absoluto. A base de5570sedes é de2022, não cobertura garantida de alterações territoriais posteriores. Fonte e hash do arquivo em portfolio-server/src/weather-cities-source.json.

Cache compartilhado usa Cache API existente, sem criar namespace pago. Respeita Expires, atualização local no máximo horária com intervalo aleatório; If-Modified-Since e304 quando há last-modified. App sem uso não consulta. Erro mantém última previsão e reduz novas tentativas; indisponibilidade nunca bloqueia vendas. O total de todas as instalações importa: MET exige acordo acima de20requisições/segundo. Monitorar crescimento; não alegar capacidade ilimitada nem SLA. Não houve benchmark de escala.

A janela mostra horário/data da obtenção, referência municipal, atribuição e licença. Volume parcial do período da feira é estimado proporcionalmente e marcado. Previsão não é medição observada, alerta oficial ou evidência causal de alteração de vendas. Não inventar porcentagens de queda de vendas, acurácia local ou chuva passada usando essa fonte.

**Play Store:** licença permite preparar esta integração para uso comercial, com atribuição e condições. Isso não constitui aprovação da Play Store nem auditoria integral do app. Na publicação, manter política de privacidade pública coerente com todas as funções e preencher Segurança dos dados com o comportamento real. Cidade/localização aproximada transmitida deve ser avaliada/declarada mesmo sem permissão Android de GPS; a documentação Google não limita a declaração às permissões. Informar caráter opcional/ativável e finalidade funcional; verificar regras de prestadores de serviço e a configuração real de logs/retenção. Não declarar que nenhum dado sai do aparelho. Não houve envio à Play Console nesta tarefa.

Nomes: modelo, salvamento e formatação de produto usam iniciais maiúsculas em cada palavra; Queijo meia cura vira Queijo Meia Cura. Unidade em medida numérica permanece apropriada. IDs, preços, custos e saldos são preservados. Preços dos cards mantêm base alinhada por fileira; moeda e valor têm espaços próprios e podem quebrar quando necessário para não cortar valores. Grade de3colunas preservada. As premissas estão na memória canônica de interfacev11 e acompanham o backup.
