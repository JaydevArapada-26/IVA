/** Computes age in whole years from an ISO date string (YYYY-MM-DD), as of today. */
export function computeAgeFromDob(dateOfBirth: string): number | undefined {
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return undefined;

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;

  return age >= 0 ? age : undefined;
}
