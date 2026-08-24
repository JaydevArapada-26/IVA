import { and, asc, eq, inArray } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import { adminUsers, profiles, profileVersions, users } from '../schema/identity';

export interface AdminProfileFieldsInput {
  readonly age?: number;
  readonly gender?: 'male' | 'female' | 'transgender' | 'other' | 'prefer_not_to_say';
  readonly state?: string;
  readonly district?: string;
  readonly incomeRange?: 'lt_1_lakh' | '1_to_25_lakh' | '25_to_5_lakh' | '5_to_8_lakh' | 'gt_8_lakh';
  readonly occupation?:
    | 'farmer'
    | 'laborer'
    | 'student'
    | 'self_employed'
    | 'unemployed'
    | 'private_sector'
    | 'government_sector'
    | 'homemaker';
  readonly category?: 'general' | 'obc' | 'sc' | 'st' | 'ews';
  readonly disabilityStatus?: boolean;
  readonly studentStatus?: boolean;
  readonly farmerStatus?: boolean;
  readonly seniorCitizenStatus?: boolean;
}

export class UserRepository extends BaseRepository<typeof users> {
  constructor() {
    super(users);
  }

  async findById(id: string) {
    return this.db.select().from(this.table).where(eq(this.table.id, id)).limit(1);
  }

  async findByPhone(phoneNumber: string) {
    return this.db.select().from(this.table).where(eq(this.table.phoneNumber, phoneNumber)).limit(1);
  }

  async findByEmail(email: string) {
    return this.db.select().from(this.table).where(eq(this.table.email, email)).limit(1);
  }

  async findByUsername(username: string) {
    return this.db.select().from(this.table).where(eq(this.table.username, username)).limit(1);
  }

  /** Finds the user by phone number, creating a new user (and blank profile) on first login. */
  async findOrCreateByPhone(phoneNumber: string) {
    const [existing] = await this.findByPhone(phoneNumber);
    if (existing) return existing;

    const [created] = await this.db
      .insert(users)
      .values({
        authUserId: phoneNumber,
        phoneNumber,
      })
      .returning();

    if (!created) {
      throw new Error('Failed to create user');
    }

    await this.db.insert(profiles).values({ userId: created.id });

    return created;
  }

  async touchLastSignIn(id: string) {
    await this.db.update(users).set({ lastSignInAt: new Date(), updatedAt: new Date() }).where(eq(users.id, id));
  }

  async listAllWithProfileStatus() {
    return this.db
      .select({
        id: users.id,
        authUserId: users.authUserId,
        phoneNumber: users.phoneNumber,
        email: users.email,
        displayName: users.displayName,
        status: users.status,
        rememberMeEnabled: users.rememberMeEnabled,
        lastSignInAt: users.lastSignInAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        profileStatus: profiles.profileStatus,
      })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .orderBy(users.createdAt);
  }

  async updateUserRecord(
    id: string,
    values: Partial<Pick<typeof users.$inferInsert, 'displayName' | 'email' | 'phoneNumber' | 'username' | 'status'>>,
  ) {
    const [updated] = await this.db
      .update(users)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  /** Hard delete — admin panel has direct control of the table, no soft-delete recovery path. */
  async deleteUser(id: string) {
    const [deleted] = await this.db.delete(users).where(eq(users.id, id)).returning();
    return deleted;
  }

  async deleteUsers(ids: readonly string[]) {
    if (ids.length === 0) return [];
    return this.db.delete(users).where(inArray(users.id, ids)).returning();
  }

  async setStatus(id: string, status: 'active' | 'inactive' | 'suspended') {
    const [updated] = await this.db
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async setStatusBulk(ids: readonly string[], status: 'active' | 'inactive' | 'suspended') {
    if (ids.length === 0) return [];
    return this.db
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(inArray(users.id, ids))
      .returning();
  }

  /** Fetches the profile + active profile_versions snapshot for the admin edit form. */
  async getProfileWithActiveVersion(userId: string) {
    const [profile] = await this.db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    if (!profile) return { profile: undefined, activeVersion: undefined };
    if (!profile.activeVersionId) return { profile, activeVersion: undefined };

    const [activeVersion] = await this.db
      .select()
      .from(profileVersions)
      .where(eq(profileVersions.id, profile.activeVersionId))
      .limit(1);
    return { profile, activeVersion };
  }

  /**
   * Admin edits never mutate a historical profile_versions row — they create a new version
   * (merged on top of the current active snapshot) and repoint profiles.activeVersionId,
   * matching how every other profile update in this schema is modeled.
   */
  async applyAdminProfileEdit(userId: string, fields: AdminProfileFieldsInput) {
    const { profile, activeVersion } = await this.getProfileWithActiveVersion(userId);
    if (!profile) throw new Error(`No profile found for user "${userId}"`);

    const nextVersionNumber = (profile.currentVersionNumber ?? 0) + 1;
    const [created] = await this.db
      .insert(profileVersions)
      .values({
        profileId: profile.id,
        versionNumber: nextVersionNumber,
        source: 'admin_edit',
        name: activeVersion?.name ?? null,
        phoneNumber: activeVersion?.phoneNumber ?? null,
        dateOfBirth: activeVersion?.dateOfBirth ?? null,
        age: fields.age ?? activeVersion?.age ?? null,
        gender: fields.gender ?? activeVersion?.gender ?? null,
        state: fields.state ?? activeVersion?.state ?? null,
        district: fields.district ?? activeVersion?.district ?? null,
        incomeRange: fields.incomeRange ?? activeVersion?.incomeRange ?? null,
        occupation: fields.occupation ?? activeVersion?.occupation ?? null,
        category: fields.category ?? activeVersion?.category ?? null,
        disabilityStatus: fields.disabilityStatus ?? activeVersion?.disabilityStatus ?? false,
        studentStatus: fields.studentStatus ?? activeVersion?.studentStatus ?? false,
        farmerStatus: fields.farmerStatus ?? activeVersion?.farmerStatus ?? false,
        seniorCitizenStatus: fields.seniorCitizenStatus ?? activeVersion?.seniorCitizenStatus ?? false,
        docAadhaar: activeVersion?.docAadhaar ?? null,
        docPan: activeVersion?.docPan ?? null,
        docIncome: activeVersion?.docIncome ?? null,
        docCaste: activeVersion?.docCaste ?? null,
        docDomicile: activeVersion?.docDomicile ?? null,
        docBank: activeVersion?.docBank ?? null,
        docRation: activeVersion?.docRation ?? null,
        docDisability: activeVersion?.docDisability ?? null,
        docEducational: activeVersion?.docEducational ?? null,
        docLand: activeVersion?.docLand ?? null,
        languageCode: activeVersion?.languageCode ?? 'en',
        consentGiven: activeVersion?.consentGiven ?? false,
        phoneVerified: activeVersion?.phoneVerified ?? false,
        onboardingCompleted: activeVersion?.onboardingCompleted ?? false,
      })
      .returning();
    if (!created) throw new Error('Failed to create profile version');

    await this.db
      .update(profiles)
      .set({ activeVersionId: created.id, currentVersionNumber: nextVersionNumber, updatedAt: new Date() })
      .where(eq(profiles.id, profile.id));

    return created;
  }

  /**
   * Batched, deterministically-ordered page of users eligible for the daily scheme SMS automation
   * (spec 3.10/3.11): active account, onboarding completed (enough profile to match against),
   * and dailySchemeSmsEnabled. Phone-number validity is checked by the caller (lib/daily-sms/job.ts)
   * since "looks like a real number" isn't a clean SQL predicate here. Offset pagination is fine
   * at IVA's expected user-count scale and keeps the query trivial to reason about; a keyset cursor
   * would only pay for itself at a much larger scale.
   */
  async listUsersEligibleForDailySms(offset: number, limit: number) {
    return this.db
      .select({
        userId: users.id,
        phoneNumber: users.phoneNumber,
        languageCode: profiles.languageCode,
      })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .where(and(eq(users.status, 'active'), eq(profiles.onboardingCompleted, true), eq(profiles.dailySchemeSmsEnabled, true)))
      .orderBy(asc(users.id))
      .limit(limit)
      .offset(offset);
  }

  /** Admin login is checked against ADMIN_SECRET_KEY (see config/env) since no password-hash
   * column exists on users/admin_users in the current schema. This joins on the user's email. */
  async findAdminByEmail(email: string) {
    const rows = await this.db
      .select({
        adminUserId: adminUsers.id,
        role: adminUsers.role,
        adminStatus: adminUsers.status,
        displayName: adminUsers.displayName,
        userId: users.id,
        userStatus: users.status,
        email: users.email,
      })
      .from(adminUsers)
      .innerJoin(users, eq(adminUsers.userId, users.id))
      .where(eq(users.email, email))
      .limit(1);
    return rows[0];
  }
}
