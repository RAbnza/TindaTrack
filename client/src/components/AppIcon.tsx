import type { NavigationIcon as NavigationIconName } from '../config/navigation'

export function AppIcon({
  name,
}: {
  name: NavigationIconName
}) {
  const commonProps = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,

    strokeLinecap:
      'round' as const,

    strokeLinejoin:
      'round' as const,

    'aria-hidden':
      true as const,
  }

  switch (name) {
    case 'dashboard':
      return (
        <svg {...commonProps}>
          <rect
            x="4"
            y="4"
            width="6"
            height="6"
            rx="1.5"
          />

          <rect
            x="14"
            y="4"
            width="6"
            height="6"
            rx="1.5"
          />

          <rect
            x="4"
            y="14"
            width="6"
            height="6"
            rx="1.5"
          />

          <rect
            x="14"
            y="14"
            width="6"
            height="6"
            rx="1.5"
          />
        </svg>
      )

    case 'inventory':
      return (
        <svg {...commonProps}>
          <path d="M5 7.5 12 4l7 3.5v9L12 20l-7-3.5z" />
          <path d="M5 7.5 12 11l7-3.5" />
          <path d="M12 11v9" />
        </svg>
      )

    case 'sale':
      return (
        <svg {...commonProps}>
          <path d="M5 6h14v12H5z" />
          <path d="M8 10h8" />
          <path d="M8 14h3" />
        </svg>
      )

    case 'receiving':
      return (
        <svg {...commonProps}>
          <path d="M12 4v10" />
          <path d="m8 10 4 4 4-4" />
          <path d="M5 17v3h14v-3" />
        </svg>
      )

    case 'adjustment':
      return (
        <svg {...commonProps}>
          <path d="M4 7h10" />
          <path d="M18 7h2" />

          <circle
            cx="16"
            cy="7"
            r="2"
          />

          <path d="M4 17h2" />
          <path d="M10 17h10" />

          <circle
            cx="8"
            cy="17"
            r="2"
          />
        </svg>
      )

    case 'products':
      return (
        <svg {...commonProps}>
          <rect
            x="4"
            y="5"
            width="16"
            height="14"
            rx="2"
          />

          <path d="M4 10h16" />
          <path d="M9 5v5" />
        </svg>
      )

    case 'suppliers':
      return (
        <svg {...commonProps}>
          <path d="M4 18V8l8-4 8 4v10" />
          <path d="M8 18v-4h8v4" />
          <path d="M8 9h.01M12 9h.01M16 9h.01" />
        </svg>
      )

    case 'staff':
      return (
        <svg {...commonProps}>
          <circle
            cx="9"
            cy="8"
            r="3"
          />

          <path d="M4 19c0-3 2-5 5-5s5 2 5 5" />

          <path d="M16 8.5c2 .3 3 1.5 3 3.5" />

          <path d="M16 15c2.2.3 4 1.8 4 4" />
        </svg>
      )

    case 'reports':
      return (
        <svg {...commonProps}>
          <path d="M5 19V9" />
          <path d="M12 19V5" />
          <path d="M19 19v-7" />
        </svg>
      )

    case 'movements':
      return (
        <svg {...commonProps}>
          <path d="M5 7h13" />
          <path d="m15 4 3 3-3 3" />

          <path d="M19 17H6" />
          <path d="m9 14-3 3 3 3" />
        </svg>
      )

    case 'audit':
      return (
        <svg {...commonProps}>
          <path d="M7 4h10v16H7z" />
          <path d="M9 8h6" />
          <path d="M9 12h6" />
          <path d="M9 16h4" />
        </svg>
      )
  }
}
