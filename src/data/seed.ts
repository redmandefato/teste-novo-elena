// ============================================================================
// GERADOR DE DADOS MOCKADOS — determinístico (mesma semente = mesmos dados).
// Empresa fictícia: "Vitta Suplementos" (rede de lojas + delivery em Manaus).
// Parceiro white label fictício: "Norte Tech Soluções".
// ============================================================================
import type { Seed, Session, Message, Contact, Card, Account, QrInstance, DailyMetric, User, Team } from '../types';
import { DAY, HOUR, MIN, mulberry32, slug, startOfDay, monthKey, monthRange, addMonths, round2, hashNoise, sum } from '../lib/util';
import { DEFAULT_PRICING, computeAccount } from '../lib/pricing';
import { SCRIPTS, GROUP_SCRIPTS, BOT_MENU, Step } from './scripts';

export const SEED_VERSION = 5;

const FIRST = ['Ana', 'Bruno', 'Camila', 'Daniel', 'Eduarda', 'Fernando', 'Gabriela', 'Henrique', 'Isabela', 'João', 'Karina', 'Lucas', 'Mariana', 'Nicolas', 'Olívia', 'Pedro', 'Rafael', 'Sabrina', 'Thiago', 'Vinícius', 'Wesley', 'Yasmin', 'Amanda', 'Caio', 'Débora', 'Gustavo', 'Letícia', 'Matheus', 'Natália', 'Otávio', 'Patrícia', 'Renan', 'Simone', 'Tatiane', 'Vitor', 'Bianca', 'Leonardo', 'Priscila', 'André', 'Jéssica', 'Rodrigo', 'Aline', 'Marcelo', 'Luana', 'Diego', 'Fabiana', 'Igor', 'Carolina', 'Raissa', 'Kelvin'];
const LAST = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Araújo', 'Ferreira', 'Barbosa', 'Ribeiro', 'Carvalho', 'Gomes', 'Martins', 'Rocha', 'Melo', 'Cardoso', 'Teixeira', 'Correia', 'Monteiro', 'Moura', 'Batista', 'Freitas', 'Pinheiro', 'Farias', 'Cavalcante', 'Nogueira'];
const BUSINESS = ['Academia Corpo em Forma', 'Box CrossFit Norte', 'Studio Pilates Equilíbrio', 'Mercadinho Bom Preço', 'Farmácia Vida+', 'Empório Natural Amazônia', 'Personal Rafa Fit', 'Clínica NutriVida'];
const NICKS = ['Thay 💪', 'Gui Monteiro 🏋️', 'Lari ✨', 'Dudu Fit', 'Nanda 🌸'];

export function createSeed(NOW = Date.now()): Seed {
  const R = mulberry32(20261112);
  const rand = () => R();
  const int = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1));
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  const chance = (p: number) => rand() < p;
  const shuffle = <T,>(arr: T[]): T[] => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  let n = 0;
  const id = (p: string) => `${p}${(++n).toString(36)}`;
  const phone = (ddd = 92) => `(${ddd}) 9${int(8100, 9999)}-${String(int(0, 9999)).padStart(4, '0')}`;
  const hex = (len = 32) => Array.from({ length: len }, () => '0123456789ABCDEF'[int(0, 15)]).join('');

  // ------------------------------------------------------------- Usuários
  const U: [string, User['role'], User['status'], string?][] = [
    ['Rafaela Moura', 'admin', 'online', 'Gerente de Atendimento'],
    ['Beatriz Lima', 'agent', 'online'], ['Carlos Eduardo', 'agent', 'online'], ['Daniela Freitas', 'supervisor', 'online', 'Supervisora Delivery'],
    ['Eduardo Nogueira', 'agent', 'away'], ['Fernanda Rocha', 'agent', 'online'], ['Gabriel Teixeira', 'agent', 'offline'],
    ['Helena Duarte', 'supervisor', 'online', 'Supervisora Atacado'], ['Igor Batista', 'agent', 'online'], ['Juliana Prado', 'agent', 'away'],
    ['Kaique Almeida', 'agent', 'online'], ['Larissa Monteiro', 'agent', 'online'], ['Marcos Paiva', 'agent', 'offline'],
  ];
  const users: User[] = U.map(([name, role, status, title], i) => ({
    id: `u${i + 1}`, name, role, status, title: title ?? (role === 'agent' ? 'Atendente' : role === 'supervisor' ? 'Supervisor(a)' : 'Administrador(a)'),
    email: `${slug(name.split(' ')[0])}.${slug(name.split(' ').slice(-1)[0])}@vitta.com.br`, phone: phone(),
    lastSeenAt: NOW - (status === 'online' ? int(0, 5) * MIN : int(1, 48) * HOUR), createdAt: NOW - int(60, 400) * DAY, maxConcurrent: role === 'agent' ? 8 : 12,
  }));

  // -------------------------------------------------------------- Equipes
  const T: [string, string[], string[], Partial<Team>?][] = [
    ['Delivery', ['u2', 'u3', 'u12', 'u1'], ['u4'], { isDefault: true, channelIds: ['c1'] }],
    ['Loja Centro', ['u5', 'u1'], ['u4'], { channelIds: ['c2'] }],
    ['Loja Ponta Negra', ['u6'], [], { channelIds: ['c2'] }],
    ['Loja Cidade Nova', ['u7'], [], { channelIds: ['c2'] }],
    ['Atacado', ['u9', 'u1'], ['u8'], { restricted: true, channelIds: ['c3'] }],
    ['Financeiro', ['u10', 'u1'], [], { restricted: true, channelIds: ['c1'], distribution: false }],
    ['SAC', ['u11', 'u12', 'u1'], [], { channelIds: ['c1', 'c4', 'c5'] }],
    ['Pós-venda', ['u3', 'u12'], [], { channelIds: ['c1'] }],
    ['Equipe Site', ['u13'], [], { channelIds: ['c6'] }],
    ['IA Vitta', [], [], { isBot: true, channelIds: ['c1'], distribution: false }],
    ['Redes Sociais', ['u11', 'u6'], [], { channelIds: ['c4', 'c5'] }],
  ];
  const teams: Team[] = T.map(([name, agents, sups, extra], i) => ({
    id: `t${i + 1}`, name, isDefault: false, access: 'agent', restricted: false, distribution: true, overflow: true, acceptTimeoutMin: 4, channelIds: [],
    members: [...sups.map((userId) => ({ userId, role: 'supervisor' as const })), ...agents.map((userId) => ({ userId, role: 'agent' as const }))],
    createdAt: NOW - int(90, 300) * DAY, ...extra,
  }));
  const teamMembers = (tid: string) => teams.find((t) => t.id === tid)!.members.map((m) => m.userId);

  // --------------------------------------------------------------- Canais
  const channels: Seed['channels'] = [
    { id: 'c1', type: 'whatsapp', name: 'Vitta Delivery', identifier: '(92) 99100-1001', status: 'connected', teamId: 't1', chatbotId: 'b1', createdAt: NOW - 300 * DAY },
    { id: 'c2', type: 'whatsapp_qr', name: 'Vitta Lojas', identifier: '(92) 99100-2002', status: 'connected', teamId: 't2', chatbotId: 'b2', instanceId: hex(), createdAt: NOW - 250 * DAY },
    { id: 'c3', type: 'whatsapp_qr', name: 'Vitta Atacado', identifier: '(92) 99100-3003', status: 'disconnected', teamId: 't5', chatbotId: 'b3', instanceId: hex(), createdAt: NOW - 180 * DAY },
    { id: 'c4', type: 'instagram', name: 'Instagram', identifier: '@vittasuplementos', status: 'connected', teamId: 't11', chatbotId: 'b4', createdAt: NOW - 200 * DAY },
    { id: 'c5', type: 'messenger', name: 'Messenger', identifier: 'Vitta Suplementos', status: 'connected', teamId: 't11', createdAt: NOW - 200 * DAY },
    { id: 'c6', type: 'webchat', name: 'Chat do site', identifier: 'vitta.com.br', status: 'connected', teamId: 't9', createdAt: NOW - 120 * DAY },
  ];

  // ------------------------------------------------------------ Etiquetas
  const tags: Seed['tags'] = [
    { id: 'tg1', name: 'Qualificado', color: '#7c3aed' }, { id: 'tg2', name: 'VIP', color: '#d97706' }, { id: 'tg3', name: 'Atacado', color: '#0284c7' },
    { id: 'tg4', name: 'Novo cliente', color: '#16a34a' }, { id: 'tg5', name: 'Reclamação', color: '#dc2626' }, { id: 'tg6', name: 'Aguardando pagamento', color: '#ea580c' },
    { id: 'tg7', name: 'Pedido em andamento', color: '#a16207' }, { id: 'tg8', name: 'Recompra', color: '#0d9488' }, { id: 'tg9', name: 'Lead frio', color: '#64748b' },
    { id: 'tg10', name: 'Personal / Parceiro', color: '#db2777' },
  ];

  // ------------------------------------------------------------- Contatos
  const sellers = ['u2', 'u3', 'u5', 'u6', 'u9', 'u12'];
  const contacts: Contact[] = [];
  const usedNames = new Set<string>();
  for (let i = 0; i < 160; i++) {
    let name: string;
    const isBiz = i % 19 === 7 && i / 19 < BUSINESS.length;
    if (isBiz) name = BUSINESS[Math.floor(i / 19)];
    else if (i % 31 === 13) name = NICKS[Math.floor(i / 31) % NICKS.length];
    else { do { name = `${pick(FIRST)} ${pick(LAST)}`; } while (usedNames.has(name)); }
    usedNames.add(name);
    const first = name.split(' ')[0], last = name.split(' ').slice(-1)[0];
    const tagIds: string[] = [];
    if (isBiz) tagIds.push('tg3', 'tg1');
    if (chance(0.35)) tagIds.push(pick(tags).id);
    if (chance(0.12)) tagIds.push(pick(tags).id);
    contacts.push({
      id: `ct${i + 1}`, name, phone: phone(chance(0.86) ? 92 : pick([97, 95, 91, 11, 21])),
      email: chance(0.55) ? `${slug(first)}.${slug(last)}${int(1, 99)}@${pick(['gmail.com', 'hotmail.com', 'outlook.com', 'icloud.com'])}` : '',
      instagram: chance(0.4) ? `@${slug(first)}${chance(0.5) ? '.' + slug(last).slice(0, 5) : ''}${chance(0.4) ? 'fit' : ''}` : '',
      tagIds: [...new Set(tagIds)], ownerId: chance(0.55) ? pick(sellers) : null,
      city: pick(['Manaus', 'Manaus', 'Manaus', 'Manaus', 'Itacoatiara', 'Parintins', 'Manacapuru', 'Iranduba', 'Boa Vista']),
      origin: pick(['WhatsApp', 'WhatsApp', 'Instagram', 'Site', 'Indicação', 'Loja física', 'Campanha Black Friday']),
      cpf: chance(0.45) ? `${int(100, 999)}.${int(100, 999)}.${int(100, 999)}-${int(10, 99)}` : '',
      birthday: chance(0.45) ? `${String(int(1, 28)).padStart(2, '0')}/${String(int(1, 12)).padStart(2, '0')}/${int(1975, 2005)}` : '',
      sequenceIds: chance(0.15) ? [pick(['sq1', 'sq2', 'sq3'])] : [], notes: [],
      archived: i > 150 && chance(0.5), blocked: i > 155, createdAt: NOW - int(1, 420) * DAY,
    });
  }
  const pool = shuffle(contacts.filter((c) => !c.archived && !c.blocked));
  const bizContacts = contacts.filter((c) => c.tagIds.includes('tg3'));

  // ------------------------------------------------------- Atendimentos
  const sessions: Session[] = [];
  const messages: Message[] = [];
  const userById = Object.fromEntries(users.map((u) => [u.id, u]));
  const teamById = Object.fromEntries(teams.map((t) => [t.id, t]));
  let protocol = 2611040;

  const fill = (s: string, ctx: { first: string; agent: string }) => s.replace(/\{first\}/g, ctx.first).replace(/\{agent\}/g, ctx.agent);
  const toMsg = (sid: string, step: Step, at: number, ctx: { first: string; agent: string }, userId?: string): Message => {
    const [dir, type, body, extra] = step;
    const m: Message = { id: id('m'), sessionId: sid, dir, type, body: fill(body, ctx), at };
    if (dir === 'out' || dir === 'bot') m.status = 'read';
    if (dir === 'out') m.userId = userId;
    if (extra) {
      if (type === 'template') m.template = extra;
      else m.media = { ...extra, caption: type === 'image' ? fill(body, ctx) : undefined };
    }
    return m;
  };

  type Plan = 'new' | 'mine' | 'other' | 'done';
  const plan: Plan[] = [...Array(13).fill('new'), ...Array(7).fill('mine'), ...Array(16).fill('other'), ...Array(14).fill('done')];
  const scriptOrder = shuffle([...SCRIPTS, ...SCRIPTS, ...SCRIPTS, ...SCRIPTS]);
  let poolIdx = 0;
  const mineContacts: Contact[] = [];

  plan.forEach((kind, i) => {
    const script = scriptOrder[i % scriptOrder.length];
    let contact: Contact;
    if (script.key === 'atacado' && bizContacts.length) contact = bizContacts[i % bizContacts.length];
    else if (kind === 'done' && i % 3 === 0 && mineContacts.length) contact = mineContacts[i % mineContacts.length];
    else contact = pool[poolIdx++ % pool.length];
    if (kind === 'mine') mineContacts.push(contact);
    const channelId = script.channel ?? teamById[script.teamId].channelIds[0] ?? 'c1';
    const channel = channels.find((c) => c.id === channelId)!;
    const members = teamMembers(script.teamId).filter((u) => u !== 'u1');
    const assigneeId = kind === 'new' ? null : kind === 'mine' ? 'u1' : kind === 'other' ? (members.length ? pick(members) : 'u2') : chance(0.35) ? 'u1' : members.length ? pick(members) : 'u3';
    const agent = assigneeId ? userById[assigneeId] : null;
    const ctx = { first: contact.name.split(' ')[0], agent: agent ? agent.name.split(' ')[0] : '' };
    const sid = id('s');

    // Linha do tempo relativa (ms) — depois é deslocada para terminar em "lastAgo"
    const tl: { step?: Step; event?: [string, any]; offset: number }[] = [];
    let t = 0;
    const push = (x: { step?: Step; event?: [string, any] }, gap: number) => { t += gap; tl.push({ ...x, offset: t }); };
    script.intro.forEach((s) => push({ step: s }, int(1, 3) * MIN));
    if (channel.chatbotId) {
      push({ step: ['bot', 'text', BOT_MENU] }, 4000);
      push({ step: ['in', 'text', script.opt] }, int(15, 90) * 1000);
      push({ event: [`Chatbot direcionou o atendimento para a equipe ${teamById[script.teamId].name}`, 'bot'] }, 3000);
    }
    let bodySteps: Step[] = [];
    if (kind === 'new') {
      if (script.waiting && chance(0.6)) script.waiting.forEach((s) => push({ step: s }, int(2, 15) * MIN));
    } else {
      const other = pick(teamMembers(script.teamId).filter((u) => u !== assigneeId)) as string | undefined;
      if (other && chance(0.25)) {
        push({ event: [`Atendimento distribuído automaticamente para ${userById[other].name.split(' ')[0]}`, 'distributed'] }, 5000);
        push({ event: [`O limite de tempo para ${userById[other].name.split(' ')[0]} iniciar o atendimento expirou. Redistribuindo…`, 'expired'] }, 4 * MIN);
      }
      push({ event: [`Atendimento distribuído automaticamente para ${ctx.agent}`, 'distributed'] }, 5000);
      bodySteps = kind === 'done' ? script.body : script.body.slice(0, int(1, script.body.length - 1));
      let prevDir = 'in';
      bodySteps.forEach((s) => { push({ step: s }, s[0] === 'out' ? (prevDir === 'out' ? int(10, 60) * 1000 : int(1, 5) * MIN) : int(1, 9) * MIN); prevDir = s[0]; });
      if (kind !== 'done' && chance(0.18)) {
        const from = teamById[script.teamId].name;
        const to = pick(teams.filter((x) => !x.isBot && x.id !== script.teamId)).name;
        tl.splice(tl.length - 1, 0, { event: [`${userById[pick(['u4', 'u8', 'u1'])].name.split(' ')[0]} transferiu o atendimento de ${to} para ${from}`, 'transferred'], offset: tl[tl.length - 1].offset - 30000 });
      }
    }
    const classification = kind === 'done' ? script.classification : null;
    if (kind === 'done') push({ event: [`Atendimento concluído por ${ctx.agent} · ${classification}`, 'concluded'] }, 2 * MIN);

    const lastAgo = (kind === 'new' ? int(2, 300) : kind === 'mine' ? int(1, 200) : kind === 'other' ? int(3, 900) : int(90, 9 * 24 * 60)) * MIN;
    const shift = NOW - lastAgo - t;
    const msgs: Message[] = tl.map((x) => {
      const at = x.offset + shift;
      if (x.event) return { id: id('m'), sessionId: sid, dir: 'event', type: 'text', body: x.event[0], at, event: x.event[1] } as Message;
      return toMsg(sid, x.step!, at, ctx, assigneeId ?? undefined);
    });
    // não lidas = mensagens do cliente no final da conversa
    let unread = 0;
    if (kind !== 'done') for (let k = msgs.length - 1; k >= 0; k--) { if (msgs[k].dir === 'in') unread++; else if (msgs[k].dir === 'out' || msgs[k].dir === 'bot') break; }
    if (kind === 'other' && chance(0.4)) unread = 0;
    const inbound = msgs.filter((m) => m.dir === 'in');
    const firstOut = msgs.find((m) => m.dir === 'out');
    messages.push(...msgs);
    sessions.push({
      id: sid, protocol: String(protocol++), contactId: contact.id, channelId, teamId: script.teamId, assigneeId,
      status: kind === 'new' ? 'new' : kind === 'done' ? 'concluded' : 'open', isGroup: false, unread,
      startedAt: msgs[0].at, lastAt: msgs[msgs.length - 1].at, lastInboundAt: inbound.length ? inbound[inbound.length - 1].at : null,
      firstResponseAt: firstOut?.at ?? null, concludedAt: kind === 'done' ? msgs[msgs.length - 1].at : null,
      classification, saleValue: kind === 'done' && script.sale ? script.sale : null, csat: kind === 'done' && chance(0.7) ? pick([5, 5, 5, 4, 4, 3]) : null, watchers: [],
    });
    if (kind !== 'done') script.tags.forEach((tg) => { if (!contact.tagIds.includes(tg)) contact.tagIds.push(tg); });
  });

  // Grupos de WhatsApp
  GROUP_SCRIPTS.forEach((g, gi) => {
    const sid = id('s');
    const assigneeId = gi < 2 ? 'u1' : pick(['u4', 'u8']);
    const agentName = userById[assigneeId].name.split(' ')[0];
    const contact: Contact = { ...contacts[0], id: `ctg${gi + 1}`, name: g.name, phone: `Grupo · ${g.participants.length + 1} participantes`, email: '', instagram: '', tagIds: [], ownerId: null, notes: [], sequenceIds: [], cpf: '', birthday: '', origin: 'WhatsApp', city: 'Manaus', archived: false, blocked: false };
    contacts.push(contact);
    let at = NOW - int(30, 1200) * MIN - g.lines.length * 6 * MIN;
    const msgs = g.lines.map(([who, text]) => {
      at += int(1, 9) * MIN;
      return who === '@agent'
        ? ({ id: id('m'), sessionId: sid, dir: 'out', type: 'text', body: text, at, userId: assigneeId, status: 'read' } as Message)
        : ({ id: id('m'), sessionId: sid, dir: 'in', type: 'text', body: text, at, senderName: who } as Message);
    });
    messages.push(...msgs);
    const last = msgs[msgs.length - 1];
    sessions.push({
      id: sid, protocol: String(protocol++), contactId: contact.id, channelId: 'c2', teamId: gi === 1 ? 't5' : 't2', assigneeId, status: 'open', isGroup: true,
      groupName: g.name, participants: [...g.participants, agentName], unread: last.dir === 'in' ? int(1, 4) : 0, startedAt: msgs[0].at, lastAt: last.at,
      lastInboundAt: last.at, firstResponseAt: msgs[0].at, concludedAt: null, classification: null, saleValue: null, csat: null, watchers: [],
    });
  });

  // Notas internas em alguns contatos
  contacts.slice(0, 40).forEach((c, i) => {
    if (i % 4 === 0) c.notes.push({ id: id('n'), userId: pick(['u1', 'u4', 'u2']), text: pick(['Cliente prefere entrega após 18h.', 'Treina na Academia Corpo em Forma — indicado pelo personal Rafa.', 'Alérgico a lactose: oferecer whey isolado ou vegano.', 'Sempre paga no Pix. Cliente recorrente desde 2025.', 'Pediu para ser avisado quando chegar a creatina gummy.']), at: NOW - int(1, 60) * DAY });
  });

  // ------------------------------------------------ Respostas e modelos
  const quickReplies: Seed['quickReplies'] = [
    { id: 'q1', shortcut: 'saudacao', text: 'Olá! Aqui é {agente} da Vitta Suplementos 😊 Como posso te ajudar?' },
    { id: 'q2', shortcut: 'pix', text: 'Nossa chave Pix (CNPJ) é 12.345.678/0001-90 — Vitta Suplementos LTDA. Após o pagamento, me envie o comprovante por aqui 🙏' },
    { id: 'q3', shortcut: 'entrega', text: 'Entregamos em Manaus em até 1h (taxa a partir de R$ 6,00). Para o interior, enviamos por transportadora.' },
    { id: 'q4', shortcut: 'horario', text: 'Nossas lojas funcionam de seg. a sáb. das 9h às 21h, e domingo das 10h às 16h.' },
    { id: 'q5', shortcut: 'atacado', text: 'Para compras no atacado o pedido mínimo é R$ 1.000,00 e já garante preço de tabela. Posso te enviar nossa tabela?' },
    { id: 'q6', shortcut: 'troca', text: 'Sentimos muito pelo ocorrido! Pode nos enviar uma foto do produto e da nota fiscal? Vamos resolver o mais rápido possível.' },
    { id: 'q7', shortcut: 'obrigado', text: 'Obrigado pela preferência! Qualquer coisa, é só chamar 💚' },
    { id: 'q8', shortcut: 'aguarde', text: 'Só um instante, por favor, que já verifico para você ⏳' },
  ];
  const templates: Seed['templates'] = [
    { id: 'tp1', name: 'boas_vindas', category: 'Utilidade', language: 'pt_BR', status: 'Aprovado', body: 'Olá {{1}}! Obrigado por falar com a Vitta Suplementos 💚 Em que podemos ajudar?', updatedAt: NOW - 90 * DAY },
    { id: 'tp2', name: 'pedido_saiu_entrega', category: 'Utilidade', language: 'pt_BR', status: 'Aprovado', body: 'Oba, {{1}}! Seu pedido #{{2}} saiu para entrega e chega em até {{3}} 🛵', buttons: ['Acompanhar pedido'], updatedAt: NOW - 60 * DAY },
    { id: 'tp3', name: 'lembrete_pagamento', category: 'Utilidade', language: 'pt_BR', status: 'Aprovado', body: 'Oi {{1}}, sua cobrança de {{2}} vence hoje. Pague pelo link: {{3}}', buttons: ['Pagar agora'], updatedAt: NOW - 45 * DAY },
    { id: 'tp4', name: 'black_friday_2026', category: 'Marketing', language: 'pt_BR', status: 'Aprovado', header: '🖤 SUPER BLACK FRIDAY VITTA', body: 'Até 50% OFF em whey, creatina e pré-treino! Use o cupom BLACK50 até domingo, {{1}}.', buttons: ['Ver ofertas', 'Falar com atendente'], updatedAt: NOW - 12 * DAY },
    { id: 'tp5', name: 'recompra_30_dias', category: 'Marketing', language: 'pt_BR', status: 'Pendente', body: 'Oi {{1}}! Seu {{2}} deve estar acabando 😉 Que tal garantir o próximo com 10% OFF?', buttons: ['Quero recomprar'], updatedAt: NOW - 2 * DAY },
    { id: 'tp6', name: 'pesquisa_satisfacao', category: 'Utilidade', language: 'pt_BR', status: 'Aprovado', body: 'Como foi seu atendimento hoje, {{1}}? Responda de 1 a 5 ⭐', buttons: ['5 ⭐', '4 ⭐', '3 ou menos'], updatedAt: NOW - 120 * DAY },
    { id: 'tp7', name: 'codigo_verificacao', category: 'Autenticação', language: 'pt_BR', status: 'Aprovado', body: 'Seu código de verificação Vitta é {{1}}. Não compartilhe com ninguém.', updatedAt: NOW - 200 * DAY },
    { id: 'tp8', name: 'reativacao_inativos', category: 'Marketing', language: 'pt_BR', status: 'Rejeitado', body: 'Sentimos sua falta!!! 😱 Volte AGORA e ganhe brinde GRÁTIS!!!', rejectionReason: 'Conteúdo promocional com formatação abusiva (excesso de caixa alta e pontuação).', updatedAt: NOW - 20 * DAY },
  ];

  // ----------------------------------------------------- Chat interno
  const internalChat: Seed['internalChat'] = [
    { id: id('ic'), room: 'all', userId: 'u1', pinned: true, at: NOW - 120 * DAY, text: 'Informações importantes – Atacado 📦\n\n🔹 Valor mínimo: a partir de R$ 1.000,00 já garante os preços de tabela.\n💳 Pagamento: Pix, débito, dinheiro ou crédito à vista. Crédito parcelado tem +5%.\n🚚 Envio: Manaus em até 24h após confirmação; interior conforme escolha do cliente.' },
    { id: id('ic'), room: 'all', userId: 'u4', at: NOW - 5 * HOUR, text: 'Pessoal, chegou o estoque de creatina Growth! 📦 Já pode vender.' },
    { id: id('ic'), room: 'all', userId: 'u2', at: NOW - 4 * HOUR, text: 'Boa! Tinha 3 clientes esperando 🙌' },
    { id: id('ic'), room: 'all', userId: 'u1', at: NOW - 3 * HOUR, text: 'Lembrem de marcar a etiqueta "Pedido em andamento" nos pedidos do delivery, ok?' },
    { id: id('ic'), room: 'all', userId: 'u8', at: NOW - 95 * MIN, text: 'O número do Atacado desconectou, já pedi para o TI ler o QR Code de novo.' },
    { id: id('ic'), room: 'all', userId: 'u12', at: NOW - 40 * MIN, text: 'Quem pode cobrir o almoço às 12h na fila do SAC?' },
    { id: id('ic'), room: 'all', userId: 'u11', at: NOW - 38 * MIN, text: 'Eu cubro! 👍' },
    { id: id('ic'), room: 't1', userId: 'u4', at: NOW - 2 * HOUR, text: 'Fila do delivery está alta, priorizem quem está esperando há mais de 15 min.' },
    { id: id('ic'), room: 't1', userId: 'u3', at: NOW - 100 * MIN, text: 'Ok! Pegando os mais antigos agora.' },
    { id: id('ic'), room: 't5', userId: 'u8', at: NOW - 6 * HOUR, text: 'Tabela de dezembro sobe amanhã no drive.' },
  ];

  const notifications: Seed['notifications'] = [
    { id: id('nt'), title: 'Novo atendimento na fila', body: 'Delivery tem 5 clientes aguardando há mais de 10 min', at: NOW - 6 * MIN, read: false, icon: 'Inbox', link: '/atendimentos?aba=novos' },
    { id: id('nt'), title: 'Atendimento transferido para você', body: 'Daniela transferiu um atendimento do SAC', at: NOW - 35 * MIN, read: false, icon: 'ArrowLeftRight', link: '/atendimentos?aba=meus' },
    { id: id('nt'), title: 'Canal desconectado', body: 'Vitta Atacado (92) 99100-3003 precisa ler o QR Code novamente', at: NOW - 95 * MIN, read: false, icon: 'WifiOff', link: '/admin/canais' },
    { id: id('nt'), title: 'Pagamento recebido', body: 'Pix de R$ 3.480,00 — Academia Corpo em Forma', at: NOW - 3 * HOUR, read: false, icon: 'CircleDollarSign', link: '/apps/pagamentos' },
    { id: id('nt'), title: 'Campanha concluída', body: 'Super Black Friday Vitta: 4.611 entregues, 612 respostas', at: NOW - 20 * HOUR, read: true, icon: 'Megaphone', link: '/apps/campanhas' },
    { id: id('nt'), title: 'Modelo rejeitado pela Meta', body: 'reativacao_inativos foi rejeitado. Veja o motivo.', at: NOW - 2 * DAY, read: true, icon: 'TriangleAlert', link: '/ajustes/modelos' },
    { id: id('nt'), title: 'Você foi mencionado', body: 'Larissa mencionou você no chat interno', at: NOW - 3 * DAY, read: true, icon: 'AtSign' },
  ];

  // ------------------------------------------------------------- Painéis
  const panels: Seed['panels'] = [
    { id: 'p1', name: 'Funil de Vendas', description: 'Oportunidades do delivery e lojas', kind: 'Vendas', prefix: 'FV', scope: 'Toda a empresa', pinned: true, deleted: false, stages: [
      { id: 'p1s1', name: 'Oportunidade', color: '#64748b' }, { id: 'p1s2', name: 'Follow up', color: '#8b5cf6' }, { id: 'p1s3', name: 'Em negociação', color: '#0ea5e9' }, { id: 'p1s4', name: 'Venda realizada', color: '#10b981' }, { id: 'p1s5', name: 'Oportunidade perdida', color: '#ef4444' }] },
    { id: 'p2', name: 'Atacado B2B', description: 'Academias, mercados e revendas', kind: 'Vendas', prefix: 'AT', scope: 'Atacado', pinned: true, deleted: false, stages: [
      { id: 'p2s1', name: 'Prospecção', color: '#64748b' }, { id: 'p2s2', name: 'Proposta enviada', color: '#f59e0b' }, { id: 'p2s3', name: 'Negociação', color: '#0ea5e9' }, { id: 'p2s4', name: 'Fechado', color: '#10b981' }, { id: 'p2s5', name: 'Perdido', color: '#ef4444' }] },
    { id: 'p3', name: 'Pós-venda Delivery', description: 'Acompanhamento de pedidos e avaliações', kind: 'Gestão', prefix: 'PV', scope: 'Delivery', pinned: false, deleted: false, stages: [
      { id: 'p3s1', name: 'Novo pedido', color: '#64748b' }, { id: 'p3s2', name: 'Em separação', color: '#f59e0b' }, { id: 'p3s3', name: 'Saiu para entrega', color: '#0ea5e9' }, { id: 'p3s4', name: 'Entregue', color: '#10b981' }, { id: 'p3s5', name: 'Avaliação', color: '#8b5cf6' }] },
    ...['u1', 'u2', 'u4', 'u8', 'u12'].map((uid, i) => ({ id: `pt${i + 1}`, name: 'Minhas tarefas', description: 'Gerencie aqui suas tarefas', kind: 'Tarefas' as const, prefix: `MT${i + 1}`, scope: userById[uid].name, ownerId: uid, pinned: false, deleted: false, stages: [
      { id: `pt${i + 1}s1`, name: 'A fazer', color: '#64748b' }, { id: `pt${i + 1}s2`, name: 'Em andamento', color: '#0ea5e9' }, { id: `pt${i + 1}s3`, name: 'Concluído', color: '#10b981' }] })),
    { id: 'p9', name: 'Campanha Natal 2025', description: 'Painel antigo', kind: 'Vendas', prefix: 'NT', scope: 'Toda a empresa', pinned: false, deleted: true, stages: [{ id: 'p9s1', name: 'Leads', color: '#64748b' }, { id: 'p9s2', name: 'Fechados', color: '#10b981' }] },
  ];
  const cards: Card[] = [];
  const cardTitles: Record<string, string[]> = {
    p1: ['Kit hipertrofia', 'Combo whey + creatina', 'Assinatura mensal', 'Pré-treino 3 un.', 'Kit emagrecimento', 'Recompra whey 2kg', 'Presente aniversário', 'Kit iniciante'],
    p2: ['Pedido mensal academia', 'Revenda interior', 'Fornecimento box', 'Mix mercadinho', 'Contrato trimestral', 'Kit vitrine farmácia'],
    p3: ['Pedido #48213', 'Pedido #48220', 'Pedido #48231', 'Pedido #48244', 'Pedido #48257', 'Pedido #48263', 'Pedido #48270', 'Pedido #48281'],
  };
  const taskTitles = ['Ligar para fornecedores', 'Responder avaliações do Google', 'Revisar etiquetas da semana', 'Treinar equipe nova', 'Conferir estoque de creatina', 'Montar campanha de Natal', 'Atualizar tabela atacado', 'Enviar relatório semanal'];
  panels.filter((p) => !p.deleted).forEach((p) => {
    const count = p.kind === 'Tarefas' ? int(4, 6) : p.id === 'p1' ? 22 : p.id === 'p2' ? 12 : 14;
    for (let k = 0; k < count; k++) {
      const stage = p.stages[Math.min(p.stages.length - 1, Math.floor(Math.pow(rand(), 1.3) * p.stages.length))];
      const contact = p.id === 'p2' ? bizContacts[k % bizContacts.length] : pool[(k * 7 + p.id.length) % pool.length];
      const value = p.kind === 'Tarefas' ? 0 : p.id === 'p2' ? int(12, 160) * 100 : round2(int(90, 1200) + int(0, 99) / 100);
      const created = NOW - int(1, 40) * DAY;
      cards.push({
        id: id('cd'), key: `${p.prefix}-${k + 1}`, panelId: p.id, stageId: stage.id,
        title: p.kind === 'Tarefas' ? taskTitles[(k + p.id.length) % taskTitles.length] : `${pick(cardTitles[p.id] ?? cardTitles.p1)} — ${contact.name.split(' ')[0]}`,
        contactIds: p.kind === 'Tarefas' ? [] : [contact.id], ownerId: p.ownerId ?? pick(p.id === 'p2' ? ['u8', 'u9'] : sellers), value,
        dueAt: chance(0.7) ? NOW + int(-5, 20) * DAY : null, tagIds: chance(0.4) ? [pick(tags).id] : [],
        description: p.kind === 'Tarefas' ? 'Tarefa recorrente da semana.' : pick(['Cliente pediu orçamento pelo WhatsApp.', 'Retornar com condição especial no Pix.', 'Interessado em compra recorrente todo mês.', 'Veio pela campanha de Black Friday.', '']),
        notes: chance(0.4) ? [{ id: id('n'), userId: pick(sellers), text: pick(['Liguei e ficou de responder amanhã.', 'Enviei a tabela por e-mail.', 'Pediu desconto de 5%.']), at: created + DAY }] : [],
        history: [{ at: created, text: `Item criado em ${p.stages[0].name}` }, ...(stage.id !== p.stages[0].id ? [{ at: created + int(1, 4) * DAY, text: `Movido para ${stage.name}` }] : [])],
        archived: false, createdAt: created,
      });
    }
  });

  // -------------------------------------------------------------- Apps
  const chatbots: Seed['chatbots'] = [
    { id: 'b1', name: 'Menu Principal - Delivery', kind: 'service', channelType: 'whatsapp', teamId: 't1', status: 'active', archived: false, runs: 18342, updatedAt: NOW - 3 * DAY, flow: [
      { id: 'f1', type: 'start', title: 'Cliente enviou a primeira mensagem' },
      { id: 'f2', type: 'condition', title: 'Dentro do horário de atendimento?', text: 'Seg–Sáb 9h–21h · Dom 10h–16h' },
      { id: 'f3', type: 'message', title: 'Boas-vindas + menu', text: BOT_MENU.replace('{first}', '{{nome}}') },
      { id: 'f4', type: 'menu', title: 'Aguardar opção', options: [{ key: '1', label: 'Fazer um pedido', target: 'Delivery' }, { key: '2', label: 'Nossas lojas', target: 'Loja Centro' }, { key: '3', label: 'Atacado / Revenda', target: 'Atacado' }, { key: '4', label: 'Financeiro', target: 'Financeiro' }, { key: '5', label: 'Trocas e SAC', target: 'SAC' }] },
      { id: 'f5', type: 'transfer', title: 'Transferir para a equipe escolhida', text: 'Distribuição automática entre atendentes online' },
    ] },
    { id: 'b2', name: 'Lojas - WhatsApp', kind: 'service', channelType: 'whatsapp_qr', teamId: 't2', status: 'active', archived: false, runs: 6210, updatedAt: NOW - 10 * DAY, flow: [
      { id: 'f1', type: 'start', title: 'Cliente enviou mensagem' }, { id: 'f2', type: 'message', title: 'Saudação', text: 'Oi {{nome}}! Qual loja você quer falar?' },
      { id: 'f3', type: 'menu', title: 'Escolha da loja', options: [{ key: '1', label: 'Centro', target: 'Loja Centro' }, { key: '2', label: 'Ponta Negra', target: 'Loja Ponta Negra' }, { key: '3', label: 'Cidade Nova', target: 'Loja Cidade Nova' }] },
      { id: 'f4', type: 'transfer', title: 'Transferir para a loja' }] },
    { id: 'b3', name: 'Atacado - WhatsApp', kind: 'service', channelType: 'whatsapp_qr', teamId: 't5', status: 'active', archived: false, runs: 1420, updatedAt: NOW - 30 * DAY, flow: [
      { id: 'f1', type: 'start', title: 'Cliente enviou mensagem' }, { id: 'f2', type: 'message', title: 'Qualificação', text: 'Para atendimento no atacado, informe seu CNPJ 🙂' }, { id: 'f3', type: 'wait', title: 'Aguardar CNPJ' }, { id: 'f4', type: 'transfer', title: 'Transferir para Atacado' }] },
    { id: 'b4', name: 'Redes Sociais - Instagram/Messenger', kind: 'service', channelType: 'instagram', teamId: 't11', status: 'active', archived: false, runs: 4980, updatedAt: NOW - 6 * DAY, flow: [
      { id: 'f1', type: 'start', title: 'Mensagem no Direct' }, { id: 'f2', type: 'ai', title: 'Assistente IA responde dúvidas frequentes', text: 'Base: catálogo, horários, entregas' }, { id: 'f3', type: 'transfer', title: 'Se pedir humano → Redes Sociais' }] },
    { id: 'b5', name: 'IA Vitta - Assistente (beta)', kind: 'service', channelType: 'whatsapp', teamId: 't10', status: 'paused', archived: false, runs: 312, updatedAt: NOW - 1 * DAY, flow: [
      { id: 'f1', type: 'start', title: 'Cliente enviou mensagem' }, { id: 'f2', type: 'ai', title: 'IA generativa com catálogo de produtos', text: 'Responde preços, estoque e monta o pedido' }, { id: 'f3', type: 'condition', title: 'Pedido montado?' }, { id: 'f4', type: 'transfer', title: 'Transferir para Delivery para fechar' }] },
    { id: 'b6', name: 'Black Friday 50% OFF', kind: 'service', channelType: 'whatsapp', teamId: 't1', status: 'active', archived: false, runs: 2310, updatedAt: NOW - 12 * DAY, flow: [
      { id: 'f1', type: 'start', title: 'Resposta à campanha' }, { id: 'f2', type: 'message', title: 'Ofertas', text: 'Confira as ofertas com o cupom BLACK50!' }, { id: 'f3', type: 'transfer', title: 'Transferir para Delivery' }] },
    { id: 'b7', name: 'Pesquisa de satisfação (CSAT)', kind: 'automation', channelType: 'whatsapp', teamId: 't8', status: 'active', archived: false, runs: 8790, updatedAt: NOW - 40 * DAY, flow: [
      { id: 'f1', type: 'start', title: 'Atendimento concluído' }, { id: 'f2', type: 'message', title: 'Pergunta', text: 'Como foi seu atendimento? Responda de 1 a 5 ⭐' }, { id: 'f3', type: 'wait', title: 'Aguardar nota (24h)' }, { id: 'f4', type: 'end', title: 'Registrar CSAT no relatório' }] },
    { id: 'b8', name: 'Recuperação de carrinho do site', kind: 'automation', channelType: 'whatsapp', teamId: 't9', status: 'active', archived: false, runs: 1204, updatedAt: NOW - 15 * DAY, flow: [
      { id: 'f1', type: 'start', title: 'Webhook: carrinho abandonado' }, { id: 'f2', type: 'wait', title: 'Esperar 1 hora' }, { id: 'f3', type: 'message', title: 'Lembrete', text: 'Esqueceu algo no carrinho? Finalize com 5% OFF 😉' }, { id: 'f4', type: 'end', title: 'Fim' }] },
    { id: 'b9', name: 'Lembrete de recompra 30 dias', kind: 'automation', channelType: 'whatsapp', teamId: 't8', status: 'paused', archived: false, runs: 640, updatedAt: NOW - 25 * DAY, flow: [
      { id: 'f1', type: 'start', title: '30 dias após a compra' }, { id: 'f2', type: 'message', title: 'Oferta de recompra' }, { id: 'f3', type: 'end', title: 'Fim' }] },
    { id: 'b10', name: 'Natal 2025 (antigo)', kind: 'service', channelType: 'whatsapp', teamId: 't1', status: 'paused', archived: true, runs: 3011, updatedAt: NOW - 320 * DAY, flow: [{ id: 'f1', type: 'start', title: 'Início' }] },
  ];

  const campaigns: Seed['campaigns'] = [
    { id: 'cp1', name: 'Super Black Friday Vitta 🖤', channelId: 'c1', templateId: 'tp4', status: 'Concluída', audience: 4820, sent: 4820, delivered: 4611, read: 3902, replied: 612, failed: 209, scheduledAt: NOW - 1 * DAY, createdBy: 'u1', segment: 'Clientes ativos (últimos 180 dias)' },
    { id: 'cp2', name: 'Reativação de clientes inativos', channelId: 'c1', templateId: 'tp1', status: 'Enviando', audience: 2300, sent: 1449, delivered: 1390, read: 802, replied: 96, failed: 59, scheduledAt: NOW - 2 * HOUR, createdBy: 'u4', segment: 'Sem compra há 90+ dias' },
    { id: 'cp3', name: 'Lançamento Creatina Gummy', channelId: 'c2', templateId: 'tp1', status: 'Concluída', audience: 1250, sent: 1250, delivered: 1218, read: 1003, replied: 188, failed: 32, scheduledAt: NOW - 9 * DAY, createdBy: 'u1', segment: 'Etiqueta: Recompra' },
    { id: 'cp4', name: 'Atacado — Tabela Dezembro', channelId: 'c3', templateId: 'tp1', status: 'Agendada', audience: 86, sent: 0, delivered: 0, read: 0, replied: 0, failed: 0, scheduledAt: NOW + 18 * DAY, createdBy: 'u8', segment: 'Etiqueta: Atacado' },
    { id: 'cp5', name: 'Cupom aniversariantes de novembro', channelId: 'c1', templateId: 'tp1', status: 'Concluída', audience: 312, sent: 312, delivered: 305, read: 281, replied: 74, failed: 7, scheduledAt: NOW - 11 * DAY, createdBy: 'u12', segment: 'Aniversário em novembro' },
    { id: 'cp6', name: 'Natal Fitness 2026', channelId: 'c1', templateId: 'tp4', status: 'Rascunho', audience: 5100, sent: 0, delivered: 0, read: 0, replied: 0, failed: 0, scheduledAt: NOW + 30 * DAY, createdBy: 'u1', segment: 'Todos os contatos' },
    { id: 'cp7', name: 'Recompra Whey 30 dias', channelId: 'c1', templateId: 'tp5', status: 'Pausada', audience: 640, sent: 210, delivered: 204, read: 160, replied: 31, failed: 6, scheduledAt: NOW - 4 * DAY, createdBy: 'u3', segment: 'Compraram whey há 30 dias' },
  ];

  const sequences: Seed['sequences'] = [
    { id: 'sq1', name: 'Boas-vindas novos clientes', active: true, enrolled: 412, completed: 356, conversion: 18.4, steps: [{ delay: 'Imediato', text: 'Mensagem de boas-vindas + cupom PRIMEIRACOMPRA' }, { delay: '+1 dia', text: 'Dicas de uso dos suplementos' }, { delay: '+3 dias', text: 'Convite para o grupo VIP' }] },
    { id: 'sq2', name: 'Pós-venda Delivery', active: true, enrolled: 1890, completed: 1702, conversion: 31.2, steps: [{ delay: '+2 horas', text: 'Confirmação de entrega' }, { delay: '+1 dia', text: 'Pesquisa de satisfação' }, { delay: '+7 dias', text: 'Conteúdo: receitas com whey' }, { delay: '+25 dias', text: 'Lembrete de recompra' }] },
    { id: 'sq3', name: 'Recompra Whey 30 dias', active: true, enrolled: 640, completed: 480, conversion: 22.7, steps: [{ delay: '+28 dias', text: 'Seu whey está acabando?' }, { delay: '+31 dias', text: 'Cupom de 10% para recompra' }] },
    { id: 'sq4', name: 'Lead Atacado', active: false, enrolled: 74, completed: 51, conversion: 12.1, steps: [{ delay: 'Imediato', text: 'Apresentação + tabela' }, { delay: '+2 dias', text: 'Follow-up' }, { delay: '+5 dias', text: 'Condição especial' }, { delay: '+10 dias', text: 'Última chamada' }, { delay: '+20 dias', text: 'Pesquisa de perda' }] },
    { id: 'sq5', name: 'Carrinho abandonado (site)', active: true, enrolled: 980, completed: 911, conversion: 14.9, steps: [{ delay: '+1 hora', text: 'Lembrete do carrinho' }, { delay: '+1 dia', text: 'Cupom 5% OFF' }, { delay: '+3 dias', text: 'Frete grátis por 24h' }] },
  ];

  const scheduled: Seed['scheduled'] = Array.from({ length: 12 }, (_, k) => {
    const c = pool[(k * 5) % pool.length];
    const st = k < 7 ? 'Agendada' : k < 10 ? 'Enviada' : k === 10 ? 'Cancelada' : 'Falhou';
    return { id: id('sm'), contactId: c.id, channelId: pick(['c1', 'c2']), body: pick(['Oi {nome}! Passando para lembrar do seu pedido reservado até hoje 😉', 'Bom dia! O produto que você pediu chegou na loja ✅', 'Lembrete: sua cobrança vence amanhã. Precisa da 2ª via?', 'Feliz aniversário! 🎉 Ganhe 15% OFF com o cupom NIVER15', 'Seu treino merece: whey com 20% OFF só hoje!']).replace('{nome}', c.name.split(' ')[0]), sendAt: st === 'Agendada' ? NOW + int(1, 240) * HOUR : NOW - int(1, 120) * HOUR, status: st as any, createdBy: pick(['u1', 'u2', 'u4', 'u12']) };
  });

  const payments: Seed['payments'] = Array.from({ length: 22 }, (_, k) => {
    const c = k % 5 === 0 ? bizContacts[k % bizContacts.length] : pool[(k * 3 + 1) % pool.length];
    const status = pick(['Pago', 'Pago', 'Pago', 'Pendente', 'Pendente', 'Vencido', 'Cancelado']) as any;
    const due = NOW + int(-20, 15) * DAY;
    return { id: id('pg'), contactId: c.id, description: pick(['Pedido delivery', 'Kit hipertrofia', 'Pedido atacado', 'Assinatura mensal', 'Combo whey + creatina', 'Pré-treino Insanity']), value: k % 5 === 0 ? int(10, 60) * 100 : round2(int(60, 480) + 0.9), method: pick(['Pix', 'Pix', 'Boleto', 'Cartão de crédito']) as any, status, dueAt: due, paidAt: status === 'Pago' ? due - int(0, 3) * DAY : null, createdBy: pick(['u1', 'u2', 'u3', 'u10']), link: `https://pay.vitta.com.br/c/${hex(10).toLowerCase()}` };
  });

  const apps: Seed['apps'] = [
    { id: 'a1', name: 'Asaas', description: 'Cobranças por Pix, boleto e cartão direto da conversa.', category: 'Pagamentos', installed: true, price: 'R$ 29,90/mês', icon: 'CircleDollarSign', color: '#0ea5e9' },
    { id: 'a2', name: 'Transcrição de áudio', description: 'Transforma áudios dos clientes em texto automaticamente.', category: 'Produtividade', installed: true, price: 'R$ 0,06/min', icon: 'AudioLines', color: '#8b5cf6' },
    { id: 'a3', name: 'Chatbot com IA', description: 'Assistente generativo treinado com seu catálogo.', category: 'Automação', installed: true, price: 'R$ 50,00/mês', icon: 'Sparkles', color: '#10b981' },
    { id: 'a4', name: 'Pesquisa CSAT', description: 'Envia pesquisa de satisfação ao concluir atendimentos.', category: 'Qualidade', installed: true, price: 'Grátis', icon: 'Star', color: '#f59e0b' },
    { id: 'a5', name: 'Webhooks', description: 'Envie eventos de mensagens e atendimentos para seus sistemas.', category: 'Desenvolvedores', installed: true, price: 'Grátis', icon: 'Webhook', color: '#64748b' },
    { id: 'a6', name: 'Ligações VoIP', description: 'Faça e receba ligações dentro do atendimento.', category: 'Comunicação', installed: false, price: 'R$ 0,12/min', icon: 'PhoneCall', color: '#ef4444' },
    { id: 'a7', name: 'Google Sheets', description: 'Exporte contatos e cards do CRM para planilhas.', category: 'Integrações', installed: false, price: 'Grátis', icon: 'Sheet', color: '#16a34a' },
    { id: 'a8', name: 'RD Station CRM', description: 'Sincronize oportunidades e contatos.', category: 'Integrações', installed: false, price: 'Grátis', icon: 'Workflow', color: '#2563eb' },
    { id: 'a9', name: 'Bling ERP', description: 'Consulte estoque e emita pedidos pelo chat.', category: 'ERP', installed: false, price: 'R$ 19,90/mês', icon: 'Package', color: '#22c55e' },
    { id: 'a10', name: 'Nuvemshop', description: 'Pedidos da loja virtual direto no atendimento.', category: 'E-commerce', installed: false, price: 'Grátis', icon: 'ShoppingBag', color: '#0284c7' },
    { id: 'a11', name: 'Typebot', description: 'Use fluxos do Typebot como chatbot de atendimento.', category: 'Automação', installed: false, price: 'Grátis', icon: 'Bot', color: '#f97316' },
    { id: 'a12', name: 'Zapier', description: 'Conecte com mais de 5.000 aplicativos.', category: 'Integrações', installed: false, price: 'Grátis', icon: 'Zap', color: '#ff4a00' },
  ];

  // ------------------------------------------------------------ Métricas
  const daily: DailyMetric[] = [];
  let pend = 7200;
  for (let d = 89; d >= 0; d--) {
    const date = startOfDay(NOW) - d * DAY;
    const wd = new Date(date).getDay();
    const f = wd === 0 ? 0.45 : wd === 6 ? 0.75 : 1;
    const novos = Math.round((560 + 110 * Math.sin(d / 6)) * f * (0.85 + rand() * 0.3));
    const concluidos = Math.round(novos * (0.88 + rand() * 0.3));
    pend = Math.max(2500, pend + novos - concluidos);
    daily.push({ date, novos, concluidos, pendentes: pend, iniciados: Math.round(novos * 0.82), esperaMin: round2(8 + rand() * 16 + (wd === 1 ? 6 : 0)), duracaoH: round2(3 + rand() * 30), csat: round2(4.1 + rand() * 0.8), mensagens: Math.round(novos * (11 + rand() * 6)) });
  }
  const heatmap = Array.from({ length: 7 }, (_, wd) => Array.from({ length: 24 }, (_, h) => {
    const base = h < 7 ? 2 : h < 9 ? 18 : h < 13 ? 62 : h < 15 ? 45 : h < 18 ? 52 : h < 22 ? 70 : 20;
    return Math.round(base * (wd === 0 ? 0.35 : wd === 6 ? 0.7 : 1) * (0.75 + rand() * 0.5));
  }));
  const byChannel = [
    { name: 'WhatsApp Delivery', value: 1540 }, { name: 'WhatsApp Lojas', value: 1147 }, { name: '@vittasuplementos', value: 428 }, { name: 'WhatsApp Atacado', value: 299 }, { name: 'Messenger', value: 112 }, { name: 'Chat do site', value: 96 },
  ];
  const tagsUsage = tags.map((t) => ({ name: t.name, value: int(40, 900), color: t.color })).sort((a, b) => b.value - a.value);
  const classifications = [
    { name: 'Venda realizada', value: 38 }, { name: 'Dúvida esclarecida', value: 24 }, { name: 'Pedido / entrega', value: 14 }, { name: 'Reclamação resolvida', value: 8 }, { name: 'Financeiro', value: 7 }, { name: 'Sem resposta do cliente', value: 9 },
  ];
  const curMonth = monthKey(NOW);
  const last6 = monthRange(addMonths(curMonth, -5), curMonth);
  const messageUsage = last6.map((m, i) => ({ month: m, marketing: int(3800, 6200) + (i === 5 ? 1800 : 0), utility: int(5200, 7400), service: int(14000, 19000), authentication: int(80, 260) }));
  const infra = last6.map((m, i) => ({ month: m, storageGb: round2(38 + i * 4.2 + rand() * 2), messages: int(140000, 190000), aiTokens: int(1.1e6, 2.6e6), transcriptionMin: int(900, 1800) }));

  // -------------------------------------------------- Admin / Faturamento
  const partner = { name: '[ELENA] Norte Tech Soluções', legalName: 'Norte Tech Soluções em Tecnologia LTDA', startBillingAt: '2025-11-19', customDomain: 'atendimento.nortetech.com.br', app: 'Genérico' as const };
  const A: [string, number, number, string, string | null, any?][] = [
    ['Sua Agência Digital (Conta do parceiro)', 5, 3, '2025-11-27', null, { partner: true }],
    ['Colchões Bom Sono', 4, 2, '2026-02-06', null],
    ['Nutri Max Suplementos', 8, 5, '2025-12-12', null, { asaas: true }],
    ['Pisos & Cia Revestimentos', 3, 2, '2026-04-18', null],
    ['Clínica Bem Viver', 1, 1, '2026-03-21', '2026-04-13', { ai: true }],
    ['Decora Pisos', 2, 2, '2026-01-31', null],
    ['Moda Bella Boutique', 5, 2, '2025-12-16', null, { ai: true, tr: 20 }],
    ['Fit Power Suplementos', 8, 3, '2026-02-21', null],
    ['Formatto Móveis Planejados', 7, 2, '2026-04-12', null],
    ['Vitta Suplementos (Grupo Vitta)', 28, 10, '2025-12-02', null, { tr: 110, ai: true, asaas: true }],
    ['Fênix Distribuidora', 24, 2, '2026-01-10', null],
    ['Ótica Visão Clara', 5, 5, '2026-01-20', null],
    ['Saúde Ocupacional Prevenir', 39, 18, '2026-04-12', null, { tr: 88 }],
    ['Imobiliária Rio Negro', 2, 2, '2026-04-09', null],
    ['Pet Shop Amigo Fiel', 3, 1, '2026-06-03', null, { ai: true }],
    ['Escola de Idiomas Fluent', 6, 2, '2026-07-15', null],
    ['Auto Peças Turbo', 4, 1, '2026-08-01', '2026-10-20'],
    ['Restaurante Sabor da Amazônia', 3, 2, '2026-09-10', null, { ai: true }],
    ['Construtora Horizonte', 12, 4, '2026-10-05', null, { asaas: true }],
  ];
  const accounts: Account[] = A.map(([name, users, chans, start, end, x = {}], i) => {
    const months = monthRange(start.slice(0, 7), end ? end.slice(0, 7) : curMonth);
    const history: Account['history'] = {};
    months.forEach((m, k) => {
      const prog = months.length > 1 ? k / (months.length - 1) : 1;
      const noise = hashNoise(name + m);
      history[m] = {
        users: Math.max(1, Math.round(users * (0.55 + 0.45 * prog) + (noise - 0.5) * 2)),
        channels: Math.max(1, Math.round(chans * (0.6 + 0.4 * prog) + (noise > 0.8 ? 1 : 0))),
        transcription: x.tr ? round2(x.tr * (0.6 + noise * 0.8)) : 0,
        calling: 0,
      };
    });
    return {
      id: `ac${i + 1}`, name, legalName: name.replace(/\s*\(.*\)/, '') + ' LTDA', cnpj: `${int(10, 99)}.${int(100, 999)}.${int(100, 999)}/0001-${int(10, 99)}`,
      plan: 'Padrão', status: end ? 'Cancelada' : i === 18 ? 'Trial' : 'Ativa', isPartnerAccount: !!x.partner, chatbotAI: !!x.ai, asaas: !!x.asaas,
      startBillingAt: start, endBillingAt: end, contactName: `${pick(FIRST)} ${pick(LAST)}`, contactPhone: phone(), history,
    };
  });
  const qrInstances: QrInstance[] = [];
  accounts.forEach((acc) => {
    const count = acc.isPartnerAccount ? 1 : int(1, 3);
    let cursor = new Date(acc.startBillingAt + 'T02:00:00').getTime() + int(0, 3) * DAY;
    const endLimit = acc.endBillingAt ? new Date(acc.endBillingAt + 'T23:00:00').getTime() : NOW;
    const num = `+55 (92) 9${int(8100, 9999)}-${String(int(0, 9999)).padStart(4, '0')}`;
    for (let k = 0; k < count && cursor < endLimit; k++) {
      const last = k === count - 1;
      const end = last ? (acc.endBillingAt ? endLimit : null) : Math.min(endLimit, cursor + int(1, 70) * DAY + int(1, 3) * HOUR);
      qrInstances.push({ id: id('qi'), instanceId: hex(), accountId: acc.id, number: k === 1 && chance(0.4) ? `+55 (92) 9${int(8100, 9999)}-${String(int(0, 9999)).padStart(4, '0')}` : num, startAt: cursor, endAt: end, status: end ? 'Desconectada' : 'Conectada' });
      if (end) cursor = end + int(0, 2) * DAY + int(1, 5) * HOUR;
    }
    if (chance(0.25)) qrInstances.push({ id: id('qi'), instanceId: hex(), accountId: acc.id, number: num, startAt: NOW - int(5, 60) * DAY, endAt: null, status: 'Conectada' });
  });
  const infraCost: Record<string, number> = {};
  monthRange(partner.startBillingAt.slice(0, 7), curMonth).forEach((m) => {
    const rows = accounts.map((a) => computeAccount(a, m, DEFAULT_PRICING)).filter(Boolean) as any[];
    infraCost[m] = round2(sum(rows, (r) => r.users * DEFAULT_PRICING.infraPerUser + r.channels * DEFAULT_PRICING.infraPerChannel) * (0.85 + hashNoise('infra' + m) * 0.5));
  });

  const audit: Seed['admin']['audit'] = Array.from({ length: 48 }, (_, k) => {
    const [action, entity, detail] = pick([
      ['Criou', 'Conta', 'Conta "Construtora Horizonte" criada em período de teste'], ['Alterou', 'Plano', 'Preço da Faixa 2 de usuários atualizado'], ['Conectou', 'Canal', 'Instância QR conectada para Ótica Visão Clara'],
      ['Desconectou', 'Canal', 'Instância QR de Vitta Atacado desconectada'], ['Alterou', 'Usuário', 'Perfil de Helena Duarte alterado para Supervisor'], ['Exportou', 'Relatório', 'Relatório de faturamento exportado (CSV)'],
      ['Suspendeu', 'Conta', 'Auto Peças Turbo suspensa por inadimplência'], ['Criou', 'Aviso', 'Aviso "Manutenção programada" publicado'], ['Login', 'Sessão', 'Acesso ao painel administrativo'], ['Alterou', 'Configurações', 'Cor primária da plataforma alterada'],
    ]);
    return { id: id('au'), at: NOW - k * int(2, 9) * HOUR, userName: pick(['Admin do Parceiro', 'Suporte Norte Tech', 'Rafaela Moura', 'Financeiro Norte Tech']), action, entity, detail, ip: `177.${int(10, 250)}.${int(0, 255)}.${int(1, 254)}` };
  });

  return {
    version: SEED_VERSION,
    createdAt: NOW,
    company: {
      id: 'co1', name: 'Vitta Suplementos', legalName: 'Vitta Suplementos e Nutrição LTDA', cnpj: '12.345.678/0001-90', timezone: 'America/Manaus', licenses: 15,
      businessHours: [['Segunda', '09:00', '21:00'], ['Terça', '09:00', '21:00'], ['Quarta', '09:00', '21:00'], ['Quinta', '09:00', '21:00'], ['Sexta', '09:00', '21:00'], ['Sábado', '09:00', '21:00'], ['Domingo', '10:00', '16:00']].map(([day, open, close]) => ({ day, open, close, enabled: true })),
      awayMessage: 'Olá! Nosso horário de atendimento é de seg. a sáb. das 9h às 21h e domingo das 10h às 16h. Deixe sua mensagem que responderemos assim que possível 💚',
      greetingMessage: 'Olá! Seja bem-vindo(a) à Vitta Suplementos 💪',
      slaFirstResponseMin: 10, autoCloseHours: 12,
    },
    users, teams, channels, tags, contacts, sessions, messages, quickReplies, templates, internalChat, notifications,
    panels, cards, chatbots, campaigns, sequences, scheduled, payments, apps,
    metrics: { daily, heatmap, byChannel, tagsUsage, classifications, messageUsage, infra },
    admin: {
      partner, accounts, qrInstances, infraCost,
      admUsers: [
        { id: 'au1', name: 'Admin do Parceiro', email: 'parceiro@nortetech.com.br', role: 'Proprietário', lastAccess: NOW - 20 * MIN, active: true },
        { id: 'au2', name: 'Suporte Norte Tech', email: 'suporte@nortetech.com.br', role: 'Suporte', lastAccess: NOW - 3 * HOUR, active: true },
        { id: 'au3', name: 'Financeiro Norte Tech', email: 'financeiro@nortetech.com.br', role: 'Financeiro', lastAccess: NOW - 2 * DAY, active: true },
        { id: 'au4', name: 'Comercial Norte Tech', email: 'comercial@nortetech.com.br', role: 'Comercial', lastAccess: NOW - 6 * DAY, active: true },
        { id: 'au5', name: 'Estagiário 2025', email: 'estagio@nortetech.com.br', role: 'Suporte', lastAccess: NOW - 120 * DAY, active: false },
      ],
      audit,
      notices: [
        { id: 'nc1', title: 'Manutenção programada', body: 'Domingo, 16/11, das 02h às 04h, o envio de mensagens pode oscilar.', audience: 'Todas as contas', level: 'warning', startAt: NOW - DAY, endAt: NOW + 4 * DAY, active: true },
        { id: 'nc2', title: 'Novo: Chatbot com IA', body: 'Agora você pode criar assistentes com IA treinados no seu catálogo. Fale com seu consultor!', audience: 'Todas as contas', level: 'success', startAt: NOW - 10 * DAY, endAt: NOW + 20 * DAY, active: true },
        { id: 'nc3', title: 'Atualize seus modelos de mensagem', body: 'A Meta mudou as regras de categoria de modelos de marketing.', audience: 'Contas com WhatsApp oficial', level: 'info', startAt: NOW - 40 * DAY, endAt: NOW - 10 * DAY, active: false },
      ],
      customActions: [
        { id: 'ca1', name: 'Consultar pedido no ERP', url: 'https://erp.exemplo.com/pedidos?tel={{contato.telefone}}', location: 'Menu do chat', openIn: 'Modal', active: true },
        { id: 'ca2', name: 'Abrir ficha no CRM externo', url: 'https://crm.exemplo.com/contato/{{contato.id}}', location: 'Painel do contato', openIn: 'Nova aba', active: true },
        { id: 'ca3', name: 'Central de ajuda', url: 'https://ajuda.nortetech.com.br', location: 'Barra superior', openIn: 'Nova aba', active: true },
        { id: 'ca4', name: 'Gerar orçamento', url: 'https://orcamento.exemplo.com/novo?cliente={{contato.nome}}', location: 'Menu do chat', openIn: 'Modal', active: false },
      ],
      platform: { platformName: 'Elena', primaryColor: '#05966b', supportEmail: 'suporte@nortetech.com.br', supportWhatsapp: '(92) 99999-0000', customDomain: 'atendimento.nortetech.com.br', termsUrl: 'https://nortetech.com.br/termos', allowSignup: true, trialDays: 7 },
      pricing: DEFAULT_PRICING,
      connections: Array.from({ length: 30 }, (_, k) => ({ id: id('cn'), at: NOW - k * int(3, 20) * HOUR, accountName: pick(accounts).name, channel: `WhatsApp QR ${pick(['+55 92 9', '+55 92 8'])}${int(1000, 9999)}-${int(1000, 9999)}`, event: pick(['Conectado', 'Desconectado', 'QR gerado', 'Reconectado']) as any, detail: pick(['Leitura de QR Code pelo celular', 'Celular sem internet há 10 min', 'Sessão encerrada pelo WhatsApp', 'Reconexão automática bem-sucedida', 'Instância criada pelo painel']) })),
    },
  };
}
