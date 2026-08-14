export const ROLES = Object.freeze({
  ADMIN: 'admin',
  STAFF: 'staff',
  LECTURER: 'lecturer',
})

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.STAFF]: 'Staff',
  [ROLES.LECTURER]: 'Lecturer',
}

export const ALL_ROLES = Object.values(ROLES)
