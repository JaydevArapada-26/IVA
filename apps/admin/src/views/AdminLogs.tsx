import React, { useEffect, useMemo, useState } from 'react';
import { ThemeColors } from 'shared/constants/theme';
import type { AdminLogEntryDto } from 'shared/contracts';
import { api } from '../lib/api';

interface AdminLogsProps {
  theme: ThemeColors;
}

const ScrollIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

function rowMatchesSearch(log: AdminLogEntryDto, query: string): boolean {
  if (!query) return true;
  const haystack = [log.id, log.actorType, log.actorLabel, log.action, log.entityType, log.entityId, log.reason, log.occurredAt]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export const AdminLogs: React.FC<AdminLogsProps> = ({ theme }) => {
  const [logs, setLogs] = useState<readonly AdminLogEntryDto[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setStatus('loading');
    api.admin
      .logs()
      .then((data) => {
        setLogs(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  };

  useEffect(load, []);

  const filtered = useMemo(() => logs.filter((l) => rowMatchesSearch(l, searchQuery)), [logs, searchQuery]);
  const allFilteredSelected = filtered.length > 0 && filtered.every((l) => selectedIds.has(l.id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filtered.forEach((l) => next.delete(l.id));
      else filtered.forEach((l) => next.add(l.id));
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
    if (!window.confirm('This permanently deletes this audit log entry from the database. This cannot be undone. Continue?')) return;
    setBusyId(id);
    try {
      await api.admin.deleteLog(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
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
    if (!window.confirm(`This permanently deletes ${ids.length} audit log entr${ids.length === 1 ? 'y' : 'ies'} from the database. This cannot be undone. Continue?`)) return;
    setBulkBusy(true);
    try {
      await api.admin.bulkDeleteLogs({ ids });
      setLogs((prev) => prev.filter((l) => !selectedIds.has(l.id)));
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
          <ScrollIcon /> System & Security Audit Logs
        </h2>
        <p style={{ fontSize: '14px', color: theme.textMuted, margin: 0 }}>
          Log of administrator actions, data updates, and system events — directly deletable from this table
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
            placeholder="Search any column — actor, action, entity, reason…"
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

      {status === 'loading' && <div style={{ color: theme.textMuted, padding: '16px' }}>Loading logs…</div>}
      {status === 'error' && <div style={{ color: theme.alertUrgent, padding: '16px' }}>Could not load audit logs right now.</div>}

      {status === 'ready' && (
        <div style={{ backgroundColor: theme.surface, borderRadius: '20px', border: `1.5px solid ${theme.border}`, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: theme.textMuted }}>
              {logs.length === 0 ? 'No audit log entries yet.' : 'No entries match your search.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: theme.surfaceSubtle, borderBottom: `1.5px solid ${theme.border}`, color: theme.textHeading }}>
                  <th style={{ padding: '16px 12px', width: '36px' }}>
                    <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} />
                  </th>
                  <th style={{ padding: '16px 20px', fontWeight: '800' }}>Timestamp</th>
                  <th style={{ padding: '16px 20px', fontWeight: '800' }}>Actor</th>
                  <th style={{ padding: '16px 20px', fontWeight: '800' }}>Action</th>
                  <th style={{ padding: '16px 20px', fontWeight: '800' }}>Entity</th>
                  <th style={{ padding: '16px 20px', fontWeight: '800' }}>Reason</th>
                  <th style={{ padding: '16px 20px', fontWeight: '800' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id} style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textBody }}>
                    <td style={{ padding: '16px 12px' }}>
                      <input type="checkbox" checked={selectedIds.has(log.id)} onChange={() => toggleSelectOne(log.id)} />
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', fontFamily: 'monospace', color: theme.textMuted }}>
                      {log.occurredAt}
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: '800', color: theme.textHeading }}>
                      {log.actorLabel}
                      <div style={{ fontSize: '11px', color: theme.textMuted, fontWeight: '600' }}>{log.actorType}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ backgroundColor: theme.surfaceSubtle, color: theme.primary, padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', fontFamily: 'monospace' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', lineHeight: '1.4' }}>
                      {log.entityType}
                      {log.entityId ? ` · ${log.entityId}` : ''}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: theme.textMuted }}>
                      {log.reason || '—'}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <button
                        onClick={() => handleDelete(log.id)}
                        disabled={busyId === log.id}
                        style={{ backgroundColor: 'transparent', color: theme.alertUrgent, border: `1px solid ${theme.alertUrgent}`, padding: '6px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: busyId === log.id ? 'default' : 'pointer' }}
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
