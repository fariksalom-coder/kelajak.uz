export const POINTS_PER_CORRECT = 10;

export function saveRecord(mode: string, score: number): void {
  if (typeof window === 'undefined') return;
  try {
    const key = 'zukko_hisobla_records';
    const raw = localStorage.getItem(key);
    const obj = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    const current = obj[mode] ?? 0;
    if (score > current) {
      obj[mode] = score;
      localStorage.setItem(key, JSON.stringify(obj));
    }
  } catch {
    // ignore
  }
}
