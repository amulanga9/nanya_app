import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Booking } from '../lib/types';

interface Props {
  onClose: () => void;
  onChanged: () => void;
}

export function MyBookings({ onClose, onChanged }: Props) {
  const [phone, setPhone] = useState('');
  const [results, setResults] = useState<Booking[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function search() {
    setLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('parent_phone', phone.trim())
      .eq('status', 'active')
      .order('start_time');
    setResults((data as Booking[]) ?? []);
    setLoading(false);
  }

  async function cancel(id: string) {
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
    onChanged();
    search();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 w-full max-w-sm text-slate-100 space-y-3 max-h-[85vh] overflow-auto">
        <div className="flex justify-between items-start">
          <h2 className="text-lg font-semibold">Мои брони</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="tel"
            placeholder="+998 90 123 45 67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1 rounded bg-slate-800 border border-slate-600 px-2 py-1"
          />
          <button onClick={search} disabled={!phone.trim() || loading} className="px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 disabled:opacity-50">
            Найти
          </button>
        </div>

        {results !== null && (
          <ul className="space-y-2">
            {results.length === 0 && <p className="text-sm text-slate-400">Активных броней не найдено</p>}
            {results.map((b) => (
              <li key={b.id} className="bg-slate-800 rounded p-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">
                    {b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)}
                  </span>
                  <button onClick={() => cancel(b.id)} className="text-rose-400 hover:text-rose-300 text-xs">
                    Отменить
                  </button>
                </div>
                <div className="text-slate-300">{b.children.map((c) => `${c.name} (${c.age})`).join(', ')}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
