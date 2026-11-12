import { useState } from 'react';
import { useStore } from '../store/useStore';
import { maskPhone } from '../lib/util';
import { Btn, Icon, Input } from '../components/ui';

export default function Login() {
  const login = useStore((s) => s.login);
  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [value, setValue] = useState('');
  const [step, setStep] = useState<'id' | 'code'>('id');
  const [code, setCode] = useState('');

  return (
    <div className="min-h-full grid lg:grid-cols-2 bg-white">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-brand-700 via-brand-600 to-emerald-500 text-white relative overflow-hidden">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10" />
        <div className="absolute -left-10 bottom-10 h-60 w-60 rounded-full bg-white/10" />
        <div className="flex items-center gap-3 relative"><img src="logo.svg" className="h-10 w-10" alt="" /><span className="text-2xl font-extrabold tracking-tight">elena</span></div>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight">Todo o seu atendimento em um só lugar.</h2>
          <p className="mt-4 text-brand-50/90">WhatsApp, Instagram, Messenger e chat do site com distribuição automática, CRM, chatbots e relatórios em tempo real.</p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[['MessagesSquare', 'Multicanal'], ['Bot', 'Chatbots com IA'], ['ChartColumn', 'Indicadores']].map(([i, l]) => (
              <div key={l} className="rounded-xl bg-white/10 backdrop-blur p-3"><Icon name={i} size={20} /><p className="text-xs mt-2 font-medium">{l}</p></div>
            ))}
          </div>
        </div>
        <p className="text-xs text-brand-100/80 relative">Protótipo com dados fictícios · Elena © 2026</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8"><img src="logo.svg" className="h-9 w-9" alt="" /><span className="text-xl font-extrabold">elena</span></div>
          <h1 className="text-3xl font-bold text-slate-900">Bem-vindo!</h1>
          {step === 'id' ? (
            <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); setStep('code'); }}>
              <p className="text-sm text-slate-500">Informe seu {mode === 'phone' ? 'telefone' : 'e-mail'} para entrar:</p>
              {mode === 'phone'
                ? <Input icon="Phone" placeholder="(00) 00000-0000" value={value} onChange={(e) => setValue(maskPhone(e.target.value))} autoFocus />
                : <Input icon="Mail" type="email" placeholder="voce@empresa.com.br" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />}
              <button type="button" className="text-sm text-brand-700 font-medium hover:underline" onClick={() => { setMode(mode === 'phone' ? 'email' : 'phone'); setValue(''); }}>
                Entrar com {mode === 'phone' ? 'e-mail' : 'telefone'}
              </button>
              <Btn variant="primary" size="lg" className="w-full rounded-full" type="submit">Entrar</Btn>
            </form>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); login(); }}>
              <p className="text-sm text-slate-500">Enviamos um código de 6 dígitos para <b className="text-slate-700">{value || 'seu contato'}</b>.</p>
              <Input icon="KeyRound" placeholder="000000" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} autoFocus />
              <p className="text-xs text-slate-400">Protótipo: qualquer código funciona.</p>
              <Btn variant="primary" size="lg" className="w-full rounded-full" type="submit">Confirmar e entrar</Btn>
              <button type="button" className="text-sm text-slate-500 hover:underline" onClick={() => setStep('id')}>Voltar</button>
            </form>
          )}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <Btn variant="soft" icon="Sparkles" className="w-full" onClick={() => login()}>Entrar direto com a conta demonstração</Btn>
          </div>
          <p className="mt-8 text-center text-sm text-slate-500">É novo por aqui? <a className="text-brand-700 font-medium hover:underline" href="#" onClick={(e) => { e.preventDefault(); login(); }}>Crie uma conta e teste grátis</a></p>
        </div>
      </div>
    </div>
  );
}
