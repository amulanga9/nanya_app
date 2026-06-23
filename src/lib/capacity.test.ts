import { describe, expect, it } from 'vitest';
import { canBook, colorForOccupancy, maxAvailableForRange, occupancyForSlot, timeToMinutes } from './capacity';
import type { Booking } from './types';

function booking(start: string, end: string, count: number, status: Booking['status'] = 'active'): Booking {
  return {
    id: Math.random().toString(),
    window_id: 'w1',
    start_time: start,
    end_time: end,
    children: [],
    children_count: count,
    parent_phone: '+998',
    status,
    created_at: new Date().toISOString(),
  };
}

describe('acceptance criteria', () => {
  it('2. booking 15:00-16:00 for 2 children -> slot occupancy 2/3, yellow', () => {
    const bookings = [booking('15:00', '16:00', 2)];
    const occ = occupancyForSlot(bookings, timeToMinutes('15:00'));
    expect(occ).toBe(2);
    expect(colorForOccupancy(occ)).toBe('yellow');
  });

  it('3. second booking 15:00-16:00 for 1 child fills to 3/3 (red); third mom cannot book', () => {
    const bookings = [booking('15:00', '16:00', 2), booking('15:00', '16:00', 1)];
    const occ = occupancyForSlot(bookings, timeToMinutes('15:00'));
    expect(occ).toBe(3);
    expect(colorForOccupancy(occ)).toBe('red');

    const result = canBook(bookings, timeToMinutes('15:00'), timeToMinutes('16:00'), 1);
    expect(result.ok).toBe(false);
    expect(result.blockedAt).toBe('15:00');
  });

  it('4. booking 14:00-16:00 blocked when middle slot is full', () => {
    const bookings = [booking('15:00', '16:00', 3)];
    const result = canBook(bookings, timeToMinutes('14:00'), timeToMinutes('16:00'), 1);
    expect(result.ok).toBe(false);
    expect(result.blockedAt).toBe('15:00');
  });

  it('6. cancelling a booking frees the slot back to green', () => {
    const bookings = [booking('15:00', '16:00', 3, 'cancelled')];
    const occ = occupancyForSlot(bookings, timeToMinutes('15:00'));
    expect(occ).toBe(0);
    expect(colorForOccupancy(occ)).toBe('green');
  });

  it('max available for a range is the min free capacity across its slots', () => {
    const bookings = [booking('15:00', '15:30', 1), booking('15:30', '16:00', 2)];
    const max = maxAvailableForRange(bookings, timeToMinutes('15:00'), timeToMinutes('16:00'));
    expect(max).toBe(1); // 15:30 slot only has 1 free (3-2)
  });
});
