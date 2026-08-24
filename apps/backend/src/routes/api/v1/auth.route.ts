import type { HttpRouteDefinition, JsonValue } from '../../../http/types';
import type {
  AdminLoginResponseDto,
  CheckAccountResponse,
  LoginResponseDto,
  RequestOtpResponse,
  SessionExchangeResponse,
  SignupCompleteResponse,
  SignupProfileFields,
} from 'shared/contracts/auth';
import { loadBackendEnv } from '../../../config';
import { UserRepository } from '../../../db/repositories/user.repository';
import { db } from '../../../db';
import { profileVersions, profiles, smsQueue, users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { consumeOtp, createAdminSession, createCitizenSession, issueOtp } from '../../../lib/auth-store';
import { err, ok, parseJsonBody } from '../../../lib/http-responses';
import { verifySupabaseAccessToken } from '../../../lib/supabase-jwt';
import { normalizePhoneNumber } from '../../../lib/phone';
import { computeAgeFromDob } from '../../../lib/age';
import { buildNewProfileFieldsPatchFromRequest } from '../../../lib/profile/new-fields';

export const requestOtpRoute: HttpRouteDefinition = {
  method: 'POST',
  path: '/auth/otp',
  summary: 'Request a one-time login code for a phone number',
  handler: async (req) => {
    const parsed = parseJsonBody(req.bodyText);
    if (!parsed.ok) {
      return err('BAD_REQUEST', 'Request body must be valid JSON');
    }
    const phoneNumber = typeof parsed.value.phoneNumber === 'string' ? parsed.value.phoneNumber.trim() : '';
    if (!phoneNumber) {
      return err('BAD_REQUEST', 'phoneNumber is required');
    }

    const code = issueOtp(phoneNumber);

    // No SMS provider is wired up in this environment. We still record a real, honestly-queued
    // SMS row (never marked as sent) so the admin SMS queue reflects reality, and we echo the
    // code back as devOtp so local/dev flows can proceed without a real SMS provider.
    await db.insert(smsQueue).values({
      phoneNumber,
      messageBody: `Your IVA verification code is ${code}. It expires in 5 minutes.`,
      status: 'queued',
    });

    const data: RequestOtpResponse = {
      phoneNumber,
      otpRequested: true,
      devOtp: code,
    };
    return ok(data as unknown as JsonValue);
  },
};

export const loginRoute: HttpRouteDefinition = {
  method: 'POST',
  path: '/auth/login',
  summary: 'Verify OTP and issue a citizen session token',
  handler: async (req) => {
    const parsed = parseJsonBody(req.bodyText);
    if (!parsed.ok) {
      return err('BAD_REQUEST', 'Request body must be valid JSON');
    }
    const phoneNumber = typeof parsed.value.phoneNumber === 'string' ? parsed.value.phoneNumber.trim() : '';
    const otp = typeof parsed.value.otp === 'string' ? parsed.value.otp.trim() : '';
    if (!phoneNumber || !otp) {
      return err('BAD_REQUEST', 'phoneNumber and otp are required');
    }

    if (!consumeOtp(phoneNumber, otp)) {
      return err('UNAUTHORIZED', 'Invalid or expired OTP');
    }

    const userRepo = new UserRepository();
    const user = await userRepo.findOrCreateByPhone(phoneNumber);
    await userRepo.touchLastSignIn(user.id);

    const session = createCitizenSession(user.id);
    const data: LoginResponseDto = {
      token: session.token,
      userId: user.id,
      expiresAt: session.expiresAt.toISOString(),
    };
    return ok(data as unknown as JsonValue);
  },
};

/**
 * Checked before the frontend triggers a Supabase OTP send, so login never wastes an OTP
 * (email or SMS) on an email/phone with no matching local `users` row.
 */
export const checkAccountRoute: HttpRouteDefinition = {
  method: 'GET',
  path: '/auth/check-account',
  summary: 'Check whether an IVA account exists for a given email or phone number',
  handler: async (req) => {
    const email = (req.query.get('email') ?? '').trim();
    const phoneRaw = (req.query.get('phone') ?? '').trim();
    if (!email && !phoneRaw) return err('BAD_REQUEST', 'email or phone is required');

    const userRepo = new UserRepository();
    const [byEmail] = email ? await userRepo.findByEmail(email) : [undefined];
    const [byPhone] = byEmail || !phoneRaw ? [undefined] : await userRepo.findByPhone(normalizePhoneNumber(phoneRaw));
    const data: CheckAccountResponse = { exists: Boolean(byEmail ?? byPhone) };
    return ok(data as unknown as JsonValue);
  },
};

export const adminLoginRoute: HttpRouteDefinition = {
  method: 'POST',
  path: '/auth/admin-login',
  summary: 'Authenticate an admin user against ADMIN_SECRET_KEY',
  handler: async (req) => {
    const parsed = parseJsonBody(req.bodyText);
    if (!parsed.ok) {
      return err('BAD_REQUEST', 'Request body must be valid JSON');
    }
    const email = typeof parsed.value.email === 'string' ? parsed.value.email.trim() : '';
    const password = typeof parsed.value.password === 'string' ? parsed.value.password : '';
    if (!email || !password) {
      return err('BAD_REQUEST', 'email and password are required');
    }

    const env = loadBackendEnv();
    if (!env.adminSecretKey || password !== env.adminSecretKey) {
      return err('UNAUTHORIZED', 'Invalid admin credentials');
    }

    const userRepo = new UserRepository();
    const record = await userRepo.findAdminByEmail(email);
    if (!record || record.adminStatus !== 'active' || record.userStatus !== 'active') {
      return err('UNAUTHORIZED', 'Invalid admin credentials');
    }

    const session = createAdminSession(record.adminUserId, record.userId, record.role);
    const data: AdminLoginResponseDto = {
      token: session.token,
      adminUserId: record.adminUserId,
      role: record.role,
      ...(record.displayName ? { displayName: record.displayName } : {}),
      expiresAt: session.expiresAt.toISOString(),
    };
    return ok(data as unknown as JsonValue);
  },
};

/**
 * Exchanges a verified Supabase Auth session (issued after email+password+email-OTP or
 * phone+SMS-OTP verification on the frontend) for an IVA citizen session. Per the login
 * requirement, this NEVER auto-creates a user — if no local `users` row is linked to this
 * Supabase auth identity yet, the login is rejected and the citizen is directed to sign up.
 */
export const sessionExchangeRoute: HttpRouteDefinition = {
  method: 'POST',
  path: '/auth/session/exchange',
  summary: 'Exchange a verified Supabase Auth token for an IVA citizen session (login only — never creates a user)',
  handler: async (req) => {
    const parsed = parseJsonBody(req.bodyText);
    if (!parsed.ok) return err('BAD_REQUEST', 'Request body must be valid JSON');

    const supabaseAccessToken = typeof parsed.value.supabaseAccessToken === 'string' ? parsed.value.supabaseAccessToken : '';
    if (!supabaseAccessToken) return err('BAD_REQUEST', 'supabaseAccessToken is required');

    const claims = await verifySupabaseAccessToken(supabaseAccessToken);
    if (!claims) return err('UNAUTHORIZED', 'Invalid or expired Supabase session');

    const userRepo = new UserRepository();
    const [byAuthId] = await db.select().from(users).where(eq(users.authUserId, claims.sub)).limit(1);
    const [byEmail] = byAuthId || !claims.email ? [undefined] : await userRepo.findByEmail(claims.email);
    const [byPhone] =
      byAuthId || byEmail || !claims.phone ? [undefined] : await userRepo.findByPhone(normalizePhoneNumber(claims.phone));
    const user = byAuthId ?? byEmail ?? byPhone;

    if (!user) {
      return err('NOT_FOUND', 'No IVA account found for this login. Please sign up first.');
    }

    if (typeof parsed.value.rememberMe === 'boolean') {
      await db.update(users).set({ rememberMeEnabled: parsed.value.rememberMe }).where(eq(users.id, user.id));
    }

    await userRepo.touchLastSignIn(user.id);
    const session = createCitizenSession(user.id);
    const data: SessionExchangeResponse = {
      token: session.token,
      userId: user.id,
      expiresAt: session.expiresAt.toISOString(),
      ...(user.displayName ? { displayName: user.displayName } : {}),
    };
    return ok(data as unknown as JsonValue);
  },
};

/**
 * Finalizes signup after the frontend has already created the Supabase Auth account. Creates
 * the local users/profiles/profile_versions rows. Rejected if the email or phone already exists
 * locally, per the signup requirement (no duplicate accounts).
 */
export const signupCompleteRoute: HttpRouteDefinition = {
  method: 'POST',
  path: '/auth/signup/complete',
  summary: 'Create the local IVA user/profile records after a Supabase Auth signup',
  handler: async (req) => {
    const parsed = parseJsonBody(req.bodyText);
    if (!parsed.ok) return err('BAD_REQUEST', 'Request body must be valid JSON');

    const supabaseAccessToken = typeof parsed.value.supabaseAccessToken === 'string' ? parsed.value.supabaseAccessToken : '';
    const displayName = typeof parsed.value.displayName === 'string' ? parsed.value.displayName.trim() : '';
    const username = typeof parsed.value.username === 'string' ? parsed.value.username.trim() : '';
    const phoneNumber = typeof parsed.value.phoneNumber === 'string' ? normalizePhoneNumber(parsed.value.phoneNumber) : '';
    const email = typeof parsed.value.email === 'string' ? parsed.value.email.trim() : '';
    const profile = (parsed.value.profile ?? undefined) as SignupProfileFields | undefined;

    if (!supabaseAccessToken || !displayName || !username || !phoneNumber || !email) {
      return err('BAD_REQUEST', 'supabaseAccessToken, displayName, username, phoneNumber, and email are required');
    }

    const claims = await verifySupabaseAccessToken(supabaseAccessToken);
    if (!claims) return err('UNAUTHORIZED', 'Invalid or expired Supabase session');

    const userRepo = new UserRepository();
    const [existingByEmail] = await userRepo.findByEmail(email);
    if (existingByEmail) return err('CONFLICT', 'An account with this email already exists. Please sign in instead.');
    const [existingByPhone] = await userRepo.findByPhone(phoneNumber);
    if (existingByPhone) return err('CONFLICT', 'An account with this phone number already exists. Please sign in instead.');
    const [existingByUsername] = await userRepo.findByUsername(username);
    if (existingByUsername) return err('CONFLICT', 'This username is already taken.');

    const rememberMe = typeof parsed.value.rememberMe === 'boolean' ? parsed.value.rememberMe : false;
    const [createdUser] = await db
      .insert(users)
      .values({ authUserId: claims.sub, phoneNumber, email, displayName, username, status: 'active', rememberMeEnabled: rememberMe })
      .returning();
    if (!createdUser) return err('INTERNAL_ERROR', 'Failed to create user');

    const [createdProfile] = await db.insert(profiles).values({ userId: createdUser.id }).returning();
    if (!createdProfile) return err('INTERNAL_ERROR', 'Failed to create profile');

    const dateOfBirth = profile?.dateOfBirth;
    const derivedAge = dateOfBirth ? computeAgeFromDob(dateOfBirth) : undefined;
    const documents = profile?.documents;
    const newFieldsPatch = buildNewProfileFieldsPatchFromRequest(profile);

    const [version] = await db
      .insert(profileVersions)
      .values({
        profileId: createdProfile.id,
        versionNumber: 1,
        source: 'manual',
        name: displayName,
        phoneNumber,
        ...(dateOfBirth !== undefined ? { dateOfBirth } : {}),
        ...(derivedAge !== undefined ? { age: derivedAge } : {}),
        ...(profile?.gender !== undefined ? { gender: profile.gender as never } : {}),
        ...(profile?.state !== undefined ? { state: profile.state } : {}),
        ...(profile?.district !== undefined ? { district: profile.district } : {}),
        ...(profile?.incomeRange !== undefined ? { incomeRange: profile.incomeRange as never } : {}),
        ...(profile?.occupation !== undefined ? { occupation: profile.occupation as never } : {}),
        ...(profile?.category !== undefined ? { category: profile.category as never } : {}),
        disabilityStatus: profile?.disabilityStatus ?? false,
        studentStatus: profile?.studentStatus ?? false,
        ...(documents?.aadhaar !== undefined ? { docAadhaar: documents.aadhaar } : {}),
        ...(documents?.pan !== undefined ? { docPan: documents.pan } : {}),
        ...(documents?.income !== undefined ? { docIncome: documents.income } : {}),
        ...(documents?.caste !== undefined ? { docCaste: documents.caste } : {}),
        ...(documents?.domicile !== undefined ? { docDomicile: documents.domicile } : {}),
        ...(documents?.bank !== undefined ? { docBank: documents.bank } : {}),
        ...(documents?.ration !== undefined ? { docRation: documents.ration } : {}),
        ...(documents?.disability !== undefined ? { docDisability: documents.disability } : {}),
        ...(documents?.educational !== undefined ? { docEducational: documents.educational } : {}),
        ...(documents?.land !== undefined ? { docLand: documents.land } : {}),
        // Signup profile expansion (progressive profiling) — see lib/profile/new-fields.ts.
        ...newFieldsPatch,
        consentGiven: true,
        phoneVerified: true,
        onboardingCompleted: true,
      })
      .returning();
    if (!version) return err('INTERNAL_ERROR', 'Failed to create profile version');

    await db
      .update(profiles)
      .set({ activeVersionId: version.id, profileStatus: 'active', onboardingCompleted: true, currentVersionNumber: 1 })
      .where(eq(profiles.id, createdProfile.id));

    await userRepo.touchLastSignIn(createdUser.id);
    const session = createCitizenSession(createdUser.id);
    const data: SignupCompleteResponse = {
      token: session.token,
      userId: createdUser.id,
      expiresAt: session.expiresAt.toISOString(),
      displayName,
    };
    return ok(data as unknown as JsonValue);
  },
};
