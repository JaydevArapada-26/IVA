import React, { useState } from 'react';
import { ThemeColors, SUPPORTED_LANGUAGES_LIST } from 'shared/constants/theme';
import { SupportedLanguage, UserProfile, Category, IncomeRange, Occupation, Gender } from 'shared/types';

interface WebSchemeWizardProps {
  theme: ThemeColors;
  language: SupportedLanguage;
  profile: UserProfile;
  onSaveProfile: (updated: Partial<UserProfile>) => void;
  onNavigate: (route: string) => void;
}

const GlobeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

export const WebSchemeWizard: React.FC<WebSchemeWizardProps> = ({
  theme,
  language,
  profile,
  onSaveProfile,
  onNavigate,
}) => {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: profile.name || '',
    phone: profile.phone || '',
    state: profile.state || 'Uttar Pradesh',
    district: profile.district || 'Lucknow',
    language: language || 'en',
    age: profile.age || 35,
    gender: profile.gender || 'Female',
    category: profile.category || 'OBC',
    incomeRange: profile.incomeRange || '< 1 Lakh',
    occupation: profile.occupation || 'Farmer',
    farmerStatus: profile.farmerStatus ?? true,
    studentStatus: profile.studentStatus ?? false,
    disabilityStatus: profile.disabilityStatus ?? false,
    seniorCitizenStatus: profile.seniorCitizenStatus ?? false,
  });

  const updateField = (field: keyof UserProfile, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFinish = () => {
    onSaveProfile(formData);
    onNavigate('/login');
  };

  const stepsList = [
    { num: 1, title: 'Location & Language', icon: <GlobeIcon /> },
    { num: 2, title: 'Demographics', icon: <UserIcon /> },
    { num: 3, title: 'Income & Sector', icon: <BriefcaseIcon /> },
    { num: 4, title: 'Eligibility Status', icon: <ShieldCheckIcon /> },
  ];

  return (
    <div style={{ backgroundColor: theme.background, minHeight: 'calc(100vh - 80px)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Wizard Progress Header Bar */}
        <div style={{ backgroundColor: theme.surface, borderRadius: '24px', padding: '24px 32px', border: `1.5px solid ${theme.border}`, marginBottom: '32px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '900', color: theme.textHeading, margin: 0 }}>
              Find Eligible Government Schemes
            </h2>
            <span style={{ fontSize: '14px', fontWeight: '800', color: theme.primary, backgroundColor: theme.surfaceSubtle, padding: '6px 14px', borderRadius: '20px' }}>
              Step {step} of 4
            </span>
          </div>

          {/* Stepper Indicators */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {stepsList.map((s) => (
              <div
                key={s.num}
                onClick={() => setStep(s.num)}
                style={{
                  backgroundColor: step >= s.num ? theme.primary : theme.surfaceSubtle,
                  color: step >= s.num ? '#ffffff' : theme.textMuted,
                  borderRadius: '12px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: step >= s.num ? 'rgba(255,255,255,0.25)' : theme.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                  {s.num}
                </div>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Form Content Card */}
        <div style={{ backgroundColor: theme.surface, borderRadius: '24px', padding: '36px', border: `1.5px solid ${theme.border}`, boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
          {/* STEP 1: LOCATION & LANGUAGE */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: theme.textHeading, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <GlobeIcon /> Step 1: Select Location & Portal Language
              </h3>
              <p style={{ fontSize: '14px', color: theme.textMuted, marginBottom: '24px' }}>
                Government schemes vary by state and region. Tell us where you reside.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: theme.textHeading, marginBottom: '8px' }}>
                    Preferred Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => updateField('language', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      borderRadius: '14px',
                      border: `1.5px solid ${theme.border}`,
                      backgroundColor: theme.background,
                      color: theme.textHeading,
                      fontSize: '15px',
                      fontWeight: '700',
                      outline: 'none',
                    }}
                  >
                    {SUPPORTED_LANGUAGES_LIST.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.nativeName} ({l.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: theme.textHeading, marginBottom: '8px' }}>
                      State / Union Territory
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => updateField('state', e.target.value)}
                      placeholder="e.g. Uttar Pradesh"
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        borderRadius: '14px',
                        border: `1.5px solid ${theme.border}`,
                        backgroundColor: theme.background,
                        color: theme.textHeading,
                        fontSize: '15px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: theme.textHeading, marginBottom: '8px' }}>
                      District
                    </label>
                    <input
                      type="text"
                      value={formData.district}
                      onChange={(e) => updateField('district', e.target.value)}
                      placeholder="e.g. Lucknow"
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        borderRadius: '14px',
                        border: `1.5px solid ${theme.border}`,
                        backgroundColor: theme.background,
                        color: theme.textHeading,
                        fontSize: '15px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DEMOGRAPHICS */}
          {step === 2 && (
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: theme.textHeading, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserIcon /> Step 2: Demographics & Social Category
              </h3>
              <p style={{ fontSize: '14px', color: theme.textMuted, marginBottom: '24px' }}>
                Certain welfare benefits are reserved for specific age groups and social categories.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: theme.textHeading, marginBottom: '8px' }}>
                    Age (Years): <span style={{ color: theme.primary, fontWeight: '800' }}>{formData.age}</span>
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="90"
                    value={formData.age}
                    onChange={(e) => updateField('age', Number(e.target.value))}
                    style={{ width: '100%', accentColor: theme.primary }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: theme.textHeading, marginBottom: '8px' }}>
                    Gender
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {(['Male', 'Female', 'Transgender', 'Other'] as Gender[]).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => updateField('gender', g)}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: '12px',
                          backgroundColor: formData.gender === g ? theme.primary : theme.surfaceSubtle,
                          color: formData.gender === g ? '#ffffff' : theme.textHeading,
                          border: `1.5px solid ${formData.gender === g ? theme.primary : theme.border}`,
                          fontWeight: '700',
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: theme.textHeading, marginBottom: '8px' }}>
                    Social Category
                  </label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {(['General', 'OBC', 'SC', 'ST', 'EWS'] as Category[]).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => updateField('category', cat)}
                        style={{
                          padding: '10px 18px',
                          borderRadius: '12px',
                          backgroundColor: formData.category === cat ? theme.primary : theme.surfaceSubtle,
                          color: formData.category === cat ? '#ffffff' : theme.textHeading,
                          border: `1.5px solid ${formData.category === cat ? theme.primary : theme.border}`,
                          fontWeight: '700',
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: INCOME & OCCUPATION */}
          {step === 3 && (
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: theme.textHeading, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BriefcaseIcon /> Step 3: Annual Household Income & Occupation
              </h3>
              <p style={{ fontSize: '14px', color: theme.textMuted, marginBottom: '24px' }}>
                Financial subsidies and housing grants depend on income caps.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: theme.textHeading, marginBottom: '8px' }}>
                    Annual Household Income Range
                  </label>
                  <select
                    value={formData.incomeRange}
                    onChange={(e) => updateField('incomeRange', e.target.value as IncomeRange)}
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      borderRadius: '14px',
                      border: `1.5px solid ${theme.border}`,
                      backgroundColor: theme.background,
                      color: theme.textHeading,
                      fontSize: '15px',
                      fontWeight: '700',
                      outline: 'none',
                    }}
                  >
                    {['< 1 Lakh', '1 - 2.5 Lakhs', '2.5 - 5 Lakhs', '5 - 8 Lakhs', '> 8 Lakhs'].map((inc) => (
                      <option key={inc} value={inc}>{inc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: theme.textHeading, marginBottom: '8px' }}>
                    Primary Occupation / Sector
                  </label>
                  <select
                    value={formData.occupation}
                    onChange={(e) => updateField('occupation', e.target.value as Occupation)}
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      borderRadius: '14px',
                      border: `1.5px solid ${theme.border}`,
                      backgroundColor: theme.background,
                      color: theme.textHeading,
                      fontSize: '15px',
                      fontWeight: '700',
                      outline: 'none',
                    }}
                  >
                    {['Farmer', 'Laborer', 'Student', 'Self-Employed', 'Unemployed', 'Private Sector', 'Government Sector', 'Homemaker'].map((occ) => (
                      <option key={occ} value={occ}>{occ}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: ELIGIBILITY STATUS */}
          {step === 4 && (
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: theme.textHeading, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheckIcon /> Step 4: Special Status Criteria
              </h3>
              <p style={{ fontSize: '14px', color: theme.textMuted, marginBottom: '24px' }}>
                Select all applicable categories for additional specialized grants.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                {[
                  { key: 'farmerStatus', label: 'Landholding Farmer / PM-KISAN Beneficiary' },
                  { key: 'studentStatus', label: 'Enrolled Student / Scholarship Applicant' },
                  { key: 'disabilityStatus', label: 'Person with Disability (Divyangjan)' },
                  { key: 'seniorCitizenStatus', label: 'Senior Citizen (60+ Years Old)' },
                ].map((item) => {
                  const val = !!formData[item.key as keyof UserProfile];
                  return (
                    <div
                      key={item.key}
                      onClick={() => updateField(item.key as keyof UserProfile, !val)}
                      style={{
                        backgroundColor: val ? theme.surfaceSubtle : theme.background,
                        border: `2px solid ${val ? theme.primary : theme.border}`,
                        borderRadius: '16px',
                        padding: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={val}
                        onChange={() => {}}
                        style={{ width: '20px', height: '20px', accentColor: theme.primary }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: '700', color: theme.textHeading }}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Wizard Action Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', paddingTop: '20px', borderTop: `1px solid ${theme.border}` }}>
            <button
              onClick={() => step > 1 && setStep(step - 1)}
              disabled={step === 1}
              style={{
                backgroundColor: theme.surfaceSubtle,
                color: theme.textHeading,
                border: `1.5px solid ${theme.border}`,
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: step === 1 ? 'not-allowed' : 'pointer',
                opacity: step === 1 ? 0.5 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <ArrowLeftIcon />
              Back
            </button>

            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                style={{
                  backgroundColor: theme.primary,
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                }}
              >
                <span>Next Step</span>
                <ArrowRightIcon />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                style={{
                  backgroundColor: theme.primary,
                  color: '#ffffff',
                  border: 'none',
                  padding: '14px 32px',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
                }}
              >
                <span>Proceed to Sign In & View Schemes</span>
                <ArrowRightIcon />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
