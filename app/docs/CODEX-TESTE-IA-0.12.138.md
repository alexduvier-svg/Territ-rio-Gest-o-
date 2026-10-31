# Codex Teste 0.12.138 — baixar e ativar com um toque

O produtor abre Ajustes > Inteligência e toca em **Baixar e ativar assistente**. O app baixa o Qwen3 compatível, mostra o progresso, confere tamanho e SHA-256 e ativa o modelo. Não abre navegador nem pede escolha de arquivo.

- Download de977MB, iniciado apenas pelo toque; Wi-Fi recomendado e cerca de1,3GB livres.
- Tela permanece ligada durante o download em primeiro plano. Sair/fechar pausa; Retomar continua o arquivo parcial.
- Origem HTTPS e revisão fixas. Redirecionamentos limitados a HTTPS de provedores autorizados; nenhuma URL arbitrária vem da interface.
- Se o servidor ignorar Range, reinicia o arquivo parcial; não concatena duas cópias.
- Conteúdo incompleto nunca é ativado. SHA inválido elimina somente o arquivo parcial; dados do negócio não são acessados.
- Cálculos, explicação sob demanda e voz Android mantêm os limites descritos na137.

## Atualização

Pacote br.com.territorio.gestao2.codexteste, código179, versão0.12.138-teste.2, mesmo certificado da137. Atualiza somente o Codex Teste. O AGRO Gestão original tem outra identidade e é preservado.

APK Codex_Teste_0.12.138.apk: 37035726bytes. SHA-256: 7c3e7c6f8b7291919cfa79ee1913552fce827ed4c944c4c3a8fc49cf33ebe479.

## Validação

837testes de domínio passaram.9cenários Java cobrem download completo, retomada, reinício por resposta200, Range incorreto, SHA inválido, pausa, corpo truncado, redirecionamento inseguro e arquivo ausente. O teste DOM confirma botão único, ativação automática, retomada e ausência de navegador/importação no fluxo. Build Android, assinatura v2, identidade,64arquivos públicos e alinhamento ZIP16KB conferidos; bibliotecas idênticas às137, já verificadas para ELF16KB. Origem fixa respondeu200 em HEAD.

O download completo de977MB, a inferência, a voz e o comportamento visual ainda precisam de teste em Android físico. Não apresentar os testes sintéticos como validação no celular.
