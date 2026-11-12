-- ============================================================================
-- Elena Atendimento — schema PostgreSQL (espelha src/types.ts)
-- Multi-tenant: tudo pertence a uma "account" (empresa cliente), e cada conta
-- pertence a um "partner" (revenda white label).
-- ============================================================================

create table partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  start_billing_at date not null,
  custom_domain text,
  app_type text check (app_type in ('Genérico','Personalizado'))
);

create table accounts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners(id),
  name text not null,
  legal_name text,
  cnpj text,
  plan text not null default 'Padrão',
  status text not null default 'Trial' check (status in ('Ativa','Suspensa','Cancelada','Trial')),
  is_partner_account boolean not null default false,
  chatbot_ai boolean not null default false,
  asaas boolean not null default false,
  start_billing_at date not null,
  end_billing_at date,
  timezone text not null default 'America/Manaus',
  sla_first_response_min int not null default 10,
  auto_close_hours int not null default 12,
  licenses int not null default 5,
  greeting_message text,
  away_message text,
  created_at timestamptz not null default now()
);

create table account_business_hours (
  account_id uuid references accounts(id) on delete cascade,
  weekday smallint check (weekday between 0 and 6),
  open_at time, close_at time, enabled boolean default true,
  primary key (account_id, weekday)
);

-- Snapshot mensal de uso (base do faturamento)
create table account_usage_months (
  account_id uuid references accounts(id) on delete cascade,
  period char(7) not null,               -- 'YYYY-MM'
  users int not null, channels int not null,
  transcription numeric(12,2) not null default 0,
  calling numeric(12,2) not null default 0,
  primary key (account_id, period)
);

create table users (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  name text not null, email text not null, phone text,
  role text not null check (role in ('admin','supervisor','agent')),
  status text not null default 'offline' check (status in ('online','away','offline')),
  title text,
  max_concurrent int not null default 8,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  unique (account_id, email)
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  access text not null default 'agent' check (access in ('agent','team')),
  restricted boolean not null default false,
  distribution boolean not null default true,
  overflow boolean not null default true,
  accept_timeout_min int not null default 4,
  is_bot boolean not null default false,
  created_at timestamptz not null default now()
);

create table team_members (
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text not null default 'agent' check (role in ('agent','supervisor')),
  primary key (team_id, user_id)
);

create table chatbots (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('service','automation')),
  channel_type text not null,
  team_id uuid references teams(id),
  status text not null default 'active' check (status in ('active','paused')),
  archived boolean not null default false,
  flow jsonb not null default '[]',      -- nós do fluxo (FlowNode[])
  runs bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table channels (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  type text not null check (type in ('whatsapp','whatsapp_qr','instagram','messenger','webchat')),
  name text not null,
  identifier text not null,
  status text not null default 'pending' check (status in ('connected','disconnected','pending')),
  team_id uuid references teams(id),
  chatbot_id uuid references chatbots(id),
  instance_id text,
  created_at timestamptz not null default now()
);
create table team_channels (team_id uuid references teams(id) on delete cascade, channel_id uuid references channels(id) on delete cascade, primary key (team_id, channel_id));

create table qr_instances (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  instance_id text not null,
  number text not null,
  start_at timestamptz not null,
  end_at timestamptz
);

create table tags (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  name text not null, color text not null
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  name text not null, phone text, email text, instagram text,
  owner_id uuid references users(id),     -- carteirização
  city text, origin text, cpf text, birthday text,
  custom_fields jsonb not null default '{}',
  archived boolean not null default false,
  blocked boolean not null default false,
  created_at timestamptz not null default now()
);
create index on contacts (account_id, phone);
create table contact_tags (contact_id uuid references contacts(id) on delete cascade, tag_id uuid references tags(id) on delete cascade, primary key (contact_id, tag_id));
create table contact_notes (id uuid primary key default gen_random_uuid(), contact_id uuid references contacts(id) on delete cascade, user_id uuid references users(id), text text not null, at timestamptz not null default now());

create table sessions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  protocol bigserial,
  contact_id uuid not null references contacts(id),
  channel_id uuid not null references channels(id),
  team_id uuid not null references teams(id),
  assignee_id uuid references users(id),
  status text not null check (status in ('new','open','concluded')),
  is_group boolean not null default false,
  group_name text,
  unread int not null default 0,
  started_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  last_inbound_at timestamptz,
  first_response_at timestamptz,
  concluded_at timestamptz,
  classification text,
  sale_value numeric(12,2),
  csat smallint check (csat between 1 and 5)
);
create index on sessions (account_id, status, team_id);
create index on sessions (assignee_id, status);
create table session_watchers (session_id uuid references sessions(id) on delete cascade, user_id uuid references users(id) on delete cascade, primary key (session_id, user_id));

create table messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  dir text not null check (dir in ('in','out','bot','event','note')),
  type text not null default 'text' check (type in ('text','image','audio','document','location','template')),
  body text not null default '',
  media jsonb,                            -- {src, fileName, fileSize, duration, caption, address}
  template jsonb,                         -- {name, buttons}
  event text,                             -- bot|distributed|expired|transferred|concluded|reopened|assigned|created
  user_id uuid references users(id),
  sender_name text,
  status text check (status in ('sent','delivered','read')),
  external_id text,                       -- id da mensagem no provedor (Meta/Z-API)
  at timestamptz not null default now()
);
create index on messages (session_id, at);

create table quick_replies (id uuid primary key default gen_random_uuid(), account_id uuid references accounts(id) on delete cascade, shortcut text not null, text text not null);

create table message_templates (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade,
  name text not null, category text not null, language text not null default 'pt_BR',
  status text not null default 'Pendente', header text, body text not null, buttons text[], rejection_reason text,
  updated_at timestamptz not null default now()
);

create table internal_messages (id uuid primary key default gen_random_uuid(), account_id uuid references accounts(id) on delete cascade, room text not null, user_id uuid references users(id), text text not null, pinned boolean default false, at timestamptz not null default now());

-- CRM
create table panels (id uuid primary key default gen_random_uuid(), account_id uuid references accounts(id) on delete cascade, name text not null, description text, kind text not null, prefix text not null, scope text, owner_id uuid references users(id), pinned boolean default false, deleted boolean default false);
create table panel_stages (id uuid primary key default gen_random_uuid(), panel_id uuid references panels(id) on delete cascade, name text not null, color text not null, position int not null);
create table cards (
  id uuid primary key default gen_random_uuid(),
  panel_id uuid not null references panels(id) on delete cascade,
  stage_id uuid not null references panel_stages(id),
  key text not null, title text not null, description text,
  owner_id uuid references users(id), value numeric(12,2) default 0, due_at timestamptz,
  archived boolean default false, created_at timestamptz not null default now()
);
create table card_contacts (card_id uuid references cards(id) on delete cascade, contact_id uuid references contacts(id) on delete cascade, primary key (card_id, contact_id));
create table card_history (id bigserial primary key, card_id uuid references cards(id) on delete cascade, text text not null, at timestamptz not null default now());

-- Apps
create table campaigns (id uuid primary key default gen_random_uuid(), account_id uuid references accounts(id) on delete cascade, name text not null, channel_id uuid references channels(id), template_id uuid references message_templates(id), segment text, status text not null, audience int, sent int default 0, delivered int default 0, read int default 0, replied int default 0, failed int default 0, scheduled_at timestamptz, created_by uuid references users(id));
create table sequences (id uuid primary key default gen_random_uuid(), account_id uuid references accounts(id) on delete cascade, name text not null, active boolean default true, steps jsonb not null default '[]');
create table sequence_enrollments (sequence_id uuid references sequences(id) on delete cascade, contact_id uuid references contacts(id) on delete cascade, step int default 0, enrolled_at timestamptz default now(), completed_at timestamptz, primary key (sequence_id, contact_id));
create table scheduled_messages (id uuid primary key default gen_random_uuid(), account_id uuid references accounts(id) on delete cascade, contact_id uuid references contacts(id), channel_id uuid references channels(id), body text not null, send_at timestamptz not null, status text not null default 'Agendada', created_by uuid references users(id));
create table payments (id uuid primary key default gen_random_uuid(), account_id uuid references accounts(id) on delete cascade, contact_id uuid references contacts(id), description text, value numeric(12,2) not null, method text not null, status text not null, due_at timestamptz, paid_at timestamptz, link text, external_id text, created_by uuid references users(id));

-- Admin / white label
create table pricing (partner_id uuid primary key references partners(id), config jsonb not null);  -- formato: tipo Pricing
create table infra_costs (partner_id uuid references partners(id), period char(7), amount numeric(12,2), primary key (partner_id, period));
create table audit_log (id bigserial primary key, partner_id uuid references partners(id), at timestamptz default now(), user_name text, action text, entity text, detail text, ip inet);
create table notices (id uuid primary key default gen_random_uuid(), partner_id uuid references partners(id), title text, body text, audience text, level text, start_at timestamptz, end_at timestamptz, active boolean default true);
create table custom_actions (id uuid primary key default gen_random_uuid(), partner_id uuid references partners(id), name text, url text, location text, open_in text, active boolean default true);
create table connection_log (id bigserial primary key, account_id uuid references accounts(id), at timestamptz default now(), channel text, event text, detail text);
