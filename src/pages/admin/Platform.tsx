import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Btn, Card, Field, Input, Page, Toggle } from '../../components/ui';

export default function Platform() {
  const st = useStore();
  const [p, setP] = useState(st.admin.platform);
  const [partner, setPartner] = useState(st.admin.partner);
  return (
    <Page title="Configurações da plataforma" subtitle="Personalização white label: nome, cores, domínio e cadastro" actions={<Btn variant="primary" icon="Save" onClick={() => { st.patch('admin', { ...st.admin, platform: p, partner }); st.toast('Configurações salvas', { tone: 'success' }); }}>Salvar</Btn>}>
      <div className="grid lg:grid-cols-[1fr_360px] gap-5">
        <div className="space-y-5">
          <Card title="Marca" icon="Palette">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Nome da plataforma"><Input value={p.platformName} onChange={(e) => setP({ ...p, platformName: e.target.value })} /></Field>
              <Field label="Cor primária"><div className="flex gap-2"><input type="color" value={p.primaryColor} onChange={(e) => setP({ ...p, primaryColor: e.target.value })} className="h-9 w-12 rounded border border-slate-200" /><Input value={p.primaryColor} onChange={(e) => setP({ ...p, primaryColor: e.target.value })} className="flex-1" /></div></Field>
              <Field label="Logo" className="sm:col-span-2"><div className="flex items-center gap-3"><img src="logo.svg" className="h-12 w-12" alt="" /><Btn size="sm" icon="Upload" onClick={() => st.toast('Upload de logo (protótipo)')}>Trocar logo</Btn></div></Field>
            </div>
          </Card>
          <Card title="Domínio e aplicativo" icon="Globe">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Domínio personalizado" hint="Aponte um CNAME para o servidor da plataforma"><Input value={partner.customDomain ?? ''} onChange={(e) => setPartner({ ...partner, customDomain: e.target.value || null })} /></Field>
              <Field label="Aplicativo móvel"><select className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm" value={partner.app ?? ''} onChange={(e) => setPartner({ ...partner, app: (e.target.value || null) as any })}><option value="">Sem aplicativo</option><option>Genérico</option><option>Personalizado</option></select></Field>
            </div>
          </Card>
          <Card title="Suporte e cadastro" icon="LifeBuoy">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="E-mail de suporte"><Input value={p.supportEmail} onChange={(e) => setP({ ...p, supportEmail: e.target.value })} /></Field>
              <Field label="WhatsApp de suporte"><Input value={p.supportWhatsapp} onChange={(e) => setP({ ...p, supportWhatsapp: e.target.value })} /></Field>
              <Field label="Link dos termos de uso"><Input value={p.termsUrl} onChange={(e) => setP({ ...p, termsUrl: e.target.value })} /></Field>
              <Field label="Dias de teste grátis"><Input type="number" value={p.trialDays} onChange={(e) => setP({ ...p, trialDays: Number(e.target.value) })} /></Field>
            </div>
            <div className="mt-4"><Toggle checked={p.allowSignup} onChange={(v) => setP({ ...p, allowSignup: v })} label="Permitir cadastro self-service" hint='Mostra "Crie uma conta e teste grátis" na tela de login' /></div>
          </Card>
        </div>
        <Card title="Pré-visualização" icon="Eye" className="h-fit">
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="h-10 flex items-center gap-2 px-3 text-white text-sm font-bold" style={{ background: p.primaryColor }}><img src="logo.svg" className="h-6 w-6" alt="" />{p.platformName.toLowerCase()}</div>
            <div className="p-4 space-y-2"><div className="h-3 w-2/3 rounded bg-slate-200" /><div className="h-3 w-1/2 rounded bg-slate-100" /><button className="mt-2 h-8 px-4 rounded-full text-white text-xs font-medium" style={{ background: p.primaryColor }}>Entrar</button></div>
          </div>
          <p className="text-xs text-slate-500 mt-3">Acesso em <b>{partner.customDomain ?? 'domínio padrão'}</b></p>
        </Card>
      </div>
    </Page>
  );
}
