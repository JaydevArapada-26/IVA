import React, { useEffect, useState } from 'react';
import { ThemeColors } from 'shared/constants/theme';
import { SupportedLanguage, UserProfile, Gender, IncomeRange, Category, Occupation, EligibilityProfileFields, EmploymentStatus } from 'shared/types';
import { getTranslation } from 'shared/i18n/translations';
import { ALL_INDIAN_STATES_AND_UTS, getDistrictsForState } from 'shared/constants/indiaLocationData';
import {
  DOCUMENT_ITEMS,
  RESIDENCE_TYPE_OPTIONS,
  CASTE_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
  BPL_EWS_STATUS_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  DISABILITY_PERCENTAGE_OPTIONS,
  LAND_OWNERSHIP_OPTIONS,
  LANDHOLDING_SIZE_OPTIONS,
  AGRICULTURE_ACTIVITY_TYPE_OPTIONS,
  EDUCATION_STREAM_OPTIONS,
  HOUSING_SITUATION_OPTIONS,
  BUSINESS_TYPE_OPTIONS,
  AGRICULTURE_TRIGGER_EMPLOYMENT_STATUSES,
  BUSINESS_TRIGGER_EMPLOYMENT_STATUSES,
} from 'shared/constants/profileOptions';
import { api } from '../lib/api';
import { supabase } from '../lib/supabaseClient';
import { PHONE_COUNTRY_CODE, toE164, toLocalDigits } from '../lib/phone';

interface ProfileEditViewProps {
  theme: ThemeColors;
  language: SupportedLanguage;
  profile: UserProfile;
  onSave: (updated: Partial<UserProfile>) => void;
  onCancel: () => void;
}

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CheckCircleIcon = ({ color }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: color || '#10b981', flexShrink: 0 }}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

const XCircleIcon = ({ color }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: color || '#94a3b8', flexShrink: 0 }}>
    <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
  </svg>
);

type DocumentKey = 'aadhaar' | 'pan' | 'income' | 'caste' | 'domicile' | 'bank' | 'ration' | 'disability' | 'educational' | 'land';

const fieldLabelStyle: React.CSSProperties = { display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' };

function inputStyle(theme: ThemeColors): React.CSSProperties {
  return {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '10px',
    border: `1.5px solid ${theme.border}`,
    backgroundColor: theme.background,
    color: theme.textHeading,
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
  };
}

function cardStyle(theme: ThemeColors): React.CSSProperties {
  return {
    backgroundColor: theme.surface,
    borderRadius: '18px',
    padding: '20px',
    border: `1.5px solid ${theme.border}`,
    marginBottom: '16px',
  };
}

export const ProfileEditView: React.FC<ProfileEditViewProps> = ({ theme, language, profile, onSave, onCancel }) => {
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // Bulk-saved fields (name, DOB, gender, state, district, occupation, income, disability,
  // username, documents) — everything the signup wizard originally collected.
  const [name, setName] = useState(profile.name ?? '');
  const [username, setUsername] = useState(profile.username ?? '');
  const [dob, setDob] = useState(profile.dob ?? '');
  const [gender, setGender] = useState<Gender>(profile.gender ?? 'Male');
  const [state, setState] = useState(profile.state ?? 'Uttar Pradesh');
  const [district, setDistrict] = useState(profile.district ?? '');
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [incomeRange, setIncomeRange] = useState<IncomeRange>(profile.incomeRange ?? '< 1 Lakh');
  const [disabilityStatus, setDisabilityStatus] = useState(profile.disabilityStatus ?? false);
  const [documents, setDocuments] = useState<Record<DocumentKey, boolean | undefined>>({
    aadhaar: profile.documentsAvailability?.aadhaar,
    pan: profile.documentsAvailability?.pan,
    income: profile.documentsAvailability?.income,
    caste: profile.documentsAvailability?.caste,
    domicile: profile.documentsAvailability?.domicile,
    bank: profile.documentsAvailability?.bank,
    ration: profile.documentsAvailability?.ration,
    disability: profile.documentsAvailability?.disability,
    educational: profile.documentsAvailability?.educational,
    land: profile.documentsAvailability?.land,
  });

  // Signup profile expansion (progressive profiling) — lets existing users complete/update these
  // fields later without re-running signup, per the spec's "existing user preservation" requirement.
  const [residenceType, setResidenceType] = useState<EligibilityProfileFields['residenceType'] | ''>(profile.residenceType ?? '');
  // Caste reuses the pre-existing `category` field (Title-Case, converted server-side via
  // lib/profile-enums.ts categoryToDb/categoryToDto) — same convention this view already uses
  // for gender/occupation/incomeRange below, unlike the newly-added raw-value fields.
  const [category, setCategory] = useState<Category | ''>(profile.category ?? '');
  const [educationLevel, setEducationLevel] = useState<EligibilityProfileFields['educationLevel'] | ''>(profile.educationLevel ?? '');
  const [employmentStatus, setEmploymentStatus] = useState<EligibilityProfileFields['employmentStatus'] | ''>(profile.employmentStatus ?? '');
  const [bplEwsStatus, setBplEwsStatus] = useState<EligibilityProfileFields['bplEwsStatus'] | ''>(profile.bplEwsStatus ?? '');
  const [maritalStatus, setMaritalStatus] = useState<EligibilityProfileFields['maritalStatus'] | ''>(profile.maritalStatus ?? '');
  const [disabilityPercentage, setDisabilityPercentage] = useState<EligibilityProfileFields['disabilityPercentage'] | ''>(profile.disabilityPercentage ?? '');
  const [hasDependents, setHasDependents] = useState<boolean | ''>(profile.hasDependents ?? '');
  const [numberOfDependents, setNumberOfDependents] = useState<string>(profile.numberOfDependents ? String(profile.numberOfDependents) : '');
  const [ownsAgriculturalLand, setOwnsAgriculturalLand] = useState<EligibilityProfileFields['ownsAgriculturalLand'] | ''>(profile.ownsAgriculturalLand ?? '');
  const [landholdingSize, setLandholdingSize] = useState<EligibilityProfileFields['landholdingSize'] | ''>(profile.landholdingSize ?? '');
  const [agricultureActivityType, setAgricultureActivityType] = useState<EligibilityProfileFields['agricultureActivityType'] | ''>(profile.agricultureActivityType ?? '');
  const [educationStream, setEducationStream] = useState<EligibilityProfileFields['educationStream'] | ''>(profile.educationStream ?? '');
  const [currentYearClass, setCurrentYearClass] = useState<string>(profile.currentYearClass ?? '');
  const [housingSituation, setHousingSituation] = useState<EligibilityProfileFields['housingSituation'] | ''>(profile.housingSituation ?? '');
  const [ownsResidentialLand, setOwnsResidentialLand] = useState<boolean | ''>(profile.ownsResidentialLand ?? '');
  const [businessType, setBusinessType] = useState<EligibilityProfileFields['businessType'] | ''>(profile.businessType ?? '');
  const [dailySchemeSmsEnabled, setDailySchemeSmsEnabled] = useState<boolean>(profile.dailySchemeSmsEnabled ?? true);

  const showAgricultureSection = employmentStatus !== '' && AGRICULTURE_TRIGGER_EMPLOYMENT_STATUSES.has(employmentStatus);
  const showStudentSection = employmentStatus === 'student';
  const showBusinessSection = employmentStatus !== '' && BUSINESS_TRIGGER_EMPLOYMENT_STATUSES.has(employmentStatus);

  // Occupation is no longer its own question here either — mirrors AuthPages.tsx's derivation so
  // the legacy `occupation` field (still read by the eligibility/priority engines) stays populated
  // from Employment Status alone, without asking the citizen twice.
  const EMPLOYMENT_STATUS_TO_OCCUPATION: Partial<Record<EmploymentStatus, Occupation>> = {
    student: 'Student',
    self_employed: 'Self-Employed',
    business_owner: 'Self-Employed',
    farmer: 'Farmer',
    agricultural_worker: 'Farmer',
    labour_worker: 'Laborer',
    unemployed: 'Unemployed',
    homemaker: 'Homemaker',
  };
  const derivedOccupation: Occupation | undefined =
    employmentStatus !== '' ? EMPLOYMENT_STATUS_TO_OCCUPATION[employmentStatus] : undefined;

  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load the real, backend-persisted profile on mount — the `profile` prop is just local app
  // state seeded at login and may be stale/incomplete.
  useEffect(() => {
    let cancelled = false;
    api.profile
      .get()
      .then((dto) => {
        if (cancelled) return;
        setName(dto.name ?? '');
        setUsername(dto.username ?? '');
        setDob(dto.dateOfBirth ?? '');
        setGender(dto.gender ?? 'Male');
        setState(dto.state ?? 'Uttar Pradesh');
        setDistrict(dto.district ?? '');
        setIncomeRange(dto.incomeRange ?? '< 1 Lakh');
        setDisabilityStatus(dto.disabilityStatus ?? false);
        setCategory(dto.category ?? '');
        setResidenceType(dto.residenceType ?? '');
        setEducationLevel(dto.educationLevel ?? '');
        setEmploymentStatus(dto.employmentStatus ?? '');
        setBplEwsStatus(dto.bplEwsStatus ?? '');
        setMaritalStatus(dto.maritalStatus ?? '');
        setDisabilityPercentage(dto.disabilityPercentage ?? '');
        setHasDependents(dto.hasDependents ?? '');
        setNumberOfDependents(dto.numberOfDependents ? String(dto.numberOfDependents) : '');
        setOwnsAgriculturalLand(dto.ownsAgriculturalLand ?? '');
        setLandholdingSize(dto.landholdingSize ?? '');
        setAgricultureActivityType(dto.agricultureActivityType ?? '');
        setEducationStream(dto.educationStream ?? '');
        setCurrentYearClass(dto.currentYearClass ?? '');
        setHousingSituation(dto.housingSituation ?? '');
        setOwnsResidentialLand(dto.ownsResidentialLand ?? '');
        setBusinessType(dto.businessType ?? '');
        setDailySchemeSmsEnabled(dto.dailySchemeSmsEnabled ?? true);
        setDocuments({
          aadhaar: dto.documents.aadhaar,
          pan: dto.documents.pan,
          income: dto.documents.income,
          caste: dto.documents.caste,
          domicile: dto.documents.domicile,
          bank: dto.documents.bank,
          ration: dto.documents.ration,
          disability: dto.documents.disability,
          educational: dto.documents.educational,
          land: dto.documents.land,
        });
        setEmailValue(dto.email ?? '');
        setPhoneValue(dto.phoneNumber ? toLocalDigits(dto.phoneNumber) : '');
        setLoadStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setLoadStatus('error');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setAvailableDistricts(getDistrictsForState(state));
  }, [state]);

  const markDirty = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setIsDirty(true);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await api.profile.update({
        name: name.trim(),
        ...(username.trim() ? { username: username.trim() } : {}),
        ...(dob ? { dateOfBirth: dob } : {}),
        gender,
        state,
        district,
        ...(derivedOccupation ? { occupation: derivedOccupation } : {}),
        incomeRange,
        disabilityStatus,
        // Mirrors AuthPages.tsx: studentStatus drives student-scheme matching and is derived
        // strictly from Employment Status, never from Education Level.
        studentStatus: employmentStatus === 'student',
        ...(category ? { category } : {}),
        documents: {
          ...(documents.aadhaar !== undefined ? { aadhaar: documents.aadhaar } : {}),
          ...(documents.pan !== undefined ? { pan: documents.pan } : {}),
          ...(documents.income !== undefined ? { income: documents.income } : {}),
          ...(documents.caste !== undefined ? { caste: documents.caste } : {}),
          ...(documents.domicile !== undefined ? { domicile: documents.domicile } : {}),
          ...(documents.bank !== undefined ? { bank: documents.bank } : {}),
          ...(documents.ration !== undefined ? { ration: documents.ration } : {}),
          ...(documents.disability !== undefined ? { disability: documents.disability } : {}),
          ...(documents.educational !== undefined ? { educational: documents.educational } : {}),
          ...(documents.land !== undefined ? { land: documents.land } : {}),
        },
        // Signup profile expansion (progressive profiling) — values already match the backend's
        // stable enum values 1:1, unlike gender/occupation/incomeRange/category above.
        ...(residenceType ? { residenceType } : {}),
        ...(educationLevel ? { educationLevel } : {}),
        ...(employmentStatus ? { employmentStatus } : {}),
        ...(bplEwsStatus ? { bplEwsStatus } : {}),
        ...(maritalStatus ? { maritalStatus } : {}),
        ...(disabilityStatus && disabilityPercentage ? { disabilityPercentage } : {}),
        ...(hasDependents !== '' ? { hasDependents } : {}),
        ...(hasDependents === true && numberOfDependents ? { numberOfDependents: Number(numberOfDependents) } : {}),
        ...(showAgricultureSection && ownsAgriculturalLand ? { ownsAgriculturalLand } : {}),
        ...(showAgricultureSection && ownsAgriculturalLand === 'yes' && landholdingSize ? { landholdingSize } : {}),
        ...(showAgricultureSection && agricultureActivityType ? { agricultureActivityType } : {}),
        ...(showStudentSection && educationStream ? { educationStream } : {}),
        ...(showStudentSection && currentYearClass.trim() ? { currentYearClass: currentYearClass.trim() } : {}),
        ...(housingSituation ? { housingSituation } : {}),
        ...(ownsResidentialLand !== '' ? { ownsResidentialLand } : {}),
        ...(showBusinessSection && businessType ? { businessType } : {}),
        dailySchemeSmsEnabled,
      });
      setIsDirty(false);
      setSaveSuccess(true);
      onSave({
        name,
        username,
        dob,
        gender,
        state,
        district,
        ...(derivedOccupation ? { occupation: derivedOccupation } : {}),
        incomeRange,
        disabilityStatus,
        ...(category ? { category } : {}),
        documentsAvailability: documents as Record<string, boolean>,
        ...(residenceType ? { residenceType } : {}),
        ...(educationLevel ? { educationLevel } : {}),
        ...(employmentStatus ? { employmentStatus } : {}),
        ...(bplEwsStatus ? { bplEwsStatus } : {}),
        ...(maritalStatus ? { maritalStatus } : {}),
        ...(housingSituation ? { housingSituation } : {}),
        dailySchemeSmsEnabled,
      });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // --- Email change (separate flow — verified via Supabase's own confirmation link) ---
  const [emailValue, setEmailValue] = useState(profile.email ?? '');
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailConfirmSent, setEmailConfirmSent] = useState(false);

  const handleRequestEmailChange = async () => {
    setEmailError(null);
    if (!newEmail.trim() || newEmail.trim() === emailValue) {
      setEmailError('Enter a different email address.');
      return;
    }
    setEmailBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) {
        setEmailError(error.message || 'Could not start the email change.');
        return;
      }
      setEmailConfirmSent(true);
    } finally {
      setEmailBusy(false);
    }
  };

  // --- Phone change (separate flow — verified via OTP re-entry) ---
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');
  const [newPhoneLocal, setNewPhoneLocal] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneChanged, setPhoneChanged] = useState(false);

  const handleRequestPhoneChange = async () => {
    setPhoneError(null);
    if (toLocalDigits(newPhoneLocal).length !== 10) {
      setPhoneError('Enter a valid 10-digit phone number.');
      return;
    }
    setPhoneBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ phone: toE164(newPhoneLocal) });
      if (error) {
        setPhoneError(error.message || 'Could not start the phone change.');
        return;
      }
      setPhoneOtpSent(true);
    } finally {
      setPhoneBusy(false);
    }
  };

  const handleVerifyPhoneChange = async () => {
    setPhoneError(null);
    if (!phoneOtp.trim() || phoneOtp.length < 6) {
      setPhoneError('Enter the 6-digit code sent to your new number.');
      return;
    }
    setPhoneBusy(true);
    try {
      const result = await supabase.auth.verifyOtp({ phone: toE164(newPhoneLocal), token: phoneOtp.trim(), type: 'phone_change' });
      if (result.error || !result.data.session) {
        setPhoneError(result.error?.message || 'Invalid or expired code.');
        return;
      }
      await api.profile.syncIdentity({ supabaseAccessToken: result.data.session.access_token });
      setPhoneValue(toLocalDigits(newPhoneLocal));
      setPhoneChanged(true);
      setEditingPhone(false);
      setPhoneOtpSent(false);
      setNewPhoneLocal('');
      setPhoneOtp('');
      onSave({ phone: toLocalDigits(newPhoneLocal) });
    } finally {
      setPhoneBusy(false);
    }
  };

  // --- Password change (current password re-verified, then updated via Supabase) ---
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordChanged, setPasswordChanged] = useState(false);

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  const isPasswordMatching = confirmNewPassword.length > 0 && newPassword === confirmNewPassword;

  const handleChangePassword = async () => {
    setPasswordError(null);
    if (!currentPassword) {
      setPasswordError('Enter your current password.');
      return;
    }
    if (!isPasswordValid) {
      setPasswordError('New password does not meet all requirements.');
      return;
    }
    if (!isPasswordMatching) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setPasswordBusy(true);
    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({ email: emailValue, password: currentPassword });
      if (verifyError) {
        setPasswordError('Current password is incorrect.');
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setPasswordError(updateError.message || 'Could not update your password.');
        return;
      }
      setPasswordChanged(true);
      setChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } finally {
      setPasswordBusy(false);
    }
  };

  const handleBackAttempt = () => {
    if (isDirty && !window.confirm(getTranslation(language, 'unsavedChangesMsg'))) return;
    onCancel();
  };

  if (loadStatus === 'loading') {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: theme.textMuted }}>Loading your profile…</div>
    );
  }
  if (loadStatus === 'error') {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: theme.alertUrgent }}>Could not load your profile right now.</div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: theme.background, minHeight: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button
          onClick={handleBackAttempt}
          style={{ backgroundColor: theme.surface, color: theme.textHeading, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '8px 14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
        >
          ← Back to Dashboard
        </button>
        <h3 style={{ fontSize: '18px', fontWeight: '800', color: theme.textHeading, margin: 0 }}>{getTranslation(language, 'editProfileTitle')}</h3>
        {isDirty && (
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#d97706', backgroundColor: '#fef3c7', padding: '4px 10px', borderRadius: '12px' }}>Unsaved Changes</span>
        )}
      </div>

      {/* Personal Info */}
      <div style={cardStyle(theme)}>
        <h4 style={{ fontSize: '15px', fontWeight: '800', color: theme.textHeading, margin: '0 0 14px 0' }}>Personal Information</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ ...fieldLabelStyle, color: theme.textMuted }}>Full Name</label>
            <input value={name} onChange={(e) => markDirty(setName)(e.target.value)} style={inputStyle(theme)} />
          </div>
          <div>
            <label style={{ ...fieldLabelStyle, color: theme.textMuted }}>Date of Birth</label>
            <input type="date" value={dob} onChange={(e) => markDirty(setDob)(e.target.value)} style={inputStyle(theme)} />
          </div>
          <div>
            <label style={{ ...fieldLabelStyle, color: theme.textMuted }}>Gender</label>
            <select value={gender} onChange={(e) => markDirty(setGender)(e.target.value as Gender)} style={inputStyle(theme)}>
              {(['Male', 'Female', 'Transgender', 'Other', 'Prefer not to say'] as Gender[]).map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ ...fieldLabelStyle, color: theme.textMuted }}>Username</label>
            <input value={username} onChange={(e) => markDirty(setUsername)(e.target.value)} style={inputStyle(theme)} />
          </div>
        </div>
      </div>

      {/* Account & Security */}
      <div style={cardStyle(theme)}>
        <h4 style={{ fontSize: '15px', fontWeight: '800', color: theme.textHeading, margin: '0 0 14px 0' }}>Account & Security</h4>

        {/* Email */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${theme.border}` }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted }}>Email</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: theme.textHeading }}>{emailValue || 'Not set'}</div>
          </div>
          <button onClick={() => { setEditingEmail((v) => !v); setEmailError(null); setEmailConfirmSent(false); }} style={{ backgroundColor: theme.surfaceSubtle, color: theme.primary, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            Change
          </button>
        </div>
        {editingEmail && (
          <div style={{ padding: '12px 0' }}>
            {emailConfirmSent ? (
              <div style={{ fontSize: '13px', color: '#10b981', fontWeight: 700 }}>
                Confirmation link sent to {newEmail.trim()}. Click it to finish the change.
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="New email address" style={{ ...inputStyle(theme), flex: '1 1 220px' }} />
                <button onClick={handleRequestEmailChange} disabled={emailBusy} style={{ backgroundColor: theme.primary, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 16px', fontWeight: 700, fontSize: '13px', cursor: emailBusy ? 'default' : 'pointer' }}>
                  {emailBusy ? 'Sending…' : 'Send Confirmation'}
                </button>
              </div>
            )}
            {emailError && <div style={{ color: theme.alertUrgent, fontSize: '12.5px', marginTop: '8px', fontWeight: 600 }}>{emailError}</div>}
          </div>
        )}

        {/* Phone */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${theme.border}` }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted }}>Phone Number</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: theme.textHeading }}>{phoneValue ? `${PHONE_COUNTRY_CODE} ${phoneValue}` : 'Not set'}</div>
          </div>
          <button onClick={() => { setEditingPhone((v) => !v); setPhoneError(null); setPhoneOtpSent(false); setPhoneChanged(false); }} style={{ backgroundColor: theme.surfaceSubtle, color: theme.primary, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            Change
          </button>
        </div>
        {editingPhone && (
          <div style={{ padding: '12px 0' }}>
            {!phoneOtpSent ? (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input type="tel" maxLength={10} value={newPhoneLocal} onChange={(e) => setNewPhoneLocal(toLocalDigits(e.target.value))} placeholder="New 10-digit number" style={{ ...inputStyle(theme), flex: '1 1 220px' }} />
                <button onClick={handleRequestPhoneChange} disabled={phoneBusy} style={{ backgroundColor: theme.primary, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 16px', fontWeight: 700, fontSize: '13px', cursor: phoneBusy ? 'default' : 'pointer' }}>
                  {phoneBusy ? 'Sending…' : 'Send OTP'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} maxLength={6} placeholder="6-digit OTP" style={{ ...inputStyle(theme), flex: '1 1 160px' }} />
                <button onClick={handleVerifyPhoneChange} disabled={phoneBusy} style={{ backgroundColor: theme.primary, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 16px', fontWeight: 700, fontSize: '13px', cursor: phoneBusy ? 'default' : 'pointer' }}>
                  {phoneBusy ? 'Verifying…' : 'Verify & Save'}
                </button>
              </div>
            )}
            {phoneError && <div style={{ color: theme.alertUrgent, fontSize: '12.5px', marginTop: '8px', fontWeight: 600 }}>{phoneError}</div>}
          </div>
        )}
        {phoneChanged && !editingPhone && <div style={{ fontSize: '12.5px', color: '#10b981', fontWeight: 700, padding: '4px 0' }}>Phone number updated.</div>}

        {/* Password */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted }}>Password</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: theme.textHeading }}>••••••••</div>
          </div>
          <button onClick={() => { setChangingPassword((v) => !v); setPasswordError(null); setPasswordChanged(false); }} style={{ backgroundColor: theme.surfaceSubtle, color: theme.primary, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            Change Password
          </button>
        </div>
        {changingPassword && (
          <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" style={inputStyle(theme)} />
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" style={inputStyle(theme)} />
            <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Confirm new password" style={inputStyle(theme)} />

            <div style={{ backgroundColor: theme.surfaceSubtle, padding: '10px 12px', borderRadius: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11.5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasMinLength ? '#10b981' : theme.textMuted }}>{hasMinLength ? <CheckCircleIcon /> : <XCircleIcon color={theme.textMuted} />}8+ characters</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasUppercase ? '#10b981' : theme.textMuted }}>{hasUppercase ? <CheckCircleIcon /> : <XCircleIcon color={theme.textMuted} />}Uppercase letter</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasLowercase ? '#10b981' : theme.textMuted }}>{hasLowercase ? <CheckCircleIcon /> : <XCircleIcon color={theme.textMuted} />}Lowercase letter</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasNumber ? '#10b981' : theme.textMuted }}>{hasNumber ? <CheckCircleIcon /> : <XCircleIcon color={theme.textMuted} />}Number</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasSpecial ? '#10b981' : theme.textMuted, gridColumn: 'span 2' }}>{hasSpecial ? <CheckCircleIcon /> : <XCircleIcon color={theme.textMuted} />}Special character</div>
            </div>

            <button onClick={handleChangePassword} disabled={passwordBusy} style={{ backgroundColor: theme.primary, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 16px', fontWeight: 700, fontSize: '13px', cursor: passwordBusy ? 'default' : 'pointer', alignSelf: 'flex-start' }}>
              {passwordBusy ? 'Updating…' : 'Update Password'}
            </button>
            {passwordError && <div style={{ color: theme.alertUrgent, fontSize: '12.5px', fontWeight: 600 }}>{passwordError}</div>}
          </div>
        )}
        {passwordChanged && !changingPassword && <div style={{ fontSize: '12.5px', color: '#10b981', fontWeight: 700, padding: '4px 0' }}>Password updated.</div>}
      </div>

      {/* Location & Work */}
      <div style={cardStyle(theme)}>
        <h4 style={{ fontSize: '15px', fontWeight: '800', color: theme.textHeading, margin: '0 0 14px 0' }}>Location & Work</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ ...fieldLabelStyle, color: theme.textMuted }}>State</label>
            <select value={state} onChange={(e) => markDirty(setState)(e.target.value)} style={inputStyle(theme)}>
              {ALL_INDIAN_STATES_AND_UTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ ...fieldLabelStyle, color: theme.textMuted }}>District</label>
            <select value={district} onChange={(e) => markDirty(setDistrict)(e.target.value)} style={inputStyle(theme)}>
              {availableDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={{ ...fieldLabelStyle, color: theme.textMuted }}>Annual Income</label>
            <select value={incomeRange} onChange={(e) => markDirty(setIncomeRange)(e.target.value as IncomeRange)} style={inputStyle(theme)}>
              {(['< 1 Lakh', '1 - 2.5 Lakhs', '2.5 - 5 Lakhs', '5 - 8 Lakhs', '> 8 Lakhs'] as IncomeRange[]).map((i) => <option key={i} value={i}>₹ {i}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginTop: '14px' }}>
          <label style={{ ...fieldLabelStyle, color: theme.textMuted, marginBottom: '10px' }}>Disability Status</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button type="button" onClick={() => markDirty(setDisabilityStatus)(false)} style={{ padding: '10px', borderRadius: '10px', border: `2px solid ${!disabilityStatus ? theme.primary : theme.border}`, backgroundColor: !disabilityStatus ? theme.surfaceSubtle : theme.background, color: theme.textHeading, fontWeight: 700, fontSize: '13.5px', cursor: 'pointer' }}>No</button>
            <button type="button" onClick={() => markDirty(setDisabilityStatus)(true)} style={{ padding: '10px', borderRadius: '10px', border: `2px solid ${disabilityStatus ? theme.primary : theme.border}`, backgroundColor: disabilityStatus ? theme.surfaceSubtle : theme.background, color: theme.textHeading, fontWeight: 700, fontSize: '13.5px', cursor: 'pointer' }}>Yes</button>
          </div>
        </div>
      </div>

      {/* Eligibility Profile — signup profile expansion, editable later per "existing user
          preservation" requirement. Reuses the same option lists + i18n keys as the signup wizard. */}
      <div style={cardStyle(theme)}>
        <h4 style={{ fontSize: '15px', fontWeight: '800', color: theme.textHeading, margin: '0 0 4px 0' }}>{getTranslation(language, 'regPhase2SectionTitle')}</h4>
        <p style={{ fontSize: '12.5px', color: theme.textMuted, margin: '0 0 14px 0' }}>{getTranslation(language, 'regWhyAsking')}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ ...fieldLabelStyle, color: theme.textMuted }}>{getTranslation(language, 'regResidenceLabel')}</label>
            <select value={residenceType} onChange={(e) => markDirty(setResidenceType)(e.target.value as EligibilityProfileFields['residenceType'] | '')} style={inputStyle(theme)}>
              <option value="">{getTranslation(language, 'profileOptNotSure')}</option>
              {RESIDENCE_TYPE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{getTranslation(language, opt.labelKey)}</option>)}
            </select>
          </div>
          <div>
            <label style={{ ...fieldLabelStyle, color: theme.textMuted }}>{getTranslation(language, 'regCasteLabel')}</label>
            <select value={category} onChange={(e) => markDirty(setCategory)(e.target.value as Category | '')} style={inputStyle(theme)}>
              <option value="">{getTranslation(language, 'profileOptPreferNotToSay')}</option>
              {(['General', 'OBC', 'SC', 'ST', 'EWS', 'Prefer not to say', 'Other'] as Category[]).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ ...fieldLabelStyle, color: theme.textMuted }}>{getTranslation(language, 'regEducationLabel')}</label>
            <select value={educationLevel} onChange={(e) => markDirty(setEducationLevel)(e.target.value as EligibilityProfileFields['educationLevel'] | '')} style={inputStyle(theme)}>
              <option value="">{getTranslation(language, 'profileOptNotSure')}</option>
              {EDUCATION_LEVEL_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{getTranslation(language, opt.labelKey)}</option>)}
            </select>
          </div>
          <div>
            <label style={{ ...fieldLabelStyle, color: theme.textMuted }}>{getTranslation(language, 'regEmploymentStatusLabel')}</label>
            <select value={employmentStatus} onChange={(e) => markDirty(setEmploymentStatus)(e.target.value as EligibilityProfileFields['employmentStatus'] | '')} style={inputStyle(theme)}>
              <option value="">{getTranslation(language, 'profileOptNotSure')}</option>
              {EMPLOYMENT_STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{getTranslation(language, opt.labelKey)}</option>)}
            </select>
          </div>
          <div>
            <label style={{ ...fieldLabelStyle, color: theme.textMuted }}>{getTranslation(language, 'regBplEwsLabel')}</label>
            <select value={bplEwsStatus} onChange={(e) => markDirty(setBplEwsStatus)(e.target.value as EligibilityProfileFields['bplEwsStatus'] | '')} style={inputStyle(theme)}>
              <option value="">{getTranslation(language, 'profileOptNotSure')}</option>
              {BPL_EWS_STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{getTranslation(language, opt.labelKey)}</option>)}
            </select>
          </div>
          <div>
            <label style={{ ...fieldLabelStyle, color: theme.textMuted }}>{getTranslation(language, 'regMaritalStatusLabel')}</label>
            <select value={maritalStatus} onChange={(e) => markDirty(setMaritalStatus)(e.target.value as EligibilityProfileFields['maritalStatus'] | '')} style={inputStyle(theme)}>
              <option value="">{getTranslation(language, 'profileOptPreferNotToSay')}</option>
              {MARITAL_STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{getTranslation(language, opt.labelKey)}</option>)}
            </select>
          </div>
          <div>
            <label style={{ ...fieldLabelStyle, color: theme.textMuted }}>{getTranslation(language, 'regHousingSituationLabel')}</label>
            <select value={housingSituation} onChange={(e) => markDirty(setHousingSituation)(e.target.value as EligibilityProfileFields['housingSituation'] | '')} style={inputStyle(theme)}>
              <option value="">{getTranslation(language, 'profileOptPreferNotToSay')}</option>
              {HOUSING_SITUATION_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{getTranslation(language, opt.labelKey)}</option>)}
            </select>
          </div>
          {disabilityStatus && (
            <div>
              <label style={{ ...fieldLabelStyle, color: theme.textMuted }}>{getTranslation(language, 'regDisabilityPercentageLabel')}</label>
              <select value={disabilityPercentage} onChange={(e) => markDirty(setDisabilityPercentage)(e.target.value as EligibilityProfileFields['disabilityPercentage'] | '')} style={inputStyle(theme)}>
                <option value="">{getTranslation(language, 'profileOptNotSure')}</option>
                {DISABILITY_PERCENTAGE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{getTranslation(language, opt.labelKey)}</option>)}
              </select>
            </div>
          )}
        </div>

        <div style={{ marginTop: '14px' }}>
          <label style={{ ...fieldLabelStyle, color: theme.textMuted }}>{getTranslation(language, 'regDependentsLabel')}</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {([['yes', true], ['no', false], ['prefer', '']] as const).map(([key, val]) => (
              <button
                key={key}
                type="button"
                onClick={() => markDirty(setHasDependents)(val)}
                style={{ padding: '10px', borderRadius: '10px', border: `2px solid ${hasDependents === val ? theme.primary : theme.border}`, backgroundColor: hasDependents === val ? theme.surfaceSubtle : theme.background, color: theme.textHeading, fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
              >
                {getTranslation(language, key === 'yes' ? 'profileOptYes' : key === 'no' ? 'profileOptNo' : 'profileOptPreferNotToSay')}
              </button>
            ))}
          </div>
          {hasDependents === true && (
            <input
              type="number"
              min={0}
              max={20}
              value={numberOfDependents}
              onChange={(e) => markDirty(setNumberOfDependents)(e.target.value)}
              placeholder={getTranslation(language, 'regDependentsCountLabel')}
              style={{ ...inputStyle(theme), marginTop: '10px' }}
            />
          )}
        </div>

        {showAgricultureSection && (
          <div style={{ marginTop: '14px', backgroundColor: theme.surfaceSubtle, borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h5 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: theme.textHeading }}>{getTranslation(language, 'regAgricultureHeading')}</h5>
            <select value={ownsAgriculturalLand} onChange={(e) => markDirty(setOwnsAgriculturalLand)(e.target.value as EligibilityProfileFields['ownsAgriculturalLand'] | '')} style={inputStyle(theme)}>
              <option value="">{getTranslation(language, 'regLandOwnershipLabel')}</option>
              {LAND_OWNERSHIP_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{getTranslation(language, opt.labelKey)}</option>)}
            </select>
            {ownsAgriculturalLand === 'yes' && (
              <select value={landholdingSize} onChange={(e) => markDirty(setLandholdingSize)(e.target.value as EligibilityProfileFields['landholdingSize'] | '')} style={inputStyle(theme)}>
                <option value="">{getTranslation(language, 'regLandholdingLabel')}</option>
                {LANDHOLDING_SIZE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{getTranslation(language, opt.labelKey)}</option>)}
              </select>
            )}
            <select value={agricultureActivityType} onChange={(e) => markDirty(setAgricultureActivityType)(e.target.value as EligibilityProfileFields['agricultureActivityType'] | '')} style={inputStyle(theme)}>
              <option value="">{getTranslation(language, 'regAgricultureActivityLabel')}</option>
              {AGRICULTURE_ACTIVITY_TYPE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{getTranslation(language, opt.labelKey)}</option>)}
            </select>
          </div>
        )}

        {showStudentSection && (
          <div style={{ marginTop: '14px', backgroundColor: theme.surfaceSubtle, borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h5 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: theme.textHeading }}>{getTranslation(language, 'regStudentHeading')}</h5>
            <select value={educationStream} onChange={(e) => markDirty(setEducationStream)(e.target.value as EligibilityProfileFields['educationStream'] | '')} style={inputStyle(theme)}>
              <option value="">{getTranslation(language, 'regEducationStreamLabel')}</option>
              {EDUCATION_STREAM_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{getTranslation(language, opt.labelKey)}</option>)}
            </select>
            <input type="text" value={currentYearClass} onChange={(e) => markDirty(setCurrentYearClass)(e.target.value)} placeholder={getTranslation(language, 'regCurrentYearClassPlaceholder')} style={inputStyle(theme)} />
          </div>
        )}

        {showBusinessSection && (
          <div style={{ marginTop: '14px', backgroundColor: theme.surfaceSubtle, borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h5 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: theme.textHeading }}>{getTranslation(language, 'regBusinessHeading')}</h5>
            <select value={businessType} onChange={(e) => markDirty(setBusinessType)(e.target.value as EligibilityProfileFields['businessType'] | '')} style={inputStyle(theme)}>
              <option value="">{getTranslation(language, 'regBusinessTypeLabel')}</option>
              {BUSINESS_TYPE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{getTranslation(language, opt.labelKey)}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Notification Preferences (Stage 3: daily automated scheme-recommendation SMS) */}
      <div style={cardStyle(theme)}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: theme.textHeading }}>{getTranslation(language, 'dailySchemeSmsLabel')}</div>
            <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '2px' }}>{getTranslation(language, 'dailySchemeSmsDesc')}</div>
          </div>
          <button
            type="button"
            onClick={() => markDirty(setDailySchemeSmsEnabled)(!dailySchemeSmsEnabled)}
            style={{
              width: '46px',
              height: '26px',
              borderRadius: '13px',
              border: 'none',
              backgroundColor: dailySchemeSmsEnabled ? theme.primary : theme.border,
              position: 'relative',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            aria-pressed={dailySchemeSmsEnabled}
          >
            <span style={{ position: 'absolute', top: '3px', left: dailySchemeSmsEnabled ? '23px' : '3px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.15s ease' }} />
          </button>
        </div>
      </div>

      {/* Document Ownership */}
      <div style={cardStyle(theme)}>
        <h4 style={{ fontSize: '15px', fontWeight: '800', color: theme.textHeading, margin: '0 0 4px 0' }}>Document Ownership</h4>
        <p style={{ fontSize: '12.5px', color: theme.textMuted, margin: '0 0 14px 0' }}>
          We only record whether you have each document — never the document itself.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {DOCUMENT_ITEMS.map((doc) => {
            const value = documents[doc.id];
            return (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.surfaceSubtle, borderRadius: '12px', padding: '10px 14px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: theme.textHeading }}>{getTranslation(language, doc.labelKey)}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button type="button" onClick={() => markDirty(setDocuments)({ ...documents, [doc.id]: true })} style={{ padding: '5px 12px', borderRadius: '8px', border: `1px solid ${value === true ? theme.primary : theme.border}`, backgroundColor: value === true ? theme.primary : theme.background, color: value === true ? '#fff' : theme.textHeading, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{getTranslation(language, 'profileOptYes')}</button>
                  <button type="button" onClick={() => markDirty(setDocuments)({ ...documents, [doc.id]: false })} style={{ padding: '5px 12px', borderRadius: '8px', border: `1px solid ${value === false ? theme.textMuted : theme.border}`, backgroundColor: value === false ? theme.surface : theme.background, color: theme.textHeading, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{getTranslation(language, 'profileOptNo')}</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {saveError && <div style={{ color: theme.alertUrgent, fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>{saveError}</div>}
      {saveSuccess && !isDirty && <div style={{ color: '#10b981', fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>Profile saved.</div>}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          style={{
            flex: 1,
            backgroundColor: isDirty ? '#10b981' : theme.surfaceSubtle,
            color: isDirty ? '#ffffff' : theme.textMuted,
            border: 'none',
            padding: '16px',
            borderRadius: '14px',
            fontSize: '16px',
            fontWeight: '800',
            cursor: isDirty && !saving ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <CheckIcon />
          {saving ? 'Saving…' : getTranslation(language, 'saveChanges')}
        </button>
        <button
          onClick={handleBackAttempt}
          style={{ backgroundColor: theme.surfaceSubtle, color: theme.textHeading, border: `1px solid ${theme.border}`, padding: '16px 20px', borderRadius: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
        >
          {getTranslation(language, 'cancel')}
        </button>
      </div>
    </div>
  );
};
