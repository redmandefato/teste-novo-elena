// ============================================================================
// MOTOR DE FATURAMENTO WHITE LABEL
// Regras deduzidas do relatório "Faturamento Parceiros" do sistema de referência
// (conferidas contra os valores reais de abr/2026 — ver docs/MODELAGEM.md).
// ============================================================================
import type { Account, Pricing, QrInstance, Partner } from '../types';
import { DAY, round2, sum } from './util';

export const DEFAULT_PRICING: Pricing = {
  basePlan: 149.9, // inclui 3 usuários + 1 canal
  includedUsers: 3,
  includedChannels: 1,
  userTiers: [
    { label: 'Faixa 1', from: 4, to: 20, price: 19.9 },
    { label: 'Faixa 2', from: 21, to: 50, price: 14.9 },
    { label: 'Faixa 3', from: 51, to: null, price: 9.9 },
  ],
  channelTiers: [
    { label: 'Faixa 1', from: 2, to: 5, price: 29.9 },
    { label: 'Faixa 2', from: 6, to: null, price: 19.9 },
  ],
  chatbotAI: 50,
  asaas: 29.9,
  qrInstanceMonthly: 69.9, // cobrado por dia de uso (69,90 / 30 = 2,33)
  minimumLicense: 659.8, // licenciamento mínimo mensal do parceiro
  customDomain: 0,
  appCustom: 0,
  volumeDiscount: [
    { above: 10000, pct: 5 },
    { above: 20000, pct: 8 },
  ],
  daysBase: 30,
  infraPerUser: 1.9,
  infraPerChannel: 2.6,
};

export function monthBounds(key: string) {
  const [y, m] = key.split('-').map(Number);
  const start = new Date(y, m - 1, 1).getTime();
  const end = new Date(y, m, 1).getTime(); // exclusivo
  return { start, end, days: new Date(y, m, 0).getDate() };
}

const day0 = (ts: number) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };

/** Dias ativos de uma conta no mês (contagem inclusiva). Mês cheio => fator 1. */
export function activeFactor(startISO: string, endISO: string | null, key: string, daysBase = 30) {
  const { start, end } = monthBounds(key);
  const s = new Date(startISO + 'T00:00:00').getTime();
  const e = endISO ? new Date(endISO + 'T23:59:59').getTime() : null;
  if (s >= end || (e !== null && e < start)) return { days: 0, factor: 0 };
  const from = Math.max(s, start);
  const to = e === null ? end - 1 : Math.min(e, end - 1);
  const fullMonth = from === start && to === end - 1;
  const days = Math.round((day0(to) - day0(from)) / DAY) + 1;
  return { days: Math.min(days, daysBase), factor: fullMonth ? 1 : Math.min(days, daysBase) / daysBase };
}

/** Quantidade de itens cobrados em cada faixa. Ex.: 24 usuários => [17, 4, 0] */
export function tierSplit(count: number, tiers: Pricing['userTiers']) {
  return tiers.map((t) => Math.max(0, Math.min(count, t.to ?? Infinity) - t.from + 1));
}

export interface AccountBill {
  period: string;
  accountId: string;
  name: string;
  isPartnerAccount: boolean;
  startBillingAt: string;
  endBillingAt: string | null;
  users: number;
  usersTiers: number[];
  channels: number;
  channelsTiers: number[];
  base: number;
  usersCost: number;
  channelsCost: number;
  chatbotAI: number;
  transcription: number;
  asaas: number;
  calling: number;
  days: number;
  factor: number;
  total: number;
}

export function computeAccount(acc: Account, key: string, P: Pricing): AccountBill | null {
  const snap = acc.history[key];
  if (!snap) return null;
  const { days, factor } = activeFactor(acc.startBillingAt, acc.endBillingAt, key, P.daysBase);
  if (days <= 0) return null;
  const usersTiers = acc.isPartnerAccount ? P.userTiers.map(() => 0) : tierSplit(snap.users, P.userTiers);
  const channelsTiers = tierSplit(snap.channels, P.channelTiers);
  const base = acc.isPartnerAccount ? 0 : P.basePlan;
  const usersCost = sum(usersTiers.map((c, i) => c * P.userTiers[i].price));
  const channelsCost = sum(channelsTiers.map((c, i) => c * P.channelTiers[i].price));
  const chatbot = acc.chatbotAI ? P.chatbotAI : 0;
  const asaas = acc.asaas ? P.asaas : 0;
  const recurring = (base + usersCost + channelsCost + chatbot + asaas) * factor;
  return {
    period: key,
    accountId: acc.id,
    name: acc.name,
    isPartnerAccount: acc.isPartnerAccount,
    startBillingAt: acc.startBillingAt,
    endBillingAt: acc.endBillingAt,
    users: snap.users,
    usersTiers,
    channels: snap.channels,
    channelsTiers,
    base: round2(base * factor),
    usersCost: round2(usersCost * factor),
    channelsCost: round2(channelsCost * factor),
    chatbotAI: round2(chatbot * factor),
    transcription: snap.transcription,
    asaas: round2(asaas * factor),
    calling: snap.calling,
    days,
    factor,
    total: round2(recurring + snap.transcription + snap.calling),
  };
}

export interface InstanceBill { instance: QrInstance; accountName: string; days: number; cost: number }

/** Instâncias QR: cobradas por dia de uso no mês. Instâncias com menos de 24h de vida não são cobradas. */
export function computeInstances(list: QrInstance[], accounts: Account[], key: string, P: Pricing): InstanceBill[] {
  const { start, end } = monthBounds(key);
  const daily = round2(P.qrInstanceMonthly / P.daysBase);
  const names = Object.fromEntries(accounts.map((a) => [a.id, a.name]));
  return list
    .map((inst) => {
      const s = inst.startAt, e = inst.endAt ?? Date.now();
      if (s >= end || e < start) return null;
      const lifetime = e - s;
      const from = Math.max(s, start), to = Math.min(e, end);
      const days = lifetime < DAY ? 0 : Math.min(P.daysBase, Math.ceil((to - from) / DAY));
      return { instance: inst, accountName: names[inst.accountId] ?? '—', days, cost: round2(days * daily) };
    })
    .filter(Boolean) as InstanceBill[];
}

export interface Consolidated {
  period: string;
  rows: AccountBill[];
  instances: InstanceBill[];
  accountsTotal: number;
  accountsCharged: number;
  minimumApplied: boolean;
  minimum: number;
  qrTotal: number;
  infra: number;
  app: number;
  domain: number;
  discount: number;
  total: number;
  users: number;
  channels: number;
}

export function computeConsolidated(
  key: string,
  accounts: Account[],
  instances: QrInstance[],
  partner: Partner,
  P: Pricing,
  infraCost: Record<string, number>,
): Consolidated {
  const rows = accounts.map((a) => computeAccount(a, key, P)).filter(Boolean) as AccountBill[];
  rows.sort((a, b) => a.name.localeCompare(b.name));
  const inst = computeInstances(instances, accounts, key, P);
  const accountsTotal = round2(sum(rows, (r) => r.total));
  const pf = activeFactor(partner.startBillingAt, null, key, P.daysBase).factor;
  const minimum = round2(P.minimumLicense * pf);
  const minimumApplied = rows.length > 0 && accountsTotal < minimum;
  const accountsCharged = minimumApplied ? minimum : accountsTotal;
  const qrTotal = round2(sum(inst, (i) => i.cost));
  const infra = infraCost[key] ?? 0;
  const app = partner.app === 'Personalizado' ? P.appCustom : 0;
  const domain = partner.customDomain ? P.customDomain : 0;
  const tier = [...P.volumeDiscount].sort((a, b) => b.above - a.above).find((t) => accountsCharged > t.above);
  const discount = tier ? round2((accountsCharged * tier.pct) / 100) : 0;
  return {
    period: key,
    rows,
    instances: inst,
    accountsTotal,
    accountsCharged,
    minimumApplied,
    minimum,
    qrTotal,
    infra,
    app,
    domain,
    discount,
    total: round2(accountsCharged + qrTotal + infra + app + domain - discount),
    users: sum(rows, (r) => r.users),
    channels: sum(rows, (r) => r.channels),
  };
}

/** Simulador de preço (tela Admin > Planos). */
export function simulatePrice(users: number, channels: number, chatbot: boolean, asaas: boolean, P: Pricing) {
  const uT = tierSplit(users, P.userTiers);
  const cT = tierSplit(channels, P.channelTiers);
  const lines = [
    { label: `Plano base (inclui ${P.includedUsers} usuários e ${P.includedChannels} canal)`, value: P.basePlan },
    ...P.userTiers.map((t, i) => ({ label: `Usuários ${t.label} (${uT[i]} × ${t.price.toFixed(2).replace('.', ',')})`, value: uT[i] * t.price })),
    ...P.channelTiers.map((t, i) => ({ label: `Canais ${t.label} (${cT[i]} × ${t.price.toFixed(2).replace('.', ',')})`, value: cT[i] * t.price })),
  ];
  if (chatbot) lines.push({ label: 'Chatbot com IA', value: P.chatbotAI });
  if (asaas) lines.push({ label: 'App Asaas (pagamentos)', value: P.asaas });
  return { lines: lines.filter((l) => l.value > 0 || l.label.startsWith('Plano')), total: round2(sum(lines, (l) => l.value)) };
}
