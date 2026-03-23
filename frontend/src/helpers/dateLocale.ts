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

export function formatDate( lang: string, date = new Date().toString(), isFull = true): string {
  const locale = getDateLocale(lang);
  const options: Intl.DateTimeFormatOptions = isFull? {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  } : {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };

  return new Date(date).toLocaleDateString(locale, options );
}