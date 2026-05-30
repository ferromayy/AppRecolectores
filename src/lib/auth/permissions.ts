import { SUPERADMIN_EMAIL, type UserRole } from "@/lib/auth/constants";
import { CREATABLE_ROLES } from "@/lib/auth/constants";

export type ProfileLike = { role: UserRole };

export function isSuperadminUser(
  profile: ProfileLike | null | undefined,
  email: string | null | undefined,
) {
  return (
    profile?.role === "superadmin" &&
    email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()
  );
}

/** Superadmin o admin: pueden gestionar usuarios (con distintos límites). */
export function canManageUsers(profile: ProfileLike | null | undefined) {
  return profile?.role === "superadmin" || profile?.role === "admin";
}

/** Roles que este actor puede crear. */
export function creatableRolesFor(actorRole: UserRole): readonly UserRole[] {
  if (actorRole === "superadmin") {
    return CREATABLE_ROLES;
  }
  if (actorRole === "admin") {
    return ["recolector"];
  }
  return [];
}

export function canCreateRole(actorRole: UserRole, targetRole: UserRole) {
  return creatableRolesFor(actorRole).includes(targetRole);
}

export function canResetPassword(actorRole: UserRole, targetRole: UserRole) {
  if (targetRole === "superadmin") return false;
  if (actorRole === "superadmin") {
    return targetRole === "admin" || targetRole === "recolector";
  }
  if (actorRole === "admin") {
    return targetRole === "recolector";
  }
  return false;
}

export function listableRolesFor(actorRole: UserRole): UserRole[] {
  if (actorRole === "superadmin") {
    return ["admin", "recolector"];
  }
  if (actorRole === "admin") {
    return ["recolector"];
  }
  return [];
}
