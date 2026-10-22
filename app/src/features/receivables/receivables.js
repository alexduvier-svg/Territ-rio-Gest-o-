// Valores em centavos. Fiado é venda entregue, não entrada de dinheiro.
export const CASH_METHODS = ['Pix', 'Dinheiro', 'Crédito', 'Débito', 'Outro'];
export const day = (at = Date.now()) => new Intl.DateTimeFormat('en-CA', {timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at));
export function validDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const at = new Date(value + 'T12:00:00Z');
  return Number.isFinite(+at) && at.toISOString().slice(0,10) === value;
}
export const principal = sale => (sale.payments || []).filter(p => p.method === 'Fiado').reduce((n,p) => n + p.amount, 0);
export const paid = sale => (sale.credit?.receipts || []).reduce((n,r) => n + r.amount, 0);
export const balance = sale => sale.status === 'completed' ? Math.max(0, principal(sale) - paid(sale)) : 0;
export function draftError(draft, today = day()) {
  if (draft.payment !== 'Fiado') return '';
  if (draft.split) return 'Fiado deve ser registrado como uma única forma de pagamento.';
  if (!String(draft.clientName || '').trim()) return 'Escolha ou informe o cliente do Fiado.';
  if (!validDay(draft.creditDueDate) || draft.creditDueDate < today) return 'Escolha uma data de pagamento a partir de hoje.';
  return '';
}
export function collections(sales, matches = () => true) {
  return sales.flatMap(s => (s.credit?.receipts || []).map(r => ({...r,saleId:s.id,scope:s.scope || 'loja',customerId:s.customerId}))).filter(matches);
}
export function outstanding(sales, clientId) {
  return sales.filter(s => (!clientId || s.customerId === clientId) && balance(s) > 0)
    .sort((a,b) => String(a.credit?.dueDate).localeCompare(String(b.credit?.dueDate)) || String(a.date).localeCompare(String(b.date)));
}
// Uma baixa integral explícita; a mesma operação nunca baixa duas vezes após falha/reabertura.
export function settle(sales, {saleId,operationId,method,date}, now = Date.now()) {
  const s = sales.find(s => s.id === saleId);
  if (!s || !principal(s)) throw Error('A venda a receber não foi encontrada.');
  if (!operationId || operationId.length > 120) throw Error('Identificação do recebimento inválida.');
  if(sales.some(other=>other!==s&&(other.credit?.receipts||[]).some(r=>r.id===operationId)))throw Error('Este recebimento já pertence a outra venda.');
  const previous = (s.credit?.receipts || []).find(r => r.id === operationId);
  if (previous) {
    if (previous.method !== method || previous.date.slice(0,10) !== date) throw Error('Este recebimento já foi salvo com outros dados.');
    return previous;
  }
  if (!CASH_METHODS.includes(method)) throw Error('Escolha como recebeu o pagamento.');
  if (!validDay(date) || date < day(s.date) || date > day(now)) throw Error('A data do recebimento deve ficar entre a venda e hoje.');
  const amount = balance(s);
  if (!Number.isSafeInteger(amount) || amount <= 0) throw Error('Esta venda não tem valor a receber.');
  const previousReceipts=s.credit?.receipts||[];
  if(!s.credit||previousReceipts.some(r=>!Number.isSafeInteger(r.amount)||r.amount<=0)||paid(s)>principal(s))throw Error('Confira o histórico de recebimentos antes de baixar.');
  const receipt = {id:operationId,method,amount,date:date+'T12:00:00-03:00',recordedAt:new Date(now).toISOString(),audit:{engineVersion:2,operationId,ruleId:'domain.receivable',result:'verified',reason:'integral_balance_and_idempotency',at:new Date(now).toISOString()}};
  s.credit.receipts = [...previousReceipts,receipt];
  // Verify actual result before returning to the existing durable domain commit.
  if(balance(s)!==0||s.credit.receipts.filter(r=>r.id===operationId).length!==1){s.credit.receipts=previousReceipts;throw Error('Não foi possível conferir o recebimento.');}
  return receipt;
}
export function refundedCash(sale) {
  return (sale.payments || []).filter(p => p.method !== 'Fiado').reduce((n,p) => n+p.amount,0) + paid(sale);
}
