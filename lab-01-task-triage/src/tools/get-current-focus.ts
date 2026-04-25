export interface CurrentFocus {
  date: string;    // YYYY-MM-DD
  weekday: string; // e.g., "Friday"
  time: string;    // HH:MM (24h, local)
}

export function createGetCurrentFocus(now: () => Date = () => new Date()) {
  return async (_input: Record<string, never>): Promise<CurrentFocus> => {
    const d = now();
    const date = d.toISOString().slice(0, 10);
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return { date, weekday, time: `${hh}:${mm}` };
  };
}
