import type {
  UserRole,
} from '../types/auth'

export type NavigationIcon =
  | 'dashboard'
  | 'inventory'
  | 'sale'
  | 'receiving'
  | 'adjustment'
  | 'products'
  | 'suppliers'
  | 'staff'
  | 'reports'
  | 'movements'
  | 'audit'

export type NavigationItem = {
  label: string
  to: string
  icon: NavigationIcon
  roles: UserRole[]
}

export type NavigationSection = {
  label: string
  items: NavigationItem[]
}

export const navigationSections:
  NavigationSection[] = [
    {
      label: 'Main',

      items: [
        {
          label: 'Dashboard',
          to: '/dashboard',
          icon: 'dashboard',
          roles: [
            'OWNER',
            'STAFF',
          ],
        },
      ],
    },

    {
      label: 'Operations',

      items: [
        {
          label: 'Inventory',
          to: '/inventory',
          icon: 'inventory',
          roles: [
            'OWNER',
            'STAFF',
          ],
        },

        {
          label: 'New Sale',
          to: '/sales/new',
          icon: 'sale',
          roles: [
            'OWNER',
            'STAFF',
          ],
        },

        {
          label: 'Receive Stock',
          to: '/receiving',
          icon: 'receiving',
          roles: [
            'OWNER',
            'STAFF',
          ],
        },

        {
          label: 'Adjust Stock',
          to: '/adjustments',
          icon: 'adjustment',
          roles: [
            'OWNER',
          ],
        },
      ],
    },

    {
      label: 'Management',

      items: [
        {
          label: 'Products',
          to: '/products',
          icon: 'products',
          roles: [
            'OWNER',
          ],
        },

        {
          label: 'Suppliers',
          to: '/suppliers',
          icon: 'suppliers',
          roles: [
            'OWNER',
          ],
        },

        {
          label: 'Staff',
          to: '/staff',
          icon: 'staff',
          roles: [
            'OWNER',
          ],
        },
      ],
    },

    {
      label: 'Insights',

      items: [
        {
          label: 'Reports',
          to: '/reports',
          icon: 'reports',
          roles: [
            'OWNER',
          ],
        },

        {
          label: 'Movements',
          to: '/movements',
          icon: 'movements',
          roles: [
            'OWNER',
          ],
        },

        {
          label: 'Audit',
          to: '/audit',
          icon: 'audit',
          roles: [
            'OWNER',
          ],
        },
      ],
    },
  ]

export function getVisibleNavigation(
  role: UserRole,
): NavigationSection[] {
  return navigationSections
    .map(
      (section) => ({
        ...section,

        items:
          section.items.filter(
            (item) =>
              item.roles.includes(
                role,
              ),
          ),
      }),
    )
    .filter(
      (section) =>
        section.items.length >
        0,
    )
}