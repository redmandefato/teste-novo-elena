// ============================================================================
// STORE GLOBAL (zustand) — estado do app + ações.
// Hoje os dados vêm do gerador de mocks e ficam salvos no localStorage.
// Para ligar num backend real, troque as ações por chamadas de API
// (a "forma" dos dados já é a mesma de src/types.ts / docs/schema.sql).
// ============================================================================
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Seed, Message, Session, Prefs, Contact, Card, ID } from '../types';
import { createSeed, SEED_VERSION } from '../data/seed';
import { uid } from '../lib/util';

export const ME = 'u1';

interface UIState {
  typing: Record<ID, boolean>;
  toasts: { id: string; text: string; icon?: string; tone?: 'default' | 'success' | 'error'; link?: string }[];
  railOpen: boolean;
}

interface Actions {
  login: (userId?: ID) => void;
  logout: () => void;
  reset: () => void;
  setPrefs: (p: Partial<Prefs>) => void;
  // atendimentos
  markRead: (sessionId: ID) => void;
  sendMessage: (sessionId: ID, msg: Partial<Message>) => void;
  receiveMessage: (sessionId: ID, msg: Partial<Message>) => void;
  addEvent: (sessionId: ID, body: string, event: Message['event']) => void;
  assignToMe: (sessionId: ID) => void;
  transfer: (sessionId: ID, target: { teamId?: ID; userId?: ID }, note?: string) => void;
  conclude: (sessionId: ID, data: { classification?: string; saleValue?: number | null; csat?: boolean }) => void;
  reopen: (sessionId: ID) => void;
  startConversation: (phone: string, channelId?: ID) => ID;
  createIncomingSession: (contactId: ID, channelId: ID, teamId: ID, firstText: string) => ID;
  toggleWatch: (sessionId: ID) => void;
  // contatos
  updateContact: (id: ID, patch: Partial<Contact>) => void;
  addContact: (c: Partial<Contact>) => ID;
  addContactNote: (id: ID, text: string) => void;
  // CRM
  moveCard: (cardId: ID, stageId: ID) => void;
  updateCard: (cardId: ID, patch: Partial<Card>) => void;
  addCard: (c: Partial<Card> & { panelId: ID; stageId: ID; title: string }) => ID;
  removeCard: (cardId: ID) => void;
  // genérico
  patch: <K extends keyof Seed>(key: K, value: Seed[K]) => void;
  upsert: <K extends ListKeys>(key: K, item: any) => void;
  removeItem: <K extends ListKeys>(key: K, id: ID) => void;
  sendInternal: (room: string, text: string) => void;
  markNotificationsRead: () => void;
  pushNotification: (n: { title: string; body: string; icon: string; link?: string }) => void;
  // UI
  toast: (text: string, opts?: Partial<UIState['toasts'][number]>) => void;
  dismissToast: (id: string) => void;
  setTyping: (sessionId: ID, v: boolean) => void;
  setRail: (v: boolean) => void;
}

type ListKeys = { [K in keyof Seed]: Seed[K] extends any[] ? K : never }[keyof Seed];

export type Store = Seed & { authUserId: ID | null; prefs: Prefs } & UIState & Actions;

const DEFAULT_PREFS: Prefs = { concludeMode: '12h', classifyOnConclude: true, simulation: true, notificationsBanner: true, sort: 'recent', sound: false };

const firstName = (s?: { name: string }) => (s ? s.name.split(' ')[0] : '');

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      const updSession = (id: ID, patch: Partial<Session> | ((s: Session) => Partial<Session>)) =>
        set((st) => ({ sessions: st.sessions.map((s) => (s.id === id ? { ...s, ...(typeof patch === 'function' ? patch(s) : patch) } : s)) }));
      const meName = () => firstName(get().users.find((u) => u.id === (get().authUserId ?? ME)));

      return {
        ...createSeed(),
        authUserId: null,
        prefs: DEFAULT_PREFS,
        typing: {},
        toasts: [],
        railOpen: false,

        login: (userId = ME) => set({ authUserId: userId }),
        logout: () => set({ authUserId: null }),
        reset: () => set({ ...createSeed(), prefs: DEFAULT_PREFS, typing: {}, toasts: [] }),
        setPrefs: (p) => set((st) => ({ prefs: { ...st.prefs, ...p } })),

        markRead: (sessionId) => updSession(sessionId, { unread: 0 }),

        sendMessage: (sessionId, msg) => {
          const now = Date.now();
          const me = get().authUserId ?? ME;
          const m: Message = { id: uid('m'), sessionId, dir: 'out', type: 'text', body: '', at: now, userId: me, status: 'sent', ...msg } as Message;
          set((st) => ({ messages: [...st.messages, m] }));
          updSession(sessionId, (s) => ({
            lastAt: now,
            firstResponseAt: s.firstResponseAt ?? (m.dir === 'out' ? now : null),
            status: s.status === 'new' && m.dir === 'out' ? 'open' : s.status,
            assigneeId: s.assigneeId ?? (m.dir === 'out' ? me : s.assigneeId),
          }));
          if (m.dir === 'out') {
            setTimeout(() => set((st) => ({ messages: st.messages.map((x) => (x.id === m.id ? { ...x, status: 'delivered' } : x)) })), 900);
            setTimeout(() => set((st) => ({ messages: st.messages.map((x) => (x.id === m.id ? { ...x, status: 'read' } : x)) })), 2600);
          }
        },

        receiveMessage: (sessionId, msg) => {
          const now = Date.now();
          const m: Message = { id: uid('m'), sessionId, dir: 'in', type: 'text', body: '', at: now, ...msg } as Message;
          set((st) => ({ messages: [...st.messages, m] }));
          updSession(sessionId, (s) => ({ lastAt: now, lastInboundAt: now, unread: s.unread + 1, status: s.status === 'concluded' ? 'new' : s.status, assigneeId: s.status === 'concluded' && get().prefs.concludeMode === 'immediate' ? null : s.assigneeId }));
        },

        addEvent: (sessionId, body, event) => {
          const m: Message = { id: uid('m'), sessionId, dir: 'event', type: 'text', body, at: Date.now(), event };
          set((st) => ({ messages: [...st.messages, m] }));
        },

        assignToMe: (sessionId) => {
          const me = get().authUserId ?? ME;
          updSession(sessionId, { assigneeId: me, status: 'open' });
          get().addEvent(sessionId, `${meName()} iniciou o atendimento`, 'assigned');
        },

        transfer: (sessionId, target, note) => {
          const st = get();
          const s = st.sessions.find((x) => x.id === sessionId)!;
          const fromTeam = st.teams.find((t) => t.id === s.teamId)?.name ?? '';
          if (target.userId) {
            const u = st.users.find((x) => x.id === target.userId)!;
            updSession(sessionId, { assigneeId: u.id, status: 'open' });
            get().addEvent(sessionId, `${meName()} transferiu o atendimento para ${u.name}${note ? ` · "${note}"` : ''}`, 'transferred');
          } else if (target.teamId) {
            const team = st.teams.find((t) => t.id === target.teamId)!;
            const online = team.members.map((m) => st.users.find((u) => u.id === m.userId)!).filter((u) => u && u.status === 'online' && u.id !== (st.authUserId ?? ME));
            const next = team.distribution && online.length ? online[Math.floor(Math.random() * online.length)] : null;
            updSession(sessionId, { teamId: team.id, assigneeId: next?.id ?? null, status: next ? 'open' : 'new' });
            get().addEvent(sessionId, `${meName()} transferiu o atendimento de ${fromTeam} para ${team.name}${note ? ` · "${note}"` : ''}`, 'transferred');
            if (next) get().addEvent(sessionId, `Atendimento distribuído automaticamente para ${firstName(next)}`, 'distributed');
          }
        },

        conclude: (sessionId, data) => {
          const now = Date.now();
          updSession(sessionId, { status: 'concluded', concludedAt: now, unread: 0, classification: data.classification ?? null, saleValue: data.saleValue ?? null });
          get().addEvent(sessionId, `Atendimento concluído por ${meName()}${data.classification ? ` · ${data.classification}` : ''}`, 'concluded');
          if (data.csat) get().sendMessage(sessionId, { dir: 'bot', body: 'Como você avalia nosso atendimento hoje? Responda de 1 a 5 ⭐', status: 'sent' });
        },

        reopen: (sessionId) => {
          const me = get().authUserId ?? ME;
          updSession(sessionId, { status: 'open', concludedAt: null, assigneeId: me });
          get().addEvent(sessionId, `${meName()} reabriu o atendimento`, 'reopened');
        },

        startConversation: (phone, channelId = 'c1') => {
          const st = get();
          const digits = phone.replace(/\D/g, '');
          let contact = st.contacts.find((c) => c.phone.replace(/\D/g, '') === digits);
          if (!contact) {
            const cid = get().addContact({ name: `Novo contato ${phone}`, phone, origin: 'Ativo (atendente)' });
            contact = get().contacts.find((c) => c.id === cid)!;
          }
          const open = st.sessions.find((s) => s.contactId === contact!.id && s.status !== 'concluded');
          if (open) return open.id;
          const now = Date.now();
          const channel = st.channels.find((c) => c.id === channelId)!;
          const s: Session = {
            id: uid('s'), protocol: String(2611000 + st.sessions.length + 900), contactId: contact.id, channelId, teamId: channel.teamId, assigneeId: st.authUserId ?? ME,
            status: 'open', isGroup: false, unread: 0, startedAt: now, lastAt: now, lastInboundAt: null, firstResponseAt: null, concludedAt: null, classification: null, saleValue: null, csat: null, watchers: [],
          };
          set((x) => ({ sessions: [s, ...x.sessions] }));
          get().addEvent(s.id, `${meName()} iniciou uma conversa ativa`, 'created');
          return s.id;
        },

        createIncomingSession: (contactId, channelId, teamId, firstText) => {
          const now = Date.now();
          const st = get();
          const s: Session = {
            id: uid('s'), protocol: String(2611000 + st.sessions.length + 900), contactId, channelId, teamId, assigneeId: null, status: 'new', isGroup: false, unread: 1,
            startedAt: now, lastAt: now, lastInboundAt: now, firstResponseAt: null, concludedAt: null, classification: null, saleValue: null, csat: null, watchers: [],
          };
          const team = st.teams.find((t) => t.id === teamId)!;
          const m1: Message = { id: uid('m'), sessionId: s.id, dir: 'in', type: 'text', body: firstText, at: now - 4000 };
          const m2: Message = { id: uid('m'), sessionId: s.id, dir: 'event', type: 'text', body: `Chatbot direcionou o atendimento para a equipe ${team.name}`, at: now, event: 'bot' };
          set((x) => ({ sessions: [s, ...x.sessions], messages: [...x.messages, m1, m2] }));
          return s.id;
        },

        toggleWatch: (sessionId) => {
          const me = get().authUserId ?? ME;
          updSession(sessionId, (s) => ({ watchers: s.watchers.includes(me) ? s.watchers.filter((w) => w !== me) : [...s.watchers, me] }));
        },

        updateContact: (id, patch) => set((st) => ({ contacts: st.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
        addContact: (c) => {
          const id = uid('ct');
          const contact: Contact = { id, name: 'Novo contato', phone: '', email: '', instagram: '', tagIds: [], ownerId: null, city: 'Manaus', origin: 'Cadastro manual', cpf: '', birthday: '', sequenceIds: [], notes: [], archived: false, blocked: false, createdAt: Date.now(), ...c };
          set((st) => ({ contacts: [contact, ...st.contacts] }));
          return id;
        },
        addContactNote: (id, text) => {
          const note = { id: uid('n'), userId: get().authUserId ?? ME, text, at: Date.now() };
          set((st) => ({ contacts: st.contacts.map((c) => (c.id === id ? { ...c, notes: [note, ...c.notes] } : c)) }));
        },

        moveCard: (cardId, stageId) => {
          const st = get();
          const card = st.cards.find((c) => c.id === cardId);
          if (!card || card.stageId === stageId) return;
          const panel = st.panels.find((p) => p.id === card.panelId)!;
          const stage = panel.stages.find((s) => s.id === stageId)!;
          set({ cards: st.cards.map((c) => (c.id === cardId ? { ...c, stageId, history: [...c.history, { at: Date.now(), text: `${meName()} moveu para ${stage.name}` }] } : c)) });
        },
        updateCard: (cardId, patch) => set((st) => ({ cards: st.cards.map((c) => (c.id === cardId ? { ...c, ...patch } : c)) })),
        addCard: (c) => {
          const st = get();
          const panel = st.panels.find((p) => p.id === c.panelId)!;
          const num = st.cards.filter((x) => x.panelId === c.panelId).length + 1;
          const id = uid('cd');
          const card: Card = { id, key: `${panel.prefix}-${num}`, contactIds: [], ownerId: st.authUserId ?? ME, value: 0, dueAt: null, tagIds: [], description: '', notes: [], history: [{ at: Date.now(), text: 'Item criado' }], archived: false, createdAt: Date.now(), ...c };
          set({ cards: [...st.cards, card] });
          return id;
        },
        removeCard: (cardId) => set((st) => ({ cards: st.cards.filter((c) => c.id !== cardId) })),

        patch: (key, value) => set({ [key]: value } as any),
        upsert: (key, item) => set((st: any) => {
          const list = st[key] as any[];
          const exists = list.some((x) => x.id === item.id);
          return { [key]: exists ? list.map((x) => (x.id === item.id ? { ...x, ...item } : x)) : [item, ...list] };
        }),
        removeItem: (key, id) => set((st: any) => ({ [key]: (st[key] as any[]).filter((x) => x.id !== id) })),

        sendInternal: (room, text) => set((st) => ({ internalChat: [...st.internalChat, { id: uid('ic'), room, userId: st.authUserId ?? ME, text, at: Date.now() }] })),
        markNotificationsRead: () => set((st) => ({ notifications: st.notifications.map((n) => ({ ...n, read: true })) })),
        pushNotification: (n) => set((st) => ({ notifications: [{ id: uid('nt'), at: Date.now(), read: false, ...n }, ...st.notifications].slice(0, 40) })),

        toast: (text, opts = {}) => {
          const id = uid('t');
          set((st) => ({ toasts: [...st.toasts, { id, text, ...opts }].slice(-4) }));
          setTimeout(() => get().dismissToast(id), 4200);
        },
        dismissToast: (id) => set((st) => ({ toasts: st.toasts.filter((t) => t.id !== id) })),
        setTyping: (sessionId, v) => set((st) => ({ typing: { ...st.typing, [sessionId]: v } })),
        setRail: (v) => set({ railOpen: v }),
      };
    },
    {
      name: 'elena-atendimento',
      version: SEED_VERSION,
      storage: createJSONStorage(() => localStorage),
      // dados efêmeros de UI não são persistidos
      partialize: (st) => {
        const { typing, toasts, railOpen, ...rest } = st as any;
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function')) as any;
      },
      migrate: () => ({ ...createSeed(), authUserId: null, prefs: DEFAULT_PREFS }) as any,
    },
  ),
);

export const useMe = () => {
  const id = useStore((s) => s.authUserId) ?? ME;
  return useStore((s) => s.users.find((u) => u.id === id)!);
};
