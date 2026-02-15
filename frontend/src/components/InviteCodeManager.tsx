import { useEffect, useState } from 'react';
import type { InviteCode } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

const styles = {
  panel: {
    background: '#1a1a3e',
    border: '1px solid #2a2a5a',
    borderRadius: '12px',
    padding: '24px',
    width: '100%',
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#c0c0ff',
    marginBottom: '16px',
  },
  createRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    alignItems: 'flex-end',
    flexWrap: 'wrap' as const,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  label: {
    fontSize: '11px',
    color: '#6a6a9a',
  },
  input: {
    padding: '8px 12px',
    background: '#0f0f23',
    border: '1px solid #3a3a6a',
    borderRadius: '6px',
    color: '#e0e0e0',
    fontSize: '13px',
    width: '120px',
  },
  btn: {
    padding: '8px 16px',
    background: '#4a4aff',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '13px',
  },
  th: {
    textAlign: 'left' as const,
    padding: '8px 12px',
    color: '#6a6a9a',
    borderBottom: '1px solid #2a2a5a',
    fontWeight: 500,
  },
  td: {
    padding: '8px 12px',
    color: '#c0c0e0',
    borderBottom: '1px solid #1a1a3a',
  },
  code: {
    fontFamily: 'monospace',
    fontWeight: 600,
    letterSpacing: '1px',
    color: '#7c8aff',
  },
  active: {
    color: '#44ff88',
    fontWeight: 600,
    fontSize: '12px',
  },
  inactive: {
    color: '#ff6b6b',
    fontWeight: 600,
    fontSize: '12px',
  },
  deactivateBtn: {
    padding: '4px 10px',
    background: 'transparent',
    border: '1px solid #ff4444',
    borderRadius: '4px',
    color: '#ff6b6b',
    fontSize: '11px',
    cursor: 'pointer',
  },
  empty: {
    color: '#6a6a9a',
    fontSize: '13px',
    textAlign: 'center' as const,
    padding: '20px 0',
  },
  error: {
    color: '#ff6b6b',
    fontSize: '13px',
    marginBottom: '8px',
  },
};

export function InviteCodeManager() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [maxUses, setMaxUses] = useState('');
  const [expiresIn, setExpiresIn] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCodes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/invite-codes`, {
        credentials: 'include',
      });
      if (res.ok) {
        setCodes(await res.json());
      }
    } catch (_) {
      // silent
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {};
      if (maxUses.trim()) body.max_uses = parseInt(maxUses, 10);
      if (expiresIn.trim()) {
        const hours = parseInt(expiresIn, 10);
        body.expires_at = new Date(Date.now() + hours * 3600000).toISOString();
      }
      const res = await fetch(`${API_BASE}/api/admin/invite-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to create invite code');
      }
      setMaxUses('');
      setExpiresIn('');
      await fetchCodes();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  const handleDeactivate = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/invite-codes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        await fetchCodes();
      }
    } catch (_) {
      // silent
    }
  };

  const formatExpiry = (iso: string | null) => {
    if (!iso) return 'Never';
    const d = new Date(iso);
    if (d < new Date()) return 'Expired';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={styles.panel}>
      <h4 style={styles.title}>Invite Codes</h4>

      <div style={styles.createRow}>
        <div style={styles.fieldGroup}>
          <span style={styles.label}>Max Uses (blank = unlimited)</span>
          <input
            style={styles.input}
            placeholder="e.g. 10"
            value={maxUses}
            onChange={e => setMaxUses(e.target.value.replace(/\D/g, ''))}
          />
        </div>
        <div style={styles.fieldGroup}>
          <span style={styles.label}>Expires In (hours, blank = never)</span>
          <input
            style={styles.input}
            placeholder="e.g. 48"
            value={expiresIn}
            onChange={e => setExpiresIn(e.target.value.replace(/\D/g, ''))}
          />
        </div>
        <button style={styles.btn} onClick={handleCreate} disabled={loading}>
          {loading ? 'Creating...' : 'Create Code'}
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {codes.length === 0 ? (
        <p style={styles.empty}>No invite codes yet.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Code</th>
              <th style={styles.th}>Uses</th>
              <th style={styles.th}>Expires</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {codes.map(c => (
              <tr key={c.id}>
                <td style={{ ...styles.td, ...styles.code }}>{c.code}</td>
                <td style={styles.td}>
                  {c.use_count}{c.max_uses !== null ? ` / ${c.max_uses}` : ''}
                </td>
                <td style={styles.td}>{formatExpiry(c.expires_at)}</td>
                <td style={styles.td}>
                  <span style={c.is_active ? styles.active : styles.inactive}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={styles.td}>
                  {c.is_active && (
                    <button style={styles.deactivateBtn} onClick={() => handleDeactivate(c.id)}>
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
