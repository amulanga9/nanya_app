import { useEffect, useMemo, useState } from 'react';
import { addDays, formatDayLabel, minutesToTime, startOfWeek, toISODate } from '../lib/date';
import { CALENDAR_START_HOUR, CALENDAR_END_HOUR, ROW_HEIGHT_PX } from '../lib/constants';
import type { Booking, NannyWindow } from '../lib/types';
import { WindowBlock } from './WindowBlock';

interface Props {
  windows: NannyWindow[];
  bookings: Booking[];
  isAdmin: boolean;
  onWindowClick: (w: NannyWindow) => void;
  onSlotClick: (w: NannyWindow, slotStartMinutes: number) => void;
  onRangeSelect: (date: string, startTime: string, endTime: string) => void;
}

const SLOT_COUNT = ((CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60) / 30;
const TOTAL_HEIGHT = SLOT_COUNT * ROW_HEIGHT_PX;

export function WeekCalendar({ windows, bookings, isAdmin, onWindowClick, onSlotClick, onRangeSelect }: Props) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const [now, setNow] = useState(new Date());
  const [drag, setDrag] = useState<{ iso: string; startIdx: number; endIdx: number } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!drag) return;
    function finish() {
      setDrag((d) => {
        if (d) {
          const fromIdx = Math.min(d.startIdx, d.endIdx);
          const toIdx = Math.max(d.startIdx, d.endIdx);
          const startMinutes = CALENDAR_START_HOUR * 60 + fromIdx * 30;
          const endMinutes = CALENDAR_START_HOUR * 60 + (toIdx + 1) * 30;
          onRangeSelect(d.iso, minutesToTime(startMinutes), minutesToTime(endMinutes));
        }
        return null;
      });
    }
    window.addEventListener('mouseup', finish);
    return () => window.removeEventListener('mouseup', finish);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag]);

  function handleSlotMouseDown(iso: string, idx: number) {
    if (!isAdmin) return;
    setDrag({ iso, startIdx: idx, endIdx: idx });
  }

  function handleSlotMouseEnter(iso: string, idx: number) {
    if (!isAdmin || !drag || drag.iso !== iso) return;
    setDrag({ ...drag, endIdx: idx });
  }

  const hours = Array.from({ length: CALENDAR_END_HOUR - CALENDAR_START_HOUR }, (_, i) => CALENDAR_START_HOUR + i);

  function nowOffsetPx(day: Date): number | null {
    if (toISODate(day) !== toISODate(now)) return null;
    const minutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = CALENDAR_START_HOUR * 60;
    const endMinutes = CALENDAR_END_HOUR * 60;
    if (minutes < startMinutes || minutes > endMinutes) return null;
    return ((minutes - startMinutes) / 30) * ROW_HEIGHT_PX;
  }

  return (
    <div className="flex flex-col h-full text-slate-100">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-700">
        <button
          className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700"
          onClick={() => setWeekStart(addDays(weekStart, -7))}
        >
          ←
        </button>
        <div className="font-semibold">
          {formatDayLabel(days[0])} — {formatDayLabel(days[6])}
        </div>
        <button
          className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700"
          onClick={() => setWeekStart(addDays(weekStart, 7))}
        >
          →
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="flex min-w-[800px]">
          {/* hour labels column */}
          <div className="w-14 shrink-0 sticky left-0 bg-slate-950 z-10">
            <div className="h-8" />
            {hours.map((h) => (
              <div
                key={h}
                style={{ height: ROW_HEIGHT_PX * 2 }}
                className="text-xs text-slate-400 text-right pr-2 border-t border-slate-800"
              >
                {h.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {days.map((day) => {
            const iso = toISODate(day);
            const dayWindows = windows.filter((w) => w.date === iso);
            const offset = nowOffsetPx(day);
            return (
              <div key={iso} className="flex-1 min-w-[110px] border-l border-slate-800 relative">
                <div className="h-8 flex items-center justify-center text-sm font-medium border-b border-slate-800 bg-slate-900 sticky top-0 z-10">
                  {formatDayLabel(day)}
                </div>
                <div className="relative" style={{ height: TOTAL_HEIGHT }}>
                  {Array.from({ length: SLOT_COUNT }).map((_, i) => {
                    const inSelection =
                      isAdmin &&
                      drag !== null &&
                      drag.iso === iso &&
                      i >= Math.min(drag.startIdx, drag.endIdx) &&
                      i <= Math.max(drag.startIdx, drag.endIdx);
                    return (
                      <div
                        key={i}
                        style={{ height: ROW_HEIGHT_PX }}
                        className={`border-t ${i % 2 === 0 ? 'border-slate-800' : 'border-slate-900'} ${
                          isAdmin ? 'cursor-pointer select-none' : ''
                        } ${inSelection ? 'bg-teal-700/50' : ''}`}
                        onMouseDown={() => handleSlotMouseDown(iso, i)}
                        onMouseEnter={() => handleSlotMouseEnter(iso, i)}
                      />
                    );
                  })}

                  {offset !== null && (
                    <div
                      className="absolute left-0 right-0 h-px bg-red-500 z-20"
                      style={{ top: offset }}
                    >
                      <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
                    </div>
                  )}

                  {dayWindows.map((w) => (
                    <WindowBlock
                      key={w.id}
                      window={w}
                      bookings={bookings.filter((b) => b.window_id === w.id)}
                      isAdmin={isAdmin}
                      onClick={() => onWindowClick(w)}
                      onSlotClick={(slotStart) => onSlotClick(w, slotStart)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
