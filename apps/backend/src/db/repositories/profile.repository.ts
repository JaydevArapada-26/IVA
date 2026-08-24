import { eq } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import { profiles, profileVersions } from '../schema/identity';
import { computeAgeFromDob } from '../../lib/age';

export type ProfileVersionPatch = Partial<
  Pick<
    typeof profileVersions.$inferInsert,
    | 'name'
    | 'phoneNumber'
    | 'dateOfBirth'
    | 'age'
    | 'gender'
    | 'state'
    | 'district'
    | 'incomeRange'
    | 'occupation'
    | 'category'
    | 'disabilityStatus'
    | 'studentStatus'
    | 'farmerStatus'
    | 'seniorCitizenStatus'
    | 'docAadhaar'
    | 'docPan'
    | 'docIncome'
    | 'docCaste'
    | 'docDomicile'
    | 'docBank'
    | 'docRation'
    | 'docDisability'
    | 'docEducational'
    | 'docLand'
    | 'languageCode'
    | 'consentGiven'
    | 'onboardingCompleted'
    // --- Signup profile expansion (progressive profiling) ---
    | 'residenceType'
    | 'maritalStatus'
    | 'educationLevel'
    | 'employmentStatus'
    | 'bplEwsStatus'
    | 'disabilityPercentage'
    | 'hasDependents'
    | 'numberOfDependents'
    | 'specialCircumstances'
    | 'ownsAgriculturalLand'
    | 'landholdingSize'
    | 'agricultureActivityType'
    | 'educationStream'
    | 'currentYearClass'
    | 'housingSituation'
    | 'ownsResidentialLand'
    | 'businessType'
  >
>;

export class ProfileRepository extends BaseRepository<typeof profiles> {
  constructor() {
    super(profiles);
  }

  async getByUserId(userId: string) {
    const [profile] = await this.db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    if (!profile) return undefined;

    let activeVersion: typeof profileVersions.$inferSelect | undefined;
    if (profile.activeVersionId) {
      const rows = await this.db
        .select()
        .from(profileVersions)
        .where(eq(profileVersions.id, profile.activeVersionId))
        .limit(1);
      activeVersion = rows[0];
    }

    return { profile, activeVersion };
  }

  async getOrCreateByUserId(userId: string) {
    const existing = await this.getByUserId(userId);
    if (existing) return existing;

    const [profile] = await this.db.insert(profiles).values({ userId }).returning();
    if (!profile) {
      throw new Error('Failed to create profile');
    }
    return { profile, activeVersion: undefined as typeof profileVersions.$inferSelect | undefined };
  }

  /** Writes a new profile_versions row layered on top of the current active version (versioning
   * design per db/schema/identity.ts: profiles.currentVersionNumber/activeVersionId track the
   * latest row in profile_versions). */
  async applyUpdate(userId: string, patch: ProfileVersionPatch, source: 'manual' | 'admin_edit' = 'manual') {
    const { profile, activeVersion } = await this.getOrCreateByUserId(userId);

    const nextVersionNumber = profile.currentVersionNumber + 1;
    const dateOfBirth = patch.dateOfBirth ?? activeVersion?.dateOfBirth;
    // Age is always derived from dateOfBirth when present, rather than trusted as a separately
    // passed value — keeps it accurate on every save instead of silently going stale.
    const derivedAge = dateOfBirth ? computeAgeFromDob(dateOfBirth) : undefined;

    const merged: typeof profileVersions.$inferInsert = {
      profileId: profile.id,
      versionNumber: nextVersionNumber,
      source,
      name: patch.name ?? activeVersion?.name,
      phoneNumber: patch.phoneNumber ?? activeVersion?.phoneNumber,
      dateOfBirth,
      age: derivedAge ?? patch.age ?? activeVersion?.age,
      gender: patch.gender ?? activeVersion?.gender,
      state: patch.state ?? activeVersion?.state,
      district: patch.district ?? activeVersion?.district,
      incomeRange: patch.incomeRange ?? activeVersion?.incomeRange,
      occupation: patch.occupation ?? activeVersion?.occupation,
      category: patch.category ?? activeVersion?.category,
      disabilityStatus: patch.disabilityStatus ?? activeVersion?.disabilityStatus ?? false,
      studentStatus: patch.studentStatus ?? activeVersion?.studentStatus ?? false,
      farmerStatus: patch.farmerStatus ?? activeVersion?.farmerStatus ?? false,
      seniorCitizenStatus: patch.seniorCitizenStatus ?? activeVersion?.seniorCitizenStatus ?? false,
      docAadhaar: patch.docAadhaar ?? activeVersion?.docAadhaar,
      docPan: patch.docPan ?? activeVersion?.docPan,
      docIncome: patch.docIncome ?? activeVersion?.docIncome,
      docCaste: patch.docCaste ?? activeVersion?.docCaste,
      docDomicile: patch.docDomicile ?? activeVersion?.docDomicile,
      docBank: patch.docBank ?? activeVersion?.docBank,
      docRation: patch.docRation ?? activeVersion?.docRation,
      docDisability: patch.docDisability ?? activeVersion?.docDisability,
      docEducational: patch.docEducational ?? activeVersion?.docEducational,
      docLand: patch.docLand ?? activeVersion?.docLand,
      residenceType: patch.residenceType ?? activeVersion?.residenceType,
      maritalStatus: patch.maritalStatus ?? activeVersion?.maritalStatus,
      educationLevel: patch.educationLevel ?? activeVersion?.educationLevel,
      employmentStatus: patch.employmentStatus ?? activeVersion?.employmentStatus,
      bplEwsStatus: patch.bplEwsStatus ?? activeVersion?.bplEwsStatus,
      disabilityPercentage: patch.disabilityPercentage ?? activeVersion?.disabilityPercentage,
      hasDependents: patch.hasDependents ?? activeVersion?.hasDependents,
      numberOfDependents: patch.numberOfDependents ?? activeVersion?.numberOfDependents,
      specialCircumstances: patch.specialCircumstances ?? activeVersion?.specialCircumstances,
      ownsAgriculturalLand: patch.ownsAgriculturalLand ?? activeVersion?.ownsAgriculturalLand,
      landholdingSize: patch.landholdingSize ?? activeVersion?.landholdingSize,
      agricultureActivityType: patch.agricultureActivityType ?? activeVersion?.agricultureActivityType,
      educationStream: patch.educationStream ?? activeVersion?.educationStream,
      currentYearClass: patch.currentYearClass ?? activeVersion?.currentYearClass,
      housingSituation: patch.housingSituation ?? activeVersion?.housingSituation,
      ownsResidentialLand: patch.ownsResidentialLand ?? activeVersion?.ownsResidentialLand,
      businessType: patch.businessType ?? activeVersion?.businessType,
      languageCode: patch.languageCode ?? activeVersion?.languageCode ?? 'en',
      consentGiven: patch.consentGiven ?? activeVersion?.consentGiven ?? false,
      phoneVerified: activeVersion?.phoneVerified ?? false,
      onboardingCompleted: patch.onboardingCompleted ?? activeVersion?.onboardingCompleted ?? false,
      createdByUserId: userId,
    };

    const [newVersion] = await this.db.insert(profileVersions).values(merged).returning();
    if (!newVersion) {
      throw new Error('Failed to create profile version');
    }

    const consentJustGiven = patch.consentGiven === true && activeVersion?.consentGiven !== true;

    const [updatedProfile] = await this.db
      .update(profiles)
      .set({
        currentVersionNumber: nextVersionNumber,
        activeVersionId: newVersion.id,
        languageCode: newVersion.languageCode,
        onboardingCompleted: newVersion.onboardingCompleted,
        profileStatus: newVersion.onboardingCompleted ? 'active' : 'incomplete',
        consentGiven: newVersion.consentGiven,
        consentUpdatedAt: consentJustGiven ? new Date() : profile.consentUpdatedAt,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, profile.id))
      .returning();

    return { profile: updatedProfile ?? profile, activeVersion: newVersion };
  }

  /** Lives on `profiles` (not versioned like the rest of the profile — it's a delivery
   * preference, not eligibility data) — used by profile settings and the daily SMS job. */
  async setDailySchemeSmsEnabled(userId: string, enabled: boolean) {
    const { profile } = await this.getOrCreateByUserId(userId);
    const [updated] = await this.db
      .update(profiles)
      .set({ dailySchemeSmsEnabled: enabled, updatedAt: new Date() })
      .where(eq(profiles.id, profile.id))
      .returning();
    return updated ?? profile;
  }
}
