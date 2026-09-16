const relative = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
  ['second', 1],
];

/** « il y a 3 minutes », « dans 2 minutes »… */
export function formatRelative(iso: string | null, now = Date.now()): string {
  if (!iso) return 'jamais';
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size || unit === 'second') {
      return relative.format(Math.round(seconds / size), unit);
    }
  }
  return '';
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}
