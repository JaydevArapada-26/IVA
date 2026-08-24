import type { ApiClient } from './client';
import type {
  AdminBulkIdsRequest,
  AdminBulkPrepRequest,
  AdminBulkResultResponse,
  AdminCanonicalImportRowDto,
  AdminIngestionRecordDto,
  AdminLanguageDto,
  AdminLanguageUpsertRequest,
  AdminLogEntryDto,
  AdminLoginRequestDto,
  AdminLoginResponseDto,
  AdminReviewDecisionRequest,
  AdminReviewQueueRecordDto,
  AdminSchemeDetailDto,
  AdminSchemeRecordDto,
  AdminSchemeUpsertRequest,
  AdminSendSmsResponse,
  AdminSetUserStatusRequest,
  AdminSmsRecordDto,
  AdminSourceRecordDto,
  AdminStatsDto,
  AdminUserRecordDto,
  AdminUserUpdateRequest,
  DailySmsJobRunDto,
  RunDailySmsJobResponse,
  AssistantMessageRequest,
  AssistantMessageResponse,
  CheckAccountResponse,
  EligibilityResultDto,
  LoginRequestDto,
  LoginResponseDto,
  NotificationDto,
  ProfileDto,
  RequestOtpRequest,
  RequestOtpResponse,
  SavedSchemeDto,
  SessionExchangeRequest,
  SessionExchangeResponse,
  SignupCompleteRequest,
  SignupCompleteResponse,
  SchemeCategoryDto,
  SchemeDetailDto,
  SchemeListQuery,
  SchemeRecommendationPageDto,
  SchemeSummaryDto,
  SmsHistoryDto,
  SyncIdentityRequest,
  SyncIdentityResponse,
  UpdateProfileRequest,
} from '../contracts';

export function createSchemesApi(client: ApiClient) {
  return {
    list: (query?: SchemeListQuery) => client.get<readonly SchemeSummaryDto[]>('/schemes', query as Record<string, string | number | boolean | undefined>),
    categories: () => client.get<readonly SchemeCategoryDto[]>('/schemes/categories'),
    recommended: (page?: number, pageSize?: number, occupationOnly?: boolean) =>
      client.get<SchemeRecommendationPageDto>('/schemes/recommended', {
        ...(page ? { page } : {}),
        ...(pageSize ? { pageSize } : {}),
        ...(occupationOnly ? { occupationOnly: true } : {}),
      }),
    getBySlug: (slug: string) => client.get<SchemeDetailDto>(`/schemes/${slug}`),
    savedList: () => client.get<readonly SavedSchemeDto[]>('/schemes/saved'),
    save: (schemeId: string) => client.post<{ saved: boolean }>('/schemes/saved', { schemeId }),
    unsave: (schemeId: string) => client.del<{ unsaved: boolean }>(`/schemes/saved/${schemeId}`),
  };
}

export function createProfileApi(client: ApiClient) {
  return {
    get: () => client.get<ProfileDto>('/profile'),
    update: (body: UpdateProfileRequest) => client.patch<ProfileDto>('/profile', body),
    syncIdentity: (body: SyncIdentityRequest) => client.post<SyncIdentityResponse>('/profile/sync-identity', body),
    eligibility: () => client.get<readonly EligibilityResultDto[]>('/profile/eligibility'),
    notifications: () => client.get<readonly NotificationDto[]>('/profile/notifications'),
    smsHistory: () => client.get<readonly SmsHistoryDto[]>('/profile/sms-history'),
  };
}

export function createAuthApi(client: ApiClient) {
  return {
    requestOtp: (body: RequestOtpRequest) => client.post<RequestOtpResponse>('/auth/otp', body),
    login: (body: LoginRequestDto) => client.post<LoginResponseDto>('/auth/login', body),
    adminLogin: (body: AdminLoginRequestDto) => client.post<AdminLoginResponseDto>('/auth/admin-login', body),
    sessionExchange: (body: SessionExchangeRequest) => client.post<SessionExchangeResponse>('/auth/session/exchange', body),
    signupComplete: (body: SignupCompleteRequest) => client.post<SignupCompleteResponse>('/auth/signup/complete', body),
    checkAccount: (query: { email?: string; phone?: string }) =>
      client.get<CheckAccountResponse>('/auth/check-account', query as Record<string, string | undefined>),
  };
}

export function createAssistantApi(client: ApiClient) {
  return {
    sendMessage: (body: AssistantMessageRequest) => client.post<AssistantMessageResponse>('/assistant/message', body),
  };
}


export function createAdminApi(client: ApiClient) {
  return {
    stats: () => client.get<AdminStatsDto>('/admin/stats'),
    schemes: () => client.get<readonly AdminSchemeRecordDto[]>('/admin/schemes'),
    publishScheme: (schemeId: string) => client.post<AdminSchemeRecordDto>(`/admin/schemes/${schemeId}/publish`),
    archiveScheme: (schemeId: string) => client.post<AdminSchemeRecordDto>(`/admin/schemes/${schemeId}/archive`),
    schemeDetail: (schemeId: string) => client.get<AdminSchemeDetailDto>(`/admin/schemes/${schemeId}/detail`),
    createScheme: (body: AdminSchemeUpsertRequest) => client.post<AdminSchemeDetailDto>('/admin/schemes', body),
    updateScheme: (schemeId: string, body: Partial<AdminSchemeUpsertRequest>) =>
      client.patch<AdminSchemeDetailDto>(`/admin/schemes/${schemeId}`, body),
    deleteScheme: (schemeId: string) => client.del<{ deleted: boolean }>(`/admin/schemes/${schemeId}`),
    bulkDeleteSchemes: (body: AdminBulkIdsRequest) => client.post<AdminBulkResultResponse>('/admin/schemes/bulk-delete', body),
    users: () => client.get<readonly AdminUserRecordDto[]>('/admin/users'),
    updateUser: (userId: string, body: AdminUserUpdateRequest) =>
      client.patch<AdminUserRecordDto>(`/admin/users/${userId}`, body),
    setUserStatus: (userId: string, body: AdminSetUserStatusRequest) =>
      client.patch<AdminBulkResultResponse>(`/admin/users/${userId}/status`, body),
    bulkSetUserStatus: (body: AdminBulkIdsRequest & AdminSetUserStatusRequest) =>
      client.post<AdminBulkResultResponse>('/admin/users/bulk-status', body),
    deleteUser: (userId: string) => client.del<{ deleted: boolean }>(`/admin/users/${userId}`),
    bulkDeleteUsers: (body: AdminBulkIdsRequest) => client.post<AdminBulkResultResponse>('/admin/users/bulk-delete', body),
    sendSms: (userId: string) => client.post<AdminSendSmsResponse>(`/admin/users/${userId}/send-sms`),
    runDailySmsJob: () => client.post<RunDailySmsJobResponse>('/admin/daily-sms/run'),
    dailySmsJobRuns: () => client.get<readonly DailySmsJobRunDto[]>('/admin/daily-sms/runs'),
    logs: () => client.get<readonly AdminLogEntryDto[]>('/admin/logs'),
    deleteLog: (logId: string) => client.del<{ deleted: boolean }>(`/admin/logs/${logId}`),
    bulkDeleteLogs: (body: AdminBulkIdsRequest) => client.post<AdminBulkResultResponse>('/admin/logs/bulk-delete', body),
    smsQueue: () => client.get<readonly AdminSmsRecordDto[]>('/admin/sms-queue'),
    deleteSmsLog: (smsLogId: string) => client.del<{ deleted: boolean }>(`/admin/sms-queue/${smsLogId}`),
    bulkDeleteSmsLogs: (body: AdminBulkIdsRequest) => client.post<AdminBulkResultResponse>('/admin/sms-queue/bulk-delete', body),
    sources: () => client.get<readonly AdminSourceRecordDto[]>('/admin/sources'),
    reverifySource: (sourceId: string) => client.post<AdminSourceRecordDto>(`/admin/sources/${sourceId}/reverify`),
    reviewQueue: () => client.get<readonly AdminReviewQueueRecordDto[]>('/admin/review-queue'),
    decideReview: (reviewId: string, body: AdminReviewDecisionRequest) =>
      client.post<AdminReviewQueueRecordDto>(`/admin/review-queue/${reviewId}/decide`, body),
    startBulkPrep: (body: AdminBulkPrepRequest) => client.post<readonly AdminIngestionRecordDto[]>('/admin/ingestion/bulk-prep', body),
    ingestUrl: (url: string) => client.post<AdminIngestionRecordDto>('/admin/ingestion/url', { url }),
    ingestionQueue: () => client.get<readonly AdminIngestionRecordDto[]>('/admin/ingestion'),
    importCanonicalCsv: (csvText: string) => client.post<readonly AdminCanonicalImportRowDto[]>('/admin/ingestion/canonical-import', { csvText }),
    languages: () => client.get<readonly AdminLanguageDto[]>('/admin/languages'),
    createLanguage: (body: AdminLanguageUpsertRequest) => client.post<AdminLanguageDto>('/admin/languages', body),
    updateLanguage: (languageId: string, body: Partial<AdminLanguageUpsertRequest>) =>
      client.patch<AdminLanguageDto>(`/admin/languages/${languageId}`, body),
    deleteLanguage: (languageId: string) => client.del<{ deleted: boolean }>(`/admin/languages/${languageId}`),
  };
}

export type IvaApi = {
  schemes: ReturnType<typeof createSchemesApi>;
  profile: ReturnType<typeof createProfileApi>;
  auth: ReturnType<typeof createAuthApi>;
  assistant: ReturnType<typeof createAssistantApi>;
  admin: ReturnType<typeof createAdminApi>;
};
