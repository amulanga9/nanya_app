import { useMemo, useState } from 'react';
import { useScheduleData } from './hooks/useScheduleData';
import { WeekCalendar } from './components/WeekCalendar';
import { CreateWindowForm } from './components/CreateWindowForm';
import { NannyPanel } from './components/NannyPanel';
import { BookingPopup } from './components/BookingPopup';
import { MyBookings } from './components/MyBookings';
import { NannyLogin } from './components/NannyLogin';
import { isNannySession, nannyLogout } from './lib/auth';
import type { NannyWindow } from './lib/types';

function App() {
  const wantsAdmin = useMemo(() => new URLSearchParams(window.location.search).get('admin') === '1', []);
  const [isAdmin, setIsAdmin] = useState(isNannySession);
  const { windows, bookings, loading, refetch } = useScheduleData();

  const [showCreateWindow, setShowCreateWindow] = useState(false);
  const [activeWindow, setActiveWindow] = useState<NannyWindow | null>(null);
  const [bookingSlot, setBookingSlot] = useState<{ window: NannyWindow; slotStart: number } | null>(null);
  const [showMyBookings, setShowMyBookings] = useState(false);

  function handleWindowClick(w: NannyWindow) {
    if (isAdmin) {
      setActiveWindow(w);
    }
  }

  function handleSlotClick(w: NannyWindow, slotStart: number) {
    if (!isAdmin) {
      setBookingSlot({ window: w, slotStart });
    }
  }

  if (wantsAdmin && !isAdmin) {
    return <NannyLogin onSuccess={() => setIsAdmin(true)} />;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div>
          <h1 className="text-lg font-bold">Nanya</h1>
          <p className="text-xs text-slate-400">{isAdmin ? 'Режим няни' : 'Режим мамы'}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin ? (
            <>
              <button
                onClick={() => setShowCreateWindow(true)}
                className="px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-sm"
              >
                + Открыть окно
              </button>
              <button
                onClick={() => {
                  nannyLogout();
                  setIsAdmin(false);
                }}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm"
              >
                Выйти
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowMyBookings(true)}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm"
            >
              Мои брони
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {loading ? (
          <div className="p-6 text-slate-400">Загрузка…</div>
        ) : (
          <WeekCalendar
            windows={windows}
            bookings={bookings}
            isAdmin={isAdmin}
            onWindowClick={handleWindowClick}
            onSlotClick={handleSlotClick}
          />
        )}
      </main>

      {showCreateWindow && (
        <CreateWindowForm onClose={() => setShowCreateWindow(false)} onCreated={refetch} />
      )}

      {activeWindow && (
        <NannyPanel
          window={activeWindow}
          bookings={bookings.filter((b) => b.window_id === activeWindow.id)}
          onClose={() => setActiveWindow(null)}
          onChanged={refetch}
        />
      )}

      {bookingSlot && (
        <BookingPopup
          window={bookingSlot.window}
          bookings={bookings.filter((b) => b.window_id === bookingSlot.window.id)}
          initialSlotStart={bookingSlot.slotStart}
          onClose={() => setBookingSlot(null)}
          onBooked={refetch}
        />
      )}

      {showMyBookings && <MyBookings onClose={() => setShowMyBookings(false)} onChanged={refetch} />}
    </div>
  );
}

export default App;
