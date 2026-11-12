import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Btn, Card, Icon, Page, Stat, Badge } from '../../components/ui';
import { computeConsolidated } from '../../lib/pricing';
import { brl, monthKey, addMonths } from '../../lib/util';

const RESOURCES = [
  { icon: 'GraduationCap', title: 'Trilha de treinamento', text: 'Vídeos de implantação: canais, equipes, chatbot e CRM', tag: '12 aulas' },
  { icon: 'Presentation', title: 'Apresentação comercial', text: 'Deck editável com sua marca para apresentar a clientes', tag: 'PPTX' },
  { icon: 'FileText', title: 'Contrato modelo', text: 'Minuta de contrato de licenciamento SaaS', tag: 'DOCX' },
  { icon: 'Calculator', title: 'Calculadora de proposta', text: 'Monte propostas com a tabela de preços atual', tag: 'Online', to: '/admin/planos' },
  { icon: 'BookOpen', title: 'Base de conhecimento', text: 'Artigos para o seu suporte de primeiro nível', tag: '84 artigos' },
  { icon: 'Image', title: 'Kit de marketing', text: 'Posts, banners e textos para redes sociais', tag: 'ZIP' },
];

export default function PartnerPortal() {
  const st = useStore();
  const nav = useNavigate();
  const { partner, accounts, qrInstances, pricing, infraCost } = st.admin;
  const prev = addMonths(monthKey(Date.now()), -1);
  const cons = useMemo(() => computeConsolidated(prev, accounts, qrInstances, partner, pricing, infraCost), [prev, accounts, qrInstances, partner, pricing, infraCost]);
  const active = accounts.filter((a) => a.status === 'Ativa' || a.status === 'Trial').length;
  const level = active >= 20 ? 'Ouro' : active >= 10 ? 'Prata' : 'Bronze';
  return (
    <Page title="Portal de parceiros" subtitle={partner.name}>
      <div className="rounded-2xl bg-gradient-to-r from-brand-700 to-emerald-500 text-white p-6 mb-5 flex flex-wrap items-center gap-6">
        <div className="flex-1 min-w-[240px]"><Badge tone="dark" className="!bg-white/20">Parceiro {level}</Badge><h2 className="text-2xl font-bold mt-2">Olá! Sua operação está crescendo 🚀</h2><p className="text-brand-50/90 text-sm mt-1">Faltam {Math.max(0, (level === 'Bronze' ? 10 : 20) - active)} contas ativas para o próximo nível, que traz desconto maior na tabela.</p></div>
        <Btn className="!bg-white !text-brand-700 !border-0" icon="FileSpreadsheet" onClick={() => nav('/admin/faturamento')}>Ver faturamento</Btn>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <Stat label="Contas ativas" value={active} icon="Building" tone="brand" />
        <Stat label="Fatura do mês anterior" value={brl(cons.total)} icon="Receipt" tone="blue" />
        <Stat label="Usuários na base" value={cons.users} icon="Users" tone="violet" />
        <Stat label="Nível" value={level} icon="Medal" tone="amber" />
      </div>
      <h2 className="font-semibold mb-3">Materiais e ferramentas</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        {RESOURCES.map((r) => (
          <button key={r.title} onClick={() => (r.to ? nav(r.to) : st.toast('Material disponível na versão final'))} className="text-left bg-white rounded-xl border border-slate-200 shadow-card p-4 hover:shadow-md transition flex gap-3">
            <span className="h-10 w-10 rounded-lg bg-brand-50 text-brand-700 grid place-items-center shrink-0"><Icon name={r.icon} size={20} /></span>
            <span className="flex-1"><span className="flex items-center gap-2"><b className="text-sm">{r.title}</b><Badge>{r.tag}</Badge></span><span className="block text-xs text-slate-500 mt-1">{r.text}</span></span>
          </button>
        ))}
      </div>
      <Card title="Suporte ao parceiro" icon="LifeBuoy">
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">E-mail</p><p className="font-medium">{st.admin.platform.supportEmail}</p></div>
          <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">WhatsApp</p><p className="font-medium">{st.admin.platform.supportWhatsapp}</p></div>
          <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">SLA de resposta</p><p className="font-medium">até 4h úteis</p></div>
        </div>
      </Card>
    </Page>
  );
}
