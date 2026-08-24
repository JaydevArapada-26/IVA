import { boolean, date, index, integer, numeric, pgTable, smallint, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { vector } from 'drizzle-orm/pg-core';
import {
  schemeBenefitTypeEnum,
  schemeEmbeddingKindEnum,
  schemePublicationStatusEnum,
  schemeSourceTypeEnum,
  schemeSourceVerificationStatusEnum,
  eligibilityLogicOperatorEnum,
  eligibilityComparisonOperatorEnum,
  eligibilitySourceKindEnum,
} from '../enums';
import { createdAtColumn, deletedAtColumn, sortOrderColumn, updatedAtColumn, uuidPk } from '../helpers';
import { adminUsers } from './identity';

export const governmentDepartments = pgTable(
  'government_departments',
  {
    id: uuidPk(),
    parentDepartmentId: uuid('parent_department_id').references((): AnyPgColumn => governmentDepartments.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    code: text('code'),
    ministryName: text('ministry_name'),
    websiteUrl: text('website_url'),
    sortOrder: sortOrderColumn(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    slugUnique: uniqueIndex('government_departments_slug_unique').on(table.slug),
    codeUnique: uniqueIndex('government_departments_code_unique').on(table.code),
    parentIdx: index('government_departments_parent_department_id_idx').on(table.parentDepartmentId),
  }),
);

export const schemeCategories = pgTable(
  'scheme_categories',
  {
    id: uuidPk(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    sortOrder: sortOrderColumn(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    slugUnique: uniqueIndex('scheme_categories_slug_unique').on(table.slug),
    nameUnique: uniqueIndex('scheme_categories_name_unique').on(table.name),
  }),
);

export const schemeSubcategories = pgTable(
  'scheme_subcategories',
  {
    id: uuidPk(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => schemeCategories.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    sortOrder: sortOrderColumn(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    categorySlugUnique: uniqueIndex('scheme_subcategories_category_id_slug_unique').on(
      table.categoryId,
      table.slug,
    ),
    categoryIdx: index('scheme_subcategories_category_id_idx').on(table.categoryId),
    orderUnique: uniqueIndex('scheme_subcategories_category_id_sort_order_unique').on(
      table.categoryId,
      table.sortOrder,
    ),
  }),
);

export const schemes = pgTable(
  'schemes',
  {
    id: uuidPk(),
    // Legacy normalized links — nullable now that CSV-imported schemes populate the flat
    // ministry/department/categories columns below instead of joining these lookup tables.
    departmentId: uuid('department_id').references(() => governmentDepartments.id, { onDelete: 'restrict' }),
    categoryId: uuid('category_id').references(() => schemeCategories.id, { onDelete: 'restrict' }),
    subcategoryId: uuid('subcategory_id').references(() => schemeSubcategories.id, {
      onDelete: 'set null',
    }),
    slug: text('slug').notNull(),
    schemeName: text('scheme_name').notNull(),
    shortTitle: text('short_title'),
    level: text('level'),
    state: text('state'),
    ministry: text('ministry'),
    department: text('department'),
    beneficiaryType: text('beneficiary_type'),
    targetBeneficiaries: text('target_beneficiaries'),
    benefitType: text('benefit_type'),
    categories: text('categories').array(),
    subCategories: text('sub_categories').array(),
    tags: text('tags').array(),
    briefDescription: text('brief_description').notNull(),
    detailedDescription: text('detailed_description').notNull(),
    benefits: text('benefits'),
    eligibility: text('eligibility'),
    exclusions: text('exclusions'),
    applicationMode: text('application_mode'),
    applicationProcess: text('application_process'),
    documentsRequired: text('documents_required'),
    references: text('references'),
    schemeOpenDate: date('scheme_open_date', { mode: 'date' }),
    schemeCloseDate: date('scheme_close_date', { mode: 'date' }),
    dbtScheme: boolean('dbt_scheme').notNull().default(false),
    faqCount: integer('faq_count'),
    sourceUrl: text('source_url').notNull(),
    applicationUrl: text('application_url'),
    publicationStatus: schemePublicationStatusEnum('publication_status').notNull().default('in_review'),
    isUrgent: boolean('is_urgent').notNull().default(false),
    isVerified: boolean('is_verified').notNull().default(false),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'date' }),
    approvedAt: timestamp('approved_at', { withTimezone: true, mode: 'date' }),
    rejectedAt: timestamp('rejected_at', { withTimezone: true, mode: 'date' }),
    archivedAt: timestamp('archived_at', { withTimezone: true, mode: 'date' }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    slugUnique: uniqueIndex('schemes_slug_unique').on(table.slug),
    departmentIdx: index('schemes_department_id_idx').on(table.departmentId),
    categoryIdx: index('schemes_category_id_idx').on(table.categoryId),
    subcategoryIdx: index('schemes_subcategory_id_idx').on(table.subcategoryId),
    statusIdx: index('schemes_publication_status_idx').on(table.publicationStatus),
    urgentIdx: index('schemes_is_urgent_idx').on(table.isUrgent),
    stateIdx: index('schemes_state_idx').on(table.state),
  }),
);

export const schemeDocuments = pgTable(
  'scheme_documents',
  {
    id: uuidPk(),
    schemeId: uuid('scheme_id')
      .notNull()
      .references(() => schemes.id, { onDelete: 'cascade' }),
    documentCode: text('document_code').notNull(),
    documentName: text('document_name').notNull(),
    description: text('description'),
    isMandatory: boolean('is_mandatory').notNull().default(true),
    sortOrder: sortOrderColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    schemeDocumentUnique: uniqueIndex('scheme_documents_scheme_id_document_code_unique').on(
      table.schemeId,
      table.documentCode,
    ),
    schemeIdx: index('scheme_documents_scheme_id_idx').on(table.schemeId),
  }),
);

export const schemeBenefits = pgTable(
  'scheme_benefits',
  {
    id: uuidPk(),
    schemeId: uuid('scheme_id')
      .notNull()
      .references(() => schemes.id, { onDelete: 'cascade' }),
    benefitType: schemeBenefitTypeEnum('benefit_type').notNull().default('other'),
    title: text('title').notNull(),
    description: text('description').notNull(),
    valueText: text('value_text'),
    valueMin: numeric('value_min', { precision: 18, scale: 2 }),
    valueMax: numeric('value_max', { precision: 18, scale: 2 }),
    unitText: text('unit_text'),
    frequencyText: text('frequency_text'),
    sortOrder: sortOrderColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    schemeIdx: index('scheme_benefits_scheme_id_idx').on(table.schemeId),
    typeIdx: index('scheme_benefits_benefit_type_idx').on(table.benefitType),
  }),
);

export const schemeEligibilityRuleSets = pgTable(
  'scheme_eligibility_rule_sets',
  {
    id: uuidPk(),
    schemeId: uuid('scheme_id')
      .notNull()
      .references(() => schemes.id, { onDelete: 'cascade' }),
    versionNumber: integer('version_number').notNull().default(1),
    logicMode: eligibilityLogicOperatorEnum('logic_mode').notNull().default('and'),
    createdByAdminUserId: uuid('created_by_admin_user_id').references(() => adminUsers.id, {
      onDelete: 'set null',
    }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    schemeUnique: uniqueIndex('scheme_eligibility_rule_sets_scheme_id_version_number_unique').on(
      table.schemeId,
      table.versionNumber,
    ),
    schemeIdx: index('scheme_eligibility_rule_sets_scheme_id_idx').on(table.schemeId),
    activeIdx: index('scheme_eligibility_rule_sets_is_active_idx').on(table.isActive),
  }),
);

export const schemeEligibilityRuleGroups = pgTable(
  'scheme_eligibility_rule_groups',
  {
    id: uuidPk(),
    ruleSetId: uuid('rule_set_id')
      .notNull()
      .references(() => schemeEligibilityRuleSets.id, { onDelete: 'cascade' }),
    groupOrder: integer('group_order').notNull().default(0),
    logicOperator: eligibilityLogicOperatorEnum('logic_operator').notNull().default('and'),
    description: text('description'),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    ruleSetIdx: index('scheme_eligibility_rule_groups_rule_set_id_idx').on(table.ruleSetId),
    orderUnique: uniqueIndex('scheme_eligibility_rule_groups_rule_set_id_group_order_unique').on(
      table.ruleSetId,
      table.groupOrder,
    ),
  }),
);

export const schemeEligibilityRules = pgTable(
  'scheme_eligibility_rules',
  {
    id: uuidPk(),
    ruleGroupId: uuid('rule_group_id')
      .notNull()
      .references(() => schemeEligibilityRuleGroups.id, { onDelete: 'cascade' }),
    ruleOrder: integer('rule_order').notNull().default(0),
    sourceKind: eligibilitySourceKindEnum('source_kind').notNull(),
    fieldKey: text('field_key').notNull(),
    comparisonOperator: eligibilityComparisonOperatorEnum('comparison_operator').notNull(),
    displayLabel: text('display_label').notNull(),
    negated: boolean('negated').notNull().default(false),
    isRequired: boolean('is_required').notNull().default(true),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    ruleGroupIdx: index('scheme_eligibility_rules_rule_group_id_idx').on(table.ruleGroupId),
    sourceIdx: index('scheme_eligibility_rules_source_kind_idx').on(table.sourceKind),
    orderUnique: uniqueIndex('scheme_eligibility_rules_rule_group_id_rule_order_unique').on(
      table.ruleGroupId,
      table.ruleOrder,
    ),
  }),
);

export const schemeEligibilityRuleValues = pgTable(
  'scheme_eligibility_rule_values',
  {
    id: uuidPk(),
    ruleId: uuid('rule_id')
      .notNull()
      .references(() => schemeEligibilityRules.id, { onDelete: 'cascade' }),
    valueOrder: integer('value_order').notNull().default(0),
    textValue: text('text_value'),
    numericValue: numeric('numeric_value', { precision: 18, scale: 2 }),
    booleanValue: boolean('boolean_value'),
    dateValue: timestamp('date_value', { withTimezone: true, mode: 'date' }),
    unitText: text('unit_text'),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    ruleIdx: index('scheme_eligibility_rule_values_rule_id_idx').on(table.ruleId),
    orderUnique: uniqueIndex('scheme_eligibility_rule_values_rule_id_value_order_unique').on(
      table.ruleId,
      table.valueOrder,
    ),
  }),
);

export const schemeFaqs = pgTable(
  'scheme_faqs',
  {
    id: uuidPk(),
    schemeId: uuid('scheme_id')
      .notNull()
      .references(() => schemes.id, { onDelete: 'cascade' }),
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    sortOrder: sortOrderColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    schemeIdx: index('scheme_faqs_scheme_id_idx').on(table.schemeId),
  }),
);

export const schemeTags = pgTable(
  'scheme_tags',
  {
    id: uuidPk(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    tagType: text('tag_type').notNull(),
    description: text('description'),
    isSystemGenerated: boolean('is_system_generated').notNull().default(false),
    sortOrder: sortOrderColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    slugUnique: uniqueIndex('scheme_tags_slug_unique').on(table.slug),
    nameUnique: uniqueIndex('scheme_tags_name_unique').on(table.name),
    tagTypeIdx: index('scheme_tags_tag_type_idx').on(table.tagType),
  }),
);

export const schemeTagMaps = pgTable(
  'scheme_tag_maps',
  {
    id: uuidPk(),
    schemeId: uuid('scheme_id')
      .notNull()
      .references(() => schemes.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => schemeTags.id, { onDelete: 'cascade' }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    schemeTagUnique: uniqueIndex('scheme_tag_maps_scheme_id_tag_id_unique').on(table.schemeId, table.tagId),
    schemeIdx: index('scheme_tag_maps_scheme_id_idx').on(table.schemeId),
    tagIdx: index('scheme_tag_maps_tag_id_idx').on(table.tagId),
  }),
);

export const schemeSources = pgTable(
  'scheme_sources',
  {
    id: uuidPk(),
    schemeId: uuid('scheme_id')
      .notNull()
      .references(() => schemes.id, { onDelete: 'cascade' }),
    sourceType: schemeSourceTypeEnum('source_type').notNull().default('official_portal'),
    sourceUrl: text('source_url').notNull(),
    sourceTitle: text('source_title'),
    sourceIdentifier: text('source_identifier'),
    verificationStatus: schemeSourceVerificationStatusEnum('verification_status')
      .notNull()
      .default('unverified'),
    verifiedAt: timestamp('verified_at', { withTimezone: true, mode: 'date' }),
    lastCheckedAt: timestamp('last_checked_at', { withTimezone: true, mode: 'date' }),
    httpStatus: integer('http_status'),
    checksum: text('checksum'),
    notes: text('notes'),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    schemeIdx: index('scheme_sources_scheme_id_idx').on(table.schemeId),
    typeIdx: index('scheme_sources_source_type_idx').on(table.sourceType),
    statusIdx: index('scheme_sources_verification_status_idx').on(table.verificationStatus),
    sourceUnique: uniqueIndex('scheme_sources_scheme_id_source_url_unique').on(
      table.schemeId,
      table.sourceUrl,
    ),
  }),
);

const schemeEmbeddingVector = vector('embedding', { dimensions: 1536 });

export const schemeEmbeddings = pgTable(
  'scheme_embeddings',
  {
    id: uuidPk(),
    schemeId: uuid('scheme_id')
      .notNull()
      .references(() => schemes.id, { onDelete: 'cascade' }),
    embeddingKind: schemeEmbeddingKindEnum('embedding_kind').notNull().default('full_text'),
    modelName: text('model_name').notNull(),
    modelVersion: text('model_version').notNull(),
    dimension: integer('dimension').notNull().default(1536),
    chunkIndex: smallint('chunk_index').notNull().default(0),
    contentText: text('content_text').notNull(),
    contentHash: text('content_hash').notNull(),
    embedding: schemeEmbeddingVector.notNull(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    schemeIdx: index('scheme_embeddings_scheme_id_idx').on(table.schemeId),
    schemeKindIdx: index('scheme_embeddings_scheme_id_embedding_kind_idx').on(
      table.schemeId,
      table.embeddingKind,
    ),
    modelIdx: index('scheme_embeddings_model_name_idx').on(table.modelName),
    hashUnique: uniqueIndex('scheme_embeddings_scheme_id_content_hash_unique').on(
      table.schemeId,
      table.contentHash,
    ),
  }),
);
