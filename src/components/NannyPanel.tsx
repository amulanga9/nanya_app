import { colorForOccupancy, occupancyForSlot, slotsInRange, timeToMinutes, minutesToTime } from '../lib/capacity';
import { supabase } from '../lib/supabase';
import type { Booking, NannyWindow } from '../lib/types';

interface Props {
  window: NannyWindow;
  bookings: Booking[];
  onClose: () => void;
  onChanged: () => void;
}

const colorClasses: Record<string, string> = {
  green: 'bg-emerald-600',
  yellow: 'bg-amber-500',
  red: 'bg-rose-600',
};

export function NannyPanel({ window: w, bookings, onClose, onChanged }: Props) {
  const startMinutes = timeToMinutes(w.start_time);
  const endMinutes = timeToMinutes(w.end_time);
  const slots = slotsInRange(startMinutes, endMinutes);
  const activeBookings = bookings.filter((b) => b.status === 'active');

  async function deleteWindow() {
    if (!confirm('Удалить окно и все его брони?')) return;
    await supabase.from('windows').delete().eq('id', w.id);
    onChanged();
    onClose();
  }

  async function cancelBooking(id: string) {
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
    onChanged();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 w-full max-w-md text-slate-100 space-y-3 max-h-[85vh] overflow-auto">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold">{w.location}</h2>
            <p className="text-sm text-slate-400">
              {w.date} · {w.start_time.slice(0, 5)}–{w.end_time.slice(0, 5)}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-1">Занятость по ячейкам</h3>
          <div className="flex flex-wrap gap-1">
            {slots.map((slot) => {
              const occupied = occupancyForSlot(activeBookings, slot);
              const color = colorForOccupancy(occupied);
              return (
                <div
                  key={slot}
                  className={`text-[10px] text-white rounded px-1.5 py-1 ${colorClasses[color]}`}
                  title={minutesToTime(slot)}
                >
                  {minutesToTime(slot)} · {occupied}/3
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-1">Брони ({activeBookings.length})</h3>
          {activeBookings.length === 0 && <p className="text-sm text-slate-400">Пока нет броней</p>}
          <ul className="space-y-2">
            {activeBookings.map((b) => (
              <li key={b.id} className="bg-slate-800 rounded p-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">
                    {b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)}
                  </span>
                  <button onClick={() => cancelBooking(b.id)} className="text-rose-400 hover:text-rose-300 text-xs">
                    Отменить
                  </button>
                </div>
                <div className="text-slate-300">
                  {b.children.map((c) => `${c.name} (${c.age})`).join(', ')}
                </div>
                <div className="text-slate-400 text-xs">{b.parent_phone}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={deleteWindow} className="px-3 py-1.5 rounded bg-rose-700 hover:bg-rose-600 text-sm">
            Удалить окно
          </button>
        </div>
      </div>
    </div>
  );
}
