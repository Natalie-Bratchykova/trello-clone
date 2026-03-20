/**
 * Maps i18n language codes to BCP-47 locale strings for date formatting.
 */
export function getDateLocale(lang: string): string {
  switch (lang) {
    case 'uk': return 'uk-UA';
    case 'ja': return 'ja-JP';
    case 'en': return 'en-US';
    default: return 'en-US';
  }
}

