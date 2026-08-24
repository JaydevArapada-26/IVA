export type EligibilityResultStatus = 'eligible' | 'ineligible' | 'partial' | 'unknown';

export interface EligibilityResultDto {
  readonly schemeId: string;
  readonly resultStatus: EligibilityResultStatus;
  readonly score?: number;
  readonly matchedRulesCount: number;
  readonly failedRulesCount: number;
  readonly summary?: string;
  readonly evaluatedAt: string;
}
