/**
 * Shared enums for database and application-level constants.
 * These map directly to integer values stored in the database.
 */

/** Soft-delete / row lifecycle status — used in every table's `record_status` column. */
export enum RecordStatus {
  Active = 0,
  Deleted = 1,
  Suspended = 2,
}

/** Bet direction — stored in `transactions.bet_type` and `transaction_details.bet_type`. */
export enum BetType {
  Back = 0,
  Lay = 1,
}

/** Helper: convert BetType number back to display string. */
export function betTypeToString(value: BetType): "back" | "lay" {
  return value === BetType.Back ? "back" : "lay";
}

/** User role hierarchy — stored in `users.role`. Values match group_id. */
export enum UserRole {
  Owner = 0,
  Admin = 3,
  Super = 4,
  Master = 5,
  Agent = 6,
  User = 7,
}

/** Helper: convert UserRole number back to display string. */
export function roleToString(value: UserRole | number): string {
  switch (value) {
    case UserRole.Owner:
      return "owner";
    case UserRole.Admin:
      return "admin";
    case UserRole.Super:
      return "super";
    case UserRole.Master:
      return "master";
    case UserRole.Agent:
      return "agent";
    case UserRole.User:
      return "user";
    default:
      return "user";
  }
}

/** Profile membership tier — stored in `profiles.membership`. */
export enum MembershipType {
  Bronze = 0,
  Silver = 1,
  Gold = 2,
  Platinum = 3,
}

/** Helper: convert MembershipType number back to display string. */
export function membershipToString(value: MembershipType | number): string {
  switch (value) {
    case MembershipType.Bronze:
      return "bronze";
    case MembershipType.Silver:
      return "silver";
    case MembershipType.Gold:
      return "gold";
    case MembershipType.Platinum:
      return "platinum";
    default:
      return "bronze";
  }
}

/** Normalize role from API (number) or cache (string) to display string. */
export function normalizeRole(value: string | number | undefined | null): string {
  if (value == null) return "user";
  if (typeof value === "number") return roleToString(value);
  return value;
}

/** Normalize membership from API (number) or cache (string) to display string. */
export function normalizeMembership(value: string | number | undefined | null): string {
  if (value == null) return "bronze";
  if (typeof value === "number") return membershipToString(value);
  return value;
}

/** Panel roles that can access the /owner admin panel. */
export const PANEL_ROLE_IDS = [UserRole.Owner, UserRole.Admin, UserRole.Super, UserRole.Master, UserRole.Agent];
export const PANEL_ROLE_STRINGS = ["owner", "admin", "super", "master", "agent"];
