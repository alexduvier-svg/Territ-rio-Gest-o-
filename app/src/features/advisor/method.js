// A hypothesis is not a diagnosis. Planning records an intention and never edits commerce data.
const METHODS = [
  [/^(campeao-margem|abaixo-custo|preco-90)/, 'Preço, desconto ou custo podem limitar a margem. A aceitação de um novo preço ainda precisa ser observada.', 'Compare margem bruta, quantidade vendida e receita em um período equivalente, registrando o preço testado.'],
  [/^encalhe/, 'A quantidade levada pode estar acima da saída observada. Exposição, horário, preço e público também podem explicar a sobra.', 'Compare vendido ÷ disponibilizado, resultado bruto, saldo e eventual falta em feiras semelhantes.'],
  [/^(repor|acaba-logo|esgotou|previsao-feira)/, 'O saldo e o ritmo registrado podem exigir reposição. Estoque esgotado não comprova procura não atendida.', 'Registre quanto levou, repôs, vendeu e trouxe de volta; confira validade, caixa e horário de eventual falta.'],
  [/^(ticket|dependencia|papel-produto)/, 'O mix, a apresentação ou o perfil das compras podem influenciar o resultado. Os registros não isolam uma causa.', 'Teste uma exposição ou combinação por vez; compare ticket, itens por venda e margem, sem pressupor volume constante.'],
  [/^(retorno|identificar|qr|portfolio|divulgacao)/, 'Identificação e contato podem facilitar o relacionamento; o efeito da ação precisa ser medido.', 'Acompanhe compras identificadas e retornos no período, com autorização de contato. Sem visitantes medidos, não calcule conversão.'],
  [/^preparar/, 'Organização, preço visível e história do produto podem facilitar o atendimento.', 'Escolha uma mudança de marca ou banca, registre o evento e compare os números com uma feira semelhante.'],
];
export function explainMethod(insight) {
  const found=METHODS.find(([pattern])=>pattern.test(insight.id));
  return {...insight,hypothesis:found?.[1]||'Confira os registros e o recorte antes de atribuir uma causa ao resultado.',
    evaluation:found?.[2]||'Revise a informação indicada e execute novamente a conferência no mesmo período e local.',
    testable:!!found};
}
