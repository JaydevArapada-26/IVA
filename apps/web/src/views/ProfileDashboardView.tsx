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

// --- Icons ---
const UserHeaderIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
const UsersIcon2 = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const GraduationCapIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);
const HomeIcon2 = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const TractorIcon2 = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 4h9l1 7" /><circle cx="7" cy="17" r="3" /><circle cx="17" cy="17" r="3" />
    <path d="M13 11h5l2 4H13z" />
  </svg>
);
const BriefcaseIcon2 = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);
const AccessibilityIcon2 = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="4" r="2" /><path d="M7 9l5 1 3-5" /><path d="M7 22l1-6 4 2 1 4" /><path d="M11 17l-1-6" />
  </svg>
);

// --- Style helpers ---
const fieldLabel = (theme: ThemeColors): React.CSSProperties => ({
  fontSize: '11px', fontWeight: 800, color: theme.textSubtle, textTransform: 'uppercase',
  letterSpacing: '0.08em', marginBottom: '5px', display: 'block',
});
const fieldValue = (theme: ThemeColors): React.CSSProperties => ({
  fontSize: '15px', fontWeight: 700, color: theme.textHeading, fontFamily: FONT_SANS,
});
const inputStyle = (theme: ThemeColors): React.CSSProperties => ({
  width: '100%', padding: '10px 13px', borderRadius: '11px',
  border: `1.5px solid ${theme.border}`, backgroundColor: theme.surface,
  color: theme.textHeading, fontSize: '14px', boxSizing: 'border-box',
  outline: 'none', fontFamily: FONT_SANS, transition: 'border-color 0.15s',
});
const ROW: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' };
const ROW2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' };

// --- Label maps ---
const EMPLOYMENT_LABELS: Record<string, string> = {
  student: 'Student', employed: 'Employed', self_employed: 'Self-Employed',
  business_owner: 'Business Owner', farmer: 'Farmer', agricultural_worker: 'Agricultural Worker',
  labour_worker: 'Labour / Worker', unemployed: 'Unemployed', retired: 'Retired',
  homemaker: 'Homemaker', other: 'Other',
};
const INCOME_LABELS: Record<string, string> = {
  lt_1_lakh: 'Below Rs.1 Lakh', '1_to_25_lakh': 'Rs.1-2.5 Lakhs',
  '25_to_5_lakh': 'Rs.2.5-5 Lakhs', '5_to_8_lakh': 'Rs.5-8 Lakhs', gt_8_lakh: 'Above Rs.8 Lakhs',
};
const RESIDENCE_LABELS: Record<string, string> = { rural: 'Rural', urban: 'Urban' };
const MARITAL_LABELS: Record<string, string> = {
  single: 'Single', married: 'Married', widowed: 'Widowed',
  divorced_separated: 'Divorced / Separated', prefer_not_to_say: 'Prefer not to say',
};
const CATEGORY_LABELS: Record<string, string> = {
  general: 'General', obc: 'OBC', sc: 'SC', st: 'ST', ews: 'EWS',
  prefer_not_to_say: 'Prefer not to say', other: 'Other',
};
const BPL_LABELS: Record<string, string> = {
  bpl: 'BPL', ews: 'EWS', neither: 'Neither', not_sure: 'Not sure', prefer_not_to_say: 'Prefer not to say',
};
const EDU_LEVEL_LABELS: Record<string, string> = {
  not_studying: 'Not Studying', primary_completed: 'Primary Completed',
  secondary_completed: 'Secondary (10th)', higher_secondary_completed: 'Higher Secondary (12th)',
  graduate: 'Graduate', post_graduate: 'Post-Graduate', phd_research: 'PhD / Research',
  vocational_skill: 'Vocational / Skill Training',
};
const EDU_STREAM_LABELS: Record<string, string> = {
  science: 'Science', commerce: 'Commerce', arts_humanities: 'Arts / Humanities',
  engineering: 'Engineering', medicine: 'Medicine', law: 'Law',
  management: 'Management / MBA', agriculture: 'Agriculture',
  it_computer_science: 'IT / Computer Science', vocational_technical: 'Vocational / Technical', other: 'Other',
};
const LAND_LABELS: Record<string, string> = {
  yes: 'Yes (Own)', no: 'No', lease_rented: 'Leased / Rented', not_sure: 'Not Sure',
};
const LANDHOLDING_LABELS: Record<string, string> = {
  lt_1_acre: '< 1 Acre', acre_1_2: '1-2 Acres', acre_2_5: '2-5 Acres',
  acre_5_10: '5-10 Acres', gt_10_acre: '> 10 Acres',
};
const AGRI_LABELS: Record<string, string> = {
  crops: 'Crops', horticulture: 'Horticulture', dairy: 'Dairy', livestock: 'Livestock',
  fisheries: 'Fisheries', mixed_farming: 'Mixed Farming', other: 'Other',
};
const HOUSING_LABELS: Record<string, string> = {
  own_home: 'Own Home', renting: 'Renting', no_permanent_home: 'No Permanent Home',
  temporary_kutcha: 'Temporary / Kutcha', other: 'Other', prefer_not_to_say: 'Prefer not to say',
};
const BUSINESS_LABELS: Record<string, string> = {
  retail: 'Retail', manufacturing: 'Manufacturing', services: 'Services',
  agriculture_related: 'Agriculture Related', handicraft_artisan: 'Handicraft / Artisan',
  food_business: 'Food Business', technology: 'Technology', other: 'Other',
};
const DISABILITY_PCT_LABELS: Record<string, string> = {
  below_40: 'Below 40%', '40_59': '40-59%', '60_79': '60-79%', '80_plus': '80% or above', not_sure: 'Not Sure',
};

function labelFor(map: Record<string, string>, val: string | undefined): string {
  if (!val) return 'Not specified';
  return map[val] ?? val.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export const ProfileDashboardView: React.FC<ProfileDashboardViewProps> = ({
  theme, language, initialProfile, onProfileSaved,
}) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
  const [category, setCategory] = useState<string>(initialProfile.category ?? '');

  const [residenceType, setResidenceType] = useState<string>(initialProfile.residenceType ?? '');
  const [maritalStatus, setMaritalStatus] = useState<string>(initialProfile.maritalStatus ?? '');
  const [employmentStatus, setEmploymentStatus] = useState<string>(initialProfile.employmentStatus ?? '');
  const [bplEwsStatus, setBplEwsStatus] = useState<string>(initialProfile.bplEwsStatus ?? '');
  const [educationLevel, setEducationLevel] = useState<string>(initialProfile.educationLevel ?? '');
  const [educationStream, setEducationStream] = useState<string>(initialProfile.educationStream ?? '');
  const [currentYearClass, setCurrentYearClass] = useState<string>(initialProfile.currentYearClass ?? '');
  const [hasDependents, setHasDependents] = useState<boolean | undefined>(initialProfile.hasDependents);
  const [numberOfDependents, setNumberOfDependents] = useState<number | undefined>(initialProfile.numberOfDependents);
  const [disabilityPercentage, setDisabilityPercentage] = useState<string>(initialProfile.disabilityPercentage ?? '');
  const [ownsAgriculturalLand, setOwnsAgriculturalLand] = useState<string>(initialProfile.ownsAgriculturalLand ?? '');
  const [landholdingSize, setLandholdingSize] = useState<string>(initialProfile.landholdingSize ?? '');
  const [agricultureActivityType, setAgricultureActivityType] = useState<string>(initialProfile.agricultureActivityType ?? '');
  const [housingSituation, setHousingSituation] = useState<string>(initialProfile.housingSituation ?? '');
  const [ownsResidentialLand, setOwnsResidentialLand] = useState<boolean | undefined>(initialProfile.ownsResidentialLand);
  const [businessType, setBusinessType] = useState<string>(initialProfile.businessType ?? '');

  useEffect(() => { setAvailableDistricts(getDistrictsForState(state)); }, [state]);

  const isStudent = employmentStatus === 'student';
  const isFarmer = employmentStatus === 'farmer' || employmentStatus === 'agricultural_worker';

  const handleCancel = () => {
    setName(initialProfile.name ?? ''); setUsername(initialProfile.username ?? '');
    setDob(initialProfile.dateOfBirth ?? ''); setGender(initialProfile.gender ?? '');
    setState(initialProfile.state ?? ''); setDistrict(initialProfile.district ?? '');
    setOccupation(initialProfile.occupation ?? ''); setIncomeRange(initialProfile.incomeRange ?? '');
    setDisabilityStatus(initialProfile.disabilityStatus); setDocuments({ ...initialProfile.documents });
    setCategory(initialProfile.category ?? '');
    setResidenceType(initialProfile.residenceType ?? ''); setMaritalStatus(initialProfile.maritalStatus ?? '');
    setEmploymentStatus(initialProfile.employmentStatus ?? ''); setBplEwsStatus(initialProfile.bplEwsStatus ?? '');
    setEducationLevel(initialProfile.educationLevel ?? ''); setEducationStream(initialProfile.educationStream ?? '');
    setCurrentYearClass(initialProfile.currentYearClass ?? '');
    setHasDependents(initialProfile.hasDependents); setNumberOfDependents(initialProfile.numberOfDependents);
    setDisabilityPercentage(initialProfile.disabilityPercentage ?? '');
    setOwnsAgriculturalLand(initialProfile.ownsAgriculturalLand ?? '');
    setLandholdingSize(initialProfile.landholdingSize ?? ''); setAgricultureActivityType(initialProfile.agricultureActivityType ?? '');
    setHousingSituation(initialProfile.housingSituation ?? ''); setOwnsResidentialLand(initialProfile.ownsResidentialLand);
    setBusinessType(initialProfile.businessType ?? '');
    setSaveError(null); setSaved(false); setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true); setSaveError(null);
    try {
      await api.profile.update({
        name: name.trim() || undefined, username: username.trim() || undefined,
        dateOfBirth: dob || undefined, gender: gender as Gender || undefined,
        state: state || undefined, district: district || undefined,
        occupation: occupation as Occupation || undefined,
        incomeRange: incomeRange as IncomeRange || undefined,
        disabilityStatus, documents, category: category as any || undefined,
        residenceType: residenceType as any || undefined,
        maritalStatus: maritalStatus as any || undefined,
        employmentStatus: employmentStatus as any || undefined,
        bplEwsStatus: bplEwsStatus as any || undefined,
        educationLevel: educationLevel as any || undefined,
        educationStream: educationStream as any || undefined,
        currentYearClass: currentYearClass || undefined,
        hasDependents, numberOfDependents,
        disabilityPercentage: disabilityPercentage as any || undefined,
        ownsAgriculturalLand: ownsAgriculturalLand as any || undefined,
        landholdingSize: landholdingSize as any || undefined,
        agricultureActivityType: agricultureActivityType as any || undefined,
        housingSituation: housingSituation as any || undefined,
        ownsResidentialLand,
        businessType: businessType as any || undefined,
      });
      setSaved(true); setEditing(false);
      onProfileSaved({ name, username, dateOfBirth: dob, gender: gender as Gender, state, district, occupation: occupation as Occupation, incomeRange: incomeRange as IncomeRange, disabilityStatus });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save changes. Please try again.');
    } finally { setSaving(false); }
  };

  const card: React.CSSProperties = {
    backgroundColor: theme.surface, border: `1.5px solid ${theme.border}`,
    borderRadius: '20px', padding: '24px', marginBottom: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
  };

  const sectionTitle = (label: string, icon?: React.ReactNode) => (
    <h4 style={{ fontFamily: SERIF, fontSize: '17px', fontWeight: '800', color: theme.textHeading, margin: '0 0 18px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
      {icon && <span style={{ color: theme.primary }}>{icon}</span>}{label}
    </h4>
  );

  const readField = (label: string, value: string | undefined) => (
    <div style={{ backgroundColor: theme.surfaceSubtle, padding: '11px 14px', borderRadius: '11px', border: `1px solid ${theme.borderSubtle}` }}>
      <span style={fieldLabel(theme)}>{label}</span>
      <div style={fieldValue(theme)}>{value || 'Not specified'}</div>
    </div>
  );

  const selField = (label: string, value: string, onChange: (v: string) => void, opts: Array<{value: string; label: string}>) => (
    <div>
      <label style={fieldLabel(theme)}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle(theme)}>
        <option value="">-- Select --</option>
        {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  const boolToggle = (label: string, value: boolean | undefined, onChange: (v: boolean) => void) => (
    <div>
      <label style={fieldLabel(theme)}>{label}</label>
      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
        {[true, false].map(v => (
          <button key={String(v)} type="button" onClick={() => onChange(v)}
            style={{ padding: '8px 20px', borderRadius: '10px', border: `2px solid ${value === v ? theme.primary : theme.border}`, backgroundColor: value === v ? theme.primary : theme.surface, color: value === v ? theme.textInverse : theme.textHeading, fontWeight: 800, fontSize: '13.5px', cursor: 'pointer', transition: 'all 0.15s' }}>
            {v ? 'Yes' : 'No'}
          </button>
        ))}
      </div>
    </div>
  );

  const DOCUMENT_KEYS = ['aadhaar', 'pan', 'income', 'caste', 'domicile', 'bank', 'ration', 'disability', 'educational', 'land'] as const;
  const DOC_LABELS: Record<string, string> = {
    aadhaar: 'Aadhaar Card', pan: 'PAN Card', income: 'Income Certificate',
    caste: 'Caste Certificate', domicile: 'Domicile Certificate', bank: 'Bank Passbook',
    ration: 'Ration Card', disability: 'Disability Certificate', educational: 'Educational Marksheet', land: 'Land Document',
  };

  return (
    <div style={{ maxWidth: '940px', margin: '0 auto', padding: '28px 16px', animation: ANIM.fadeUp }}>
      <style>{`
        @media (max-width: 600px) {
          .pdb-card { padding: 16px !important; border-radius: 16px !important; }
          .pdb-header-row { flex-direction: column !important; align-items: flex-start !important; }
        }
      `}</style>

      {/* Header */}
      <div className="pdb-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ color: theme.primary, backgroundColor: theme.surfaceSubtle, border: `1.5px solid ${theme.border}`, borderRadius: '13px', padding: '9px', display: 'flex' }}>
            <UserHeaderIcon />
          </div>
          <div>
            <h2 style={{ fontFamily: SERIF, fontSize: '26px', fontWeight: '900', color: theme.textHeading, margin: 0, lineHeight: 1 }}>
              {getTranslation(language, 'profileDashboard')}
            </h2>
            <p style={{ fontSize: '13px', color: theme.textSubtle, margin: '4px 0 0', fontWeight: '500' }}>Your complete welfare profile and eligibility data</p>
          </div>
        </div>
        {!editing ? (
          <button onClick={() => { setSaved(false); setEditing(true); }}
            style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover})`, color: theme.textInverse, border: 'none', borderRadius: '11px', padding: '10px 20px', fontSize: '13.5px', fontWeight: '800', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '7px', boxShadow: '0 4px 12px rgba(113,131,85,0.28)', transition: 'all 0.15s ease' }}>
            <EditIcon /> {getTranslation(language, 'editProfile')}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={handleSave} disabled={saving}
              style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '11px', padding: '10px 20px', fontSize: '13.5px', fontWeight: '800', cursor: saving ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(16,185,129,0.28)' }}>
              <SaveIcon /> {saving ? 'Saving...' : getTranslation(language, 'saveChanges')}
            </button>
            <button onClick={handleCancel}
              style={{ backgroundColor: theme.surfaceSubtle, color: theme.textHeading, border: `1.5px solid ${theme.border}`, borderRadius: '11px', padding: '10px 16px', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer' }}>
              {getTranslation(language, 'cancelEdit')}
            </button>
          </div>
        )}
      </div>

      {saveError && <div style={{ color: '#b91c1c', fontSize: '14px', fontWeight: 600, marginBottom: '16px', padding: '13px 16px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '13px' }}>Warning: {saveError}</div>}
      {saved && <div style={{ color: '#14532d', fontSize: '14px', fontWeight: 700, marginBottom: '16px', padding: '13px 16px', backgroundColor: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckShieldIcon /> Profile saved successfully.</div>}

      {/* 1. Personal Information */}
      <div className="pdb-card" style={card}>
        {sectionTitle('Personal Information', <UserHeaderIcon />)}
        {editing ? (
          <div style={ROW}>
            <div><label style={fieldLabel(theme)}>Full Name</label><input value={name} onChange={e => setName(e.target.value)} style={inputStyle(theme)} placeholder="Your name" /></div>
            <div><label style={fieldLabel(theme)}>Date of Birth</label><input type="date" value={dob} onChange={e => setDob(e.target.value)} style={inputStyle(theme)} /></div>
            {selField('Gender', gender, setGender, [
              { value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' },
              { value: 'Transgender', label: 'Transgender' }, { value: 'Other', label: 'Other' },
              { value: 'Prefer not to say', label: 'Prefer not to say' },
            ])}
            <div><label style={fieldLabel(theme)}>Username</label><input value={username} onChange={e => setUsername(e.target.value)} style={inputStyle(theme)} placeholder="Username" /></div>
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

      {/* 2. Contact */}
      <div className="pdb-card" style={card}>
        {sectionTitle('Contact and Authentication')}
        <div style={ROW}>
          {readField('Email Address', initialProfile.email)}
          {readField('Phone Number', initialProfile.phoneNumber)}
        </div>
        <p style={{ fontSize: '12.5px', color: theme.textMuted, margin: '14px 0 0', lineHeight: '1.5', backgroundColor: theme.surfaceSubtle, padding: '9px 13px', borderRadius: '9px', border: `1px solid ${theme.borderSubtle}` }}>
          Tip: To change your password or security settings, navigate to Password and Security in the menu.
        </p>
      </div>

      {/* 3. Location & Occupation */}
      <div className="pdb-card" style={card}>
        {sectionTitle('Location and Occupation', <MapPinIcon />)}
        {editing ? (
          <div style={ROW}>
            <div>
              <label style={fieldLabel(theme)}>State</label>
              <select value={state} onChange={e => { setState(e.target.value); setDistrict(''); }} style={inputStyle(theme)}>
                <option value="">-- Select State --</option>
                {ALL_INDIAN_STATES_AND_UTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={fieldLabel(theme)}>District</label>
              <select value={district} onChange={e => setDistrict(e.target.value)} style={inputStyle(theme)}>
                <option value="">-- Select District --</option>
                {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            {selField('Employment Status', employmentStatus, setEmploymentStatus, Object.entries(EMPLOYMENT_LABELS).map(([v, l]) => ({ value: v, label: l })))}
            {selField('Annual Income', incomeRange, setIncomeRange, Object.entries(INCOME_LABELS).map(([v, l]) => ({ value: v, label: l })))}
          </div>
        ) : (
          <div style={ROW}>
            {readField('State', initialProfile.state)}
            {readField('District', initialProfile.district)}
            {readField('Employment Status', labelFor(EMPLOYMENT_LABELS, initialProfile.employmentStatus ?? initialProfile.occupation))}
            {readField('Annual Income', labelFor(INCOME_LABELS, initialProfile.incomeRange))}
          </div>
        )}
      </div>

      {/* 4. Socio-Economic Profile */}
      <div className="pdb-card" style={card}>
        {sectionTitle('Socio-Economic Profile', <UsersIcon2 />)}
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={ROW2}>
              {selField('Residence Type', residenceType, setResidenceType, Object.entries(RESIDENCE_LABELS).map(([v, l]) => ({ value: v, label: l })))}
              {selField('Marital Status', maritalStatus, setMaritalStatus, Object.entries(MARITAL_LABELS).map(([v, l]) => ({ value: v, label: l })))}
              {selField('Caste / Category', category, setCategory, Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l })))}
              {selField('BPL / EWS Status', bplEwsStatus, setBplEwsStatus, Object.entries(BPL_LABELS).map(([v, l]) => ({ value: v, label: l })))}
            </div>
            <div style={ROW2}>
              {boolToggle('Has Dependents', hasDependents, setHasDependents)}
              {hasDependents === true && (
                <div>
                  <label style={fieldLabel(theme)}>Number of Dependents</label>
                  <input type="number" min="1" max="20" value={numberOfDependents ?? ''} onChange={e => setNumberOfDependents(Number(e.target.value) || undefined)} style={inputStyle(theme)} />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={ROW}>
            {readField('Residence Type', labelFor(RESIDENCE_LABELS, initialProfile.residenceType))}
            {readField('Marital Status', labelFor(MARITAL_LABELS, initialProfile.maritalStatus))}
            {readField('Caste / Category', labelFor(CATEGORY_LABELS, initialProfile.category))}
            {readField('BPL / EWS Status', labelFor(BPL_LABELS, initialProfile.bplEwsStatus))}
            {readField('Has Dependents', initialProfile.hasDependents === true ? `Yes - ${initialProfile.numberOfDependents ?? '?'} dependent(s)` : initialProfile.hasDependents === false ? 'No' : undefined)}
          </div>
        )}
      </div>

      {/* 5. Education */}
      <div className="pdb-card" style={card}>
        {sectionTitle('Education', <GraduationCapIcon />)}
        {editing ? (
          <div style={ROW}>
            {selField('Education Level', educationLevel, setEducationLevel, Object.entries(EDU_LEVEL_LABELS).map(([v, l]) => ({ value: v, label: l })))}
            {isStudent && selField('Education Stream', educationStream, setEducationStream, Object.entries(EDU_STREAM_LABELS).map(([v, l]) => ({ value: v, label: l })))}
            {isStudent && <div><label style={fieldLabel(theme)}>Current Year / Class</label><input value={currentYearClass} onChange={e => setCurrentYearClass(e.target.value)} style={inputStyle(theme)} placeholder="e.g. 2nd Year, Class 10" /></div>}
          </div>
        ) : (
          <div style={ROW}>
            {readField('Education Level', labelFor(EDU_LEVEL_LABELS, initialProfile.educationLevel))}
            {readField('Education Stream', labelFor(EDU_STREAM_LABELS, initialProfile.educationStream))}
            {readField('Current Year / Class', initialProfile.currentYearClass)}
          </div>
        )}
      </div>

      {/* 6. Agriculture */}
      <div className="pdb-card" style={card}>
        {sectionTitle('Agriculture', <TractorIcon2 />)}
        <p style={{ fontSize: '12.5px', color: theme.textMuted, margin: '-10px 0 16px', lineHeight: 1.5 }}>Relevant for farmers and agricultural workers.</p>
        {editing ? (
          <div style={ROW}>
            {selField('Owns Agricultural Land', ownsAgriculturalLand, setOwnsAgriculturalLand, Object.entries(LAND_LABELS).map(([v, l]) => ({ value: v, label: l })))}
            {ownsAgriculturalLand === 'yes' && selField('Landholding Size', landholdingSize, setLandholdingSize, Object.entries(LANDHOLDING_LABELS).map(([v, l]) => ({ value: v, label: l })))}
            {(isFarmer || ownsAgriculturalLand === 'yes') && selField('Agriculture Activity', agricultureActivityType, setAgricultureActivityType, Object.entries(AGRI_LABELS).map(([v, l]) => ({ value: v, label: l })))}
          </div>
        ) : (
          <div style={ROW}>
            {readField('Owns Agricultural Land', labelFor(LAND_LABELS, initialProfile.ownsAgriculturalLand))}
            {readField('Landholding Size', labelFor(LANDHOLDING_LABELS, initialProfile.landholdingSize))}
            {readField('Agriculture Activity', labelFor(AGRI_LABELS, initialProfile.agricultureActivityType))}
          </div>
        )}
      </div>

      {/* 7. Housing */}
      <div className="pdb-card" style={card}>
        {sectionTitle('Housing', <HomeIcon2 />)}
        {editing ? (
          <div style={ROW}>
            {selField('Housing Situation', housingSituation, setHousingSituation, Object.entries(HOUSING_LABELS).map(([v, l]) => ({ value: v, label: l })))}
            {boolToggle('Owns Residential Land / Plot', ownsResidentialLand, setOwnsResidentialLand)}
          </div>
        ) : (
          <div style={ROW}>
            {readField('Housing Situation', labelFor(HOUSING_LABELS, initialProfile.housingSituation))}
            {readField('Owns Residential Land', initialProfile.ownsResidentialLand === true ? 'Yes' : initialProfile.ownsResidentialLand === false ? 'No' : undefined)}
          </div>
        )}
      </div>

      {/* 8. Business */}
      <div className="pdb-card" style={card}>
        {sectionTitle('Business', <BriefcaseIcon2 />)}
        <p style={{ fontSize: '12.5px', color: theme.textMuted, margin: '-10px 0 16px', lineHeight: 1.5 }}>Relevant for self-employed and business owners.</p>
        {editing ? (
          <div style={ROW}>
            {selField('Business Type', businessType, setBusinessType, Object.entries(BUSINESS_LABELS).map(([v, l]) => ({ value: v, label: l })))}
          </div>
        ) : (
          <div style={ROW}>{readField('Business Type', labelFor(BUSINESS_LABELS, initialProfile.businessType))}</div>
        )}
      </div>

      {/* 9. Disability */}
      <div className="pdb-card" style={card}>
        {sectionTitle('Disability and Accessibility', <AccessibilityIcon2 />)}
        {editing ? (
          <div style={ROW}>
            {boolToggle('Has Disability', disabilityStatus, setDisabilityStatus)}
            {disabilityStatus && selField('Disability Percentage', disabilityPercentage, setDisabilityPercentage, Object.entries(DISABILITY_PCT_LABELS).map(([v, l]) => ({ value: v, label: l })))}
          </div>
        ) : (
          <div style={ROW}>
            {readField('Has Disability', initialProfile.disabilityStatus ? 'Yes' : 'No')}
            {readField('Disability Percentage', labelFor(DISABILITY_PCT_LABELS, initialProfile.disabilityPercentage))}
          </div>
        )}
      </div>

      {/* 10. Documents */}
      <div className="pdb-card" style={card}>
        {sectionTitle('Document Ownership Checklist', <FileCheckIcon />)}
        <p style={{ fontSize: '13px', color: theme.textMuted, margin: '-10px 0 16px', lineHeight: '1.5' }}>
          Mark which certificates and documents you currently possess. IVA uses these to calculate scheme eligibility.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '9px' }}>
          {DOCUMENT_KEYS.map(key => {
            const val = documents[key];
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.surfaceSubtle, borderRadius: '12px', padding: '11px 14px', border: `1px solid ${theme.borderSubtle}` }}>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: theme.textHeading }}>{DOC_LABELS[key]}</span>
                {editing ? (
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {([true, false] as const).map(v => (
                      <button key={String(v)} type="button" onClick={() => setDocuments({ ...documents, [key]: v })}
                        style={{ padding: '3px 11px', borderRadius: '7px', border: `1.5px solid ${val === v ? (v ? '#10b981' : theme.border) : theme.borderSubtle}`, backgroundColor: val === v ? (v ? '#10b981' : theme.surface) : theme.surface, color: val === v ? '#ffffff' : theme.textSubtle, fontSize: '11.5px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.15s' }}>
                        {v ? 'Yes' : 'No'}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '11.5px', fontWeight: '800', color: val === true ? '#15803d' : theme.textSubtle, backgroundColor: val === true ? '#dcfce7' : theme.surface, padding: '3px 11px', borderRadius: '100px', border: `1px solid ${val === true ? '#bbf7d0' : theme.borderSubtle}` }}>
                    {val === true ? 'Ready' : val === false ? 'Not possessed' : 'Not set'}
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
