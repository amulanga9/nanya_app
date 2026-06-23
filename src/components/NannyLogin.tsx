import { useState } from 'react';
import { tryNannyLogin } from '../lib/auth';

interface Props {
  onSuccess: () => void;
}

export function NannyLogin({ onSuccess }: Props) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tryNannyLogin(phone)) {
      onSuccess();
    } else {
      setError('Номер не распознан');
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 rounded-lg p-4 w-full max-w-sm space-y-3">
        <h1 className="text-lg font-semibold">Вход для няни</h1>
        <label className="block text-sm">
          Номер телефона
          <input
            type="tel"
            autoFocus
            placeholder="+998 90 123 45 67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded bg-slate-800 border border-slate-600 px-2 py-1"
          />
        </label>
        {error && <p className="text-rose-400 text-sm">{error}</p>}
        <button type="submit" className="w-full px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500">
          Войти
        </button>
      </form>
    </div>
  );
}
