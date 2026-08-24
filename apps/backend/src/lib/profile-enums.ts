import type { Category, Gender, IncomeRange, Occupation } from 'shared/types';
import type { CategoryValue, GenderValue, IncomeRangeValue, OccupationValue } from '../db/enums';

/**
 * The DB schema stores profile enum fields as lowercase snake_case values (see db/enums.ts),
 * while the frontend-facing contracts (packages/shared/types) use human-readable display
 * strings. These tables translate between the two so route handlers never leak DB enum values
 * into API responses (or vice versa).
 */

const GENDER_DB_TO_DTO: Record<GenderValue, Gender> = {
  male: 'Male',
  female: 'Female',
  transgender: 'Transgender',
  other: 'Other',
  prefer_not_to_say: 'Prefer not to say',
};
const GENDER_DTO_TO_DB: Record<Gender, GenderValue> = {
  Male: 'male',
  Female: 'female',
  Transgender: 'transgender',
  Other: 'other',
  'Prefer not to say': 'prefer_not_to_say',
};

const INCOME_DB_TO_DTO: Record<IncomeRangeValue, IncomeRange> = {
  lt_1_lakh: '< 1 Lakh',
  '1_to_25_lakh': '1 - 2.5 Lakhs',
  '25_to_5_lakh': '2.5 - 5 Lakhs',
  '5_to_8_lakh': '5 - 8 Lakhs',
  gt_8_lakh: '> 8 Lakhs',
};
const INCOME_DTO_TO_DB: Record<IncomeRange, IncomeRangeValue> = {
  '< 1 Lakh': 'lt_1_lakh',
  '1 - 2.5 Lakhs': '1_to_25_lakh',
  '2.5 - 5 Lakhs': '25_to_5_lakh',
  '5 - 8 Lakhs': '5_to_8_lakh',
  '> 8 Lakhs': 'gt_8_lakh',
};

const CATEGORY_DB_TO_DTO: Record<CategoryValue, Category> = {
  general: 'General',
  obc: 'OBC',
  sc: 'SC',
  st: 'ST',
  ews: 'EWS',
  prefer_not_to_say: 'Prefer not to say',
  other: 'Other',
};
const CATEGORY_DTO_TO_DB: Record<Category, CategoryValue> = {
  General: 'general',
  OBC: 'obc',
  SC: 'sc',
  ST: 'st',
  EWS: 'ews',
  'Prefer not to say': 'prefer_not_to_say',
  Other: 'other',
};

const OCCUPATION_DB_TO_DTO: Record<OccupationValue, Occupation> = {
  farmer: 'Farmer',
  laborer: 'Laborer',
  student: 'Student',
  self_employed: 'Self-Employed',
  unemployed: 'Unemployed',
  private_sector: 'Private Sector',
  government_sector: 'Government Sector',
  homemaker: 'Homemaker',
};
const OCCUPATION_DTO_TO_DB: Record<Occupation, OccupationValue> = {
  Farmer: 'farmer',
  Laborer: 'laborer',
  Student: 'student',
  'Self-Employed': 'self_employed',
  Unemployed: 'unemployed',
  'Private Sector': 'private_sector',
  'Government Sector': 'government_sector',
  Homemaker: 'homemaker',
};

export function genderToDto(value: GenderValue | null | undefined): Gender | undefined {
  return value ? GENDER_DB_TO_DTO[value] : undefined;
}
export function genderToDb(value: Gender | undefined): GenderValue | undefined {
  return value ? GENDER_DTO_TO_DB[value] : undefined;
}
export function incomeRangeToDto(value: IncomeRangeValue | null | undefined): IncomeRange | undefined {
  return value ? INCOME_DB_TO_DTO[value] : undefined;
}
export function incomeRangeToDb(value: IncomeRange | undefined): IncomeRangeValue | undefined {
  return value ? INCOME_DTO_TO_DB[value] : undefined;
}
export function categoryToDto(value: CategoryValue | null | undefined): Category | undefined {
  return value ? CATEGORY_DB_TO_DTO[value] : undefined;
}
export function categoryToDb(value: Category | undefined): CategoryValue | undefined {
  return value ? CATEGORY_DTO_TO_DB[value] : undefined;
}
export function occupationToDto(value: OccupationValue | null | undefined): Occupation | undefined {
  return value ? OCCUPATION_DB_TO_DTO[value] : undefined;
}
export function occupationToDb(value: Occupation | undefined): OccupationValue | undefined {
  return value ? OCCUPATION_DTO_TO_DB[value] : undefined;
}
