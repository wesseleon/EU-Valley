interface CountryFlagProps {
  countryCode: string;
  size?: 'S' | 'M' | 'L';
  className?: string;
}

// Map size to pixel dimensions
const sizeMap = {
  S: { width: 16, height: 12 },
  M: { width: 20, height: 15 },
  L: { width: 32, height: 24 },
};

// Flagpack CDN URL for SVGs
const getFlagUrl = (code: string, size: 'S' | 'M' | 'L') => {
  const sizeFolder = size.toLowerCase();
  return `https://flagpack.xyz/flags/${sizeFolder}/${code}.svg`;
};

export const CountryFlag = ({ countryCode, size = 'M', className }: CountryFlagProps) => {
  // Convert 2-letter country code to uppercase for flagpack
  const code = countryCode?.toUpperCase() || '';
  
  if (!code || code.length !== 2) {
    return null;
  }
  
  const dimensions = sizeMap[size];
  
  return (
    <span 
      className={`inline-flex items-center ${className || ''}`}
      style={{ 
        width: dimensions.width, 
        height: dimensions.height,
      }}
    >
      <img
        src={getFlagUrl(code, size)}
        alt={`${code} flag`}
        width={dimensions.width}
        height={dimensions.height}
        className="rounded-sm"
        style={{
          filter: 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.15))',
          objectFit: 'cover',
        }}
        loading="lazy"
      />
    </span>
  );
};

export default CountryFlag;