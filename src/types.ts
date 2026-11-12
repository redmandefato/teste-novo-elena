// ============================================================================
// MODELAGEM DE DOMÍNIO — Elena Atendimento
// Todas as entidades do sistema. Os mocks (src/data/seed.ts) seguem estes tipos
// e o schema SQL em docs/schema.sql espelha esta mesma estrutura.
// ============================================================================

export type ID = string;
export type Timestamp = number; // epoch ms

// ---------------------------------------------------------------- Pessoas ---
export type UserRole = 'admin' | 'supervisor' | 'agent';
export type Presence = 'online' | 'away' | 'offline';

export interface User {
  id: ID;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: Presence;
  title?: string;
  lastSeenAt: Timestamp;
  createdAt: Timestamp;
  maxConcurrent: number; // limite de atendimentos simultâneos na distribuição
}

export type TeamAccess = 'agent' | 'team'; // quem vê os atendimentos: só o atendente ou a equipe toda
export interface TeamMember { userId: ID; role: 'agent' | 'supervisor' }

export interface Team {
  id: ID;
  name: string;
  isDefault: boolean;
  access: TeamAccess;
  restricted: boolean; // equipe privada (cadeado)
  distribution: boolean; // distribuição automática (round-robin)
  overflow: boolean; // transbordo quando ninguém aceita
  acceptTimeoutMin: number; // tempo p/ atendente iniciar antes de redistribuir
  channelIds: ID[];
  members: TeamMember[];
  isBot?: boolean;
  createdAt: Timestamp;
}

// ---------------------------------------------------------------- Canais ---
export type ChannelType = 'whatsapp' | 'whatsapp_qr' | 'instagram' | 'messenger' | 'webchat';
export interface Channel {
  id: ID;
  type: ChannelType;
  name: string;
  identifier: string; // número, @perfil, domínio
  status: 'connected' | 'disconnected' | 'pending';
  teamId: ID; // equipe padrão
  chatbotId?: ID;
  instanceId?: string; // instância QR (ex.: Z-API)
  createdAt: Timestamp;
}

// -------------------------------------------------------------- Contatos ---
export interface Tag { id: ID; name: string; color: string }

export interface ContactNote { id: ID; userId: ID; text: string; at: Timestamp }

export interface Contact {
  id: ID;
  name: string;
  phone: string;
  email: string;
  instagram: string;
  tagIds: ID[];
  ownerId: ID | null; // carteirização (vendedor responsável)
  city: string;
  origin: string;
  cpf: string;
  birthday: string;
  sequenceIds: ID[];
  notes: ContactNote[];
  archived: boolean;
  blocked: boolean;
  createdAt: Timestamp;
}

// --------------------------------------------------------- Atendimentos ---
export type SessionStatus = 'new' | 'open' | 'concluded';

export interface Session {
  id: ID;
  protocol: string;
  contactId: ID;
  channelId: ID;
  teamId: ID;
  assigneeId: ID | null;
  status: SessionStatus; // new = na fila da equipe | open = em andamento | concluded
  isGroup: boolean;
  groupName?: string;
  participants?: string[];
  unread: number;
  startedAt: Timestamp;
  lastAt: Timestamp;
  lastInboundAt: Timestamp | null; // controla a janela de 24h do WhatsApp oficial
  firstResponseAt: Timestamp | null;
  concludedAt: Timestamp | null;
  classification: string | null;
  saleValue: number | null;
  csat: number | null;
  watchers: ID[];
}

export type MessageDirection = 'in' | 'out' | 'bot' | 'event' | 'note';
export type MessageType = 'text' | 'image' | 'audio' | 'document' | 'location' | 'template';
export type EventKind = 'bot' | 'distributed' | 'expired' | 'transferred' | 'concluded' | 'reopened' | 'assigned' | 'created';

export interface Message {
  id: ID;
  sessionId: ID;
  dir: MessageDirection;
  type: MessageType;
  body: string;
  at: Timestamp;
  userId?: ID; // atendente que enviou (out/note)
  senderName?: string; // participante em grupos
  status?: 'sent' | 'delivered' | 'read';
  media?: { src?: string; fileName?: string; fileSize?: string; duration?: number; caption?: string; address?: string };
  template?: { name: string; buttons?: string[] };
  event?: EventKind;
}

export interface QuickReply { id: ID; shortcut: string; text: string }

export interface MessageTemplate {
  id: ID;
  name: string;
  category: 'Marketing' | 'Utilidade' | 'Autenticação';
  language: string;
  status: 'Aprovado' | 'Pendente' | 'Rejeitado';
  body: string;
  header?: string;
  buttons?: string[];
  rejectionReason?: string;
  updatedAt: Timestamp;
}

export interface InternalMessage { id: ID; room: string; userId: ID; text: string; at: Timestamp; pinned?: boolean }

export interface AppNotification { id: ID; title: string; body: string; at: Timestamp; read: boolean; icon: string; link?: string }

// ------------------------------------------------------------------ CRM ---
export interface PanelStage { id: ID; name: string; color: string }
export interface Panel {
  id: ID;
  name: string;
  description: string;
  kind: 'Vendas' | 'Gestão' | 'Tarefas';
  prefix: string;
  scope: string; // equipe ou "Toda a empresa"
  ownerId?: ID;
  stages: PanelStage[];
  pinned: boolean;
  deleted: boolean;
}
export interface Card {
  id: ID;
  key: string;
  panelId: ID;
  stageId: ID;
  title: string;
  contactIds: ID[];
  ownerId: ID;
  value: number;
  dueAt: Timestamp | null;
  tagIds: ID[];
  description: string;
  notes: ContactNote[];
  history: { at: Timestamp; text: string }[];
  archived: boolean;
  createdAt: Timestamp;
}

// ----------------------------------------------------------------- Apps ---
export interface FlowNode { id: ID; type: 'start' | 'message' | 'menu' | 'transfer' | 'ai' | 'condition' | 'end' | 'wait'; title: string; text?: string; options?: { key: string; label: string; target: string }[] }
export interface Chatbot {
  id: ID;
  name: string;
  kind: 'service' | 'automation';
  channelType: ChannelType;
  teamId: ID;
  status: 'active' | 'paused';
  archived: boolean;
  runs: number;
  updatedAt: Timestamp;
  flow: FlowNode[];
}
export interface Campaign {
  id: ID;
  name: string;
  channelId: ID;
  templateId: ID;
  status: 'Rascunho' | 'Agendada' | 'Enviando' | 'Concluída' | 'Pausada';
  audience: number;
  sent: number;
  delivered: number;
  read: number;
  replied: number;
  failed: number;
  scheduledAt: Timestamp;
  createdBy: ID;
  segment: string;
}
export interface Sequence {
  id: ID;
  name: string;
  active: boolean;
  steps: { delay: string; text: string }[];
  enrolled: number;
  completed: number;
  conversion: number;
}
export interface ScheduledMessage { id: ID; contactId: ID; channelId: ID; body: string; sendAt: Timestamp; status: 'Agendada' | 'Enviada' | 'Cancelada' | 'Falhou'; createdBy: ID }
export interface Payment {
  id: ID;
  contactId: ID;
  description: string;
  value: number;
  method: 'Pix' | 'Boleto' | 'Cartão de crédito';
  status: 'Pago' | 'Pendente' | 'Vencido' | 'Cancelado';
  dueAt: Timestamp;
  paidAt: Timestamp | null;
  createdBy: ID;
  link: string;
}
export interface MarketplaceApp { id: ID; name: string; description: string; category: string; installed: boolean; price: string; icon: string; color: string }

// -------------------------------------------------------- Relatórios ---
export interface DailyMetric {
  date: Timestamp;
  novos: number;
  concluidos: number;
  pendentes: number;
  esperaMin: number;
  duracaoH: number;
  iniciados: number;
  csat: number;
  mensagens: number;
}

// ------------------------------------------- Admin / White label ---
export interface PriceTier { label: string; from: number; to: number | null; price: number }
export interface Pricing {
  basePlan: number;
  includedUsers: number;
  includedChannels: number;
  userTiers: PriceTier[];
  channelTiers: PriceTier[];
  chatbotAI: number;
  asaas: number;
  qrInstanceMonthly: number;
  minimumLicense: number;
  customDomain: number;
  appCustom: number;
  volumeDiscount: { above: number; pct: number }[];
  daysBase: number;
  infraPerUser: number;
  infraPerChannel: number;
}

export interface AccountMonth { users: number; channels: number; transcription: number; calling: number }
export interface Account {
  id: ID;
  name: string;
  legalName: string;
  cnpj: string;
  plan: string;
  status: 'Ativa' | 'Suspensa' | 'Cancelada' | 'Trial';
  isPartnerAccount: boolean;
  chatbotAI: boolean;
  asaas: boolean;
  startBillingAt: string; // ISO date
  endBillingAt: string | null;
  contactName: string;
  contactPhone: string;
  history: Record<string, AccountMonth>; // por período YYYY-MM
}

export interface QrInstance { id: ID; instanceId: string; accountId: ID; number: string; startAt: Timestamp; endAt: Timestamp | null; status: 'Conectada' | 'Desconectada' }

export interface Partner { name: string; legalName: string; startBillingAt: string; customDomain: string | null; app: 'Genérico' | 'Personalizado' | null }

export interface AuditEntry { id: ID; at: Timestamp; userName: string; action: string; entity: string; detail: string; ip: string }

export interface Notice { id: ID; title: string; body: string; audience: string; level: 'info' | 'warning' | 'success'; startAt: Timestamp; endAt: Timestamp; active: boolean }

export interface CustomAction { id: ID; name: string; url: string; location: 'Menu do chat' | 'Barra superior' | 'Painel do contato'; openIn: 'Nova aba' | 'Modal'; active: boolean }

export interface PlatformSettings {
  platformName: string;
  primaryColor: string;
  supportEmail: string;
  supportWhatsapp: string;
  customDomain: string;
  termsUrl: string;
  allowSignup: boolean;
  trialDays: number;
}

export interface ConnectionLog { id: ID; at: Timestamp; accountName: string; channel: string; event: 'Conectado' | 'Desconectado' | 'QR gerado' | 'Reconectado'; detail: string }

export interface MonthUsage { month: string; marketing: number; utility: number; service: number; authentication: number }

export interface Company {
  id: ID;
  name: string;
  legalName: string;
  cnpj: string;
  timezone: string;
  businessHours: { day: string; open: string; close: string; enabled: boolean }[];
  awayMessage: string;
  greetingMessage: string;
  slaFirstResponseMin: number;
  autoCloseHours: number;
  licenses: number;
}

// --------------------------------------------------------- Estado raiz ---
export interface Prefs {
  concludeMode: '12h' | 'immediate';
  classifyOnConclude: boolean;
  simulation: boolean;
  notificationsBanner: boolean;
  sort: 'recent' | 'oldest';
  sound: boolean;
}

export interface Seed {
  version: number;
  createdAt: Timestamp;
  company: Company;
  users: User[];
  teams: Team[];
  channels: Channel[];
  tags: Tag[];
  contacts: Contact[];
  sessions: Session[];
  messages: Message[];
  quickReplies: QuickReply[];
  templates: MessageTemplate[];
  internalChat: InternalMessage[];
  notifications: AppNotification[];
  panels: Panel[];
  cards: Card[];
  chatbots: Chatbot[];
  campaigns: Campaign[];
  sequences: Sequence[];
  scheduled: ScheduledMessage[];
  payments: Payment[];
  apps: MarketplaceApp[];
  metrics: { daily: DailyMetric[]; heatmap: number[][]; byChannel: { name: string; value: number }[]; tagsUsage: { name: string; value: number; color: string }[]; classifications: { name: string; value: number }[]; messageUsage: MonthUsage[]; infra: { month: string; storageGb: number; messages: number; aiTokens: number; transcriptionMin: number }[] };
  admin: {
    partner: Partner;
    accounts: Account[];
    qrInstances: QrInstance[];
    admUsers: { id: ID; name: string; email: string; role: string; lastAccess: Timestamp; active: boolean }[];
    audit: AuditEntry[];
    notices: Notice[];
    customActions: CustomAction[];
    platform: PlatformSettings;
    pricing: Pricing;
    connections: ConnectionLog[];
    infraCost: Record<string, number>;
  };
}
