import React, { useEffect, useMemo, useState } from 'react';
import { ThemeColors } from 'shared/constants/theme';
import type { AdminSchemeDetailDto, AdminSchemeRecordDto, AdminSchemeUpsertRequest } from 'shared/contracts';
import { api } from '../lib/api';

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

function rowMatchesSearch(scheme: AdminSchemeRecordDto, query: string): boolean {
  if (!query) return true;
  const haystack = [scheme.id, scheme.title, scheme.slug, scheme.department, scheme.category, scheme.publicationStatus, scheme.officialUrl, scheme.updatedAt]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

interface AdminSchemesProps {
  theme: ThemeColors;
}

const FileTextIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const EMPTY_FORM: AdminSchemeUpsertRequest = {
  slug: '',
  schemeName: '',
  briefDescription: '',
  detailedDescription: '',
  sourceUrl: '',
  dbtScheme: false,
  publicationStatus: 'draft',
  isUrgent: false,
  isVerified: false,
};

function textField(
  theme: ThemeColors,
  label: string,
  value: string,
  onChange: (v: string) => void,
  multiline = false,
) {
  const commonStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: theme.background,
    color: theme.textBody,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    padding: '8px 10px',
    fontSize: '13px',
    boxSizing: 'border-box',
  };
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700, color: theme.textMuted }}>
      {label}
      {multiline ? (
        <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} style={{ ...commonStyle, resize: 'vertical' }} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} style={commonStyle} />
      )}
    </label>
  );
}

export const AdminSchemes: React.FC<AdminSchemesProps> = ({ theme }) => {
  const [schemes, setSchemes] = useState<readonly AdminSchemeRecordDto[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [modalMode, setModalMode] = useState<'closed' | 'create' | 'edit'>('closed');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminSchemeUpsertRequest>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadSchemes = () => {
    let cancelled = false;
    setStatus('loading');
    api.admin
      .schemes()
      .then((data) => {
        if (cancelled) return;
        setSchemes(data);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  };

  useEffect(() => loadSchemes(), []);

  const filteredSchemes = useMemo(() => schemes.filter((s) => rowMatchesSearch(s, searchQuery)), [schemes, searchQuery]);
  const allFilteredSelected = filteredSchemes.length > 0 && filteredSchemes.every((s) => selectedIds.has(s.id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filteredSchemes.forEach((s) => next.delete(s.id));
      else filteredSchemes.forEach((s) => next.add(s.id));
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

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!window.confirm(`This permanently deletes ${ids.length} scheme(s) from the database. This cannot be undone. Continue?`)) return;
    setBulkBusy(true);
    try {
      await api.admin.bulkDeleteSchemes({ ids });
      setSchemes((prev) => prev.filter((s) => !selectedIds.has(s.id)));
      setSelectedIds(new Set());
    } catch {
      // no-op
    } finally {
      setBulkBusy(false);
    }
  };

  const handlePublish = async (schemeId: string) => {
    setBusyId(schemeId);
    try {
      const updated = await api.admin.publishScheme(schemeId);
      setSchemes((prev) => prev.map((s) => (s.id === schemeId ? updated : s)));
    } catch {
      // leave state untouched; table still shows last known-good record
    } finally {
      setBusyId(null);
    }
  };

  const handleArchive = async (schemeId: string) => {
    setBusyId(schemeId);
    try {
      const updated = await api.admin.archiveScheme(schemeId);
      setSchemes((prev) => prev.map((s) => (s.id === schemeId ? updated : s)));
    } catch {
      // leave state untouched; table still shows last known-good record
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (schemeId: string) => {
    if (!window.confirm('This permanently deletes this scheme from the database. This cannot be undone. Continue?')) return;
    setBusyId(schemeId);
    try {
      await api.admin.deleteScheme(schemeId);
      setSchemes((prev) => prev.filter((s) => s.id !== schemeId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(schemeId);
        return next;
      });
    } catch {
      // no-op — row stays visible so the admin can retry
    } finally {
      setBusyId(null);
    }
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError(null);
    setModalMode('create');
  };

  const openEdit = async (schemeId: string) => {
    setBusyId(schemeId);
    try {
      const detail: AdminSchemeDetailDto = await api.admin.schemeDetail(schemeId);
      setForm({
        slug: detail.slug,
        schemeName: detail.schemeName,
        ...(detail.shortTitle ? { shortTitle: detail.shortTitle } : {}),
        ...(detail.level ? { level: detail.level } : {}),
        ...(detail.state ? { state: detail.state } : {}),
        ...(detail.ministry ? { ministry: detail.ministry } : {}),
        ...(detail.department ? { department: detail.department } : {}),
        ...(detail.beneficiaryType ? { beneficiaryType: detail.beneficiaryType } : {}),
        ...(detail.targetBeneficiaries ? { targetBeneficiaries: detail.targetBeneficiaries } : {}),
        ...(detail.benefitType ? { benefitType: detail.benefitType } : {}),
        categories: detail.categories ?? [],
        subCategories: detail.subCategories ?? [],
        tags: detail.tags ?? [],
        briefDescription: detail.briefDescription,
        detailedDescription: detail.detailedDescription,
        ...(detail.benefits ? { benefits: detail.benefits } : {}),
        ...(detail.eligibility ? { eligibility: detail.eligibility } : {}),
        ...(detail.exclusions ? { exclusions: detail.exclusions } : {}),
        ...(detail.applicationMode ? { applicationMode: detail.applicationMode } : {}),
        ...(detail.applicationProcess ? { applicationProcess: detail.applicationProcess } : {}),
        ...(detail.documentsRequired ? { documentsRequired: detail.documentsRequired } : {}),
        ...(detail.references ? { references: detail.references } : {}),
        ...(detail.schemeOpenDate ? { schemeOpenDate: detail.schemeOpenDate } : {}),
        ...(detail.schemeCloseDate ? { schemeCloseDate: detail.schemeCloseDate } : {}),
        dbtScheme: detail.dbtScheme,
        ...(detail.faqCount != null ? { faqCount: detail.faqCount } : {}),
        sourceUrl: detail.sourceUrl,
        ...(detail.applicationUrl ? { applicationUrl: detail.applicationUrl } : {}),
        publicationStatus: detail.publicationStatus,
        isUrgent: detail.isUrgent,
        isVerified: detail.isVerified,
      });
      setEditingId(schemeId);
      setFormError(null);
      setModalMode('edit');
    } catch {
      setFormError('Could not load scheme details.');
    } finally {
      setBusyId(null);
    }
  };

  const closeModal = () => setModalMode('closed');

  const handleSave = async () => {
    if (!form.slug.trim() || !form.schemeName.trim() || !form.briefDescription.trim() || !form.detailedDescription.trim() || !form.sourceUrl.trim()) {
      setFormError('Slug, scheme name, brief description, detailed description, and source URL are required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (modalMode === 'create') {
        await api.admin.createScheme(form);
      } else if (editingId) {
        await api.admin.updateScheme(editingId, form);
      }
      setModalMode('closed');
      loadSchemes();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to save scheme.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1300px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '900', color: theme.textHeading, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileTextIcon /> Scheme Management Records
          </h2>
          <p style={{ fontSize: '14px', color: theme.textMuted, margin: 0 }}>
            View, edit, and manage government scheme benefit records — including CSV-imported schemes
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            backgroundColor: theme.primary,
            color: '#ffffff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          + New Scheme
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: theme.textMuted }}>
            <SearchIcon />
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any column — title, department, category, status…"
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

      {status === 'loading' && <div style={{ color: theme.textMuted, padding: '16px' }}>Loading schemes…</div>}
      {status === 'error' && <div style={{ color: theme.alertUrgent, padding: '16px' }}>Could not load schemes right now.</div>}

      {status === 'ready' && (
        <div style={{ backgroundColor: theme.surface, borderRadius: '20px', border: `1.5px solid ${theme.border}`, overflow: 'hidden' }}>
          {filteredSchemes.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: theme.textMuted }}>
              {schemes.length === 0 ? 'No scheme records yet.' : 'No schemes match your search.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: theme.surfaceSubtle, borderBottom: `1.5px solid ${theme.border}`, color: theme.textHeading }}>
                  <th style={{ padding: '16px 12px', width: '36px' }}>
                    <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} />
                  </th>
                  <th style={{ padding: '16px 20px', fontWeight: '800' }}>Title & Department</th>
                  <th style={{ padding: '16px 20px', fontWeight: '800' }}>Category</th>
                  <th style={{ padding: '16px 20px', fontWeight: '800' }}>Status</th>
                  <th style={{ padding: '16px 20px', fontWeight: '800' }}>Source</th>
                  <th style={{ padding: '16px 20px', fontWeight: '800' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchemes.map((scm) => (
                  <tr key={scm.id} style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textBody }}>
                    <td style={{ padding: '16px 12px' }}>
                      <input type="checkbox" checked={selectedIds.has(scm.id)} onChange={() => toggleSelectOne(scm.id)} />
                    </td>
                    <td style={{ padding: '16px 20px', cursor: 'pointer' }} onClick={() => openEdit(scm.id)}>
                      <div style={{ fontWeight: '800', color: theme.textHeading }}>{scm.title}</div>
                      <div style={{ fontSize: '12px', color: theme.textMuted }}>{scm.department}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ backgroundColor: theme.surfaceSubtle, color: theme.primary, padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>
                        {scm.category}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: '700', color: scm.isUrgent ? theme.alertUrgent : theme.textHeading }}>
                      {scm.publicationStatus}
                      {scm.isVerified ? ' · Verified' : ''}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <a href={scm.officialUrl} target="_blank" rel="noreferrer" style={{ color: theme.primary, textDecoration: 'none', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {scm.officialUrl.replace('https://', '').slice(0, 28)}
                        <ExternalLinkIcon />
                      </a>
                    </td>
                    <td style={{ padding: '16px 20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => openEdit(scm.id)}
                        disabled={busyId === scm.id}
                        style={{ backgroundColor: theme.surfaceSubtle, color: theme.textHeading, border: `1px solid ${theme.border}`, padding: '6px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                      >
                        View / Edit
                      </button>
                      <button
                        onClick={() => handlePublish(scm.id)}
                        disabled={busyId === scm.id || scm.publicationStatus === 'published'}
                        style={{ backgroundColor: theme.surfaceSubtle, color: theme.primary, border: `1px solid ${theme.border}`, padding: '6px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: busyId === scm.id ? 'default' : 'pointer', opacity: busyId === scm.id ? 0.6 : 1 }}
                      >
                        Publish
                      </button>
                      <button
                        onClick={() => handleArchive(scm.id)}
                        disabled={busyId === scm.id || scm.publicationStatus === 'archived'}
                        style={{ backgroundColor: theme.surfaceSubtle, color: theme.alertUrgent, border: `1px solid ${theme.border}`, padding: '6px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: busyId === scm.id ? 'default' : 'pointer', opacity: busyId === scm.id ? 0.6 : 1 }}
                      >
                        Archive
                      </button>
                      <button
                        onClick={() => handleDelete(scm.id)}
                        disabled={busyId === scm.id}
                        style={{ backgroundColor: 'transparent', color: theme.alertUrgent, border: `1px solid ${theme.alertUrgent}`, padding: '6px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: busyId === scm.id ? 'default' : 'pointer', opacity: busyId === scm.id ? 0.6 : 1 }}
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

      {modalMode !== 'closed' && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto', zIndex: 100 }}
          onClick={closeModal}
        >
          <div
            style={{ backgroundColor: theme.surface, borderRadius: '20px', padding: '28px', maxWidth: '760px', width: '100%', border: `1.5px solid ${theme.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: theme.textHeading, margin: '0 0 16px 0' }}>
              {modalMode === 'create' ? 'New Scheme' : 'Edit Scheme'}
            </h3>

            {formError && <div style={{ color: theme.alertUrgent, marginBottom: '12px', fontSize: '13px', fontWeight: 700 }}>{formError}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {textField(theme, 'Slug *', form.slug, (v) => setForm((f) => ({ ...f, slug: v })))}
              {textField(theme, 'Scheme Name *', form.schemeName, (v) => setForm((f) => ({ ...f, schemeName: v })))}
              {textField(theme, 'Short Title', form.shortTitle ?? '', (v) => setForm((f) => ({ ...f, shortTitle: v })))}
              {textField(theme, 'Level', form.level ?? '', (v) => setForm((f) => ({ ...f, level: v })))}
              {textField(theme, 'State', form.state ?? '', (v) => setForm((f) => ({ ...f, state: v })))}
              {textField(theme, 'Ministry', form.ministry ?? '', (v) => setForm((f) => ({ ...f, ministry: v })))}
              {textField(theme, 'Department', form.department ?? '', (v) => setForm((f) => ({ ...f, department: v })))}
              {textField(theme, 'Beneficiary Type', form.beneficiaryType ?? '', (v) => setForm((f) => ({ ...f, beneficiaryType: v })))}
              {textField(theme, 'Target Beneficiaries', form.targetBeneficiaries ?? '', (v) => setForm((f) => ({ ...f, targetBeneficiaries: v })))}
              {textField(theme, 'Benefit Type', form.benefitType ?? '', (v) => setForm((f) => ({ ...f, benefitType: v })))}
              {textField(theme, 'Source URL *', form.sourceUrl, (v) => setForm((f) => ({ ...f, sourceUrl: v })))}
              {textField(theme, 'Application URL', form.applicationUrl ?? '', (v) => setForm((f) => ({ ...f, applicationUrl: v })))}
              {textField(theme, 'Scheme Open Date', form.schemeOpenDate ?? '', (v) => setForm((f) => ({ ...f, schemeOpenDate: v })))}
              {textField(theme, 'Scheme Close Date', form.schemeCloseDate ?? '', (v) => setForm((f) => ({ ...f, schemeCloseDate: v })))}
              {textField(theme, 'Categories (semicolon separated)', (form.categories ?? []).join('; '), (v) =>
                setForm((f) => ({ ...f, categories: v.split(';').map((s) => s.trim()).filter(Boolean) })),
              )}
              {textField(theme, 'Tags (semicolon separated)', (form.tags ?? []).join('; '), (v) =>
                setForm((f) => ({ ...f, tags: v.split(';').map((s) => s.trim()).filter(Boolean) })),
              )}
            </div>

            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {textField(theme, 'Brief Description *', form.briefDescription, (v) => setForm((f) => ({ ...f, briefDescription: v })), true)}
              {textField(theme, 'Detailed Description *', form.detailedDescription, (v) => setForm((f) => ({ ...f, detailedDescription: v })), true)}
              {textField(theme, 'Benefits', form.benefits ?? '', (v) => setForm((f) => ({ ...f, benefits: v })), true)}
              {textField(theme, 'Eligibility', form.eligibility ?? '', (v) => setForm((f) => ({ ...f, eligibility: v })), true)}
              {textField(theme, 'Exclusions', form.exclusions ?? '', (v) => setForm((f) => ({ ...f, exclusions: v })), true)}
              {textField(theme, 'Documents Required', form.documentsRequired ?? '', (v) => setForm((f) => ({ ...f, documentsRequired: v })), true)}
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" checked={form.dbtScheme} onChange={(e) => setForm((f) => ({ ...f, dbtScheme: e.target.checked }))} />
                DBT Scheme
              </label>
              <label style={{ fontSize: '13px', fontWeight: 700, color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" checked={form.isUrgent} onChange={(e) => setForm((f) => ({ ...f, isUrgent: e.target.checked }))} />
                Urgent
              </label>
              <label style={{ fontSize: '13px', fontWeight: 700, color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" checked={form.isVerified} onChange={(e) => setForm((f) => ({ ...f, isVerified: e.target.checked }))} />
                Verified
              </label>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={closeModal}
                style={{ backgroundColor: 'transparent', color: theme.textMuted, border: `1px solid ${theme.border}`, padding: '10px 18px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ backgroundColor: theme.primary, color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving…' : 'Save Scheme'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
