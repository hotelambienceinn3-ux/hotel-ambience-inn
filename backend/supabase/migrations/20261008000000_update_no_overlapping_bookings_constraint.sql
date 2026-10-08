-- Migration: Update no_overlapping_bookings exclusion constraint on public.bookings
-- Objective: Ensure only ACTIVE booking statuses (confirmed, pending, checked_in, reserved, paid, and NULL)
-- block physical room inventory, while NON-BLOCKING statuses (cancelled, completed, checked_out) do not.

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS no_overlapping_bookings;

ALTER TABLE public.bookings
  ADD CONSTRAINT no_overlapping_bookings
  EXCLUDE USING gist (
    room_id WITH =,
    daterange(check_in, check_out, '[)') WITH &&
  )
  WHERE (
    booking_status IS NULL
    OR booking_status NOT IN (
      'cancelled',
      'completed',
      'checked_out'
    )
  );
