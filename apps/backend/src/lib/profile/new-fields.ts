/**
 * Signup profile expansion (progressive-profiling eligibility fields) — shared between
 * signupCompleteRoute (routes/api/v1/auth.route.ts) and the profile GET/PATCH routes
 * (routes/api/v1/profile.route.ts), so the new-field list exists in exactly one place instead of
 * being duplicated across signup and profile-edit handlers.
 *
 * Unlike gender/incomeRange/occupation/category (see lib/profile-enums.ts), these fields use the
 * same stable snake_case values on both the wire and in the DB — no Title-Case DTO conversion —
 * so this module only needs to validate untyped request JSON against the known enum value sets,
 * not translate between two vocabularies.
 */
import type { SignupProfileFields } from 'shared/contracts/auth';
import type { ProfileDto, UpdateProfileRequest } from 'shared/contracts/profile';
import type { EligibilityProfileFields } from 'shared/types';
import {
  agricultureActivityTypeValues,
  bplEwsStatusValues,
  businessTypeValues,
  disabilityPercentageValues,
  educationLevelValues,
  educationStreamValues,
  employmentStatusValues,
  housingSituationValues,
  landOwnershipValues,
  landholdingSizeValues,
  maritalStatusValues,
  residenceTypeValues,
  specialCircumstanceValues,
} from '../../db/enums';
import type { ProfileVersionPatch } from '../../db/repositories/profile.repository';
import type { profileVersions } from '../../db/schema/identity';

function asEnum<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}
function asStringArrayEnum<T extends string>(value: unknown, allowed: readonly T[]): T[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const filtered = value.filter((v): v is T => typeof v === 'string' && (allowed as readonly string[]).includes(v));
  return filtered.length > 0 ? filtered : [];
}
function asBool(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}
function asInt(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : undefined;
}
function asText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

/** Validates and extracts only the new eligibility fields from an untyped request body (signup's
 * `profile` object, or a PATCH /profile body) into a ProfileVersionPatch slice. Unknown/invalid
 * enum values are silently dropped (not errored) — same "best effort" tolerance the rest of the
 * signup/profile body parsing in this codebase already uses for optional fields. */
export function buildNewProfileFieldsPatch(body: Record<string, unknown> | undefined | null): Partial<ProfileVersionPatch> {
  if (!body) return {};
  const patch: Partial<ProfileVersionPatch> = {};

  const residenceType = asEnum(body.residenceType, residenceTypeValues);
  if (residenceType !== undefined) patch.residenceType = residenceType;

  const maritalStatus = asEnum(body.maritalStatus, maritalStatusValues);
  if (maritalStatus !== undefined) patch.maritalStatus = maritalStatus;

  const educationLevel = asEnum(body.educationLevel, educationLevelValues);
  if (educationLevel !== undefined) patch.educationLevel = educationLevel;

  const employmentStatus = asEnum(body.employmentStatus, employmentStatusValues);
  if (employmentStatus !== undefined) patch.employmentStatus = employmentStatus;

  const bplEwsStatus = asEnum(body.bplEwsStatus, bplEwsStatusValues);
  if (bplEwsStatus !== undefined) patch.bplEwsStatus = bplEwsStatus;

  const disabilityPercentage = asEnum(body.disabilityPercentage, disabilityPercentageValues);
  if (disabilityPercentage !== undefined) patch.disabilityPercentage = disabilityPercentage;

  const hasDependents = asBool(body.hasDependents);
  if (hasDependents !== undefined) patch.hasDependents = hasDependents;

  const numberOfDependents = asInt(body.numberOfDependents);
  if (numberOfDependents !== undefined) patch.numberOfDependents = numberOfDependents;

  const specialCircumstances = asStringArrayEnum(body.specialCircumstances, specialCircumstanceValues);
  if (specialCircumstances !== undefined) patch.specialCircumstances = specialCircumstances;

  const ownsAgriculturalLand = asEnum(body.ownsAgriculturalLand, landOwnershipValues);
  if (ownsAgriculturalLand !== undefined) patch.ownsAgriculturalLand = ownsAgriculturalLand;

  const landholdingSize = asEnum(body.landholdingSize, landholdingSizeValues);
  if (landholdingSize !== undefined) patch.landholdingSize = landholdingSize;

  const agricultureActivityType = asEnum(body.agricultureActivityType, agricultureActivityTypeValues);
  if (agricultureActivityType !== undefined) patch.agricultureActivityType = agricultureActivityType;

  const educationStream = asEnum(body.educationStream, educationStreamValues);
  if (educationStream !== undefined) patch.educationStream = educationStream;

  const currentYearClass = asText(body.currentYearClass);
  if (currentYearClass !== undefined) patch.currentYearClass = currentYearClass;

  const housingSituation = asEnum(body.housingSituation, housingSituationValues);
  if (housingSituation !== undefined) patch.housingSituation = housingSituation;

  const ownsResidentialLand = asBool(body.ownsResidentialLand);
  if (ownsResidentialLand !== undefined) patch.ownsResidentialLand = ownsResidentialLand;

  const businessType = asEnum(body.businessType, businessTypeValues);
  if (businessType !== undefined) patch.businessType = businessType;

  return patch;
}

/** Convenience wrapper for the two typed request shapes that carry these fields. */
export function buildNewProfileFieldsPatchFromRequest(
  body: SignupProfileFields | UpdateProfileRequest | undefined | null,
): Partial<ProfileVersionPatch> {
  return buildNewProfileFieldsPatch(body as unknown as Record<string, unknown> | undefined | null);
}

/** Projects the new fields off an active profile_versions row onto a ProfileDto-shaped object.
 * Values pass straight through — no DB-enum-to-display-label translation needed for these fields
 * (see module doc comment above). */
export function mapNewProfileFieldsToDto(
  version: typeof profileVersions.$inferSelect | undefined,
): Partial<EligibilityProfileFields> {
  if (!version) return {};
  const dto: Partial<EligibilityProfileFields> = {};

  if (version.residenceType != null) dto.residenceType = version.residenceType;
  if (version.maritalStatus != null) dto.maritalStatus = version.maritalStatus;
  if (version.educationLevel != null) dto.educationLevel = version.educationLevel;
  if (version.employmentStatus != null) dto.employmentStatus = version.employmentStatus;
  if (version.bplEwsStatus != null) dto.bplEwsStatus = version.bplEwsStatus;
  if (version.disabilityPercentage != null) dto.disabilityPercentage = version.disabilityPercentage;
  if (version.hasDependents != null) dto.hasDependents = version.hasDependents;
  if (version.numberOfDependents != null) dto.numberOfDependents = version.numberOfDependents;
  if (version.specialCircumstances != null && version.specialCircumstances.length > 0) {
    dto.specialCircumstances = version.specialCircumstances as NonNullable<EligibilityProfileFields['specialCircumstances']>;
  }
  if (version.ownsAgriculturalLand != null) dto.ownsAgriculturalLand = version.ownsAgriculturalLand;
  if (version.landholdingSize != null) dto.landholdingSize = version.landholdingSize;
  if (version.agricultureActivityType != null) dto.agricultureActivityType = version.agricultureActivityType;
  if (version.educationStream != null) dto.educationStream = version.educationStream;
  if (version.currentYearClass != null) dto.currentYearClass = version.currentYearClass;
  if (version.housingSituation != null) dto.housingSituation = version.housingSituation;
  if (version.ownsResidentialLand != null) dto.ownsResidentialLand = version.ownsResidentialLand;
  if (version.businessType != null) dto.businessType = version.businessType;

  return dto;
}
