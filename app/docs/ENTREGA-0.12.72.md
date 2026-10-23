# AGRO Gestão 2 — 0.12.72 / código 112

## Modo Teste

Ajustes oferece Modo Teste em cinza; ativo, mostra Finalizar Modo Teste em vermelho. Aviso vermelho nas cinco abas distingue Exemplos do Sistema de Seus Produtos — Cópias Para Treino. A primeira abertura também oferece os exemplos.

A base fixa tem seis produtos e seis clientes fictícios, sem telefones ou vendas inventadas. A opção própria permite escolher até cinco apresentações existentes ou começar vazio para cadastrá-las no teste. Apenas campos comerciais são copiados; identificações, credenciais, fotos e contatos reais não são transferidos. Cada nova entrada começa da base escolhida.

Permite explorar quantidade, preço, custo, reposição, cadastro de clientes e eventos. NÃO conclui nem venda simulada: o botão de finalizar informa que é necessário desativar o modo para vender realmente. A fronteira canônica ERPModel.complete também impede qualquer registro/baixa de venda. O carrinho de teste nunca vira venda real. Gestão pode ser explorada, mas os exemplos não fabricam faturamento.

O treino usa diário A/B próprio, com integridade e confirmação de leitura, fora dos slots reais e do backup Android. Entrada aguarda dados/rascunho reais; saída confirma dois registros inativos e descarta somente o treino. Reabertura mantém o modo identificado; não há troca silenciosa para dados reais após falha. Sem backup, lembretes, agenda externa, publicação, envio ou Gemini online no treino. Os agendamentos reais não são reconfigurados nem cancelados. Cancelamentos transitórios de explicação de IA durante troca de janela não enviam dados nem ativam o serviço.

## Estoque em Produtos

A caixinha vermelha fica dentro da pill Loja, entre valores/pontinhos e olho, somente em contorno, sem círculo, fundo ou sombra. Ícones vermelho e verde medem 24px; a área de toque é preservada. Em tela pequena, a linha financeira é acomodada inteira. A elegibilidade e o adiamento do alerta durante feira seguem as regras existentes.

Card indisponível tem ação própria Repor Estoque, acessível por toque/teclado; não é selecionado para venda nem seleção múltipla. Abertura cancela toque pendente para evitar duas telas. Reposição usa o fluxo canônico, preservando reservas, carga de feira e carrinho. Saldo continua validado antes de vender; não há alocação automática para a feira.

## Verificação

578 testes unitários, incluindo dez de treino: base fixa/cópias sanitizadas/limite, diário e reabertura/saída, falha/corrupção, rejeição de contexto real e bloqueio canônico de venda. Oito cenários no navegador: claro/escuro × 320px ampliado/leve/reduzido,360,393,412. Quatro jornadas Capacitor nos dois celulares e dois temas: cinco abas, preço/custo/reposição, aviso de venda, slots reais do fixture idênticos durante treino, reabertura e descarte, ausência de ações externas. Também conferem caixinha na pill, dimensões, ausência de círculo, reposição pelo card e conflito de toques, sem venda criada.

Somente dados sintéticos em pacote separado. Nenhuma transação real, mensagem WhatsApp ou agenda pessoal acessada. Sem medição de FPS/GPU/bateria/TalkBack/aparelho básico físico/runtime16KB; ZIP e ELF LOAD16KB conferidos. Layout/motor/clima27/servidor59/FirebaseSparkAppCheck/identidade preservados.

APK: 9.136.050 bytes; acréscimo4.096 bytes sobre71. SHA256: 0b8cebdbcdaff8c4257d466c82fb3036ff4911da6ea0032bfc060c21396fa99f. Certificado original, v2/v3,48assets+2pontes.

Instalação e publicação: consultar confirmação final abaixo; não repetir build por este documento.

## Confirmação de Instalação

Cópia original conferida pelo SHA256 acima em C:/Users/alexd/PROJETOS/Território Gestão/AGRO-Gestao-2-0.12.72.apk. Instalado com adb install -r em 23/10/2026: Reno14 às15:24:20 e PKJ110 às15:24:26, código112/nome0.12.72/abertura Statusok. firstInstallTime preservado: Reno21/10 18:58:01, PKJ14/10 18:17:06. Fixtures, capturas e forwards temporários removidos dos dois. Uma tentativa preliminar no Reno não confirmou instalação; cliente sem resposta foi encerrado, sem limpar dados; o pacote definitivo foi instalado depois por streaming com sucesso. Não repetir build/verificador/cópia/instalação por este registro.
