const ACRONYMS: Record<string, string> = { glm: 'GLM', ocr: 'OCR' };
const VENDOR_PREFIX = /^zai-/;
const VERSION_PART = /^\d{1,2}$/;

/** Turns an identifier such as `zai-glm-5-3-flash` into `GLM 5.3 Flash`. */
export function formatModelDisplayName(identifier: string): string {
  const parts = identifier.replace(VENDOR_PREFIX, '').split('-');
  return parts.reduce((displayName, part, index) => {
    if (index === 0) return capitalize(part);
    const isMinorVersion =
      VERSION_PART.test(part) && VERSION_PART.test(parts[index - 1]);
    const separator = isMinorVersion ? '.' : ' ';
    return `${displayName}${separator}${capitalize(part)}`;
  }, '');
}

const capitalize = (word: string): string =>
  ACRONYMS[word] ?? word.charAt(0).toUpperCase() + word.slice(1);
