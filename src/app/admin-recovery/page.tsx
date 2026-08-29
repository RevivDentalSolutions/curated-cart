'use client';

import { useState } from 'react';

type RecoveryResult = Record<string, unknown>;

export default function AdminRecoveryPage() {
  const [token, setToken] = useState('');
  const [result, setResult] = useState<RecoveryResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(mode: 'inventory' | 'recovery') {
    setBusy(true);
    try {
      const response = await fetch('/api/admin/recover-legacy-content', {
        method: mode === 'inventory' ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-recovery-token': token },
        body: mode === 'recovery' ? JSON.stringify({ confirm: 'RECOVER_LEGACY_CONTENT' }) : undefined,
      });
      setResult(await response.json());
    } catch {
      setResult({ success: false, error: 'The recovery request could not be completed.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '4rem auto', padding: '0 1.5rem' }}>
      <h1>Legacy Content Recovery</h1>
      <p>This private operational screen is token-protected. Inventory is read-only; recovery only adds missing records and never overwrites existing products or affiliate links.</p>
      <label htmlFor="recovery-token">One-time recovery token</label>
      <input id="recovery-token" value={token} onChange={(event) => setToken(event.target.value)} type="password" style={{ display: 'block', width: '100%', margin: '0.5rem 0 1rem', padding: '0.75rem' }} />
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button type="button" disabled={busy || !token} onClick={() => run('inventory')}>Run read-only inventory</button>
        <button type="button" disabled={busy || !token} onClick={() => run('recovery')}>Recover missing legacy content</button>
      </div>
      {result && <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', marginTop: '1.5rem', padding: '1rem', background: '#f5f5f5' }}>{JSON.stringify(result, null, 2)}</pre>}
    </main>
  );
}
