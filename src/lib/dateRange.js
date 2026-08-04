import { addDaysISO, formatDateID, todayISO, toISODate } from './format';

function monthToDate() {
  const now = new Date();
  return {
    start: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)),
    end: toISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

export const RANGE_PRESETS = [
  {
    id: 'today',
    label: 'Hari ini',
    range: () => ({ start: todayISO(), end: todayISO() }),
  },
  {
    id: '7d',
    label: '7 hari',
    range: () => ({ start: todayISO(), end: addDaysISO(todayISO(), 6) }),
  },
  {
    id: '30d',
    label: '30 hari',
    range: () => ({ start: todayISO(), end: addDaysISO(todayISO(), 29) }),
  },
  {
    id: 'month',
    label: 'Bulan ini',
    range: monthToDate,
  },
];

export const defaultRange = () => ({
  presetId: '30d',
  ...RANGE_PRESETS[2].range(),
});

export function rangeLabel({ start, end }) {
  const from = formatDateID(start, { weekday: false });
  if (start === end) return from;
  return `${from} – ${formatDateID(end, { weekday: false })}`;
}
