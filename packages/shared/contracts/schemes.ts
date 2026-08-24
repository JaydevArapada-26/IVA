import type { SupportedLanguage } from '../types';

export interface SchemeBenefitDto {
  readonly id: string;
  readonly benefitType: string;
  readonly title: string;
  readonly description: string;
  readonly valueText?: string;
}

export interface SchemeFaqDto {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
}

export interface SchemeSourceDto {
  readonly id: string;
  readonly sourceType: string;
  readonly sourceUrl: string;
  readonly sourceTitle?: string;
  readonly verificationStatus: string;
  readonly httpStatus?: number;
  readonly lastCheckedAt?: string;
}

export interface SchemeSummaryDto {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly shortTitle?: string;
  readonly summary: string;
  readonly category: string;
  readonly categorySlug: string;
  readonly department: string;
  readonly officialUrl: string;
  readonly isUrgent: boolean;
  readonly isVerified: boolean;
  readonly publicationStatus: string;
  readonly publishedAt?: string;
}

export interface SchemeDetailDto extends SchemeSummaryDto {
  readonly fullDescription: string;
  readonly applicationUrl?: string;
  readonly benefits: readonly SchemeBenefitDto[];
  readonly documentsRequired: readonly { id: string; documentName: string; isMandatory: boolean }[];
  readonly faqs: readonly SchemeFaqDto[];
  readonly sources: readonly SchemeSourceDto[];
  readonly tags: readonly string[];

  // Flat CSV-import columns — always present regardless of whether this scheme went through the
  // normalized ingestion pipeline (which populates benefits/documentsRequired above) or a CSV
  // import (which only populates these). The web app renders whichever side has data.
  readonly level?: string;
  readonly state?: string;
  readonly ministry?: string;
  readonly beneficiaryType?: string;
  readonly targetBeneficiaries?: string;
  readonly benefitType?: string;
  readonly categories?: readonly string[];
  readonly subCategories?: readonly string[];
  readonly benefitsText?: string;
  readonly eligibilityText?: string;
  readonly exclusionsText?: string;
  readonly applicationMode?: string;
  readonly applicationProcess?: string;
  readonly documentsRequiredText?: string;
  readonly referencesText?: string;
  readonly schemeOpenDate?: string;
  readonly schemeCloseDate?: string;
  readonly dbtScheme?: boolean;
}

export interface SchemeListQuery {
  readonly search?: string;
  readonly categorySlug?: string;
  readonly department?: string;
  readonly limit?: number;
  readonly cursor?: string;
}

/** Deterministically ranked (priority engine) with a Gemini-generated one-line match blurb. */
export interface SchemeRecommendationDto extends SchemeSummaryDto {
  readonly matchReason: string;
  readonly priorityScore: number;
}

export interface SchemeRecommendationPageDto {
  readonly data: readonly SchemeRecommendationDto[];
  readonly totalCount: number;
  readonly hasNextPage: boolean;
}

export interface SchemeCategoryDto {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly schemeCount: number;
}

/** A scheme that a citizen has explicitly saved for quick reference. */
export interface SavedSchemeDto {
  readonly savedSchemeId: string;
  readonly schemeId: string;
  readonly schemeSlug: string;
  readonly schemeTitle: string;
  readonly schemeSummary: string;
  readonly schemeOfficialUrl: string;
  readonly savedAt: string;
}

export type { SupportedLanguage };
