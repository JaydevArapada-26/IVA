import React, { useEffect, useMemo, useState } from 'react';
import { ThemeColors } from 'shared/constants/theme';
import type { AdminUserProfileDto, AdminUserRecordDto } from 'shared/contracts';
import { ALL_INDIAN_STATES_AND_UTS } from 'shared/constants/indiaLocationData';
import { api } from '../lib/api';

interface AdminUsersProps {
  theme: ThemeColors;
}

const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const GENDER_OPTIONS = ['male', 'female', 'transgender', 'other', 'prefer_not_to_say'];
const INCOME_OPTIONS = ['lt_1_lakh', '1_to_25_lakh', '25_to_5_lakh', '5_to_8_lakh', 'gt_8_lakh'];
const OCCUPATION_OPTIONS = ['farmer', 'laborer', 'student', 'self_employed', 'unemployed', 'private_sector', 'government_sector', 'homemaker'];
const CATEGORY_OPTIONS = ['general', 'obc', 'sc', 'st', 'ews'];
const STATUS_OPTIONS = ['active', 'inactive', 'suspended'];

function rowMatchesSearch(user: AdminUserRecordDto, query: string): boolean {
  if (!query) return true;
  const haystack = [
    user.id,
    user.authUserId,
    user.phoneNumber,
    user.email,
    user.displayName,
    user.status,
    user.profileStatus,
    user.lastSignInAt,
    user.createdAt,
    user.updatedAt,
    user.rememberMeEnabled ? 'remember me' : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ theme }) => {
  const [users, setUsers] = useState<readonly AdminUserRecordDto[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [editingUser, setEditingUser] = useState<AdminUserRecordDto | null>(null);
  const [editForm, setEditForm] = useState<{ displayName: string; email: string; status: string; profile: AdminUserProfileDto }>({
    displayName: '',
    email: '',
    status: 'active',
    profile: {},
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadUsers = () => {
    let cancelled = false;
    api.admin
      .users()
      .then((data) => {
        if (!cancelled) {
          setUsers(data);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  };

  useEffect(() => loadUsers(), []);

  // The "Send SMS" lock is server-derived (AdminUserRecordDto.lastAdminSms), so it survives
  // reloads and tab switches — this just keeps it fresh while a send is actually in flight,
  // without the admin having to manually refresh to see it unlock.
  const hasPendingSms = useMemo(
    () => users.some((u) => u.lastAdminSms?.status === 'queued' || u.lastAdminSms?.status === 'sending'),
    [users],
  );
  useEffect(() => {
    if (!hasPendingSms) return;
    const interval = setInterval(() => loadUsers(), 4000);
    return () => clearInterval(interval);
  }, [hasPendingSms]);

  // Drives the "Sent: [Scheme]" auto-hide below. Ticking off the real clock (rather than a timer
  // started at component mount) means a completed send from minutes ago never flashes back into
  // view just because the admin reloaded the page or logged back in.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredUsers = useMemo(() => users.filter((u) => rowMatchesSearch(u, searchQuery)), [users, searchQuery]);

  const allFilteredSelected = filteredUsers.length > 0 && filteredUsers.every((u) => selectedIds.has(u.id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (allFilteredSelected) {
        const next = new Set(prev);
        filteredUsers.forEach((u) => next.delete(u.id));
        return next;
      }
      const next = new Set(prev);
      filteredUsers.forEach((u) => next.add(u.id));
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

  const openEdit = (user: AdminUserRecordDto) => {
    setEditingUser(user);
    setEditForm({
      displayName: user.displayName ?? '',
      email: user.email ?? '',
      status: user.status,
      profile: {},
    });
    setFormError(null);
  };

  const closeEdit = () => setEditingUser(null);

  const handleSave = async () => {
    if (!editingUser) return;
    setSaving(true);
    setFormError(null);
    try {
      const hasProfileEdits = Object.values(editForm.profile).some((v) => v !== undefined && v !== '');
      await api.admin.updateUser(editingUser.id, {
        displayName: editForm.displayName,
        email: editForm.email,
        status: editForm.status,
        ...(hasProfileEdits ? { profile: editForm.profile } : {}),
      });
      closeEdit();
      loadUsers();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('This permanently deletes this citizen row from the database. This cannot be undone. Continue?')) return;
    setBusyId(userId);
    try {
      await api.admin.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    } catch {
      // no-op — row stays visible so the admin can retry
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleStatus = async (user: AdminUserRecordDto) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    setBusyId(user.id);
    try {
      await api.admin.setUserStatus(user.id, { status: nextStatus });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)));
    } catch {
      // no-op
    } finally {
      setBusyId(null);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!window.confirm(`This permanently deletes ${ids.length} citizen row(s) from the database. This cannot be undone. Continue?`)) return;
    setBulkBusy(true);
    try {
      await api.admin.bulkDeleteUsers({ ids });
      setUsers((prev) => prev.filter((u) => !selectedIds.has(u.id)));
      setSelectedIds(new Set());
    } catch {
      // no-op
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkStatus = async (nextStatus: 'active' | 'suspended') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      await api.admin.bulkSetUserStatus({ ids, status: nextStatus });
      setUsers((prev) => prev.map((u) => (selectedIds.has(u.id) ? { ...u, status: nextStatus } : u)));
    } catch {
      // no-op
    } finally {
      setBulkBusy(false);
    }
  };

  const handleSendSms = async (userId: string) => {
    setBusyId(userId);
    try {
      // Enqueues and returns immediately — the actual send happens in the background, so this
      // just refreshes the table to pick up the new "queued" lock from lastAdminSms.
      await api.admin.sendSms(userId);
      loadUsers();
    } catch {
      // no-op — the table still reflects whatever the server's actual state is
    } finally {
      setBusyId(null);
    }
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: theme.background,
    color: theme.textBody,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    padding: '8px 10px',
    fontSize: '13px',
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '900', color: theme.textHeading, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UsersIcon /> Citizen User Management & Support
        </h2>
        <p style={{ fontSize: '14px', color: theme.textMuted, margin: 0 }}>
          Direct control of the users table — edits, status changes, and deletes apply immediately to the database
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
            placeholder="Search any column — name, phone, email, status…"
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
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: theme.textMuted }}>{selectedIds.size} selected</span>
            <button
              onClick={() => handleBulkStatus('active')}
              disabled={bulkBusy}
              style={{ backgroundColor: theme.surfaceSubtle, color: theme.success, border: `1px solid ${theme.border}`, padding: '8px 14px', borderRadius: '10px', fontWeight: 700, fontSize: '12.5px', cursor: bulkBusy ? 'default' : 'pointer' }}
            >
              Enable Selected
            </button>
            <button
              onClick={() => handleBulkStatus('suspended')}
              disabled={bulkBusy}
              style={{ backgroundColor: theme.surfaceSubtle, color: theme.alertWarning, border: `1px solid ${theme.border}`, padding: '8px 14px', borderRadius: '10px', fontWeight: 700, fontSize: '12.5px', cursor: bulkBusy ? 'default' : 'pointer' }}
            >
              Disable Selected
            </button>
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

      {status === 'loading' && <div style={{ color: theme.textMuted, padding: '16px' }}>Loading users…</div>}
      {status === 'error' && <div style={{ color: theme.alertUrgent, padding: '16px' }}>Could not load users right now.</div>}

      {status === 'ready' && (
        <div style={{ backgroundColor: theme.surface, borderRadius: '20px', border: `1.5px solid ${theme.border}`, overflow: 'hidden' }}>
          {filteredUsers.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: theme.textMuted }}>
              {users.length === 0 ? 'No registered citizens yet.' : 'No users match your search.'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ backgroundColor: theme.surfaceSubtle, borderBottom: `1.5px solid ${theme.border}`, color: theme.textHeading }}>
                    <th style={{ padding: '14px 12px', width: '36px' }}>
                      <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} />
                    </th>
                    <th style={{ padding: '14px 16px', fontWeight: '800' }}>Citizen Name & Phone</th>
                    <th style={{ padding: '14px 16px', fontWeight: '800' }}>Email</th>
                    <th style={{ padding: '14px 16px', fontWeight: '800' }}>Profile Status</th>
                    <th style={{ padding: '14px 16px', fontWeight: '800' }}>Remember Me</th>
                    <th style={{ padding: '14px 16px', fontWeight: '800' }}>Registered</th>
                    <th style={{ padding: '14px 16px', fontWeight: '800' }}>Last Sign-In</th>
                    <th style={{ padding: '14px 16px', fontWeight: '800' }}>Account Status</th>
                    <th style={{ padding: '14px 16px', fontWeight: '800' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((usr) => {
                    const smsState = usr.lastAdminSms;
                    const smsLocked = smsState?.status === 'queued' || smsState?.status === 'sending';
                    const isActive = usr.status === 'active';
                    // "Sent" is informational and low-urgency — auto-hide it 5 real seconds after
                    // completion. "Failed" stays visible (the admin needs to know and can retry);
                    // queued/sending stay visible for as long as they're actually in flight.
                    const sentRecently = smsState?.status === 'sent' && nowMs - new Date(smsState.completedAt).getTime() < 5000;
                    const showSmsStatus = Boolean(smsState) && (smsLocked || smsState?.status === 'failed' || sentRecently);
                    return (
                      <tr key={usr.id} style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textBody }}>
                        <td style={{ padding: '14px 12px' }}>
                          <input type="checkbox" checked={selectedIds.has(usr.id)} onChange={() => toggleSelectOne(usr.id)} />
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: '800', color: theme.textHeading }}>{usr.displayName || 'Unnamed'}</div>
                          <div style={{ fontSize: '12px', color: theme.textMuted }}>{usr.phoneNumber}</div>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '12.5px' }}>{usr.email || '—'}</td>
                        <td style={{ padding: '14px 16px', fontWeight: '600' }}>{usr.profileStatus || 'Unknown'}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ backgroundColor: usr.rememberMeEnabled ? '#dcfce7' : theme.surfaceSubtle, color: usr.rememberMeEnabled ? '#166534' : theme.textMuted, padding: '3px 9px', borderRadius: '8px', fontSize: '11px', fontWeight: '800' }}>
                            {usr.rememberMeEnabled ? 'On' : 'Off'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '12.5px', color: theme.textMuted }}>{usr.createdAt}</td>
                        <td style={{ padding: '14px 16px', fontSize: '12.5px', color: theme.textMuted }}>{usr.lastSignInAt || '—'}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <button
                            onClick={() => handleToggleStatus(usr)}
                            disabled={busyId === usr.id}
                            style={{
                              backgroundColor: isActive ? '#dcfce7' : '#fee2e2',
                              color: isActive ? '#166534' : '#991b1b',
                              border: 'none',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '800',
                              cursor: busyId === usr.id ? 'default' : 'pointer',
                            }}
                            title="Click to toggle enable/disable"
                          >
                            {usr.status}
                          </button>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => openEdit(usr)}
                              style={{ backgroundColor: theme.surfaceSubtle, color: theme.textHeading, border: `1px solid ${theme.border}`, padding: '6px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(usr.id)}
                              disabled={busyId === usr.id}
                              style={{ backgroundColor: 'transparent', color: theme.alertUrgent, border: `1px solid ${theme.alertUrgent}`, padding: '6px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: busyId === usr.id ? 'default' : 'pointer', opacity: busyId === usr.id ? 0.6 : 1 }}
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => handleSendSms(usr.id)}
                              disabled={busyId === usr.id || smsLocked}
                              style={{
                                backgroundColor: theme.primary,
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontWeight: '700',
                                fontSize: '12px',
                                cursor: busyId === usr.id || smsLocked ? 'default' : 'pointer',
                                opacity: busyId === usr.id || smsLocked ? 0.7 : 1,
                              }}
                            >
                              {busyId === usr.id ? 'Working…' : smsState?.status === 'queued' ? 'Queued…' : smsState?.status === 'sending' ? 'Sending…' : 'Send SMS'}
                            </button>
                          </div>
                          {showSmsStatus && smsState && (
                            <div style={{ marginTop: '6px', fontSize: '12px', fontWeight: 700, color: smsState.status === 'sent' ? theme.success : theme.textMuted, maxWidth: '260px' }}>
                              {smsState.status === 'sent'
                                ? `Sent: ${smsState.schemeName ?? 'best-match scheme'}`
                                : smsState.status === 'failed'
                                  ? (smsState.failureReason ?? 'Not sent.')
                                  : smsState.status === 'queued'
                                    ? 'Queued…'
                                    : smsState.status === 'sending'
                                      ? 'Sending…'
                                      : smsState.status}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {editingUser && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto', zIndex: 100 }}
          onClick={closeEdit}
        >
          <div
            style={{ backgroundColor: theme.surface, borderRadius: '20px', padding: '28px', maxWidth: '560px', width: '100%', border: `1.5px solid ${theme.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: theme.textHeading, margin: '0 0 16px 0' }}>
              Edit Citizen — {editingUser.phoneNumber}
            </h3>
            {formError && <div style={{ color: theme.alertUrgent, marginBottom: '12px', fontSize: '13px', fontWeight: 700 }}>{formError}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: theme.textMuted }}>
                Display Name
                <input value={editForm.displayName} onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))} style={selectStyle} />
              </label>
              <label style={{ fontSize: '12px', fontWeight: 700, color: theme.textMuted }}>
                Email
                <input value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} style={selectStyle} />
              </label>
              <label style={{ fontSize: '12px', fontWeight: 700, color: theme.textMuted }}>
                Account Status
                <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))} style={selectStyle}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '12px', fontSize: '12px', fontWeight: 800, color: theme.textHeading }}>
                Profile fields (leave blank to keep unchanged)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: theme.textMuted }}>
                  State
                  <select
                    value={editForm.profile.state ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, profile: { ...f.profile, state: e.target.value || undefined } }))}
                    style={selectStyle}
                  >
                    <option value="">—</option>
                    {ALL_INDIAN_STATES_AND_UTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ fontSize: '12px', fontWeight: 700, color: theme.textMuted }}>
                  Gender
                  <select
                    value={editForm.profile.gender ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, profile: { ...f.profile, gender: (e.target.value || undefined) as never } }))}
                    style={selectStyle}
                  >
                    <option value="">—</option>
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ fontSize: '12px', fontWeight: 700, color: theme.textMuted }}>
                  Income Range
                  <select
                    value={editForm.profile.incomeRange ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, profile: { ...f.profile, incomeRange: (e.target.value || undefined) as never } }))}
                    style={selectStyle}
                  >
                    <option value="">—</option>
                    {INCOME_OPTIONS.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ fontSize: '12px', fontWeight: 700, color: theme.textMuted }}>
                  Occupation
                  <select
                    value={editForm.profile.occupation ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, profile: { ...f.profile, occupation: (e.target.value || undefined) as never } }))}
                    style={selectStyle}
                  >
                    <option value="">—</option>
                    {OCCUPATION_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ fontSize: '12px', fontWeight: 700, color: theme.textMuted }}>
                  Category
                  <select
                    value={editForm.profile.category ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, profile: { ...f.profile, category: (e.target.value || undefined) as never } }))}
                    style={selectStyle}
                  >
                    <option value="">—</option>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {(['studentStatus', 'farmerStatus', 'seniorCitizenStatus', 'disabilityStatus'] as const).map((flag) => (
                  <label key={flag} style={{ fontSize: '12px', fontWeight: 700, color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="checkbox"
                      checked={editForm.profile[flag] ?? false}
                      onChange={(e) => setEditForm((f) => ({ ...f, profile: { ...f.profile, [flag]: e.target.checked } }))}
                    />
                    {flag}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={closeEdit}
                style={{ backgroundColor: 'transparent', color: theme.textMuted, border: `1px solid ${theme.border}`, padding: '10px 18px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ backgroundColor: theme.primary, color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
