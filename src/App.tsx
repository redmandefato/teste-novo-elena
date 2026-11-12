import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Inbox from './pages/inbox/Inbox';
import { Empty } from './components/ui';

const p = (f: () => Promise<any>) => lazy(f);
const R = {
  Contacts: p(() => import('./pages/crm/Contacts')),
  Panels: p(() => import('./pages/crm/Panels')),
  Board: p(() => import('./pages/crm/Board')),
  Portfolios: p(() => import('./pages/crm/Portfolios')),
  CrmDashboard: p(() => import('./pages/crm/CrmDashboard')),
  Campaigns: p(() => import('./pages/apps/Campaigns')),
  Payments: p(() => import('./pages/apps/Payments')),
  Chatbots: p(() => import('./pages/apps/Chatbots')),
  Sequences: p(() => import('./pages/apps/Sequences')),
  Scheduled: p(() => import('./pages/apps/Scheduled')),
  MyApps: p(() => import('./pages/apps/MyApps')),
  Indicators: p(() => import('./pages/reports/Indicators')),
  SessionsReport: p(() => import('./pages/reports/SessionsReport')),
  InfraReport: p(() => import('./pages/reports/InfraReport')),
  Users: p(() => import('./pages/settings/Users')),
  Teams: p(() => import('./pages/settings/Teams')),
  Templates: p(() => import('./pages/settings/Templates')),
  Account: p(() => import('./pages/settings/Account')),
  MessageUsage: p(() => import('./pages/settings/MessageUsage')),
  Integrations: p(() => import('./pages/settings/Integrations')),
  Accounts: p(() => import('./pages/admin/Accounts')),
  Plans: p(() => import('./pages/admin/Plans')),
  AdminChannels: p(() => import('./pages/admin/Channels')),
  AdminUsers: p(() => import('./pages/admin/AdminUsers')),
  Platform: p(() => import('./pages/admin/Platform')),
  CustomActions: p(() => import('./pages/admin/CustomActions')),
  Notices: p(() => import('./pages/admin/Notices')),
  Audit: p(() => import('./pages/admin/Audit')),
  Billing: p(() => import('./pages/admin/Billing')),
  InfraCost: p(() => import('./pages/admin/InfraCost')),
  AdminMessageUsage: p(() => import('./pages/admin/AdminMessageUsage')),
  Connections: p(() => import('./pages/admin/Connections')),
  PartnerPortal: p(() => import('./pages/admin/PartnerPortal')),
};

const Loading = () => <div className="h-full grid place-items-center text-sm text-slate-400">Carregando…</div>;

export default function App() {
  const auth = useStore((s) => s.authUserId);
  if (!auth) return <Login />;
  const r = (C: any) => <Suspense fallback={<Loading />}><C /></Suspense>;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/atendimentos" replace />} />
        <Route path="/atendimentos" element={<Inbox />} />
        <Route path="/atendimentos/:id" element={<Inbox />} />
        <Route path="/crm/contatos" element={r(R.Contacts)} />
        <Route path="/crm/paineis" element={r(R.Panels)} />
        <Route path="/crm/paineis/:id" element={r(R.Board)} />
        <Route path="/crm/carteiras" element={r(R.Portfolios)} />
        <Route path="/crm/dashboard" element={r(R.CrmDashboard)} />
        <Route path="/apps/campanhas" element={r(R.Campaigns)} />
        <Route path="/apps/pagamentos" element={r(R.Payments)} />
        <Route path="/apps/chatbots" element={r(R.Chatbots)} />
        <Route path="/apps/sequencias" element={r(R.Sequences)} />
        <Route path="/apps/agendadas" element={r(R.Scheduled)} />
        <Route path="/apps/meus-apps" element={r(R.MyApps)} />
        <Route path="/relatorios/indicadores" element={r(R.Indicators)} />
        <Route path="/relatorios/atendimentos" element={r(R.SessionsReport)} />
        <Route path="/relatorios/infraestrutura" element={r(R.InfraReport)} />
        <Route path="/ajustes/usuarios" element={r(R.Users)} />
        <Route path="/ajustes/equipes" element={r(R.Teams)} />
        <Route path="/ajustes/equipes/:id" element={r(R.Teams)} />
        <Route path="/ajustes/modelos" element={r(R.Templates)} />
        <Route path="/ajustes/conta" element={r(R.Account)} />
        <Route path="/ajustes/consumo" element={r(R.MessageUsage)} />
        <Route path="/ajustes/integracoes" element={r(R.Integrations)} />
        <Route path="/admin/contas" element={r(R.Accounts)} />
        <Route path="/admin/planos" element={r(R.Plans)} />
        <Route path="/admin/canais" element={r(R.AdminChannels)} />
        <Route path="/admin/usuarios" element={r(R.AdminUsers)} />
        <Route path="/admin/configuracoes" element={r(R.Platform)} />
        <Route path="/admin/acoes" element={r(R.CustomActions)} />
        <Route path="/admin/avisos" element={r(R.Notices)} />
        <Route path="/admin/auditoria" element={r(R.Audit)} />
        <Route path="/admin/faturamento" element={r(R.Billing)} />
        <Route path="/admin/infraestrutura" element={r(R.InfraCost)} />
        <Route path="/admin/consumo" element={r(R.AdminMessageUsage)} />
        <Route path="/admin/conexoes" element={r(R.Connections)} />
        <Route path="/admin/parceiros" element={r(R.PartnerPortal)} />
        <Route path="*" element={<Empty icon="SearchX" title="Página não encontrada" text="O endereço acessado não existe neste protótipo." />} />
      </Route>
    </Routes>
  );
}
