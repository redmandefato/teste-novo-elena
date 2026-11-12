import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Page, Select } from '../../components/ui';
import { UsageView } from '../settings/MessageUsage';
import { hashNoise } from '../../lib/util';

export default function AdminMessageUsage() {
  const st = useStore();
  const [acc, setAcc] = useState('');
  const scale = acc ? 0.05 + hashNoise(acc) * 0.6 : 4.2;
  return (
    <Page title="Consumo de mensagens (todas as contas)" subtitle="Conversas cobradas pela Meta, por conta e categoria — base para repasse de custos" actions={<Select value={acc} onChange={(e) => setAcc(e.target.value)}><option value="">Todas as contas</option>{st.admin.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>}>
      <UsageView key={acc} scale={scale} />
    </Page>
  );
}
