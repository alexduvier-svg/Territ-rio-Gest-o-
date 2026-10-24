# AGRO Gestão 2 — Entrega 0.12.83

A versão preparada foi conferida nos dois aparelhos e instalada sem recompilar nem alterar o APK. A matriz de cafés, Drip Coffee, espécies/variedades de café verde, alinhamento do Estoque e material das páginas internas estão descritos na [preparação](PREPARACAO-0.12.83.md).

638 testes unitários, oito jornadas de navegador, quatro verificações complementares do carrinho com três produtos e duas inspeções focadas de material passaram no computador. Agora também passaram as quatro jornadas Capacitor: Reno14 e PKJ110, claro e escuro. Elas incluem inicialização com cadastro pendente, cinco abas, Fornecedores, retorno seguro após erro de render, catálogo, 36 exemplos, Torra/Processo, X do cadastro, custo zero, Drip, café verde sem campo Torra, origem/apresentação separadas, quantidade/seta alinhadas, seta de Orientação com teclado e margens das janelas internas. Capturas dos fixtures nos dois aparelhos foram inspecionadas.

As jornadas usaram somente dados fictícios no pacote isolado. Nenhum banco real foi lido/copiado, venda real criada, WhatsApp enviado ou agenda pessoal acessada. O início frio do APK definitivo confirmou os seis módulos em ambos: agente, movimento, workflows, eventos, fornecedores e treino. Dados existentes e primeiras instalações preservados. Não foram medidos FPS/GPU/bateria/TalkBack/celular básico físico nem execução em páginas de16KB; o alinhamento ZIP/ELF é estrutural. O ajuste do registro da chave de métrica no harness não alterou o APK; a asserção real de deslocamento do X já fazia parte dos testes.

Versão0.12.83, código123, pacote `br.com.territorio.gestao2`, 9,197,683bytes, SHA-256 `ce873701f9fd5b080e8f5f96510f762bb99bd18f0141fe32a615fccd34a22143`. Certificado original `f5dac71cf092b67a80541c5353268ce18ef5f2ab3d4b850248a5934ae7d86b68`, v2/v3, 50arquivos web e duas pontes conferidos, ZIP/ELF16KB, sem permissão de microfone ou GPS. Cópia original conferida: `C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.83.apk`.

Instalação com adb install -r:

- Reno14 (CPH2737): 2026-10-24 14:20:23; primeira instalação preservada 2026-10-21 18:58:01; início frio e seis módulos confirmados.
- PKJ110 (PKJ110): 2026-10-24 14:20:33; primeira instalação preservada 2026-10-14 18:17:06; início frio e seis módulos confirmados.

Fixtures, capturas temporárias nos aparelhos e forwards próprios removidos. Clima, Firebase Spark/App Check, Calendar, servidor e identidade preservados. Código de preparação c494eed e encerramento de preparação2c2d8ba já estavam publicados no ramo AGRO2. O pedido posterior da janela “Vendeu Mais do Que Levou” será tratado separadamente; não exige refazer esta entrega83.
