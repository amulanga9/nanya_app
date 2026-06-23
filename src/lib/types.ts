export const MAX_CAPACITY = 3;
export const SLOT_MINUTES = 30;

export interface Child {
  name: string;
  age: number;
}

export interface NannyWindow {
  id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  location: string;
  created_at: string;
}

export interface Booking {
  id: string;
  window_id: string;
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  children: Child[];
  children_count: number;
  parent_phone: string;
  status: 'active' | 'cancelled';
  created_at: string;
}
