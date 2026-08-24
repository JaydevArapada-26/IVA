import React, { useState, useEffect } from 'react';
import { ThemeColors } from 'shared/constants/theme';
import { SupportedLanguage, UserProfile, Gender, Occupation, EligibilityProfileFields, EmploymentStatus } from 'shared/types';
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
import { supabase, setRememberMePreference } from '../lib/supabaseClient';
import { api, setAuthToken } from '../lib/api';
import { ApiError } from 'shared/api-client';
import { savePendingSignup, clearPendingSignup, type PendingSignup } from '../lib/pendingSignup';
import { PHONE_COUNTRY_CODE, toE164, toLocalDigits } from '../lib/phone';
import { saveRememberedAccount, clearRememberedAccount } from '../lib/rememberedAccount';
import { markLoginTimestamp } from '../lib/sessionTimeout';

interface AuthPagesProps {
  theme: ThemeColors;
  language: SupportedLanguage;
  initialMode?: 'login' | 'register';
  onAuthenticated: (profile: Partial<UserProfile>) => void;
}

// Clean inline SVG Icons (No emojis per guidelines)
const UserAvatarIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const CheckCircleIcon = ({ color }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: color || '#10b981', flexShrink: 0 }}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

const XCircleIcon = ({ color }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: color || '#ef4444', flexShrink: 0 }}>
    <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
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

const DocumentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

export const AuthPages: React.FC<AuthPagesProps> = ({
  theme,
  language,
  initialMode = 'login',
  onAuthenticated,
}) => {
  const [viewMode, setViewMode] = useState<'login' | 'register' | 'forgotPassword'>(initialMode);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [forgotPasswordBusy, setForgotPasswordBusy] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);
  const [regPhase, setRegPhase] = useState<number>(1);

  // Sign In Form State
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loginOtp, setLoginOtp] = useState('');
  const [loginRememberMe, setLoginRememberMe] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [awaitingEmailConfirmation, setAwaitingEmailConfirmation] = useState(false);
  const [confirmationResent, setConfirmationResent] = useState(false);
  const [confirmedElsewhere, setConfirmedElsewhere] = useState(false);
  // Resend OTP cooldown
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  // Phase 1 Registration Form State
  const [regFullName, setRegFullName] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regGender, setRegGender] = useState<Gender>('Male');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [regRememberMe, setRegRememberMe] = useState(false);

  // Phase 2 Registration Form State — no pre-filled defaults, citizen must actively choose each one.
  const [selectedState, setSelectedState] = useState<string>('');
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [regAnnualIncome, setRegAnnualIncome] = useState<string>('');
  const [regDisability, setRegDisability] = useState<boolean>(false);

  // Signup profile expansion (progressive profiling) — all optional, no pre-filled defaults.
  const [regResidenceType, setRegResidenceType] = useState<EligibilityProfileFields['residenceType'] | ''>('');
  const [regCaste, setRegCaste] = useState<string>('');
  const [regEducationLevel, setRegEducationLevel] = useState<EligibilityProfileFields['educationLevel'] | ''>('');
  const [regEmploymentStatus, setRegEmploymentStatus] = useState<EligibilityProfileFields['employmentStatus'] | ''>('');
  const [regBplEwsStatus, setRegBplEwsStatus] = useState<EligibilityProfileFields['bplEwsStatus'] | ''>('');
  const [regMaritalStatus, setRegMaritalStatus] = useState<EligibilityProfileFields['maritalStatus'] | ''>('');
  const [regDisabilityPercentage, setRegDisabilityPercentage] = useState<EligibilityProfileFields['disabilityPercentage'] | ''>('');
  const [regHasDependents, setRegHasDependents] = useState<boolean | ''>('');
  const [regNumberOfDependents, setRegNumberOfDependents] = useState<string>('');

  // Conditional: Agriculture profile
  const [regOwnsAgriculturalLand, setRegOwnsAgriculturalLand] = useState<EligibilityProfileFields['ownsAgriculturalLand'] | ''>('');
  const [regLandholdingSize, setRegLandholdingSize] = useState<EligibilityProfileFields['landholdingSize'] | ''>('');
  const [regAgricultureActivityType, setRegAgricultureActivityType] = useState<EligibilityProfileFields['agricultureActivityType'] | ''>('');

  // Conditional: Student profile
  const [regEducationStream, setRegEducationStream] = useState<EligibilityProfileFields['educationStream'] | ''>('');
  const [regCurrentYearClass, setRegCurrentYearClass] = useState<string>('');

  // Housing profile (shown for everyone — no hard trigger per spec)
  const [regHousingSituation, setRegHousingSituation] = useState<EligibilityProfileFields['housingSituation'] | ''>('');
  const [regOwnsResidentialLand, setRegOwnsResidentialLand] = useState<boolean | ''>('');

  // Conditional: Business / entrepreneurship profile
  const [regBusinessType, setRegBusinessType] = useState<EligibilityProfileFields['businessType'] | ''>('');

  const showAgricultureSection = regEmploymentStatus !== '' && AGRICULTURE_TRIGGER_EMPLOYMENT_STATUSES.has(regEmploymentStatus);
  const showStudentSection = regEmploymentStatus === 'student';
  const showBusinessSection = regEmploymentStatus !== '' && BUSINESS_TRIGGER_EMPLOYMENT_STATUSES.has(regEmploymentStatus);

  // Occupation is no longer its own signup question — the citizen only picks Current Employment
  // Status now. This derives the legacy `occupation` field (still used by the eligibility and
  // priority engines' occupation-match logic) from that single answer wherever the mapping is
  // unambiguous; left unset when it genuinely isn't (e.g. "Employed" could be private or
  // government sector — guessing would be worse than leaving it blank).
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
    regEmploymentStatus !== '' ? EMPLOYMENT_STATUS_TO_OCCUPATION[regEmploymentStatus] : undefined;

  // Phase 3 Registration Form State (Document Checklist Map)
  const [documentsMap, setDocumentsMap] = useState<Record<string, boolean>>({
    aadhaar: true,
    pan: false,
    income: false,
    caste: false,
    domicile: false,
    bank: true,
    ration: false,
    disability: false,
    educational: false,
    land: false,
  });

  // Password Policy live validation
  const hasMinLength = regPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(regPassword);
  const hasLowercase = /[a-z]/.test(regPassword);
  const hasNumber = /[0-9]/.test(regPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(regPassword);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  const isPasswordMatching = regConfirmPassword.length > 0 && regPassword === regConfirmPassword;

  // Update the district options whenever state changes — deliberately not auto-selecting the
  // first one, so district stays on its placeholder until the citizen actively picks it.
  useEffect(() => {
    setAvailableDistricts(selectedState ? getDistrictsForState(selectedState) : []);
    setSelectedDistrict('');
  }, [selectedState]);

  // Polls the database (not just this tab's own auth state) for whether signup has completed —
  // necessary because the confirmation link almost always opens in a NEW tab, which this tab has
  // no direct way to observe. Once the account shows up, try to pick up a session in THIS tab too
  // (works when "Remember me" was checked, since that puts the session in shared localStorage);
  // otherwise fall back to telling the citizen to sign in.
  useEffect(() => {
    if (!awaitingEmailConfirmation) return;
    const email = regEmail.trim();
    if (!email) return;

    const interval = setInterval(async () => {
      try {
        const { exists } = await api.auth.checkAccount({ email });
        if (!exists) return;
        clearInterval(interval);
        clearPendingSignup();

        const { data } = await supabase.auth.getSession();
        if (data.session) {
          try {
            const session = await api.auth.sessionExchange({ supabaseAccessToken: data.session.access_token });
            setAuthToken(session.token);
            markLoginTimestamp();
            if (regRememberMe) saveRememberedAccount(regEmail.trim());
            onAuthenticated({
              ...(session.displayName ? { name: session.displayName } : {}),
              phoneVerified: true,
              onboardingCompleted: true,
            });
            return;
          } catch {
            // Fall through to the "confirmed elsewhere" message below.
          }
        }
        setConfirmedElsewhere(true);
      } catch {
        // Transient network/poll failure — just try again on the next tick.
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [awaitingEmailConfirmation, regEmail]);

  // Handle Sign In Submission (Step 1: Credentials -> Step 2: OTP Verification)
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!otpSent) {
      // Set before any OTP send — Supabase writes the session to storage at verifyOtp time, and
      // this must already be in place by then so the session lands in the right storage backend.
      setRememberMePreference(loginRememberMe);
      if (loginMethod === 'email') {
        if (!loginEmail.trim() || !loginPassword.trim()) {
          setAuthError('Please enter both email and password.');
          return;
        }
        setAuthBusy(true);
        try {
          // Check first so a login for an unknown email never wastes an OTP send.
          const { exists } = await api.auth.checkAccount({ email: loginEmail.trim() });
          if (!exists) {
            setAuthError('No IVA account found for this email. Please sign up first.');
            return;
          }

          // Verifies the password without keeping that session — the final session comes from
          // the OTP step below, so a stolen/guessed password alone can never sign someone in.
          const { error: passwordError } = await supabase.auth.signInWithPassword({
            email: loginEmail.trim(),
            password: loginPassword,
          });
          if (passwordError) {
            setAuthError(passwordError.message || 'Invalid email or password.');
            return;
          }
          const { error: otpError } = await supabase.auth.signInWithOtp({ email: loginEmail.trim() });
          if (otpError) {
            setAuthError(otpError.message || 'Could not send the email OTP. Please try again.');
            return;
          }
          setOtpSent(true);
        } catch {
          setAuthError('Could not verify this account right now. Please try again.');
        } finally {
          setAuthBusy(false);
        }
      } else {
        if (toLocalDigits(loginPhone).length !== 10) {
          setAuthError('Please enter a valid 10-digit phone number.');
          return;
        }
        setAuthBusy(true);
        try {
          const { exists } = await api.auth.checkAccount({ phone: toE164(loginPhone) });
          if (!exists) {
            setAuthError('No IVA account found for this phone number. Please sign up first.');
            return;
          }

          const { error } = await supabase.auth.signInWithOtp({ phone: toE164(loginPhone) });
          if (error) {
            setAuthError(error.message || 'Could not send the SMS OTP. Please try again.');
            return;
          }
          setOtpSent(true);
        } catch {
          setAuthError('Could not verify this account right now. Please try again.');
        } finally {
          setAuthBusy(false);
        }
      }
      return;
    }

    // Step 2: OTP verification -> exchange for an IVA session
    if (!loginOtp.trim() || loginOtp.length < 6) {
      setAuthError('Please enter a valid 6-digit OTP code.');
      return;
    }

    setAuthBusy(true);
    try {
      const verifyResult =
        loginMethod === 'email'
          ? await supabase.auth.verifyOtp({ email: loginEmail.trim(), token: loginOtp.trim(), type: 'email' })
          : await supabase.auth.verifyOtp({ phone: toE164(loginPhone), token: loginOtp.trim(), type: 'sms' });

      if (verifyResult.error || !verifyResult.data.session) {
        setAuthError(verifyResult.error?.message || 'Invalid or expired OTP.');
        return;
      }

      const accessToken = verifyResult.data.session.access_token;
      try {
        const session = await api.auth.sessionExchange({ supabaseAccessToken: accessToken, rememberMe: loginRememberMe });
        setAuthToken(session.token);
        markLoginTimestamp();
        if (loginRememberMe) {
          saveRememberedAccount(loginMethod === 'email' ? loginEmail.trim() : `${PHONE_COUNTRY_CODE} ${loginPhone}`);
        } else {
          clearRememberedAccount();
        }
        onAuthenticated({
          ...(session.displayName ? { name: session.displayName } : {}),
          phoneVerified: true,
          onboardingCompleted: true,
        });
      } catch (exchangeError) {
        await supabase.auth.signOut();
        if (exchangeError instanceof ApiError && exchangeError.code === 'NOT_FOUND') {
          setAuthError('No IVA account found for this login. Please sign up first.');
        } else {
          setAuthError('Could not complete sign-in. Please try again.');
        }
      }
    } finally {
      setAuthBusy(false);
    }
  };

  // Resend OTP handler (shared for email + phone OTP flow)
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resendStatus === 'sending') return;
    setResendStatus('sending');
    setAuthError(null);
    try {
      if (loginMethod === 'email') {
        const { error } = await supabase.auth.signInWithOtp({ email: loginEmail.trim() });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithOtp({ phone: toE164(loginPhone) });
        if (error) throw error;
      }
      setResendStatus('success');
      // Start 30-second cooldown
      setResendCooldown(30);
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
      setTimeout(() => setResendStatus('idle'), 3000);
    } catch {
      setResendStatus('error');
      setTimeout(() => setResendStatus('idle'), 4000);
    }
  };

  // Phase 1 Validation -> Next Step
  const handlePhase1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!regFullName.trim()) {
      setAuthError(getTranslation(language, 'errNameRequired'));
      return;
    }
    if (!regDob) {
      setAuthError(getTranslation(language, 'errDobRequired'));
      return;
    }
    if (!regEmail.trim()) {
      setAuthError(getTranslation(language, 'errEmailRequired'));
      return;
    }
    if (toLocalDigits(regPhone).length !== 10) {
      setAuthError(getTranslation(language, 'errPhoneInvalid'));
      return;
    }
    if (!regUsername.trim()) {
      setAuthError(getTranslation(language, 'errUsernameRequired'));
      return;
    }
    if (!isPasswordValid) {
      setAuthError(getTranslation(language, 'errPasswordRequirements'));
      return;
    }
    if (!isPasswordMatching) {
      setAuthError(getTranslation(language, 'regPasswordMismatch'));
      return;
    }

    setRegPhase(2);
  };

  // Phase 2 Next Step
  const handlePhase2Next = () => {
    setAuthError(null);
    if (!selectedState) {
      setAuthError(getTranslation(language, 'errStateRequired'));
      return;
    }
    if (!selectedDistrict) {
      setAuthError(getTranslation(language, 'errDistrictRequired'));
      return;
    }
    if (!regEmploymentStatus) {
      setAuthError(getTranslation(language, 'errOccupationRequired'));
      return;
    }
    if (!regAnnualIncome) {
      setAuthError(getTranslation(language, 'errIncomeRequired'));
      return;
    }
    setRegPhase(3);
  };

  // Phase 3 Finish Registration -> Route to Dashboard
  const GENDER_TO_BACKEND: Record<Gender, string> = {
    Male: 'male',
    Female: 'female',
    Transgender: 'transgender',
    Other: 'other',
    'Prefer not to say': 'prefer_not_to_say',
  };

  const OCCUPATION_TO_BACKEND: Record<Occupation, string> = {
    Farmer: 'farmer',
    Laborer: 'laborer',
    Student: 'student',
    'Self-Employed': 'self_employed',
    Unemployed: 'unemployed',
    'Private Sector': 'private_sector',
    'Government Sector': 'government_sector',
    Homemaker: 'homemaker',
  };

  function incomeToBackend(label: string): string {
    if (label.includes('Below') || label.includes('< 1')) return 'lt_1_lakh';
    if (label.includes('1') && label.includes('3')) return '1_to_25_lakh';
    if (label.includes('3') && label.includes('5')) return '25_to_5_lakh';
    if (label.includes('5') && label.includes('8')) return '5_to_8_lakh';
    return 'gt_8_lakh';
  }

  const buildPendingSignup = (): PendingSignup => ({
    displayName: regFullName.trim(),
    username: regUsername.trim(),
    phoneNumber: toE164(regPhone),
    email: regEmail.trim(),
    profile: {
      dateOfBirth: regDob,
      gender: GENDER_TO_BACKEND[regGender],
      state: selectedState,
      district: selectedDistrict,
      incomeRange: incomeToBackend(regAnnualIncome),
      ...(derivedOccupation ? { occupation: OCCUPATION_TO_BACKEND[derivedOccupation] } : {}),
      disabilityStatus: regDisability,
      documents: documentsMap,
      // Signup profile expansion (progressive profiling) — values already match the backend's
      // stable enum values 1:1 (see packages/shared/constants/profileOptions.ts), so no UI-label
      // lookup table is needed here, unlike gender/occupation/income above.
      ...(regResidenceType ? { residenceType: regResidenceType } : {}),
      ...(regCaste ? { category: regCaste } : {}),
      ...(regEducationLevel ? { educationLevel: regEducationLevel } : {}),
      ...(regEmploymentStatus ? { employmentStatus: regEmploymentStatus } : {}),
      // studentStatus drives student-scheme matching throughout the eligibility engine — derived
      // strictly from Employment Status, never from Education Level (a postgraduate who is
      // currently unemployed, for example, should not be treated as a student).
      studentStatus: regEmploymentStatus === 'student',
      ...(regBplEwsStatus ? { bplEwsStatus: regBplEwsStatus } : {}),
      ...(regMaritalStatus ? { maritalStatus: regMaritalStatus } : {}),
      ...(regDisability && regDisabilityPercentage ? { disabilityPercentage: regDisabilityPercentage } : {}),
      ...(regHasDependents !== '' ? { hasDependents: regHasDependents } : {}),
      ...(regHasDependents === true && regNumberOfDependents ? { numberOfDependents: Number(regNumberOfDependents) } : {}),
      ...(showAgricultureSection && regOwnsAgriculturalLand ? { ownsAgriculturalLand: regOwnsAgriculturalLand } : {}),
      ...(showAgricultureSection && regOwnsAgriculturalLand === 'yes' && regLandholdingSize
        ? { landholdingSize: regLandholdingSize }
        : {}),
      ...(showAgricultureSection && regAgricultureActivityType ? { agricultureActivityType: regAgricultureActivityType } : {}),
      ...(showStudentSection && regEducationStream ? { educationStream: regEducationStream } : {}),
      ...(showStudentSection && regCurrentYearClass.trim() ? { currentYearClass: regCurrentYearClass.trim() } : {}),
      ...(regHousingSituation ? { housingSituation: regHousingSituation } : {}),
      ...(regOwnsResidentialLand !== '' ? { ownsResidentialLand: regOwnsResidentialLand } : {}),
      ...(showBusinessSection && regBusinessType ? { businessType: regBusinessType } : {}),
    },
    rememberMe: regRememberMe,
  });

  const completeSignupWithToken = async (accessToken: string, pending: PendingSignup) => {
    const session = await api.auth.signupComplete({ supabaseAccessToken: accessToken, ...pending });
    setAuthToken(session.token);
    markLoginTimestamp();
    if (pending.rememberMe) saveRememberedAccount(pending.email);
    onAuthenticated({
      name: pending.displayName,
      dob: regDob,
      gender: regGender,
      email: pending.email,
      phone: toLocalDigits(regPhone),
      username: regUsername.trim(),
      state: selectedState,
      district: selectedDistrict,
      ...(derivedOccupation ? { occupation: derivedOccupation } : {}),
      annualIncome: regAnnualIncome,
      disabilityStatus: regDisability,
      documentsAvailability: documentsMap,
      consentGiven: true,
      phoneVerified: true,
      onboardingCompleted: true,
    });
  };

  const handleCompleteRegistration = async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      // Set before signUp() — if email confirmation is required, the actual session write
      // happens later (in a possibly different tab, when the confirmation link is opened), and
      // that tab reads this same localStorage flag to decide where to persist the session.
      setRememberMePreference(regRememberMe);

      const pending = buildPendingSignup();

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: regEmail.trim(),
        password: regPassword,
        options: {
          emailRedirectTo: new URL('/auth/callback', window.location.origin).toString(),
          data: {
            displayName: pending.displayName,
            username: pending.username,
            phoneNumber: pending.phoneNumber,
            // email is stored explicitly in metadata so the /auth/callback page can reconstruct
            // the pending signup payload when localStorage is unavailable (e.g. confirmation link
            // opened on a different device or in an incognito/private browser tab).
            email: pending.email,
            profile: pending.profile,
            rememberMe: pending.rememberMe,
          },
        },
      });
      if (signUpError) {
        setAuthError(signUpError.message || 'Could not create your account. Please try again.');
        return;
      }

      if (!signUpData.session) {
        // Confirm-email is enabled on this Supabase project — no session yet. Save the profile
        // fields so they survive the redirect, and wait for the confirmation click (detected by
        // the app-level onAuthStateChange listener) to finish the signup automatically.
        savePendingSignup(pending);
        setAwaitingEmailConfirmation(true);
        return;
      }

      // Deliberately not linking the phone number to this Supabase identity via updateUser() —
      // that requires its own OTP re-verification to actually attach, and phone login doesn't
      // need it anyway: sessionExchange matches purely on users.phoneNumber against whatever
      // Supabase identity a future phone-OTP login authenticates as (see auth.route.ts). Doing
      // it here just added an unverified, error-prone step for no benefit.
      try {
        await completeSignupWithToken(signUpData.session.access_token, pending);
      } catch (completeError) {
        if (completeError instanceof ApiError && completeError.code === 'CONFLICT') {
          setAuthError(completeError.message);
        } else {
          setAuthError('Could not finish setting up your profile. Please try again.');
        }
      }
    } catch (unexpected) {
      // Without this, a thrown error (network failure, Supabase client exception, etc.) would
      // silently reject the promise — the button would reset via `finally` below with no
      // indication to the citizen of what went wrong.
      setAuthError(unexpected instanceof Error ? unexpected.message : 'Something went wrong creating your account. Please try again.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleResendConfirmation = async () => {
    setAuthBusy(true);
    setConfirmationResent(false);
    try {
      await supabase.auth.resend({
        type: 'signup',
        email: regEmail.trim(),
        options: {
          emailRedirectTo: new URL('/auth/callback', window.location.origin).toString(),
        },
      });
      setConfirmationResent(true);
    } catch {
      setAuthError('Could not resend the confirmation email. Please try again shortly.');
    } finally {
      setAuthBusy(false);
    }
  };

  const toggleDocumentStatus = (docId: string, val: boolean) => {
    setDocumentsMap((prev) => ({ ...prev, [docId]: val }));
  };

  const handleSendPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordError(null);
    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordError('Please enter your email address.');
      return;
    }
    setForgotPasswordBusy(true);
    try {
      // Supabase's own reset flow — deliberately not checking checkAccount() first, so this
      // never leaks which emails have an account (unlike login, this is a public, unauthenticated
      // form). Supabase itself no-ops silently for unknown emails.
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail.trim(), {
        redirectTo: new URL('/auth/callback', window.location.origin).toString(),
      });
      if (error) {
        setForgotPasswordError(error.message || 'Could not send the reset email. Please try again.');
        return;
      }
      setForgotPasswordSent(true);
    } finally {
      setForgotPasswordBusy(false);
    }
  };

  return (
    <div style={{ backgroundColor: theme.background, minHeight: 'calc(100vh - 80px)', padding: '40px 24px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      
      {/* SIGN IN VIEW */}
      {viewMode === 'login' && (
        <div
          style={{
            backgroundColor: theme.surface,
            borderRadius: '24px',
            padding: '40px 36px',
            border: `1.5px solid ${theme.border}`,
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
            textAlign: 'center',
          }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: theme.surfaceSubtle, color: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <UserAvatarIcon />
          </div>

          <h2 style={{ fontSize: '26px', fontWeight: '900', color: theme.textHeading, margin: '0 0 6px 0' }}>
            {otpSent ? 'Enter OTP Verification Code' : (getTranslation(language, 'verifyPhone') || 'Sign In to IVA')}
          </h2>
          <p style={{ fontSize: '14px', color: theme.textMuted, margin: '0 0 20px 0', lineHeight: '1.4' }}>
            {otpSent
              ? 'Enter the 6-digit security code we just sent you.'
              : 'Choose how you’d like to sign in.'}
          </p>

          {!otpSent && (
            <div style={{ display: 'flex', borderRadius: '14px', backgroundColor: theme.surfaceSubtle, padding: '4px', marginBottom: '20px' }}>
              {(['email', 'phone'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setLoginMethod(m); setAuthError(null); }}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: loginMethod === m ? theme.primary : 'transparent',
                    color: loginMethod === m ? '#ffffff' : theme.textMuted,
                    fontWeight: 800,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                  }}
                >
                  {m === 'email' ? 'Email & Password' : 'Phone Number'}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSignInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px', textAlign: 'left' }}>
            {!otpSent && loginMethod === 'email' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: theme.textHeading, marginBottom: '6px' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: `1.5px solid ${theme.border}`,
                      backgroundColor: theme.background,
                      color: theme.textHeading,
                      fontSize: '15px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Password with Toggle Visibility */}
                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: theme.textHeading, marginBottom: '6px' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 46px 12px 16px',
                        borderRadius: '12px',
                        border: `1.5px solid ${theme.border}`,
                        backgroundColor: theme.background,
                        color: theme.textHeading,
                        fontSize: '15px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: theme.textMuted,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {showLoginPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {!otpSent && loginMethod === 'phone' && (
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: theme.textHeading, marginBottom: '6px' }}>
                  Phone Number
                </label>
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 14px',
                      borderRadius: '12px 0 0 12px',
                      border: `1.5px solid ${theme.border}`,
                      borderRight: 'none',
                      backgroundColor: theme.surfaceSubtle,
                      color: theme.textHeading,
                      fontSize: '15px',
                      fontWeight: '700',
                    }}
                  >
                    {PHONE_COUNTRY_CODE}
                  </span>
                  <input
                    type="tel"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(toLocalDigits(e.target.value))}
                    placeholder="XXXXXXXXXX"
                    maxLength={10}
                    required
                    style={{
                      flex: 1,
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '0 12px 12px 0',
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
            )}

            {!otpSent && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: '700', color: theme.textHeading, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={loginRememberMe}
                  onChange={(e) => setLoginRememberMe(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: theme.primary }}
                />
                Remember me on this device
              </label>
            )}

            {!otpSent && loginMethod === 'email' && (
              <button
                type="button"
                onClick={() => { setViewMode('forgotPassword'); setForgotPasswordEmail(loginEmail); setForgotPasswordSent(false); setForgotPasswordError(null); }}
                style={{ background: 'none', border: 'none', color: theme.primary, fontWeight: '700', fontSize: '13px', cursor: 'pointer', textAlign: 'left', padding: 0 }}
              >
                Forgot password?
              </button>
            )}

            {otpSent && (
              /* OTP VERIFICATION STEP - NO MOBILE NUMBER DISPLAYED */
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: theme.textHeading, marginBottom: '6px' }}>
                  6-Digit OTP Security Code
                </label>
                <input
                  type="text"
                  value={loginOtp}
                  onChange={(e) => setLoginOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP code"
                  maxLength={6}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: `1.5px solid ${theme.border}`,
                    backgroundColor: theme.background,
                    color: theme.textHeading,
                    fontSize: '18px',
                    fontWeight: '800',
                    letterSpacing: '4px',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
                {/* Resend OTP */}
                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                  {resendStatus === 'success' ? (
                    <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '700' }}>
                      ✓ {getTranslation(language, 'otpCodeSent')}
                    </span>
                  ) : resendStatus === 'error' ? (
                    <span style={{ fontSize: '13px', color: theme.alertUrgent, fontWeight: '600' }}>
                      {getTranslation(language, 'otpResendError')}
                    </span>
                  ) : resendCooldown > 0 ? (
                    <span style={{ fontSize: '13px', color: theme.textMuted, fontWeight: '600' }}>
                      {getTranslation(language, 'otpResendIn')} {resendCooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendStatus === 'sending'}
                      style={{
                        background: 'none', border: 'none',
                        color: resendStatus === 'sending' ? theme.textMuted : theme.primary,
                        fontWeight: '700', fontSize: '13px',
                        cursor: resendStatus === 'sending' ? 'default' : 'pointer',
                        padding: 0,
                      }}
                    >
                      {resendStatus === 'sending' ? '...' : getTranslation(language, 'otpResendBtn')}
                    </button>
                  )}
                </div>
              </div>
            )}

            {authError && (
              <div style={{ color: theme.alertUrgent, fontSize: '13.5px', fontWeight: '600' }}>{authError}</div>
            )}

            <button
              type="submit"
              disabled={authBusy}
              style={{
                backgroundColor: theme.primary,
                color: '#ffffff',
                border: 'none',
                padding: '14px',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: '800',
                cursor: authBusy ? 'default' : 'pointer',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
                opacity: authBusy ? 0.6 : 1,
              }}
            >
              <span>{authBusy ? 'Processing...' : otpSent ? 'Verify OTP & Open Dashboard' : 'Sign In'}</span>
              <ArrowRightIcon />
            </button>
          </form>

          {/* New User Link */}
          <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: `1px solid ${theme.border}`, fontSize: '14px', color: theme.textMuted }}>
            New User?{' '}
            <button
              onClick={() => { setViewMode('register'); setRegPhase(1); setAuthError(null); }}
              style={{ background: 'none', border: 'none', color: theme.primary, fontWeight: '800', cursor: 'pointer', fontSize: '14px' }}
            >
              Register & Set Up Profile →
            </button>
          </div>
        </div>
      )}

      {/* FORGOT PASSWORD VIEW — Supabase's own reset-email flow, no custom reset logic. */}
      {viewMode === 'forgotPassword' && (
        <div
          style={{
            backgroundColor: theme.surface,
            borderRadius: '24px',
            padding: '40px 36px',
            border: `1.5px solid ${theme.border}`,
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
          }}
        >
          <h2 style={{ fontSize: '24px', fontWeight: '900', color: theme.textHeading, margin: '0 0 8px 0', textAlign: 'center' }}>
            Reset Your Password
          </h2>
          <p style={{ fontSize: '14px', color: theme.textMuted, margin: '0 0 24px 0', textAlign: 'center', lineHeight: '1.5' }}>
            Enter your account email and we'll send you a link to reset your password.
          </p>

          {forgotPasswordSent ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: theme.textBody, marginBottom: '24px' }}>
                If an account exists for <strong>{forgotPasswordEmail.trim()}</strong>, a reset link has been sent.
              </p>
              <button
                onClick={() => { setViewMode('login'); setForgotPasswordSent(false); }}
                style={{ width: '100%', backgroundColor: theme.primary, color: '#ffffff', border: 'none', padding: '14px', borderRadius: '14px', fontSize: '15px', fontWeight: '800', cursor: 'pointer' }}
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendPasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: theme.textHeading, marginBottom: '6px' }}>Email</label>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  placeholder="Enter your account email"
                  required
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1.5px solid ${theme.border}`, backgroundColor: theme.background, color: theme.textHeading, fontSize: '15px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              {forgotPasswordError && <div style={{ color: theme.alertUrgent, fontSize: '13.5px', fontWeight: '600' }}>{forgotPasswordError}</div>}

              <button
                type="submit"
                disabled={forgotPasswordBusy}
                style={{ backgroundColor: theme.primary, color: '#ffffff', border: 'none', padding: '14px', borderRadius: '14px', fontSize: '16px', fontWeight: '800', cursor: forgotPasswordBusy ? 'default' : 'pointer', opacity: forgotPasswordBusy ? 0.7 : 1 }}
              >
                {forgotPasswordBusy ? 'Sending…' : 'Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => setViewMode('login')}
                style={{ background: 'none', border: 'none', color: theme.textMuted, fontWeight: '700', fontSize: '13.5px', cursor: 'pointer' }}
              >
                ← Back to Sign In
              </button>
            </form>
          )}
        </div>
      )}

      {/* EMAIL CONFIRMATION PROMPT — shown after signUp() when Supabase requires email confirmation.
          This tab polls the database every few seconds (via checkAccount) for whether the account
          now exists, since the confirmation link almost always opens in a different tab that this
          one can't otherwise observe. See the useEffect above for the poll + same-tab session pickup. */}
      {viewMode === 'register' && awaitingEmailConfirmation && !confirmedElsewhere && (
        <div
          style={{
            backgroundColor: theme.surface,
            borderRadius: '24px',
            padding: '40px 36px',
            border: `1.5px solid ${theme.border}`,
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
            textAlign: 'center',
          }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: theme.surfaceSubtle, color: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <DocumentIcon />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '900', color: theme.textHeading, margin: '0 0 10px 0' }}>
            Confirm Your Email
          </h2>
          <p style={{ fontSize: '14px', color: theme.textMuted, margin: '0 0 8px 0', lineHeight: '1.5' }}>
            We sent a confirmation link to <strong style={{ color: theme.textHeading }}>{regEmail.trim()}</strong>.
            Click it to activate your account — this page checks automatically and will sign you in
            the moment it's confirmed.
          </p>

          {confirmationResent && (
            <div style={{ color: '#10b981', fontSize: '13px', fontWeight: '700', marginTop: '10px' }}>
              Confirmation email resent.
            </div>
          )}
          {authError && (
            <div style={{ color: theme.alertUrgent, fontSize: '13.5px', fontWeight: '600', marginTop: '10px' }}>{authError}</div>
          )}

          <button
            onClick={handleResendConfirmation}
            disabled={authBusy}
            style={{
              marginTop: '20px',
              backgroundColor: theme.surfaceSubtle,
              color: theme.primary,
              border: `1.5px solid ${theme.border}`,
              padding: '12px 20px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '800',
              cursor: authBusy ? 'default' : 'pointer',
              width: '100%',
            }}
          >
            {authBusy ? 'Sending...' : 'Resend Confirmation Email'}
          </button>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${theme.border}`, fontSize: '13.5px', color: theme.textMuted }}>
            Wrong email?{' '}
            <button
              onClick={() => { setAwaitingEmailConfirmation(false); setAuthError(null); setConfirmationResent(false); }}
              style={{ background: 'none', border: 'none', color: theme.primary, fontWeight: '800', cursor: 'pointer', fontSize: '13.5px' }}
            >
              Go back
            </button>
          </div>
        </div>
      )}

      {/* Reached when the poll above confirms the account exists in the database, but this
          specific tab has no Supabase session of its own to pick up (remember-me was off, or the
          confirmation happened in a different browser) — the citizen must sign in manually here. */}
      {viewMode === 'register' && awaitingEmailConfirmation && confirmedElsewhere && (
        <div
          style={{
            backgroundColor: theme.surface,
            borderRadius: '24px',
            padding: '40px 36px',
            border: `1.5px solid ${theme.border}`,
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
            textAlign: 'center',
          }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: theme.surfaceSubtle, color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircleIcon />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '900', color: theme.textHeading, margin: '0 0 10px 0' }}>
            Email Confirmed
          </h2>
          <p style={{ fontSize: '14px', color: theme.textMuted, margin: '0 0 20px 0', lineHeight: '1.5' }}>
            Your account is ready. Sign in with the email and password you just created.
          </p>
          <button
            onClick={() => {
              setLoginEmail(regEmail.trim());
              setLoginMethod('email');
              setViewMode('login');
              setAwaitingEmailConfirmation(false);
              setConfirmedElsewhere(false);
              setAuthError(null);
            }}
            style={{
              backgroundColor: theme.primary,
              color: '#ffffff',
              border: 'none',
              padding: '14px',
              borderRadius: '14px',
              fontSize: '15px',
              fontWeight: '800',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Continue to Sign In
          </button>
        </div>
      )}

      {/* 3-PHASE REGISTRATION WIZARD */}
      {viewMode === 'register' && !awaitingEmailConfirmation && (
        <div
          style={{
            backgroundColor: theme.surface,
            borderRadius: '24px',
            padding: '36px 40px',
            border: `1.5px solid ${theme.border}`,
            maxWidth: '680px',
            width: '100%',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ color: theme.primary, display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
              <UserAvatarIcon />
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: '900', color: theme.textHeading, margin: '0 0 6px 0' }}>
              {getTranslation(language, 'regHeading')}
            </h2>
            <div style={{ fontSize: '13.5px', color: theme.textMuted, fontWeight: '600', marginBottom: '16px' }}>
              {getTranslation(language, regPhase === 1 ? 'regPhase1Header' : regPhase === 2 ? 'regPhase2Header' : 'regPhase3Header')}
            </div>

            {/* Stepper Progress Bar */}
            <div style={{ width: '100%', backgroundColor: theme.surfaceSubtle, height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  backgroundColor: theme.primary,
                  width: regPhase === 1 ? '33.3%' : regPhase === 2 ? '66.6%' : '100%',
                  transition: 'all 0.3s ease',
                }}
              />
            </div>

            {/* Shown regardless of which phase is active, so a signup failure on the final
                submit (Phase 3) is never silently swallowed. */}
            {authError && (
              <div style={{ marginTop: '16px', color: theme.alertUrgent, fontSize: '13.5px', fontWeight: '600', textAlign: 'left' }}>
                {authError}
              </div>
            )}
          </div>

          {/* PHASE 1: ACCOUNT & PERSONAL INFO */}
          {regPhase === 1 && (
            <form onSubmit={handlePhase1Next} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: theme.textHeading, margin: '0 0 4px 0' }}>
                {getTranslation(language, 'regPhase1SectionTitle')}
              </h3>

              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: theme.textHeading, marginBottom: '6px' }}>
                  {getTranslation(language, 'regFullNameLabel')}
                </label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder={getTranslation(language, 'regFullNamePlaceholder')}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: `1.5px solid ${theme.border}`,
                    backgroundColor: theme.background,
                    color: theme.textHeading,
                    fontSize: '14.5px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              {/* DOB & Gender */}
              <div className="responsive-auth-grid-2" style={{ gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: theme.textHeading, marginBottom: '6px' }}>
                    {getTranslation(language, 'regDobLabel')}
                  </label>
                  <input
                    type="date"
                    value={regDob}
                    onChange={(e) => setRegDob(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: `1.5px solid ${theme.border}`,
                      backgroundColor: theme.background,
                      color: theme.textHeading,
                      fontSize: '14.5px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: theme.textHeading, marginBottom: '6px' }}>
                    {getTranslation(language, 'regGenderLabel')}
                  </label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value as Gender)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: `1.5px solid ${theme.border}`,
                      backgroundColor: theme.background,
                      color: theme.textHeading,
                      fontSize: '14.5px',
                      fontWeight: '600',
                      outline: 'none',
                    }}
                  >
                    <option value="Male">{getTranslation(language, 'genderOptMale')}</option>
                    <option value="Female">{getTranslation(language, 'genderOptFemale')}</option>
                    <option value="Transgender">{getTranslation(language, 'genderOptTransgender')}</option>
                    <option value="Other">{getTranslation(language, 'profileOptOther')}</option>
                    <option value="Prefer not to say">{getTranslation(language, 'profileOptPreferNotToSay')}</option>
                  </select>
                </div>
              </div>

              {/* Email & Phone */}
              <div className="responsive-auth-grid-2" style={{ gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: theme.textHeading, marginBottom: '6px' }}>
                    {getTranslation(language, 'regEmailLabel')}
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder={getTranslation(language, 'regEmailPlaceholder')}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: `1.5px solid ${theme.border}`,
                      backgroundColor: theme.background,
                      color: theme.textHeading,
                      fontSize: '14.5px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: theme.textHeading, marginBottom: '6px' }}>
                    {getTranslation(language, 'regPhoneLabel')}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 12px',
                        borderRadius: '10px 0 0 10px',
                        border: `1.5px solid ${theme.border}`,
                        borderRight: 'none',
                        backgroundColor: theme.surfaceSubtle,
                        color: theme.textHeading,
                        fontSize: '14.5px',
                        fontWeight: '700',
                      }}
                    >
                      {PHONE_COUNTRY_CODE}
                    </span>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(toLocalDigits(e.target.value))}
                      placeholder={getTranslation(language, 'regPhonePlaceholder')}
                      maxLength={10}
                      required
                      style={{
                        flex: 1,
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '0 10px 10px 0',
                        border: `1.5px solid ${theme.border}`,
                        backgroundColor: theme.background,
                        color: theme.textHeading,
                        fontSize: '14.5px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Username */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: theme.textHeading, marginBottom: '6px' }}>
                  {getTranslation(language, 'regUsernameLabel')}
                </label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder={getTranslation(language, 'regUsernamePlaceholder')}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: `1.5px solid ${theme.border}`,
                    backgroundColor: theme.background,
                    color: theme.textHeading,
                    fontSize: '14.5px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: theme.textHeading, marginBottom: '6px' }}>
                  {getTranslation(language, 'regPasswordLabel')}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder={getTranslation(language, 'regPasswordPlaceholder')}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 46px 12px 16px',
                      borderRadius: '10px',
                      border: `1.5px solid ${theme.border}`,
                      backgroundColor: theme.background,
                      color: theme.textHeading,
                      fontSize: '14.5px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: theme.textMuted,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showRegPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>

                {/* Password Policy Live Checklist */}
                <div className="responsive-auth-grid-2" style={{ marginTop: '10px', backgroundColor: theme.surfaceSubtle, padding: '12px 14px', borderRadius: '10px', gap: '8px', fontSize: '12.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasMinLength ? '#10b981' : theme.textMuted }}>
                    {hasMinLength ? <CheckCircleIcon /> : <XCircleIcon color={theme.textMuted} />}
                    <span>{getTranslation(language, 'regPasswordCheckMinLength')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasUppercase ? '#10b981' : theme.textMuted }}>
                    {hasUppercase ? <CheckCircleIcon /> : <XCircleIcon color={theme.textMuted} />}
                    <span>{getTranslation(language, 'regPasswordCheckUppercase')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasLowercase ? '#10b981' : theme.textMuted }}>
                    {hasLowercase ? <CheckCircleIcon /> : <XCircleIcon color={theme.textMuted} />}
                    <span>{getTranslation(language, 'regPasswordCheckLowercase')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasNumber ? '#10b981' : theme.textMuted }}>
                    {hasNumber ? <CheckCircleIcon /> : <XCircleIcon color={theme.textMuted} />}
                    <span>{getTranslation(language, 'regPasswordCheckNumber')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasSpecial ? '#10b981' : theme.textMuted, gridColumn: 'span 2' }}>
                    {hasSpecial ? <CheckCircleIcon /> : <XCircleIcon color={theme.textMuted} />}
                    <span>{getTranslation(language, 'regPasswordCheckSpecial')}</span>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: theme.textHeading, marginBottom: '6px' }}>
                  {getTranslation(language, 'regConfirmPasswordLabel')}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder={getTranslation(language, 'regConfirmPasswordPlaceholder')}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 46px 12px 16px',
                      borderRadius: '10px',
                      border: `1.5px solid ${regConfirmPassword ? (isPasswordMatching ? '#10b981' : theme.alertUrgent) : theme.border}`,
                      backgroundColor: theme.background,
                      color: theme.textHeading,
                      fontSize: '14.5px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: theme.textMuted,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {regConfirmPassword.length > 0 && !isPasswordMatching && (
                  <div style={{ color: theme.alertUrgent, fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>
                    {getTranslation(language, 'regPasswordMismatch')}
                  </div>
                )}
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: '700', color: theme.textHeading, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={regRememberMe}
                  onChange={(e) => setRegRememberMe(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: theme.primary }}
                />
                {getTranslation(language, 'regRememberMeLabel')}
              </label>

              {/* Next Step Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: theme.primary,
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px 28px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>{getTranslation(language, 'regProceedPhase2')}</span>
                  <ArrowRightIcon />
                </button>
              </div>
            </form>
          )}

          {/* PHASE 2: DEMOGRAPHICS & SOCIO-ECONOMIC DETAILS */}
          {regPhase === 2 && (() => {
            const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13.5px', fontWeight: '700', color: theme.textHeading, marginBottom: '6px' };
            const selectStyle: React.CSSProperties = {
              width: '100%',
              padding: '12px 16px',
              borderRadius: '10px',
              border: `1.5px solid ${theme.border}`,
              backgroundColor: theme.background,
              color: theme.textHeading,
              fontSize: '14.5px',
              fontWeight: 600,
              outline: 'none',
            };
            const conditionalCardStyle: React.CSSProperties = {
              backgroundColor: theme.surfaceSubtle,
              borderRadius: '14px',
              padding: '16px 18px',
              border: `1.5px solid ${theme.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            };
            const sectionHeadingStyle: React.CSSProperties = { fontSize: '14.5px', fontWeight: '800', color: theme.textHeading, margin: 0 };

            return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: theme.textHeading, margin: '0 0 4px 0' }}>
                  {getTranslation(language, 'regPhase2SectionTitle')}
                </h3>
                <p style={{ fontSize: '12.5px', color: theme.textMuted, margin: 0 }}>{getTranslation(language, 'regWhyAsking')}</p>
              </div>

              {/* State & District Dropdowns */}
              <div className="responsive-auth-grid-2" style={{ gap: '16px' }}>
                <div>
                  <label style={labelStyle}>{getTranslation(language, 'regStateLabel')}</label>
                  <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} style={selectStyle}>
                    <option value="" disabled>{getTranslation(language, 'regStatePlaceholder')}</option>
                    {ALL_INDIAN_STATES_AND_UTS.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>{getTranslation(language, 'regDistrictLabel')}</label>
                  <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} disabled={!selectedState} style={selectStyle}>
                    <option value="" disabled>
                      {getTranslation(language, selectedState ? 'regDistrictPlaceholder' : 'regDistrictPlaceholderNoState')}
                    </option>
                    {availableDistricts.map((dist) => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rural / Urban Residence */}
              <div>
                <label style={labelStyle}>{getTranslation(language, 'regResidenceLabel')}</label>
                <div className="responsive-auth-grid-2" style={{ gap: '16px' }}>
                  {RESIDENCE_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRegResidenceType(opt.value)}
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        border: `2px solid ${regResidenceType === opt.value ? theme.primary : theme.border}`,
                        backgroundColor: regResidenceType === opt.value ? theme.surfaceSubtle : theme.background,
                        color: theme.textHeading,
                        fontWeight: 700,
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      {getTranslation(language, opt.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Employment Status — replaces the old separate Occupation question; its
                  options are merged in here (see EMPLOYMENT_STATUS_TO_OCCUPATION above), and this
                  is also the sole source of studentStatus (never educationLevel). */}
              <div>
                <label style={labelStyle}>{getTranslation(language, 'regEmploymentStatusLabel')}</label>
                <select
                  value={regEmploymentStatus}
                  onChange={(e) => setRegEmploymentStatus(e.target.value as EligibilityProfileFields['employmentStatus'] | '')}
                  style={selectStyle}
                >
                  <option value="">{getTranslation(language, 'regOccupationPlaceholder')}</option>
                  {EMPLOYMENT_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{getTranslation(language, opt.labelKey)}</option>
                  ))}
                </select>
              </div>

              {/* Annual Income */}
              <div>
                <label style={labelStyle}>{getTranslation(language, 'regIncomeLabel')}</label>
                <select value={regAnnualIncome} onChange={(e) => setRegAnnualIncome(e.target.value)} style={selectStyle}>
                  <option value="" disabled>{getTranslation(language, 'regIncomePlaceholder')}</option>
                  <option value="Below ₹1 Lakh">{getTranslation(language, 'incomeOptBelow1')}</option>
                  <option value="₹1-2.5 Lakhs">{getTranslation(language, 'incomeOpt1to25')}</option>
                  <option value="₹2.5-5 Lakhs">{getTranslation(language, 'incomeOpt25to5')}</option>
                  <option value="₹5-8 Lakhs">{getTranslation(language, 'incomeOpt5to8')}</option>
                  <option value="Above ₹8 Lakhs">{getTranslation(language, 'incomeOptAbove8')}</option>
                </select>
              </div>

              {/* BPL / EWS status — kept separate from income, per spec */}
              <div>
                <label style={labelStyle}>{getTranslation(language, 'regBplEwsLabel')}</label>
                <select
                  value={regBplEwsStatus}
                  onChange={(e) => setRegBplEwsStatus(e.target.value as EligibilityProfileFields['bplEwsStatus'] | '')}
                  style={selectStyle}
                >
                  <option value="">{getTranslation(language, 'profileOptNotSure')}</option>
                  {BPL_EWS_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{getTranslation(language, opt.labelKey)}</option>
                  ))}
                </select>
              </div>

              {/* Caste */}
              <div>
                <label style={labelStyle}>{getTranslation(language, 'regCasteLabel')}</label>
                <select value={regCaste} onChange={(e) => setRegCaste(e.target.value)} style={selectStyle}>
                  <option value="">{getTranslation(language, 'profileOptPreferNotToSay')}</option>
                  {CASTE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{getTranslation(language, opt.labelKey)}</option>
                  ))}
                </select>
              </div>

              {/* Education level + student status */}
              <div>
                <label style={labelStyle}>{getTranslation(language, 'regEducationLabel')}</label>
                <select
                  value={regEducationLevel}
                  onChange={(e) => setRegEducationLevel(e.target.value as EligibilityProfileFields['educationLevel'] | '')}
                  style={selectStyle}
                >
                  <option value="">{getTranslation(language, 'profileOptNotSure')}</option>
                  {EDUCATION_LEVEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{getTranslation(language, opt.labelKey)}</option>
                  ))}
                </select>
              </div>

              {/* Marital status */}
              <div>
                <label style={labelStyle}>{getTranslation(language, 'regMaritalStatusLabel')}</label>
                <select
                  value={regMaritalStatus}
                  onChange={(e) => setRegMaritalStatus(e.target.value as EligibilityProfileFields['maritalStatus'] | '')}
                  style={selectStyle}
                >
                  <option value="">{getTranslation(language, 'profileOptPreferNotToSay')}</option>
                  {MARITAL_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{getTranslation(language, opt.labelKey)}</option>
                  ))}
                </select>
              </div>

              {/* Children / dependents */}
              <div>
                <label style={labelStyle}>{getTranslation(language, 'regDependentsLabel')}</label>
                <div className="responsive-auth-grid-3" style={{ gap: '12px' }}>
                  {([['yes', true], ['no', false], ['prefer', '']] as const).map(([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setRegHasDependents(val)}
                      style={{
                        padding: '10px',
                        borderRadius: '12px',
                        border: `2px solid ${regHasDependents === val ? theme.primary : theme.border}`,
                        backgroundColor: regHasDependents === val ? theme.surfaceSubtle : theme.background,
                        color: theme.textHeading,
                        fontWeight: 700,
                        fontSize: '13.5px',
                        cursor: 'pointer',
                      }}
                    >
                      {getTranslation(language, key === 'yes' ? 'profileOptYes' : key === 'no' ? 'profileOptNo' : 'profileOptPreferNotToSay')}
                    </button>
                  ))}
                </div>
                {regHasDependents === true && (
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={regNumberOfDependents}
                    onChange={(e) => setRegNumberOfDependents(e.target.value)}
                    placeholder={getTranslation(language, 'regDependentsCountLabel')}
                    style={{ ...selectStyle, marginTop: '10px', fontWeight: 400 }}
                  />
                )}
              </div>

              {/* Disability Status */}
              <div>
                <label style={{ ...labelStyle, marginBottom: '10px' }}>{getTranslation(language, 'regDisabilityLabel')}</label>
                <div className="responsive-auth-grid-2" style={{ gap: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setRegDisability(false)}
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      border: `2px solid ${!regDisability ? theme.primary : theme.border}`,
                      backgroundColor: !regDisability ? theme.surfaceSubtle : theme.background,
                      color: theme.textHeading,
                      fontWeight: '800',
                      fontSize: '15px',
                      cursor: 'pointer',
                    }}
                  >
                    {getTranslation(language, 'regDisabilityNo')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegDisability(true)}
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      border: `2px solid ${regDisability ? theme.primary : theme.border}`,
                      backgroundColor: regDisability ? theme.surfaceSubtle : theme.background,
                      color: theme.textHeading,
                      fontWeight: '800',
                      fontSize: '15px',
                      cursor: 'pointer',
                    }}
                  >
                    {getTranslation(language, 'regDisabilityYes')}
                  </button>
                </div>
                {/* Disability percentage — application-readiness detail only, never a hard filter */}
                {regDisability && (
                  <select
                    value={regDisabilityPercentage}
                    onChange={(e) => setRegDisabilityPercentage(e.target.value as EligibilityProfileFields['disabilityPercentage'] | '')}
                    style={{ ...selectStyle, marginTop: '10px' }}
                  >
                    <option value="">{getTranslation(language, 'regDisabilityPercentageLabel')}</option>
                    {DISABILITY_PERCENTAGE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{getTranslation(language, opt.labelKey)}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Conditional: Agriculture profile */}
              {showAgricultureSection && (
                <div style={conditionalCardStyle}>
                  <h4 style={sectionHeadingStyle}>{getTranslation(language, 'regAgricultureHeading')}</h4>
                  <div>
                    <label style={labelStyle}>{getTranslation(language, 'regLandOwnershipLabel')}</label>
                    <select
                      value={regOwnsAgriculturalLand}
                      onChange={(e) => setRegOwnsAgriculturalLand(e.target.value as EligibilityProfileFields['ownsAgriculturalLand'] | '')}
                      style={selectStyle}
                    >
                      <option value="">{getTranslation(language, 'profileOptNotSure')}</option>
                      {LAND_OWNERSHIP_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{getTranslation(language, opt.labelKey)}</option>
                      ))}
                    </select>
                  </div>
                  {regOwnsAgriculturalLand === 'yes' && (
                    <div>
                      <label style={labelStyle}>{getTranslation(language, 'regLandholdingLabel')}</label>
                      <select
                        value={regLandholdingSize}
                        onChange={(e) => setRegLandholdingSize(e.target.value as EligibilityProfileFields['landholdingSize'] | '')}
                        style={selectStyle}
                      >
                        <option value="">{getTranslation(language, 'profileOptNotSure')}</option>
                        {LANDHOLDING_SIZE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{getTranslation(language, opt.labelKey)}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label style={labelStyle}>{getTranslation(language, 'regAgricultureActivityLabel')}</label>
                    <select
                      value={regAgricultureActivityType}
                      onChange={(e) => setRegAgricultureActivityType(e.target.value as EligibilityProfileFields['agricultureActivityType'] | '')}
                      style={selectStyle}
                    >
                      <option value="">{getTranslation(language, 'profileOptNotSure')}</option>
                      {AGRICULTURE_ACTIVITY_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{getTranslation(language, opt.labelKey)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Conditional: Student profile */}
              {showStudentSection && (
                <div style={conditionalCardStyle}>
                  <h4 style={sectionHeadingStyle}>{getTranslation(language, 'regStudentHeading')}</h4>
                  <div>
                    <label style={labelStyle}>{getTranslation(language, 'regEducationStreamLabel')}</label>
                    <select
                      value={regEducationStream}
                      onChange={(e) => setRegEducationStream(e.target.value as EligibilityProfileFields['educationStream'] | '')}
                      style={selectStyle}
                    >
                      <option value="">{getTranslation(language, 'profileOptNotSure')}</option>
                      {EDUCATION_STREAM_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{getTranslation(language, opt.labelKey)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>{getTranslation(language, 'regCurrentYearClassLabel')}</label>
                    <input
                      type="text"
                      value={regCurrentYearClass}
                      onChange={(e) => setRegCurrentYearClass(e.target.value)}
                      placeholder={getTranslation(language, 'regCurrentYearClassPlaceholder')}
                      style={{ ...selectStyle, fontWeight: 400 }}
                    />
                  </div>
                </div>
              )}

              {/* Housing profile — shown for everyone, no hard trigger */}
              <div style={conditionalCardStyle}>
                <h4 style={sectionHeadingStyle}>{getTranslation(language, 'regHousingHeading')}</h4>
                <div>
                  <label style={labelStyle}>{getTranslation(language, 'regHousingSituationLabel')}</label>
                  <select
                    value={regHousingSituation}
                    onChange={(e) => setRegHousingSituation(e.target.value as EligibilityProfileFields['housingSituation'] | '')}
                    style={selectStyle}
                  >
                    <option value="">{getTranslation(language, 'profileOptPreferNotToSay')}</option>
                    {HOUSING_SITUATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{getTranslation(language, opt.labelKey)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>{getTranslation(language, 'regOwnsResidentialLandLabel')}</label>
                  <div className="responsive-auth-grid-3" style={{ gap: '12px' }}>
                    {([['yes', true], ['no', false], ['notSure', '']] as const).map(([key, val]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setRegOwnsResidentialLand(val)}
                        style={{
                          padding: '10px',
                          borderRadius: '12px',
                          border: `2px solid ${regOwnsResidentialLand === val ? theme.primary : theme.border}`,
                          backgroundColor: regOwnsResidentialLand === val ? theme.surfaceSubtle : theme.background,
                          color: theme.textHeading,
                          fontWeight: 700,
                          fontSize: '13.5px',
                          cursor: 'pointer',
                        }}
                      >
                        {getTranslation(language, key === 'yes' ? 'profileOptYes' : key === 'no' ? 'profileOptNo' : 'profileOptNotSure')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Conditional: Business / entrepreneurship profile */}
              {showBusinessSection && (
                <div style={conditionalCardStyle}>
                  <h4 style={sectionHeadingStyle}>{getTranslation(language, 'regBusinessHeading')}</h4>
                  <div>
                    <label style={labelStyle}>{getTranslation(language, 'regBusinessTypeLabel')}</label>
                    <select
                      value={regBusinessType}
                      onChange={(e) => setRegBusinessType(e.target.value as EligibilityProfileFields['businessType'] | '')}
                      style={selectStyle}
                    >
                      <option value="">{getTranslation(language, 'profileOptNotSure')}</option>
                      {BUSINESS_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{getTranslation(language, opt.labelKey)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setRegPhase(1)}
                  style={{
                    backgroundColor: theme.surfaceSubtle,
                    color: theme.textHeading,
                    border: `1px solid ${theme.border}`,
                    padding: '12px 20px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ArrowLeftIcon />
                  {getTranslation(language, 'regPreviousPhase')}
                </button>

                <button
                  type="button"
                  onClick={handlePhase2Next}
                  style={{
                    backgroundColor: theme.primary,
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px 28px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>{getTranslation(language, 'regProceedPhase3')}</span>
                  <ArrowRightIcon />
                </button>
              </div>
            </div>
            );
          })()}

          {/* PHASE 3: INTERACTIVE DOCUMENT READINESS CHECKLIST */}
          {regPhase === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: theme.textHeading, margin: '0 0 4px 0' }}>
                  {getTranslation(language, 'regPhase3SectionTitle')}
                </h3>
                <p style={{ fontSize: '13.5px', color: theme.textMuted, margin: '0 0 16px 0' }}>
                  {getTranslation(language, 'regPhase3SectionDesc')}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
                {DOCUMENT_ITEMS.map((doc) => {
                  const isAvailable = !!documentsMap[doc.id];
                  return (
                    <div
                      key={doc.id}
                      style={{
                        backgroundColor: theme.surfaceSubtle,
                        borderRadius: '14px',
                        padding: '14px 18px',
                        border: `1.5px solid ${isAvailable ? theme.primary : theme.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ color: theme.primary }}>
                          <DocumentIcon />
                        </div>
                        <div>
                          <div style={{ fontSize: '14.5px', fontWeight: '800', color: theme.textHeading }}>
                            {getTranslation(language, doc.labelKey)}
                          </div>
                          <div style={{ fontSize: '12px', color: theme.textMuted }}>
                            {getTranslation(language, doc.descKey)}
                          </div>
                        </div>
                      </div>

                      {/* Yes / No Toggle Button Group */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => toggleDocumentStatus(doc.id, true)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: `1px solid ${isAvailable ? theme.primary : theme.border}`,
                            backgroundColor: isAvailable ? theme.primary : theme.background,
                            color: isAvailable ? '#ffffff' : theme.textHeading,
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                          }}
                        >
                          {getTranslation(language, 'profileOptYes')}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleDocumentStatus(doc.id, false)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: `1px solid ${!isAvailable ? theme.textMuted : theme.border}`,
                            backgroundColor: !isAvailable ? theme.surface : theme.background,
                            color: !isAvailable ? theme.textHeading : theme.textMuted,
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                          }}
                        >
                          {getTranslation(language, 'profileOptNo')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setRegPhase(2)}
                  style={{
                    backgroundColor: theme.surfaceSubtle,
                    color: theme.textHeading,
                    border: `1px solid ${theme.border}`,
                    padding: '12px 20px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ArrowLeftIcon />
                  {getTranslation(language, 'regPreviousPhase')}
                </button>

                <button
                  type="button"
                  onClick={handleCompleteRegistration}
                  disabled={authBusy}
                  style={{
                    backgroundColor: theme.primary,
                    color: '#ffffff',
                    border: 'none',
                    padding: '14px 28px',
                    borderRadius: '14px',
                    fontSize: '15px',
                    fontWeight: '800',
                    cursor: authBusy ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
                    opacity: authBusy ? 0.6 : 1,
                  }}
                >
                  <span>{getTranslation(language, authBusy ? 'regSavingProfile' : 'regCompleteRegistration')}</span>
                  <ArrowRightIcon />
                </button>
              </div>
            </div>
          )}

          {/* Return to Sign In link */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: `1px solid ${theme.border}`, textAlign: 'center', fontSize: '14px', color: theme.textMuted }}>
            {getTranslation(language, 'regAlreadyHaveAccount')}{' '}
            <button
              onClick={() => { setViewMode('login'); setAuthError(null); setOtpSent(false); }}
              style={{ background: 'none', border: 'none', color: theme.primary, fontWeight: '800', cursor: 'pointer', fontSize: '14px' }}
            >
              {getTranslation(language, 'regSignInHere')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
