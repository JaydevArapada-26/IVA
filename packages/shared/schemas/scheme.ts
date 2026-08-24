export const SCHEME_IMPORT_FIELDS = [
  'id',
  'title',
  'category',
  'department',
  'summary',
  'fullDescription',
  'benefits',
  'documentsRequired',
  'officialUrl',
  'sourceVerifiedDate',
  'popularityScore',
] as const;

export type SchemeImportField = (typeof SCHEME_IMPORT_FIELDS)[number];

export const SCHEME_IMPORT_LIST_FIELDS = [
  'benefits',
  'documentsRequired',
  'applicationSteps',
] as const;

export type SchemeImportListField = (typeof SCHEME_IMPORT_LIST_FIELDS)[number];
