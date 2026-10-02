import type { NavigationIcon as NavigationIconName } from '../config/navigation'
export type AppIconName = NavigationIconName | 'search' | 'filter' | 'warning' | 'check'
  | 'arrow-right' | 'arrow-left' | 'chevron-down' | 'mail' | 'lock' | 'user'
  | 'shield' | 'plus' | 'minus' | 'close' | 'info' | 'empty' | 'calendar' | 'github'

export function AppIcon({
  name,
  className = '',
}: {
  name: AppIconName
  className?: string
}) {
  const commonProps = {
    className: `app-icon ${className}`,
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
    case 'github':
      return (
        <svg {...commonProps}>
          <path d="M9 19c-4 1-4-2-6-3M9 22v-3.5c0-1 .2-1.8 1-2.5-3.5-.4-6-1.5-6-6a5 5 0 0 1 1.5-3.5C5 5 5.1 3.5 5.5 2c2 0 3.4.9 4.5 1.5a13 13 0 0 1 4 0c1.1-.6 2.5-1.5 4.5-1.5.4 1.5.5 3 0 4.5A5 5 0 0 1 20 10c0 4.5-2.5 5.6-6 6 .8.7 1 1.5 1 2.5V22" />
        </svg>
      )
    case 'search':
      return <svg {...commonProps}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg>
    case 'filter':
      return <svg {...commonProps}><path d="M4 5h16l-6 7v7l-4-2v-5z" /></svg>
    case 'warning':
      return <svg {...commonProps}><path d="m12 4 9 16H3zM12 9v4M12 16h.01" /></svg>
    case 'check':
      return <svg {...commonProps}><path d="m5 12 4 4L19 6" /></svg>
    case 'arrow-right':
      return <svg {...commonProps}><path d="M4 12h16m-6-6 6 6-6 6" /></svg>
    case 'arrow-left':
      return <svg {...commonProps}><path d="M20 12H4m6-6-6 6 6 6" /></svg>
    case 'chevron-down':
      return <svg {...commonProps}><path d="m6 9 6 6 6-6" /></svg>
    case 'mail':
      return <svg {...commonProps}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></svg>
    case 'lock':
      return <svg {...commonProps}><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" /></svg>
    case 'user':
      return <svg {...commonProps}><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></svg>
    case 'shield':
      return <svg {...commonProps}><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6" /></svg>
    case 'plus':
      return <svg {...commonProps}><path d="M12 5v14M5 12h14" /></svg>
    case 'minus':
      return <svg {...commonProps}><path d="M5 12h14" /></svg>
    case 'close':
      return <svg {...commonProps}><path d="m6 6 12 12M18 6 6 18" /></svg>
    case 'info':
      return <svg {...commonProps}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></svg>
    case 'empty':
      return <svg {...commonProps}><path d="m4 10 3-6h10l3 6v10H4zM4 10h5l1 3h4l1-3h5" /></svg>
    case 'calendar':
      return <svg {...commonProps}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4m8-4v4M4 10h16M8 14h2m4 0h2" /></svg>
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
