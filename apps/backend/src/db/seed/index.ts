import { eq } from 'drizzle-orm';
import { MOCK_SCHEMES } from 'shared/constants/schemes';
import type { Scheme } from 'shared/types';
import { db, pool } from '../connection';
import {
  governmentDepartments,
  schemeBenefits,
  schemeCategories,
  schemeDocuments,
  schemeSources,
  schemes,
  users,
  adminUsers,
} from '../schema';
import { slugify } from '../../lib/text';
import type { SchemaDefinition } from '../schema';

export interface SeedTableDescriptor {
  readonly name: keyof SchemaDefinition;
  readonly description: string;
}

/** Documents the seed order for reference; seedDatabase() below actually performs the writes. */
export const seedTableOrder: readonly SeedTableDescriptor[] = [
  { name: 'governmentDepartments', description: 'Government department master data.' },
  { name: 'schemeCategories', description: 'Top-level scheme categories.' },
  { name: 'schemes', description: 'Canonical scheme records.' },
  { name: 'schemeBenefits', description: 'Per-scheme benefit line items.' },
  { name: 'schemeDocuments', description: 'Per-scheme required documents.' },
  { name: 'schemeSources', description: 'Per-scheme official source URLs.' },
] as const;

async function findOrCreateDepartment(name: string) {
  const slug = slugify(name);
  const existing = await db.select().from(governmentDepartments).where(eq(governmentDepartments.slug, slug)).limit(1);
  if (existing[0]) return existing[0];

  const [created] = await db.insert(governmentDepartments).values({ name, slug }).returning();
  if (!created) throw new Error(`Failed to seed government department: ${name}`);
  return created;
}

async function findOrCreateCategory(name: string) {
  const slug = slugify(name);
  const existing = await db.select().from(schemeCategories).where(eq(schemeCategories.slug, slug)).limit(1);
  if (existing[0]) return existing[0];

  const [created] = await db.insert(schemeCategories).values({ name, slug }).returning();
  if (!created) throw new Error(`Failed to seed scheme category: ${name}`);
  return created;
}

async function seedScheme(mock: Scheme, departmentId: string, categoryId: string): Promise<'created' | 'skipped'> {
  const slug = slugify(mock.id);
  const existing = await db.select().from(schemes).where(eq(schemes.slug, slug)).limit(1);
  if (existing[0]) {
    return 'skipped';
  }

  const verifiedDate =
    mock.sourceVerifiedDate && !Number.isNaN(Date.parse(mock.sourceVerifiedDate))
      ? new Date(mock.sourceVerifiedDate)
      : undefined;

  const [created] = await db
    .insert(schemes)
    .values({
      departmentId,
      categoryId,
      schemeName: mock.title,
      slug,
      briefDescription: mock.summary,
      detailedDescription: mock.fullDescription,
      sourceUrl: mock.officialUrl,
      publicationStatus: 'published',
      isUrgent: mock.isUrgent ?? false,
      isVerified: true,
      publishedAt: new Date(),
      ...(verifiedDate ? { approvedAt: verifiedDate } : {}),
    })
    .returning();

  if (!created) {
    throw new Error(`Failed to seed scheme: ${mock.id}`);
  }

  if (mock.benefits.length > 0) {
    await db.insert(schemeBenefits).values(
      mock.benefits.map((text, index) => ({
        schemeId: created.id,
        benefitType: 'other' as const,
        title: text.length > 160 ? `${text.slice(0, 157)}...` : text,
        description: text,
        sortOrder: index,
      })),
    );
  }

  if (mock.documentsRequired.length > 0) {
    await db.insert(schemeDocuments).values(
      mock.documentsRequired.map((doc, index) => ({
        schemeId: created.id,
        documentCode: slugify(doc),
        documentName: doc,
        isMandatory: true,
        sortOrder: index,
      })),
    );
  }

  await db.insert(schemeSources).values({
    schemeId: created.id,
    sourceType: 'official_portal',
    sourceUrl: mock.officialUrl,
    sourceTitle: mock.title,
    verificationStatus: verifiedDate ? 'verified' : 'unverified',
    ...(verifiedDate ? { verifiedAt: verifiedDate, lastCheckedAt: verifiedDate } : {}),
  });

  return 'created';
}

/**
 * Seeds real government scheme content (departments, categories, schemes, benefits, documents,
 * sources) sourced from packages/shared/constants/schemes.ts's MOCK_SCHEMES — the same
 * well-researched scheme data that used to ship in the frontend bundle directly. Idempotent: a
 * scheme already present (matched by slug) is left untouched rather than duplicated, so this can
 * be re-run safely.
 *
 * NOTE: this has not been run against a live Postgres instance in this sandbox (none is
 * reachable here) — it is type-checked but not execution-verified. Run `npm run db:seed` from
 * apps/backend against a real database and confirm row counts before relying on it.
 */
export async function seedDatabase(): Promise<void> {
  let createdCount = 0;
  let skippedCount = 0;

  for (const mock of MOCK_SCHEMES) {
    const department = await findOrCreateDepartment(mock.department);
    const category = await findOrCreateCategory(mock.category);
    const result = await seedScheme(mock, department.id, category.id);
    if (result === 'created') {
      createdCount += 1;
      process.stdout.write(`[iva-backend] seeded scheme: ${mock.title}\n`);
    } else {
      skippedCount += 1;
      process.stdout.write(`[iva-backend] scheme already present, skipped: ${mock.title}\n`);
    }
  }

  // Seed admin user
  const adminEmail = 'admin@iva.local';
  const existingAdminUser = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
  if (!existingAdminUser[0]) {
    const [user] = await db
      .insert(users)
      .values({
        authUserId: 'admin-auth-id',
        phoneNumber: '0000000000',
        email: adminEmail,
        displayName: 'System Administrator',
        status: 'active',
      })
      .returning();
    
    if (user) {
      await db.insert(adminUsers).values({
        userId: user.id,
        role: 'super_admin',
        status: 'active',
        displayName: 'System Administrator',
      });
      process.stdout.write(`[iva-backend] seeded admin user: ${adminEmail}\n`);
    }
  } else {
    process.stdout.write(`[iva-backend] admin user already present, skipped: ${adminEmail}\n`);
  }

  process.stdout.write(`[iva-backend] Seed complete. Created ${createdCount}, skipped ${skippedCount} (already present).\n`);
}

const isMainModule = require.main === module;
if (isMainModule) {
  seedDatabase()
    .then(() => pool.end())
    .then(() => process.exit(0))
    .catch((error: unknown) => {
      console.error('[iva-backend] Seed failed:', error);
      return pool.end().finally(() => process.exit(1));
    });
}
