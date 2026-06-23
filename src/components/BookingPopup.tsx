import { useMemo, useState } from 'react';
import { canBook, maxAvailableForRange, minutesToTime, slotsInRange, timeToMinutes } from '../lib/capacity';
import { supabase } from '../lib/supabase';
import type { Booking, Child, NannyWindow } from '../lib/types';

interface Props {
  window: NannyWindow;
  bookings: Booking[];
  initialSlotStart: number;
  onClose: () => void;
  onBooked: () => void;
}

export function BookingPopup({ window: w, bookings, initialSlotStart, onClose, onBooked }: Props) {
  const windowStart = timeToMinutes(w.start_time);
  const windowEnd = timeToMinutes(w.end_time);
  const timeOptions = useMemo(() => {
    const opts: number[] = [];
    for (let t = windowStart; t <= windowEnd; t += 30) opts.push(t);
    return opts;
  }, [windowStart, windowEnd]);

  const [from, setFrom] = useState(initialSlotStart);
  const [to, setTo] = useState(Math.min(initialSlotStart + 30, windowEnd));
  const [children, setChildren] = useState<Child[]>([{ name: '', age: 0 }]);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const activeBookings = bookings.filter((b) => b.status === 'active');
  const maxAvailable = from < to ? maxAvailableForRange(activeBookings, from, to) : 0;

  function updateChild(i: number, field: keyof Child, value: string) {
    setChildren((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, [field]: field === 'age' ? Number(value) : value } : c)),
    );
  }

  function addChild() {
    if (children.length >= maxAvailable) return;
    setChildren((prev) => [...prev, { name: '', age: 0 }]);
  }

  function removeChild(i: number) {
    setChildren((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (from >= to) {
      setError('Время «до» должно быть позже времени «от»');
      return;
    }
    if (!phone.trim()) {
      setError('Укажите телефон');
      return;
    }
    if (children.some((c) => !c.name.trim() || !c.age)) {
      setError('Заполните имя и возраст для каждого ребёнка');
      return;
    }

    const check = canBook(activeBookings, from, to, children.length);
    if (!check.ok) {
      setError(`В ${check.blockedAt} нет мест`);
      return;
    }

    setSaving(true);
    const { error: dbError } = await supabase.from('bookings').insert({
      window_id: w.id,
      start_time: minutesToTime(from),
      end_time: minutesToTime(to),
      children,
      children_count: children.length,
      parent_phone: phone.trim(),
      status: 'active',
    });
    setSaving(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    onBooked();
    onClose();
  }

  const rangeSlots = from < to ? slotsInRange(from, to) : [];
  const blockedNote =
    rangeSlots.length > 0 && maxAvailable <= 0 ? 'В выбранном диапазоне нет свободных мест' : null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900 border border-slate-700 rounded-lg p-4 w-full max-w-sm text-slate-100 space-y-3 max-h-[85vh] overflow-auto"
      >
        <div className="flex justify-between items-start">
          <h2 className="text-lg font-semibold">Запись к няне</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
        <p className="text-sm text-slate-400">{w.location}</p>

        <div className="flex gap-2">
          <label className="block text-sm flex-1">
            От
            <select
              value={from}
              onChange={(e) => setFrom(Number(e.target.value))}
              className="mt-1 w-full rounded bg-slate-800 border border-slate-600 px-2 py-1"
            >
              {timeOptions.slice(0, -1).map((t) => (
                <option key={t} value={t}>
                  {minutesToTime(t)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm flex-1">
            До
            <select
              value={to}
              onChange={(e) => setTo(Number(e.target.value))}
              className="mt-1 w-full rounded bg-slate-800 border border-slate-600 px-2 py-1"
            >
              {timeOptions.slice(1).map((t) => (
                <option key={t} value={t}>
                  {minutesToTime(t)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="text-sm text-slate-300">
          Доступно мест в этом диапазоне: <span className="font-semibold">{maxAvailable}</span>
        </p>
        {blockedNote && <p className="text-rose-400 text-sm">{blockedNote}</p>}

        <div className="space-y-2">
          {children.map((c, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Имя ребёнка"
                value={c.name}
                onChange={(e) => updateChild(i, 'name', e.target.value)}
                className="flex-1 rounded bg-slate-800 border border-slate-600 px-2 py-1 text-sm"
              />
              <input
                type="number"
                min={0}
                max={17}
                placeholder="Возраст"
                value={c.age || ''}
                onChange={(e) => updateChild(i, 'age', e.target.value)}
                className="w-20 rounded bg-slate-800 border border-slate-600 px-2 py-1 text-sm"
              />
              {children.length > 1 && (
                <button type="button" onClick={() => removeChild(i)} className="text-rose-400 text-sm">
                  ✕
                </button>
              )}
            </div>
          ))}
          {children.length < maxAvailable && (
            <button type="button" onClick={addChild} className="text-teal-400 text-sm hover:text-teal-300">
              + Добавить ребёнка
            </button>
          )}
        </div>

        <label className="block text-sm">
          Телефон мамы
          <input
            type="tel"
            placeholder="+998 90 123 45 67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded bg-slate-800 border border-slate-600 px-2 py-1"
          />
        </label>

        {error && <p className="text-rose-400 text-sm">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700">
            Отмена
          </button>
          <button
            type="submit"
            disabled={saving || maxAvailable <= 0 || children.length > maxAvailable}
            className="px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 disabled:opacity-50"
          >
            {saving ? 'Сохранение…' : 'Забронировать'}
          </button>
        </div>
      </form>
    </div>
  );
}
