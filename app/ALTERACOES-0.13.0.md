# AGRO Gestão 0.13.0

Registro histórico de uma numeração de teste anterior (código Android 43). A sequência posterior foi consolidada em 0.12.x; a versão atual usa código 49. Este arquivo não orienta instalar uma versão antiga.

Versão Android de teste com animações físicas e superfícies de vidro, preparada em 15 de outubro de 2026.

As transições usam molas com posição e velocidade. O indicador das abas segue a seleção e pode mudar de destino durante o movimento. Botões respondem à pressão; janelas, páginas, seções e avisos entram com movimento breve. Janelas continuam fechando imediatamente para a lógica do app, enquanto uma cópia visual inerte termina a saída.

O vidro aparece na navegação, nos controles flutuantes e nas janelas. As superfícies de dados mantêm leitura estável. Os temas claro e escuro e os estilos Feira e Clássico continuam disponíveis. Redução de movimento do sistema desativa as molas; a opção existente de reduzir transparência também reduz os efeitos. O modo leve limita movimento e remove o desfoque.

## Arquivos principais

- `src/features/motion/spring.js`: solução analítica da mola.
- `src/features/motion/index.js`: ciclo compartilhado de animação e integração com controles.
- `src/motion.css`: indicador e compatibilidade de movimento.
- `src/glass.css`: materiais, contraste e alternativas sem desfoque.
- `src/features/interface.js` e `src/main.js`: integração com a interface existente.

## Verificação

- 47 testes existentes e 7 testes de física aprovados.
- Auditoria de texto sem ocorrências nas larguras 360 e 375 px, nos dois temas e estilos.
- Navegador: pressão, troca rápida de abas, fechamento síncrono de janelas, redução de movimento e modo leve verificados sem erros JavaScript.
- Build de produção Vite e sincronização Capacitor concluídos.
- APK Android compilado com Gradle, versão 0.13.0, código 43, mesmo identificador de pacote e assinatura de teste do APK 0.12.4 fornecido.
- Nenhum dispositivo Android conectado: instalação e fluidez no aparelho ainda precisam ser verificadas.

## Compilar novamente

Requisitos: Node 22+, JDK 21, Android SDK com plataforma 36 e Build Tools 35.0.0. Configure `android/local.properties` para o SDK local.

```powershell
npm install
node --test tests/*.test.mjs
npm run apk:debug
```

Saída: `android/app/build/outputs/apk/debug/app-debug.apk`. Para atualizar a instalação anterior, use a mesma chave de assinatura de teste.
