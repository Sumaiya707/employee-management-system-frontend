// Permission checks use only what the backend returned for the logged-in user
// (GET /api/auth/me → data.user.permissions). The backend checks every request
// again; these checks only decide what to show.

export function hasPermission(user, key) {
  if (!user || !Array.isArray(user.permissions)) {
    return false
  }
  return user.permissions.includes(key)
}

export function hasAnyPermission(user, keys) {
  return keys.some((key) => hasPermission(user, key))
}

// "all" (organisation-wide) or "self" (own records only), from the role.
export function dataScope(user) {
  return (user && user.role && user.role.dataScope) || 'self'
}
