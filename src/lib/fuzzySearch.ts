// Simple fuzzy search implementation for tolerant matching

export const fuzzyMatch = (text: string, query: string): boolean => {
  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeText(query);
  
  // Direct match
  if (normalizedText.includes(normalizedQuery)) {
    return true;
  }
  
  // Check each query word
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
  const textWords = normalizedText.split(/\s+/).filter(w => w.length > 0);
  
  // All query words must match something in the text
  return queryWords.every(queryWord => 
    textWords.some(textWord => 
      textWord.includes(queryWord) || 
      queryWord.includes(textWord) ||
      levenshteinDistance(textWord, queryWord) <= Math.max(1, Math.floor(queryWord.length / 3))
    )
  );
};

// Normalize text: remove special chars, lowercase, trim
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[.'&\-]/g, '') // Remove dots, apostrophes, ampersands, hyphens
    .replace(/\s+/g, ' ')
    .trim();
};

// Levenshtein distance for fuzzy matching
const levenshteinDistance = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

// Score a match (higher is better)
export const fuzzyScore = (text: string, query: string): number => {
  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeText(query);
  
  // Exact match gets highest score
  if (normalizedText === normalizedQuery) {
    return 100;
  }
  
  // Starts with query gets high score
  if (normalizedText.startsWith(normalizedQuery)) {
    return 90;
  }
  
  // Contains query gets medium score
  if (normalizedText.includes(normalizedQuery)) {
    return 80;
  }
  
  // Fuzzy match gets lower score based on edit distance
  const distance = levenshteinDistance(normalizedText.slice(0, normalizedQuery.length), normalizedQuery);
  if (distance <= Math.max(1, Math.floor(normalizedQuery.length / 3))) {
    return 70 - distance * 10;
  }
  
  return 0;
};
