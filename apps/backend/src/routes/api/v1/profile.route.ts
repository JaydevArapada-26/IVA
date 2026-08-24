import type { HttpRouteDefinition, JsonValue } from '../../../http/types';
import type { ProfileCompletenessDto, ProfileDto, SyncIdentityResponse, UpdateProfileRequest } from 'shared/contracts/profile';
import type { DocumentOwnershipFields } from 'shared/contracts/auth';
import type { EligibilityResultDto } from 'shared/contracts/eligibility';
import type { NotificationDto } from 'shared/contracts/assistant';
import type { SmsHistoryDto } from 'shared/contracts/profile';
import type { Category, Gender, IncomeRange, Occupation, SupportedLanguage } from 'shared/types';
import { ProfileRepository, type ProfileVersionPatch } from '../../../db/repositories/profile.repository';
import { EligibilityResultRepository, NotificationRepository } from '../../../db/repositories/engagement.repository';
import { SmsNotificationRepository } from '../../../db/repositories/sms-notification.repository';
import { UserRepository } from '../../../db/repositories/user.repository';
import { categoryToDb, categoryToDto, genderToDb, genderToDto, incomeRangeToDb, incomeRangeToDto, occupationToDb, occupationToDto } from '../../../lib/profile-enums';
import { buildNewProfileFieldsPatch, mapNewProfileFieldsToDto } from '../../../lib/profile/new-fields';
import { err, ok, parseJsonBody, requireCitizenUserId } from '../../../lib/http-responses';
import { verifySupabaseAccessToken } from '../../../lib/supabase-jwt';
import { normalizePhoneNumber } from '../../../lib/phone';
import { bustRankingCache } from '../../../lib/priority/engine';
import type { profiles, profileVersions, users } from '../../../db/schema/identity';

const REQUIRED_COMPLETENESS_FIELDS: ReadonlyArray<{ key: string; check: (v: typeof profileVersions.$inferSelect | undefined) => boolean }> = [
  { key: 'Date of Birth', check: (v) => Boolean(v?.dateOfBirth) },
  { key: 'Gender', check: (v) => Boolean(v?.gender) },
  { key: 'State', check: (v) => Boolean(v?.state) },
  { key: 'District', check: (v) => Boolean(v?.district) },
  { key: 'Occupation', check: (v) => Boolean(v?.occupation) },
  { key: 'Annual Income', check: (v) => Boolean(v?.incomeRange) },
  { key: 'Aadhaar Card', check: (v) => v?.docAadhaar != null },
  { key: 'PAN Card', check: (v) => v?.docPan != null },
  { key: 'Income Certificate', check: (v) => v?.docIncome != null },
  { key: 'Caste Certificate', check: (v) => v?.docCaste != null },
  { key: 'Domicile Certificate', check: (v) => v?.docDomicile != null },
  { key: 'Bank Passbook', check: (v) => v?.docBank != null },
  { key: 'Ration Card', check: (v) => v?.docRation != null },
  { key: 'Disability Certificate', check: (v) => v?.docDisability != null },
  { key: 'Educational Marksheet', check: (v) => v?.docEducational != null },
  { key: 'Land Document', check: (v) => v?.docLand != null },
];

function computeCompleteness(version: typeof profileVersions.$inferSelect | undefined): ProfileCompletenessDto {
  const missingFields = REQUIRED_COMPLETENESS_FIELDS.filter((f) => !f.check(version)).map((f) => f.key);
  return { isComplete: missingFields.length === 0, missingFields };
}

function toProfileDto(
  user: typeof users.$inferSelect,
  profile: typeof profiles.$inferSelect,
  version: typeof profileVersions.$inferSelect | undefined,
): ProfileDto {
  const gender = genderToDto(version?.gender);
  const incomeRange = incomeRangeToDto(version?.incomeRange);
  const occupation = occupationToDto(version?.occupation);
  const category = categoryToDto(version?.category);

  const documents: DocumentOwnershipFields = {
    ...(version?.docAadhaar != null ? { aadhaar: version.docAadhaar } : {}),
    ...(version?.docPan != null ? { pan: version.docPan } : {}),
    ...(version?.docIncome != null ? { income: version.docIncome } : {}),
    ...(version?.docCaste != null ? { caste: version.docCaste } : {}),
    ...(version?.docDomicile != null ? { domicile: version.docDomicile } : {}),
    ...(version?.docBank != null ? { bank: version.docBank } : {}),
    ...(version?.docRation != null ? { ration: version.docRation } : {}),
    ...(version?.docDisability != null ? { disability: version.docDisability } : {}),
    ...(version?.docEducational != null ? { educational: version.docEducational } : {}),
    ...(version?.docLand != null ? { land: version.docLand } : {}),
  };

  return {
    id: profile.id,
    userId: user.id,
    profileStatus: profile.profileStatus,
    ...(version?.name ? { name: version.name } : {}),
    ...(user.username ? { username: user.username } : {}),
    ...(user.email ? { email: user.email } : {}),
    ...(user.phoneNumber ? { phoneNumber: user.phoneNumber } : {}),
    ...(version?.dateOfBirth ? { dateOfBirth: version.dateOfBirth } : {}),
    ...(version?.age != null ? { age: version.age } : {}),
    ...(gender ? { gender } : {}),
    ...(version?.state ? { state: version.state } : {}),
    ...(version?.district ? { district: version.district } : {}),
    ...(incomeRange ? { incomeRange } : {}),
    ...(occupation ? { occupation } : {}),
    ...(category ? { category } : {}),
    disabilityStatus: version?.disabilityStatus ?? false,
    studentStatus: version?.studentStatus ?? false,
    farmerStatus: version?.farmerStatus ?? false,
    seniorCitizenStatus: version?.seniorCitizenStatus ?? false,
    documents,
    languageCode: profile.languageCode as SupportedLanguage,
    consentGiven: profile.consentGiven,
    phoneVerified: version?.phoneVerified ?? false,
    onboardingCompleted: profile.onboardingCompleted,
    dailySchemeSmsEnabled: profile.dailySchemeSmsEnabled,
    ...mapNewProfileFieldsToDto(version),
    completeness: computeCompleteness(version),
  };
}

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim().length > 0 ? v : undefined;
}
function asNumber(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}
function asBoolean(v: unknown): boolean | undefined {
  return typeof v === 'boolean' ? v : undefined;
}

function buildPatch(body: Record<string, unknown>): ProfileVersionPatch {
  const patch: ProfileVersionPatch = {};

  const name = asString(body.name);
  if (name !== undefined) patch.name = name;

  const dateOfBirth = asString(body.dateOfBirth);
  if (dateOfBirth !== undefined) patch.dateOfBirth = dateOfBirth;

  const age = asNumber(body.age);
  if (age !== undefined) patch.age = age;

  const gender = genderToDb(asString(body.gender) as Gender | undefined);
  if (gender !== undefined) patch.gender = gender;

  const state = asString(body.state);
  if (state !== undefined) patch.state = state;

  const district = asString(body.district);
  if (district !== undefined) patch.district = district;

  const incomeRange = incomeRangeToDb(asString(body.incomeRange) as IncomeRange | undefined);
  if (incomeRange !== undefined) patch.incomeRange = incomeRange;

  const occupation = occupationToDb(asString(body.occupation) as Occupation | undefined);
  if (occupation !== undefined) patch.occupation = occupation;

  const category = categoryToDb(asString(body.category) as Category | undefined);
  if (category !== undefined) patch.category = category;

  const disabilityStatus = asBoolean(body.disabilityStatus);
  if (disabilityStatus !== undefined) patch.disabilityStatus = disabilityStatus;

  const studentStatus = asBoolean(body.studentStatus);
  if (studentStatus !== undefined) patch.studentStatus = studentStatus;

  const farmerStatus = asBoolean(body.farmerStatus);
  if (farmerStatus !== undefined) patch.farmerStatus = farmerStatus;

  const seniorCitizenStatus = asBoolean(body.seniorCitizenStatus);
  if (seniorCitizenStatus !== undefined) patch.seniorCitizenStatus = seniorCitizenStatus;

  const documents = (body.documents ?? undefined) as DocumentOwnershipFields | undefined;
  if (documents) {
    if (documents.aadhaar !== undefined) patch.docAadhaar = documents.aadhaar;
    if (documents.pan !== undefined) patch.docPan = documents.pan;
    if (documents.income !== undefined) patch.docIncome = documents.income;
    if (documents.caste !== undefined) patch.docCaste = documents.caste;
    if (documents.domicile !== undefined) patch.docDomicile = documents.domicile;
    if (documents.bank !== undefined) patch.docBank = documents.bank;
    if (documents.ration !== undefined) patch.docRation = documents.ration;
    if (documents.disability !== undefined) patch.docDisability = documents.disability;
    if (documents.educational !== undefined) patch.docEducational = documents.educational;
    if (documents.land !== undefined) patch.docLand = documents.land;
  }

  const languageCode = asString(body.languageCode);
  if (languageCode !== undefined) patch.languageCode = languageCode as ProfileVersionPatch['languageCode'];

  const consentGiven = asBoolean(body.consentGiven);
  if (consentGiven !== undefined) patch.consentGiven = consentGiven;

  const onboardingCompleted = asBoolean(body.onboardingCompleted);
  if (onboardingCompleted !== undefined) patch.onboardingCompleted = onboardingCompleted;

  // Signup profile expansion (progressive profiling) — see lib/profile/new-fields.ts.
  Object.assign(patch, buildNewProfileFieldsPatch(body));

  return patch;
}

export const getProfileRoute: HttpRouteDefinition = {
  method: 'GET',
  path: '/profile',
  summary: 'Retrieve the authenticated citizen profile',
  handler: async (req) => {
    const userId = requireCitizenUserId(req);
    if (!userId) {
      return err('UNAUTHORIZED', 'A valid session token is required');
    }

    const userRepo = new UserRepository();
    const [user] = await userRepo.findById(userId);
    if (!user) return err('NOT_FOUND', 'User not found');

    const repo = new ProfileRepository();
    const { profile, activeVersion } = await repo.getOrCreateByUserId(userId);
    const dto = toProfileDto(user, profile, activeVersion);
    return ok(dto as unknown as JsonValue);
  },
};

export const updateProfileRoute: HttpRouteDefinition = {
  method: 'PATCH',
  path: '/profile',
  summary: 'Update the authenticated citizen profile (writes a new profile version)',
  handler: async (req) => {
    const userId = requireCitizenUserId(req);
    if (!userId) {
      return err('UNAUTHORIZED', 'A valid session token is required');
    }

    const parsed = parseJsonBody(req.bodyText);
    if (!parsed.ok) {
      return err('BAD_REQUEST', 'Request body must be valid JSON');
    }

    const body = parsed.value as unknown as UpdateProfileRequest;
    const userRepo = new UserRepository();

    if (body.username !== undefined) {
      const nextUsername = body.username.trim();
      if (nextUsername.length > 0) {
        const [existing] = await userRepo.findByUsername(nextUsername);
        if (existing && existing.id !== userId) {
          return err('CONFLICT', 'This username is already taken.');
        }
        await userRepo.updateUserRecord(userId, { username: nextUsername });
      }
    }

    const patch = buildPatch(parsed.value);
    const profileRepo = new ProfileRepository();
    let { profile, activeVersion } = await profileRepo.applyUpdate(userId, patch, 'manual');

    if (typeof body.dailySchemeSmsEnabled === 'boolean') {
      profile = await profileRepo.setDailySchemeSmsEnabled(userId, body.dailySchemeSmsEnabled);
    }

    // Profile changed → any cached ranking for this citizen is now stale.
    bustRankingCache(userId);

    const [user] = await userRepo.findById(userId);
    if (!user) return err('NOT_FOUND', 'User not found');

    const dto = toProfileDto(user, profile, activeVersion);
    return ok(dto as unknown as JsonValue);
  },
};

/**
 * Re-syncs users.email/phoneNumber after the citizen changes either one via Supabase's own
 * verification flow (confirmation link for email, OTP re-entry for phone) — called once that
 * flow completes, using whatever email/phone the now-current Supabase session reports.
 */
export const syncIdentityRoute: HttpRouteDefinition = {
  method: 'POST',
  path: '/profile/sync-identity',
  summary: "Sync users.email/phoneNumber from the citizen's current Supabase session after an email/phone change",
  handler: async (req) => {
    const userId = requireCitizenUserId(req);
    if (!userId) return err('UNAUTHORIZED', 'A valid session token is required');

    const parsed = parseJsonBody(req.bodyText);
    if (!parsed.ok) return err('BAD_REQUEST', 'Request body must be valid JSON');
    const supabaseAccessToken = typeof parsed.value.supabaseAccessToken === 'string' ? parsed.value.supabaseAccessToken : '';
    if (!supabaseAccessToken) return err('BAD_REQUEST', 'supabaseAccessToken is required');

    const claims = await verifySupabaseAccessToken(supabaseAccessToken);
    if (!claims) return err('UNAUTHORIZED', 'Invalid or expired Supabase session');

    const userRepo = new UserRepository();
    const [user] = await userRepo.findById(userId);
    if (!user) return err('NOT_FOUND', 'User not found');
    if (user.authUserId !== claims.sub) return err('UNAUTHORIZED', 'This session does not belong to the signed-in account');

    const values: Record<string, unknown> = {};
    if (claims.email && claims.email !== user.email) {
      const [existing] = await userRepo.findByEmail(claims.email);
      if (existing && existing.id !== userId) return err('CONFLICT', 'Another account already uses this email.');
      values.email = claims.email;
    }
    if (claims.phone) {
      const normalizedPhone = normalizePhoneNumber(claims.phone);
      if (normalizedPhone !== user.phoneNumber) {
        const [existing] = await userRepo.findByPhone(normalizedPhone);
        if (existing && existing.id !== userId) return err('CONFLICT', 'Another account already uses this phone number.');
        values.phoneNumber = normalizedPhone;
      }
    }

    if (Object.keys(values).length > 0) {
      await userRepo.updateUserRecord(userId, values as never);
    }

    const [updated] = await userRepo.findById(userId);
    const data: SyncIdentityResponse = {
      ...(updated?.email ? { email: updated.email } : {}),
      phoneNumber: updated?.phoneNumber ?? user.phoneNumber,
    };
    return ok(data as unknown as JsonValue);
  },
};

export const getProfileEligibilityRoute: HttpRouteDefinition = {
  method: 'GET',
  path: '/profile/eligibility',
  summary: 'Retrieve stored eligibility results for the authenticated citizen',
  handler: async (req) => {
    const userId = requireCitizenUserId(req);
    if (!userId) {
      return err('UNAUTHORIZED', 'A valid session token is required');
    }

    const rows = await new EligibilityResultRepository().listForUser(userId);
    const data: EligibilityResultDto[] = rows.map((row) => ({
      schemeId: row.schemeId,
      resultStatus: row.resultStatus,
      ...(row.score !== null ? { score: Number(row.score) } : {}),
      matchedRulesCount: row.matchedRulesCount,
      failedRulesCount: row.failedRulesCount,
      ...(row.summary ? { summary: row.summary } : {}),
      evaluatedAt: row.evaluatedAt.toISOString(),
    }));
    return ok(data as unknown as JsonValue);
  },
};

export const getProfileNotificationsRoute: HttpRouteDefinition = {
  method: 'GET',
  path: '/profile/notifications',
  summary: 'Retrieve in-app notifications for the authenticated citizen',
  handler: async (req) => {
    const userId = requireCitizenUserId(req);
    if (!userId) {
      return err('UNAUTHORIZED', 'A valid session token is required');
    }

    const rows = await new NotificationRepository().listForUser(userId);
    const data: NotificationDto[] = rows.map((row) => ({
      id: row.id,
      notificationType: row.notificationType,
      channel: row.channel,
      status: row.status,
      title: row.title,
      body: row.body,
      ...(row.schemeId ? { schemeId: row.schemeId } : {}),
      ...(row.readAt ? { readAt: row.readAt.toISOString() } : {}),
      createdAt: row.createdAt.toISOString(),
    }));
    return ok(data as unknown as JsonValue);
  },
};

/**
 * GET /profile/sms-history
 * Returns IVA scheme-recommendation SMS records for the signed-in citizen.
 * OTP/verification rows live in a separate table and are never exposed here.
 */
export const getProfileSmsHistoryRoute: HttpRouteDefinition = {
  method: 'GET',
  path: '/profile/sms-history',
  summary: 'Retrieve IVA recommendation SMS history for the authenticated citizen',
  handler: async (req) => {
    const userId = requireCitizenUserId(req);
    if (!userId) {
      return err('UNAUTHORIZED', 'A valid session token is required');
    }

    const repo = new SmsNotificationRepository();
    const rows = await repo.listForCitizen(userId);
    const data: SmsHistoryDto[] = rows.map((row) => ({
      id: row.id,
      ...(row.schemeId ? { schemeId: row.schemeId } : {}),
      ...(row.schemeTitle ? { schemeTitle: row.schemeTitle } : {}),
      messageBody: row.messageBody,
      notificationType: row.notificationType,
      status: row.status,
      ...(row.sentAt ? { sentAt: row.sentAt.toISOString() } : {}),
      createdAt: row.createdAt.toISOString(),
    }));
    return ok(data as unknown as JsonValue);
  },
};
