import { colorForOccupancy, occupancyForSlot, slotsInRange, timeToMinutes } from '../lib/capacity';
import { CALENDAR_START_HOUR, ROW_HEIGHT_PX } from '../lib/constants';
import type { Booking, NannyWindow } from '../lib/types';

interface Props {
  window: NannyWindow;
  bookings: Booking[];
  isAdmin: boolean;
  onClick: () => void;
  onSlotClick: (slotStartMinutes: number) => void;
}

const colorClasses: Record<string, string> = {
  green: 'bg-emerald-600/70 hover:bg-emerald-500/80',
  yellow: 'bg-amber-500/80 hover:bg-amber-400/90',
  red: 'bg-rose-600/80 cursor-not-allowed',
};

export function WindowBlock({ window: w, bookings, isAdmin, onClick, onSlotClick }: Props) {
  const startMinutes = timeToMinutes(w.start_time);
  const endMinutes = timeToMinutes(w.end_time);
  const calendarStart = CALENDAR_START_HOUR * 60;

  const top = ((startMinutes - calendarStart) / 30) * ROW_HEIGHT_PX;
  const height = ((endMinutes - startMinutes) / 30) * ROW_HEIGHT_PX;
  const slots = slotsInRange(startMinutes, endMinutes);

  if (isAdmin) {
    return (
      <button
        onClick={onClick}
        title={w.location}
        className="absolute left-0.5 right-0.5 rounded-md border border-slate-300 bg-slate-100 text-slate-900 text-xs px-1 py-0.5 text-left overflow-hidden hover:bg-white"
        style={{ top, height }}
      >
        <div className="font-medium truncate">{w.location}</div>
        <div className="text-[10px] text-slate-600">
          {w.start_time.slice(0, 5)}–{w.end_time.slice(0, 5)}
        </div>
      </button>
    );
  }

  return (
    <div className="absolute left-0.5 right-0.5 rounded-md overflow-hidden border border-slate-600" style={{ top, height }}>
      {slots.map((slot) => {
        const occupied = occupancyForSlot(bookings, slot);
        const color = colorForOccupancy(occupied);
        const full = color === 'red';
        return (
          <button
            key={slot}
            disabled={full}
            onClick={() => onSlotClick(slot)}
            style={{ height: ROW_HEIGHT_PX }}
            className={`w-full block text-[10px] text-white/90 ${colorClasses[color]} border-b border-slate-900/30 last:border-b-0`}
          >
            {occupied}/3
          </button>
        );
      })}
    </div>
  );
}
