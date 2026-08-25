export interface AdminStatsDto {
  readonly publishedSchemes: number;
  readonly totalSchemes: number;
  readonly activeUsers: number;
  readonly totalUsers: number;
  readonly smsSent: number;
  readonly smsQueued: number;
  readonly languagesConfigured: number;
}

export interface AdminLanguageDto {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly nativeName: string;
  readonly isActive: boolean;
  readonly sortOrder: number;
  readonly updatedAt: string;
}

export interface AdminLanguageUpsertRequest {
  readonly code: string;
  readonly name: string;
  readonly nativeName: string;
  readonly isActive?: boolean;
  readonly sortOrder?: number;
}

export interface AdminSchemeRecordDto {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly department: string;
  readonly category: string;
  readonly publicationStatus: string;
  readonly isVerified: boolean;
  readonly isUrgent: boolean;
  readonly officialUrl: string;
  readonly updatedAt: string;
}

/** Full flat-column scheme record for the admin detail view / CRUD form. */
export interface AdminSchemeDetailDto {
  readonly id: string;
  readonly slug: string;
  readonly schemeName: string;
  readonly shortTitle?: string;
  readonly level?: string;
  readonly state?: string;
  readonly ministry?: string;
  readonly department?: string;
  readonly beneficiaryType?: string;
  readonly targetBeneficiaries?: string;
  readonly benefitType?: string;
  readonly categories?: readonly string[];
  readonly subCategories?: readonly string[];
  readonly tags?: readonly string[];
  readonly briefDescription: string;
  readonly detailedDescription: string;
  readonly benefits?: string;
  readonly eligibility?: string;
  readonly exclusions?: string;
  readonly applicationMode?: string;
  readonly applicationProcess?: string;
  readonly documentsRequired?: string;
  readonly references?: string;
  readonly schemeOpenDate?: string;
  readonly schemeCloseDate?: string;
  readonly dbtScheme: boolean;
  readonly faqCount?: number;
  readonly sourceUrl: string;
  readonly applicationUrl?: string;
  readonly publicationStatus: string;
  readonly isUrgent: boolean;
  readonly isVerified: boolean;
  readonly updatedAt: string;
  readonly createdAt: string;
}

export type AdminSchemeUpsertRequest = Omit<AdminSchemeDetailDto, 'id' | 'updatedAt' | 'createdAt'>;

/** Server-derived state of the most recent admin-triggered SMS for this user — the source of
 * truth for whether the "Send SMS" button should be locked, so the lock survives page reloads
 * and tab switches instead of living only in the admin panel's local component state. */
export interface AdminUserSmsStateDto {
  readonly status: 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'retrying';
  readonly schemeName?: string;
  readonly schemeTitle?: string;
  readonly failureReason?: string;
  readonly createdAt: string;
  /** When this status was last updated (send completed, or failed) — used to hide the "Sent:
   * [scheme]" banner 5 real seconds after completion, not 5 seconds after the page loads. */
  readonly completedAt: string;
}

export interface AdminUserRecordDto {
  readonly id: string;
  readonly authUserId: string;
  readonly phoneNumber: string;
  readonly email?: string;
  readonly displayName?: string;
  readonly status: string;
  readonly rememberMeEnabled: boolean;
  readonly profileStatus?: string;
  readonly lastSignInAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastAdminSms?: AdminUserSmsStateDto;
}

export interface AdminBulkIdsRequest {
  readonly ids: readonly string[];
}

export interface AdminBulkResultResponse {
  readonly affected: number;
}

export interface AdminSetUserStatusRequest {
  readonly status: 'active' | 'inactive' | 'suspended';
}

/** Editable citizen profile fields, sourced from the active profile_versions row. */
export interface AdminUserProfileDto {
  readonly age?: number;
  readonly gender?: string;
  readonly state?: string;
  readonly district?: string;
  readonly incomeRange?: string;
  readonly occupation?: string;
  readonly category?: string;
  readonly disabilityStatus?: boolean;
  readonly studentStatus?: boolean;
  readonly farmerStatus?: boolean;
  readonly seniorCitizenStatus?: boolean;
}

export interface AdminUserUpdateRequest {
  readonly displayName?: string;
  readonly email?: string;
  readonly status?: string;
  readonly profile?: AdminUserProfileDto;
}

/** Acknowledges that the send was queued — NOT that it went out. The actual eligibility scan /
 * Gemini phrasing / Twilio send happens afterward in the background (can take a while over
 * thousands of schemes), and its outcome shows up later as `AdminUserRecordDto.lastAdminSms`. */
export interface AdminSendSmsResponse {
  readonly accepted: boolean;
  readonly reason?: string;
  readonly notificationId?: string;
}

/** One execution of the daily scheme-recommendation SMS job (Stage 3) — backs the admin
 * operational view (spec 3.32). `status: 'running'` means the job is still in progress; poll
 * GET /admin/daily-sms/runs again to see it finish. */
export interface DailySmsJobRunDto {
  readonly id: string;
  readonly triggerSource: 'scheduler' | 'admin_manual';
  readonly deliveryDate: string;
  readonly status: 'running' | 'completed' | 'failed';
  readonly usersConsidered: number;
  readonly usersSkipped: number;
  readonly messagesEnqueued: number;
  readonly noSuitableSchemeCount: number;
  readonly errorSummary?: string;
  readonly startedAt: string;
  readonly finishedAt?: string;
}

/** Acknowledges the job started — same "accepted now, finishes in the background" shape as
 * AdminSendSmsResponse; poll GET /admin/daily-sms/runs for progress/completion. */
export interface RunDailySmsJobResponse {
  readonly accepted: boolean;
  readonly runId: string;
}

export interface AdminLogEntryDto {
  readonly id: string;
  readonly actorType: string;
  readonly actorLabel: string;
  readonly action: string;
  readonly entityType: string;
  readonly entityId?: string;
  readonly reason?: string;
  readonly occurredAt: string;
}

export interface AdminIngestionRecordDto {
  readonly id: string;
  readonly sourceUrl: string;
  readonly status: string;
  readonly extractedTitle?: string;
  readonly extractionConfidence?: number;
  readonly errorMessage?: string;
  readonly createdAt: string;
}

export interface AdminBulkPrepRequest {
  readonly urls: readonly string[];
}

export interface AdminCanonicalImportRowDto {
  readonly rowNumber: number;
  readonly status: string;
  readonly extractedTitle?: string;
  readonly errorMessage?: string;
}

export interface AdminSmsRecordDto {
  readonly id: string;
  readonly phoneNumber?: string;
  readonly schemeTitle?: string;
  readonly messageBody: string;
  readonly status: string;
  readonly notificationType: string;
  readonly failureReason?: string;
  readonly sentAt?: string;
  readonly createdAt: string;
}

/** Row-level result of importing `schemes_categorized.csv` — the deterministic matching-layer
 * import, separate from the canonical `schemes.csv` import. No admin UI wires this yet; it's
 * called directly (e.g. via API client or Supabase tooling upload). */
export interface AdminCategorizedImportRowDto {
  readonly rowNumber: number;
  readonly status: string;
  readonly slug?: string;
  readonly errorMessage?: string;
}

export interface AdminSourceRecordDto {
  readonly id: string;
  readonly schemeTitle: string;
  readonly sourceUrl: string;
  readonly verificationStatus: string;
  readonly httpStatus?: number;
  readonly lastCheckedAt?: string;
}

export interface AdminReviewQueueRecordDto {
  readonly id: string;
  readonly sourceType: string;
  readonly status: string;
  readonly priority: string;
  readonly confidenceScore?: number;
  readonly schemeTitle?: string;
  readonly createdAt: string;
}

export interface AdminReviewDecisionRequest {
  readonly decision: 'approved' | 'rejected' | 'duplicate';
  readonly reviewNotes?: string;
  readonly duplicateOfSchemeId?: string;
}
