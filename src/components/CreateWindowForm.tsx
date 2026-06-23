import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface Props {
  initialDate: string;
  initialStartTime: string;
  initialEndTime: string;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateWindowForm({ initialDate, initialStartTime, initialEndTime, onClose, onCreated }: Props) {
  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !startTime || !endTime || !location.trim()) {
      setError('Заполните все поля');
      return;
    }
    if (startTime >= endTime) {
      setError('Время начала должно быть раньше времени конца');
      return;
    }
    setSaving(true);
    const { error: dbError } = await supabase
      .from('windows')
      .insert({ date, start_time: startTime, end_time: endTime, location: location.trim() });
    setSaving(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900 border border-slate-700 rounded-lg p-4 w-full max-w-sm text-slate-100 space-y-3"
      >
        <h2 className="text-lg font-semibold">Открыть окно</h2>

        <label className="block text-sm">
          Дата
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded bg-slate-800 border border-slate-600 px-2 py-1"
          />
        </label>

        <div className="flex gap-2">
          <label className="block text-sm flex-1">
            Начало
            <input
              type="time"
              step={1800}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 w-full rounded bg-slate-800 border border-slate-600 px-2 py-1"
            />
          </label>
          <label className="block text-sm flex-1">
            Конец
            <input
              type="time"
              step={1800}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1 w-full rounded bg-slate-800 border border-slate-600 px-2 py-1"
            />
          </label>
        </div>

        <label className="block text-sm">
          Локация
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="School 21 Tashkent, лобби"
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
            disabled={saving}
            className="px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 disabled:opacity-50"
          >
            {saving ? 'Сохранение…' : 'Открыть'}
          </button>
        </div>
      </form>
    </div>
  );
}
