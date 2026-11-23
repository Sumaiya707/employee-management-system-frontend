import { Badge } from '@/components/ui/badge'

// The kind of role: "Super Admin", "System" (HR, Employee) or "Custom".
export function RoleTypeBadge({ role }) {
  if (role.isSuperAdmin) {
    return <Badge variant="accent">Super Admin</Badge>
  }
  if (role.isSystem) {
    return <Badge variant="neutral">System</Badge>
  }
  return <Badge variant="outline">Custom</Badge>
}
