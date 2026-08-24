import React, { useEffect, useState } from 'react';
import type { ThemeColors } from 'shared/constants/theme';
import type { SupportedLanguage } from 'shared/types';
import type { ProfileDto } from 'shared/contracts/profile';
import type { Gender, IncomeRange, Occupation } from 'shared/types';
import { getTranslation } from 'shared/i18n/translations';
import { api } from '../lib/api';
import { ALL_INDIAN_STATES_AND_UTS, getDistrictsForState } from 'shared/constants/indiaLocationData';
import { FONT_SERIF, FONT_SANS, ANIM } from '../design/tokens';

const SERIF = FONT_SERIF;

interface ProfileDashboardViewProps {
  theme: ThemeColors;
  language: SupportedLanguage;
  initialProfile: ProfileDto;
  onProfileSaved: (patch: Partial<ProfileDto>) => void;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const UserHeaderIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const SaveIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const CheckShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const MapPinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const FileCheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" /><polyline points="9 15 11 17 15 13" />
  </svg>
);

const fieldLabel = (theme: ThemeColors) => ({
  fontSize: '11px',
  fontWeight: '800' as const,
  color: theme.textSubtle,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  marginBottom: '5px',
  display: 'block',
});

const fieldValue = (theme: ThemeColors) => ({
  fontSize: '15px',
  fontWeight: '700' as const,
  color: theme.textHeading,
  fontFamily: FONT_SANS,
});

const inputStyle = (theme: ThemeColors): React.CSSProperties => ({
  width: '100%',
  padding: '11px 14px',
  borderRadius: '12px',
  border: `1.5px solid ${theme.border}`,
  backgroundColor: theme.surface,
  color: theme.textHeading,
  fontSize: '14.5px',
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: FONT_SANS,
  transition: 'border-color 0.15s, box-shadow 0.15s',
});

const ROW: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' };

export const ProfileDashboardView: React.FC<ProfileDashboardViewProps> = ({
  theme, language, initialProfile, onProfileSaved,
}) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Editable fields
  const [name, setName] = useState(initialProfile.name ?? '');
  const [username, setUsername] = useState(initialProfile.username ?? '');
  const [dob, setDob] = useState(initialProfile.dateOfBirth ?? '');
  const [gender, setGender] = useState<string>(initialProfile.gender ?? '');
  const [state, setState] = useState(initialProfile.state ?? '');
  const [district, setDistrict] = useState(initialProfile.district ?? '');
  const [occupation, setOccupation] = useState<string>(initialProfile.occupation ?? '');
  const [incomeRange, setIncomeRange] = useState<string>(initialProfile.incomeRange ?? '');
  const [disabilityStatus, setDisabilityStatus] = useState(initialProfile.disabilityStatus);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>(getDistrictsForState(state));
  const [documents, setDocuments] = useState({ ...initialProfile.documents });

  useEffect(() => {
    setAvailableDistricts(getDistrictsForState(state));
  }, [state]);

  const handleCancel = () => {
    setName(initialProfile.name ?? '');
    setUsername(initialProfile.username ?? '');
    setDob(initialProfile.dateOfBirth ?? '');
    setGender(initialProfile.gender ?? '');
    setState(initialProfile.state ?? '');
    setDistrict(initialProfile.district ?? '');
    setOccupation(initialProfile.occupation ?? '');
    setIncomeRange(initialProfile.incomeRange ?? '');
    setDisabilityStatus(initialProfile.disabilityStatus);
    setDocuments({ ...initialProfile.documents });
    setSaveError(null);
    setSaved(false);
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await api.profile.update({
        name: name.trim() || undefined,
        username: username.trim() || undefined,
        dateOfBirth: dob || undefined,
        gender: gender as Gender || undefined,
        state: state || undefined,
        district: district || undefined,
        occupation: occupation as Occupation || undefined,
        incomeRange: incomeRange as IncomeRange || undefined,
        disabilityStatus,
        documents,
      });
      setSaved(true);
      setEditing(false);
      onProfileSaved({ name, username, dateOfBirth: dob, gender: gender as Gender, state, district, occupation: occupation as Occupation, incomeRange: incomeRange as IncomeRange, disabilityStatus });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const card: React.CSSProperties = {
    backgroundColor: theme.surface,
    border: `1.5px solid ${theme.border}`,
    borderRadius: '24px',
    padding: '28px',
    marginBottom: '20px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
    transition: 'all 0.18s ease',
  };

  const sectionTitle = (label: string, icon?: React.ReactNode) => (
    <h4 style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: '800', color: theme.textHeading, margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
      {icon && <span style={{ color: theme.primary }}>{icon}</span>}
      {label}
    </h4>
  );

  const readField = (label: string, value: string | undefined) => (
    <div style={{ backgroundColor: theme.surfaceSubtle, padding: '12px 16px', borderRadius: '12px', border: `1px solid ${theme.borderSubtle}` }}>
      <span style={fieldLabel(theme)}>{label}</span>
      <div style={fieldValue(theme)}>{value || '—'}</div>
    </div>
  );

  const DOCUMENT_KEYS = ['aadhaar', 'pan', 'income', 'caste', 'domicile', 'bank', 'ration', 'disability', 'educational', 'land'] as const;
  const DOC_LABELS: Record<string, string> = {
    aadhaar: 'Aadhaar Card', pan: 'PAN Card', income: 'Income Certificate',
    caste: 'Caste Certificate', domicile: 'Domicile Certificate', bank: 'Bank Passbook',
    ration: 'Ration Card', disability: 'Disability Certificate', educational: 'Educational Marksheet', land: 'Land Document',
  };

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto', padding: '32px 24px', animation: ANIM.fadeUp }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ color: theme.primary, backgroundColor: theme.surfaceSubtle, border: `1.5px solid ${theme.border}`, borderRadius: '14px', padding: '10px', display: 'flex' }}>
            <UserHeaderIcon />
          </div>
          <div>
            <h2 style={{ fontFamily: SERIF, fontSize: '28px', fontWeight: '900', color: theme.textHeading, margin: 0, lineHeight: 1 }}>
              {getTranslation(language, 'profileDashboard')}
            </h2>
            <p style={{ fontSize: '14px', color: theme.textSubtle, margin: '4px 0 0', fontWeight: '500' }}>Your personal welfare profile &amp; document status</p>
          </div>
        </div>

        {!editing ? (
          <button
            onClick={() => { setSaved(false); setEditing(true); }}
            style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover})`, color: theme.textInverse, border: 'none', borderRadius: '12px', padding: '11px 22px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(113,131,85,0.3)', transition: 'all 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <EditIcon />
            {getTranslation(language, 'editProfile')}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSave} disabled={saving}
              style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', padding: '11px 22px', fontSize: '14px', fontWeight: '800', cursor: saving ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
            >
              <SaveIcon />
              {saving ? 'Saving…' : getTranslation(language, 'saveChanges')}
            </button>
            <button
              onClick={handleCancel}
              style={{ backgroundColor: theme.surfaceSubtle, color: theme.textHeading, border: `1.5px solid ${theme.border}`, borderRadius: '12px', padding: '11px 18px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
            >
              {getTranslation(language, 'cancelEdit')}
            </button>
          </div>
        )}
      </div>

      {saveError && <div style={{ color: '#b91c1c', fontSize: '14px', fontWeight: 600, marginBottom: '18px', padding: '14px 18px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '14px' }}>⚠ {saveError}</div>}
      {saved && <div style={{ color: '#14532d', fontSize: '14px', fontWeight: 700, marginBottom: '18px', padding: '14px 18px', backgroundColor: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckShieldIcon /> Profile saved successfully.</div>}

      {/* Personal Information */}
      <div style={card}>
        {sectionTitle('Personal Information', <UserHeaderIcon />)}
        {editing ? (
          <div style={ROW}>
            <div>
              <label style={fieldLabel(theme)}>Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} style={inputStyle(theme)} placeholder="Your name" />
            </div>
            <div>
              <label style={fieldLabel(theme)}>Date of Birth</label>
              <input type="date" value={dob} onChange={e => setDob(e.target.value)} style={inputStyle(theme)} />
            </div>
            <div>
              <label style={fieldLabel(theme)}>Gender</label>
              <select value={gender} onChange={e => setGender(e.target.value)} style={inputStyle(theme)}>
                <option value="">— Select —</option>
                {(['Male', 'Female', 'Transgender', 'Other', 'Prefer not to say'] as Gender[]).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={fieldLabel(theme)}>Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} style={inputStyle(theme)} placeholder="Username" />
            </div>
          </div>
        ) : (
          <div style={ROW}>
            {readField('Full Name', initialProfile.name)}
            {readField('Date of Birth', initialProfile.dateOfBirth ? new Date(initialProfile.dateOfBirth).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : undefined)}
            {readField('Gender', initialProfile.gender)}
            {readField('Username', initialProfile.username)}
          </div>
        )}
      </div>

      {/* Contact */}
      <div style={card}>
        {sectionTitle('Contact & Authentication')}
        <div style={ROW}>
          {readField('Email Address', initialProfile.email)}
          {readField('Phone Number', initialProfile.phoneNumber)}
        </div>
        <p style={{ fontSize: '13px', color: theme.textMuted, margin: '16px 0 0', lineHeight: '1.5', backgroundColor: theme.surfaceSubtle, padding: '10px 14px', borderRadius: '10px', border: `1px solid ${theme.borderSubtle}` }}>
          💡 To change your password or security settings, navigate to <strong style={{ color: theme.primary }}>Password &amp; Security</strong> in the menu.
        </p>
      </div>

      {/* Location & Work */}
      <div style={card}>
        {sectionTitle('Location & Occupation', <MapPinIcon />)}
        {editing ? (
          <div style={ROW}>
            <div>
              <label style={fieldLabel(theme)}>State</label>
              <select value={state} onChange={e => { setState(e.target.value); setDistrict(''); }} style={inputStyle(theme)}>
                <option value="">— Select State —</option>
                {ALL_INDIAN_STATES_AND_UTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={fieldLabel(theme)}>District</label>
              <select value={district} onChange={e => setDistrict(e.target.value)} style={inputStyle(theme)}>
                <option value="">— Select District —</option>
                {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={fieldLabel(theme)}>Occupation</label>
              <select value={occupation} onChange={e => setOccupation(e.target.value)} style={inputStyle(theme)}>
                <option value="">— Select —</option>
                {(['Farmer', 'Laborer', 'Student', 'Self-Employed', 'Unemployed', 'Private Sector', 'Government Sector', 'Homemaker'] as Occupation[]).map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={fieldLabel(theme)}>Annual Income</label>
              <select value={incomeRange} onChange={e => setIncomeRange(e.target.value)} style={inputStyle(theme)}>
                <option value="">— Select —</option>
                {(['< 1 Lakh', '1 - 2.5 Lakhs', '2.5 - 5 Lakhs', '5 - 8 Lakhs', '> 8 Lakhs'] as IncomeRange[]).map(i => <option key={i} value={i}>₹ {i}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={fieldLabel(theme)}>Disability Status</label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                {[false, true].map(v => (
                  <button key={String(v)} type="button" onClick={() => setDisabilityStatus(v)}
                    style={{ padding: '9px 24px', borderRadius: '10px', border: `2px solid ${disabilityStatus === v ? theme.primary : theme.border}`, backgroundColor: disabilityStatus === v ? theme.primary : theme.surface, color: disabilityStatus === v ? theme.textInverse : theme.textHeading, fontWeight: 800, fontSize: '14px', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {v ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={ROW}>
            {readField('State', initialProfile.state)}
            {readField('District', initialProfile.district)}
            {readField('Occupation', initialProfile.occupation)}
            {readField('Annual Income', initialProfile.incomeRange ? `₹ ${initialProfile.incomeRange}` : undefined)}
            {readField('Disability Status', initialProfile.disabilityStatus ? 'Yes' : 'No')}
          </div>
        )}
      </div>

      {/* Document Ownership */}
      <div style={card}>
        {sectionTitle('Document Ownership Checklist', <FileCheckIcon />)}
        <p style={{ fontSize: '13.5px', color: theme.textMuted, margin: '-10px 0 18px', lineHeight: '1.5' }}>
          Mark which certificates and documents you currently possess. IVA uses these to calculate scheme eligibility.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
          {DOCUMENT_KEYS.map(key => {
            const val = documents[key];
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.surfaceSubtle, borderRadius: '14px', padding: '12px 16px', border: `1px solid ${theme.borderSubtle}` }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: theme.textHeading }}>{DOC_LABELS[key]}</span>
                {editing ? (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {([true, false] as const).map(v => (
                      <button key={String(v)} type="button" onClick={() => setDocuments({ ...documents, [key]: v })}
                        style={{ padding: '4px 12px', borderRadius: '8px', border: `1.5px solid ${val === v ? (v ? '#10b981' : theme.border) : theme.borderSubtle}`, backgroundColor: val === v ? (v ? '#10b981' : theme.surface) : theme.surface, color: val === v ? '#ffffff' : theme.textSubtle, fontSize: '12px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.15s' }}>
                        {v ? 'Yes' : 'No'}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '12px', fontWeight: '800', color: val === true ? '#15803d' : theme.textSubtle, backgroundColor: val === true ? '#dcfce7' : theme.surface, padding: '4px 12px', borderRadius: '100px', border: `1px solid ${val === true ? '#bbf7d0' : theme.borderSubtle}` }}>
                    {val === true ? '✓ Ready' : val === false ? 'Not possessed' : 'Not set'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
