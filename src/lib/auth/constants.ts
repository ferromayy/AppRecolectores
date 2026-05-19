export const SUPERADMIN_EMAIL = "somos@ecolink.com.ar" as const;

export const USER_ROLES = ["superadmin", "admin", "recolector"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const CREATABLE_ROLES = ["admin", "recolector"] as const satisfies readonly UserRole[];

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: "Superadmin",
  admin: "Admin",
  recolector: "Recolector",
};
