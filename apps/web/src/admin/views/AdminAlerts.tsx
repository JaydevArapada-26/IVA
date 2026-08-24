import React, { useEffect, useMemo, useState } from 'react';
import { ThemeColors } from 'shared/constants/theme';
import type { AdminSmsRecordDto } from 'shared/contracts';
import { api } from '../../lib/api';

interface AdminAlertsProps {
  theme: ThemeColors;
}

const BellIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

function rowMatchesSearch(item: AdminSmsRecordDto, query: string): boolean {
  if (!query) return true;
  const haystack = [
    item.id,
    item.phoneNumber,
    item.schemeTitle,
    item.messageBody,
    item.status,
    item.notificationType,
    item.failureReason,
    item.sentAt,
    item.createdAt,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export const AdminAlerts: React.FC<AdminAlertsProps> = ({ theme }) => {
  const [smsItems, setSmsItems] = useState<readonly AdminSmsRecordDto[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setStatus('loading');
    api.admin
      .smsQueue()
      .then((data) => {
        setSmsItems(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  };

  useEffect(load, []);

  const filtered = useMemo(() => smsItems.filter((i) => rowMatchesSearch(i, searchQuery)), [smsItems, searchQuery]);
  const allFilteredSelected = filtered.length > 0 && filtered.every((i) => selectedIds.has(i.id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filtered.forEach((i) => next.delete(i.id));
      else filtered.forEach((i) => next.add(i.id));
      return next;
    });
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('This permanently deletes this SMS log entry from the database. This cannot be undone. Continue?')) return;
    setBusyId(id);
    try {
      await api.admin.deleteSmsLog(id);
      setSmsItems((prev) => prev.filter((i) => i.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch {
      // no-op
    } finally {
      setBusyId(null);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!window.confirm(`This permanently deletes ${ids.length} SMS log entr${ids.length === 1 ? 'y' : 'ies'} from the database. This cannot be undone. Continue?`)) return;
    setBulkBusy(true);
    try {
      await api.admin.bulkDeleteSmsLogs({ ids });
      setSmsItems((prev) => prev.filter((i) => !selectedIds.has(i.id)));
      setSelectedIds(new Set());
    } catch {
      // no-op
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '900', color: theme.textHeading, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BellIcon /> SMS Logs
        </h2>
        <p style={{ fontSize: '14px', color: theme.textMuted, margin: 0 }}>
          Every SMS notification sent by IVA — scheme alerts, deadline reminders, and admin-triggered sends
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: theme.textMuted }}>
            <SearchIcon />
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any column — phone, scheme, message, status…"
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              borderRadius: '12px',
              border: `1.5px solid ${theme.border}`,
              backgroundColor: theme.surface,
              color: theme.textHeading,
              fontSize: '13.5px',
              boxSizing: 'border-box',
            }}
          />
        </div>
        {selectedIds.size > 0 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: theme.textMuted }}>{selectedIds.size} selected</span>
            <button
              onClick={handleBulkDelete}
              disabled={bulkBusy}
              style={{ backgroundColor: 'transparent', color: theme.alertUrgent, border: `1px solid ${theme.alertUrgent}`, padding: '8px 14px', borderRadius: '10px', fontWeight: 700, fontSize: '12.5px', cursor: bulkBusy ? 'default' : 'pointer' }}
            >
              {bulkBusy ? 'Working…' : 'Delete Selected'}
            </button>
          </div>
        )}
      </div>

      {status === 'loading' && <div style={{ color: theme.textMuted, padding: '16px' }}>Loading SMS logs…</div>}
      {status === 'error' && <div style={{ color: theme.alertUrgent, padding: '16px' }}>Could not load SMS logs right now.</div>}

      {status === 'ready' && (
        <div style={{ backgroundColor: theme.surface, borderRadius: '20px', border: `1.5px solid ${theme.border}`, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: theme.textMuted }}>
              {smsItems.length === 0 ? 'No SMS messages sent yet.' : 'No entries match your search.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: theme.surfaceSubtle, borderBottom: `1.5px solid ${theme.border}`, color: theme.textHeading }}>
                  <th style={{ padding: '16px 12px', width: '36px' }}>
                    <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} />
                  </th>
                  <th style={{ padding: '16px 20px', fontWeight: '800' }}>Recipient & Scheme</th>
                  <th style={{ padding: '16px 20px', fontWeight: '800' }}>Type</th>
                  <th style={{ padding: '16px 20px', fontWeight: '800' }}>Message Body</th>
                  <th style={{ padding: '16px 20px', fontWeight: '800' }}>Sent</th>
                  <th style={{ padding: '16px 20px', fontWeight: '800' }}>Status</th>
                  <th style={{ padding: '16px 20px', fontWeight: '800' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textBody }}>
                    <td style={{ padding: '16px 12px' }}>
                      <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelectOne(item.id)} />
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: '800', color: theme.textHeading }}>{item.phoneNumber || '—'}</div>
                      <div style={{ fontSize: '12px', color: theme.textMuted }}>{item.schemeTitle || '—'}</div>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '12px', color: theme.textMuted }}>
                      {item.notificationType.replace(/_/g, ' ')}
                    </td>
                    <td style={{ padding: '16px 20px', maxWidth: '340px', lineHeight: '1.4', fontSize: '12.5px' }}>
                      {item.messageBody.length > 140 ? `${item.messageBody.slice(0, 140)}…` : item.messageBody}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: theme.textMuted }}>
                      {item.sentAt || '—'}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ backgroundColor: item.status === 'sent' || item.status === 'delivered' ? '#dcfce7' : item.status === 'failed' ? '#fee2e2' : '#fef3c7', color: item.status === 'sent' || item.status === 'delivered' ? '#166534' : item.status === 'failed' ? '#991b1b' : '#92400e', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800' }}>
                        {item.status}
                      </span>
                      {item.failureReason && (
                        <div style={{ fontSize: '11px', color: theme.alertUrgent, marginTop: '4px', maxWidth: '200px' }}>{item.failureReason}</div>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={busyId === item.id}
                        style={{ backgroundColor: 'transparent', color: theme.alertUrgent, border: `1px solid ${theme.alertUrgent}`, padding: '6px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: busyId === item.id ? 'default' : 'pointer' }}
                      >
                        Delete
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
