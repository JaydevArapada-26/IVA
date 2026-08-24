export { adminLogs, auditLogs } from './audit';
export { aiConversations, conversationMessages } from './ai';
export * from '../enums';

export { adminUsers, identityRelations, profileVersions, profiles, users } from './identity';
export { languages } from './languages';
export {
  governmentDepartments,
  schemeBenefits,
  schemeCategories,
  schemeDocuments,
  schemeEligibilityRuleGroups,
  schemeEligibilityRuleSets,
  schemeEligibilityRuleValues,
  schemeEligibilityRules,
  schemeEmbeddings,
  schemeFaqs,
  schemeSources,
  schemeSubcategories,
  schemeTagMaps,
  schemeTags,
  schemes,
} from './schemes';
export { schemesCategorized } from './schemes-categorized';
export {
  applications,
  dailySmsJobRuns,
  eligibilityResults,
  notifications,
  savedSchemes,
  smsNotifications,
  smsQueue,
} from './engagement';
export {
  importItems,
  importSessions,
  jobAttempts,
  reviewComments,
  reviewQueue,
  workerJobs,
} from './workflow';

import { adminLogs, auditLogs } from './audit';
import { aiConversations, conversationMessages } from './ai';
import { adminUsers, profileVersions, profiles, users } from './identity';
import { languages } from './languages';
import {
  governmentDepartments,
  schemeBenefits,
  schemeCategories,
  schemeDocuments,
  schemeEligibilityRuleGroups,
  schemeEligibilityRuleSets,
  schemeEligibilityRuleValues,
  schemeEligibilityRules,
  schemeEmbeddings,
  schemeFaqs,
  schemeSources,
  schemeSubcategories,
  schemeTagMaps,
  schemeTags,
  schemes,
} from './schemes';
import { schemesCategorized } from './schemes-categorized';
import {
  applications,
  dailySmsJobRuns,
  eligibilityResults,
  notifications,
  savedSchemes,
  smsNotifications,
  smsQueue,
} from './engagement';
import {
  importItems,
  importSessions,
  jobAttempts,
  reviewComments,
  reviewQueue,
  workerJobs,
} from './workflow';

export const schemaDefinition = {
  users,
  profiles,
  profileVersions,
  adminUsers,
  languages,
  governmentDepartments,
  schemeCategories,
  schemeSubcategories,
  schemes,
  schemeDocuments,
  schemeBenefits,
  schemeEligibilityRuleSets,
  schemeEligibilityRuleGroups,
  schemeEligibilityRules,
  schemeEligibilityRuleValues,
  schemeFaqs,
  schemeTags,
  schemeTagMaps,
  schemeSources,
  schemeEmbeddings,
  schemesCategorized,
  applications,
  savedSchemes,
  eligibilityResults,
  notifications,
  smsQueue,
  smsNotifications,
  dailySmsJobRuns,
  importSessions,
  importItems,
  reviewQueue,
  reviewComments,
  workerJobs,
  jobAttempts,
  aiConversations,
  conversationMessages,
  adminLogs,
  auditLogs,
} as const;

export type SchemaDefinition = typeof schemaDefinition;
