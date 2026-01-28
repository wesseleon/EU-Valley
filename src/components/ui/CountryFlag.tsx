import Flag from 'react-flagpack';

interface CountryFlagProps {
  countryCode: string;
  size?: 's' | 'm' | 'l';
  className?: string;
}

export const CountryFlag = ({ countryCode, size = 'm', className }: CountryFlagProps) => {
  // Convert 2-letter country code to uppercase for flagpack
  const code = countryCode?.toUpperCase() || '';
  
  if (!code || code.length !== 2) {
    return null;
  }
  
  return (
    <span className={`inline-flex items-center ${className || ''}`}>
      <Flag 
        code={code as any}
        size={size}
        hasBorder={false}
        hasBorderRadius={true}
        hasDropShadow={true}
        gradient="real-linear"
      />
    </span>
  );
};

export default CountryFlag;
