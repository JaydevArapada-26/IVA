import React, { useEffect, useState } from 'react';
import { ThemeColors } from 'shared/constants/theme';
import type { AdminLanguageDto } from 'shared/contracts';
import { api } from '../lib/api';

interface AdminLanguagesProps {
  theme: ThemeColors;
}

const GlobeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const emptyForm = { code: '', name: '', nativeName: '' };

export const AdminLanguages: React.FC<AdminLanguagesProps> = ({ theme }) => {
  const [rows, setRows] = useState<readonly AdminLanguageDto[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = () => {
    setStatus('loading');
    api.admin
      .languages()
      .then((data) => {
        setRows(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  };

  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.code.trim() || !form.name.trim() || !form.nativeName.trim()) {
      setFormError('Code, name, and native name are all required.');
      return;
    }
    setSaving(true);
    try {
      await api.admin.createLanguage({ code: form.code.trim(), name: form.name.trim(), nativeName: form.nativeName.trim() });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not add this language right now.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row: AdminLanguageDto) => {
    await api.admin.updateLanguage(row.id, { isActive: !row.isActive });
    load();
  };

  const handleDelete = async (row: AdminLanguageDto) => {
    if (!confirm(`Remove "${row.name}" from the supported languages?`)) return;
    await api.admin.deleteLanguage(row.id);
    load();
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1300px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '900', color: theme.textHeading, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GlobeIcon /> Language Management
          </h2>
          <p style={{ fontSize: '14px', color: theme.textMuted, margin: 0 }}>
            Add or remove languages available to citizens across the platform
          </p>
        </div>

        <button
          onClick={() => { setShowForm((s) => !s); setFormError(null); }}
          style={{
            backgroundColor: theme.primary,
            color: '#ffffff',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '12px',
            fontWeight: '800',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <PlusIcon /> Add Language
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          style={{
            backgroundColor: theme.surface,
            borderRadius: '20px',
            padding: '20px',
            border: `1.5px solid ${theme.border}`,
            marginBottom: '24px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr auto',
            gap: '12px',
            alignItems: 'end',
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: theme.textHeading, marginBottom: '6px' }}>Code (e.g. kn)</label>
            <input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              maxLength={5}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1.5px solid ${theme.border}`, backgroundColor: theme.background, color: theme.textHeading, boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: theme.textHeading, marginBottom: '6px' }}>English Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1.5px solid ${theme.border}`, backgroundColor: theme.background, color: theme.textHeading, boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: theme.textHeading, marginBottom: '6px' }}>Native Name</label>
            <input
              value={form.nativeName}
              onChange={(e) => setForm((f) => ({ ...f, nativeName: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1.5px solid ${theme.border}`, backgroundColor: theme.background, color: theme.textHeading, boxSizing: 'border-box' }}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            style={{
              backgroundColor: theme.primary,
              color: '#ffffff',
              border: 'none',
              padding: '11px 20px',
              borderRadius: '10px',
              fontWeight: '800',
              fontSize: '13px',
              cursor: saving ? 'default' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          {formError && (
            <div style={{ gridColumn: '1 / -1', color: theme.alertUrgent, fontSize: '13px', fontWeight: '600' }}>{formError}</div>
          )}
        </form>
      )}

      {status === 'loading' && <div style={{ color: theme.textMuted, padding: '16px' }}>Loading languages…</div>}
      {status === 'error' && <div style={{ color: theme.alertUrgent, padding: '16px' }}>Could not load languages right now.</div>}

      {status === 'ready' && (
        <div style={{ backgroundColor: theme.surface, borderRadius: '20px', border: `1.5px solid ${theme.border}`, overflow: 'hidden' }}>
          {rows.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: theme.textMuted }}>No languages configured yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: theme.surfaceSubtle, borderBottom: `1.5px solid ${theme.border}`, color: theme.textHeading }}>
                  <th style={{ padding: '14px 20px', fontWeight: '800' }}>Code</th>
                  <th style={{ padding: '14px 20px', fontWeight: '800' }}>English Name</th>
                  <th style={{ padding: '14px 20px', fontWeight: '800' }}>Native Name</th>
                  <th style={{ padding: '14px 20px', fontWeight: '800' }}>Status</th>
                  <th style={{ padding: '14px 20px', fontWeight: '800' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textBody }}>
                    <td style={{ padding: '14px 20px', fontWeight: '800', color: theme.textHeading }}>{row.code.toUpperCase()}</td>
                    <td style={{ padding: '14px 20px' }}>{row.name}</td>
                    <td style={{ padding: '14px 20px' }}>{row.nativeName}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <button
                        onClick={() => toggleActive(row)}
                        style={{
                          backgroundColor: row.isActive ? '#dcfce7' : '#fee2e2',
                          color: row.isActive ? '#166534' : '#991b1b',
                          border: 'none',
                          padding: '5px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: 'pointer',
                        }}
                      >
                        {row.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <button
                        onClick={() => handleDelete(row)}
                        title="Remove language"
                        style={{
                          backgroundColor: 'transparent',
                          border: `1px solid ${theme.alertUrgent}`,
                          color: theme.alertUrgent,
                          padding: '6px 10px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
