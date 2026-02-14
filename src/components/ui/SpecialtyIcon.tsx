import type { Engineer } from '../../types';

type Specialty = NonNullable<Engineer['specialty']>;

const SPECIALTY_COLORS: Record<Specialty, string> = {
  frontend: '#4ade80',
  backend: '#fb923c',
  fullstack: '#60a5fa',
  devops: '#c084fc',
  ai: '#f472b6',
};

interface SpecialtyIconProps {
  specialty: Specialty;
  size?: number;
  className?: string;
}

export function SpecialtyIcon({ specialty, size = 16, className }: SpecialtyIconProps) {
  const color = SPECIALTY_COLORS[specialty];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      {specialty === 'frontend' && (
        // Monitor/screen icon
        <>
          <rect x="3" y="3" width="18" height="13" rx="2" stroke={color} strokeWidth="2" />
          <line x1="8" y1="20" x2="16" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="16" x2="12" y2="20" stroke={color} strokeWidth="2" />
        </>
      )}
      {specialty === 'backend' && (
        // Server/database stack icon
        <>
          <rect x="4" y="2" width="16" height="6" rx="1" stroke={color} strokeWidth="2" />
          <rect x="4" y="10" width="16" height="6" rx="1" stroke={color} strokeWidth="2" />
          <circle cx="8" cy="5" r="1" fill={color} />
          <circle cx="8" cy="13" r="1" fill={color} />
          <line x1="12" y1="18" x2="12" y2="22" stroke={color} strokeWidth="2" />
        </>
      )}
      {specialty === 'fullstack' && (
        // Layered bars icon
        <>
          <rect x="3" y="3" width="18" height="4" rx="1" stroke={color} strokeWidth="2" />
          <rect x="5" y="10" width="14" height="4" rx="1" stroke={color} strokeWidth="2" />
          <rect x="7" y="17" width="10" height="4" rx="1" stroke={color} strokeWidth="2" />
        </>
      )}
      {specialty === 'devops' && (
        // Gear/cog icon
        <>
          <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
          <path
            d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
      {specialty === 'ai' && (
        // Brain/circuit node icon
        <>
          <circle cx="12" cy="12" r="3" fill={color} opacity="0.3" stroke={color} strokeWidth="2" />
          <circle cx="12" cy="4" r="2" stroke={color} strokeWidth="1.5" />
          <circle cx="4" cy="12" r="2" stroke={color} strokeWidth="1.5" />
          <circle cx="20" cy="12" r="2" stroke={color} strokeWidth="1.5" />
          <circle cx="12" cy="20" r="2" stroke={color} strokeWidth="1.5" />
          <line x1="12" y1="6" x2="12" y2="9" stroke={color} strokeWidth="1.5" />
          <line x1="6" y1="12" x2="9" y2="12" stroke={color} strokeWidth="1.5" />
          <line x1="15" y1="12" x2="18" y2="12" stroke={color} strokeWidth="1.5" />
          <line x1="12" y1="15" x2="12" y2="18" stroke={color} strokeWidth="1.5" />
        </>
      )}
    </svg>
  );
}
