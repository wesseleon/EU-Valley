import React from 'react';

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
  return `https://flagpack.xyz/flags/${sizeFolder}/${encodeURIComponent(code)}.svg`;
};

export const CountryFlag = ({ countryCode, size = 'M', className }: CountryFlagProps) => {
  const raw = (countryCode || '').trim();
  if (!raw) return null;

  // Map common / ambiguous codes to flagpack codes
  const specialMap: Record<string, string> = {
    'GB': 'GB-UKM',
    'UK': 'GB-UKM',
    // add other mappings if necessary...
  };

  // If the incoming code already contains a dash (e.g. 'GB-UKM'), use it as-is.
  // Otherwise uppercase and map common cases.
  let code = raw.includes('-') ? raw : (specialMap[raw.toUpperCase()] ?? raw.toUpperCase());

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
        onError={(e) => {
          // fallback -> show emoji flag if possible, otherwise remove broken img
          const upper = (countryCode || '').toUpperCase();
          if (upper.length === 2) {
            const offset = 127397;
            const flagEmoji = String.fromCodePoint(upper.charCodeAt(0) + offset, upper.charCodeAt(1) + offset);
            const parent = e.currentTarget.parentElement;
            if (parent) parent.textContent = flagEmoji;
          } else {
            // replace with tiny transparent svg to avoid broken image icon
            e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${dimensions.width}' height='${dimensions.height}'/%3E`;
          }
        }}
      />
    </span>
  );
};

export default CountryFlag;
