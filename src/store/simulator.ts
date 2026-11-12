// ============================================================================
// SIMULADOR AO VIVO — dá vida ao protótipo:
//  • a cada ~25s chega um novo cliente na fila ou uma nova mensagem
//  • quando o atendente responde, o cliente "digita…" e responde em seguida
// Pode ser ligado/desligado no menu do perfil.
// ============================================================================
import { useStore } from './useStore';
import { CLIENT_REPLIES, CLIENT_DEFAULT, NEW_OPENERS, Step } from '../data/scripts';
import type { ID } from '../types';

const pending: Record<ID, number[]> = {};
let timer: number | undefined;
let tickCount = 0;

const rnd = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

function stepToMsg(step: Step) {
  const [, type, body, extra] = step;
  return { type, body, media: extra ? { ...extra, caption: type === 'image' ? body : undefined } : undefined } as any;
}

export function onAgentMessage(sessionId: ID, text: string) {
  const st = useStore.getState();
  if (!st.prefs.simulation) return;
  const s = st.sessions.find((x) => x.id === sessionId);
  if (!s || s.status === 'concluded') return;
  (pending[sessionId] || []).forEach(clearTimeout);
  const rule = CLIENT_REPLIES.find((r) => r.match.test(text));
  const steps: Step[] = rule ? rule.replies : [rnd(CLIENT_DEFAULT)];
  const t1 = window.setTimeout(() => useStore.getState().setTyping(sessionId, true), 1400);
  let delay = 3200 + Math.random() * 2500;
  const timers = [t1];
  steps.forEach((step, i) => {
    timers.push(window.setTimeout(() => {
      const g = useStore.getState();
      g.setTyping(sessionId, i < steps.length - 1);
      const sess = g.sessions.find((x) => x.id === sessionId);
      const sender = sess?.isGroup ? rnd(sess.participants?.slice(0, -1) ?? ['Participante']) : undefined;
      g.receiveMessage(sessionId, { ...stepToMsg(step), senderName: sender });
    }, delay));
    delay += 1800 + Math.random() * 1500;
  });
  pending[sessionId] = timers;
}

function tick() {
  const st = useStore.getState();
  if (!st.authUserId || !st.prefs.simulation) return;
  tickCount++;
  const r = Math.random();
  if (r < 0.42 || tickCount === 1) {
    // novo cliente chega na fila
    const opener = rnd(NEW_OPENERS);
    const busy = new Set(st.sessions.filter((s) => s.status !== 'concluded').map((s) => s.contactId));
    const candidates = st.contacts.filter((c) => !busy.has(c.id) && !c.archived && !c.blocked && !c.id.startsWith('ctg'));
    const contact = rnd(candidates);
    if (!contact) return;
    const team = st.teams.find((t) => t.id === opener.teamId)!;
    const channelId = opener.channel ?? team.channelIds[0] ?? 'c1';
    st.createIncomingSession(contact.id, channelId, team.id, opener.text);
    st.toast(`Novo atendimento na fila ${team.name}: ${contact.name.split(' ')[0]}`, { icon: 'Inbox', link: '/atendimentos?aba=novos' });
    st.pushNotification({ title: 'Novo atendimento na fila', body: `${contact.name} · ${team.name}`, icon: 'Inbox', link: '/atendimentos?aba=novos' });
  } else if (r < 0.85) {
    // nova mensagem em atendimento aberto (prioriza os meus)
    const me = st.authUserId;
    const open = st.sessions.filter((s) => s.status === 'open' && !s.isGroup);
    const mine = open.filter((s) => s.assigneeId === me);
    const target = mine.length && Math.random() < 0.6 ? rnd(mine) : rnd(open);
    if (!target) return;
    const step = rnd(CLIENT_DEFAULT.filter((x) => x[1] === 'text'));
    st.receiveMessage(target.id, stepToMsg(step));
    if (target.assigneeId === me) {
      const c = st.contacts.find((x) => x.id === target.contactId);
      st.toast(`${c?.name ?? 'Cliente'}: ${step[2]}`, { icon: 'MessageSquare', link: `/atendimentos/${target.id}` });
    }
  } else {
    // mensagem no chat interno
    const lines = ['Alguém pode cobrir a fila do Delivery por 10 min?', 'Chegou reposição de pré-treino na Loja Centro 💪', 'Cliente VIP na fila do SAC, prioridade!', 'Bateu a meta de vendas do dia! 🎉', 'Lembrem de classificar os atendimentos ao concluir 🙏'];
    const others = st.users.filter((u) => u.id !== st.authUserId && u.status === 'online');
    const u = rnd(others);
    if (!u) return;
    useStore.setState((x) => ({ internalChat: [...x.internalChat, { id: `ic_${Date.now()}`, room: 'all', userId: u.id, text: rnd(lines), at: Date.now() }] }));
  }
}

export function startSimulator() {
  if (timer) return;
  timer = window.setInterval(tick, 25000);
  window.setTimeout(tick, 8000);
}
