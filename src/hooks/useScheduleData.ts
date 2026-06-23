import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Booking, NannyWindow } from '../lib/types';

export function useScheduleData() {
  const [windows, setWindows] = useState<NannyWindow[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  async function refetch() {
    const [windowsRes, bookingsRes] = await Promise.all([
      supabase.from('windows').select('*').order('date').order('start_time'),
      supabase.from('bookings').select('*').order('start_time'),
    ]);
    if (windowsRes.data) setWindows(windowsRes.data as NannyWindow[]);
    if (bookingsRes.data) setBookings(bookingsRes.data as Booking[]);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    void refetch();

    const channel = supabase
      .channel('schedule-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'windows' }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => refetch())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { windows, bookings, loading, refetch };
}
