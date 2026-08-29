import Flag from 'react-flagpack';

interface CountryFlagProps {
  countryCode: string;
  size?: 'S' | 'M' | 'L';
  className?: string;
}

export const CountryFlag = ({ countryCode, size = 'M', className }: CountryFlagProps) => {
  const raw = (countryCode || '').trim();
  if (!raw) return null;

  // Map common / ambiguous codes to flagpack codes
  const specialMap: Record<string, string> = {
    'GB': 'GB-UKM',
    'UK': 'GB-UKM',
  };
  const code = raw.includes('-') ? raw : (specialMap[raw.toUpperCase()] ?? raw.toUpperCase());

  return (
    <span
      className={`inline-flex items-center justify-center ${className || ''}`}
      role="img"
      aria-label={`${countryCode.toUpperCase()} flag`}
    >
      <Flag
        code={code as React.ComponentProps<typeof Flag>['code']}
        size={size.toLowerCase()}
        gradient="real-linear"
        hasDropShadow
        hasBorder
        hasBorderRadius
      />
    </span>
  );
};

export default CountryFlag;
