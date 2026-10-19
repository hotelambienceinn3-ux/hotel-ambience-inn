-- ============================================================================
-- HOTEL AMBIENCE INN — TRUSTED BOOKING CREATION & SECURITY MIGRATION (REVIEWED)
-- File: backend/supabase/migrations/20261019000000_trusted_booking_security_reviewed.sql
-- Status: SAFE REVIEWED VERSION (Controlled Code Audit — Not Deployed)
--
-- Description:
--   1. Pre-migration data validation queries (read-only diagnostics).
--   2. Check constraints on public.bookings and public.payments (duplicate-safe).
--   3. Authoritative pricing and data integrity trigger on public.bookings.
--   4. Trusted database-side booking creation RPC (public.create_booking).
--   5. Dedicated customer cancellation RPC (public.cancel_booking).
--   6. Secure real-time room availability RPC (public.get_room_availability).
--   7. Row Level Security (RLS) policies blocking direct customer INSERT/UPDATE.
--   8. Cautious staging recovery guidelines and rollback prerequisites.
--
-- Security & Concurrency Highlights:
--   - Explicit search_path = public, pg_temp on all SECURITY DEFINER functions.
--   - PostgreSQL enum types (public.booking_status, public.payment_status) strictly enforced.
--   - Catalog-inspected constraint addition preventing duplicate or unvalidated checks.
--   - Authoritative GiST exclusion constraint (bookings_no_overlap / no_overlapping_bookings)
--     preserved byte-for-byte as the final database-level double-booking defense.
--   - Row-level locking (FOR UPDATE OF r SKIP LOCKED) prevents room allocation race conditions.
--   - Row-level locking (SELECT ... FOR UPDATE) in cancellation RPC prevents status transition races.
--   - BLOCKER DOCUMENTED: Guest contact persistence requires approved schema alteration.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: PRE-MIGRATION DATA INTEGRITY CHECKS (RUN BEFORE APPLYING CONSTRAINTS)
-- ----------------------------------------------------------------------------
-- Run these read-only diagnostic queries in Supabase Dashboard SQL Editor to verify
-- that no existing records in public.bookings or public.payments violate constraints:
--
-- SELECT id, check_in, check_out FROM public.bookings WHERE check_in IS NULL OR check_out IS NULL OR check_out <= check_in;
-- SELECT id, guests FROM public.bookings WHERE guests < 1 OR guests IS NULL;
-- SELECT id, subtotal, total_amount FROM public.bookings WHERE subtotal < 0 OR total_amount < 0;
-- SELECT id, amount FROM public.payments WHERE amount < 0;
--
-- Check for existing constraints and their validation status:
-- SELECT conname, contype, convalidated, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid IN ('public.bookings'::regclass, 'public.payments'::regclass);
--
-- Verify existing enum labels in catalog:
-- SELECT t.typname, e.enumlabel
-- FROM pg_type t
-- JOIN pg_enum e ON t.oid = e.enumtypid
-- WHERE t.typname IN ('booking_status', 'payment_status')
-- ORDER BY t.typname, e.enumsortorder;

-- ----------------------------------------------------------------------------
-- STEP 2: TABLE CHECK CONSTRAINTS (IDEMPOTENT, TABLE-SCOPED & DUPLICATE-SAFE)
-- ----------------------------------------------------------------------------
-- FIX: Prevent duplicate constraints by inspecting pg_constraint and pg_get_constraintdef
-- for existing validated constraints on public.bookings and public.payments before adding checks.
-- Recognizes pre-existing validated constraints (bookings_dates_check, bookings_guests_check,
-- bookings_amounts_check, payments_amount_check). If unvalidated, validates in place.
DO $$
DECLARE
  v_has_dates_constraint boolean := false;
  v_has_guests_constraint boolean := false;
  v_has_bookings_amount_constraint boolean := false;
  v_has_payments_amount_constraint boolean := false;
  v_con record;
BEGIN
  -- 1. Date Check on public.bookings
  -- Canonical constraint name: bookings_dates_check
  -- Alternative name: bookings_check_out_after_check_in
  FOR v_con IN
    SELECT c.conname, c.convalidated, pg_get_constraintdef(c.oid) AS condef
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'bookings'
      AND c.contype = 'c'
      AND (
        c.conname IN ('bookings_dates_check', 'bookings_check_out_after_check_in')
        OR pg_get_constraintdef(c.oid) LIKE '%check_out > check_in%'
        OR pg_get_constraintdef(c.oid) LIKE '%check_out%check_in%'
      )
  LOOP
    IF v_con.convalidated THEN
      v_has_dates_constraint := true;
    ELSE
      -- Existing constraint found but unvalidated: validate it in place
      EXECUTE format('ALTER TABLE public.bookings VALIDATE CONSTRAINT %I', v_con.conname);
      v_has_dates_constraint := true;
    END IF;
  END LOOP;

  -- FIX: Ensure check_in and check_out cannot be NULL. In SQL, CHECK (check_out > check_in)
  -- evaluates to UNKNOWN if either operand is NULL, passing the check without explicit IS NOT NULL guards.
  IF NOT v_has_dates_constraint THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_dates_check
      CHECK (check_in IS NOT NULL AND check_out IS NOT NULL AND check_out > check_in);
  END IF;

  -- 2. Guest Count Check on public.bookings
  -- Canonical constraint name: bookings_guests_check
  -- Alternative name: bookings_guests_positive
  FOR v_con IN
    SELECT c.conname, c.convalidated, pg_get_constraintdef(c.oid) AS condef
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'bookings'
      AND c.contype = 'c'
      AND (
        c.conname IN ('bookings_guests_check', 'bookings_guests_positive')
        OR pg_get_constraintdef(c.oid) LIKE '%guests >= 1%'
        OR pg_get_constraintdef(c.oid) LIKE '%guests > 0%'
      )
  LOOP
    IF v_con.convalidated THEN
      v_has_guests_constraint := true;
    ELSE
      EXECUTE format('ALTER TABLE public.bookings VALIDATE CONSTRAINT %I', v_con.conname);
      v_has_guests_constraint := true;
    END IF;
  END LOOP;

  IF NOT v_has_guests_constraint THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_guests_check
      CHECK (guests >= 1);
  END IF;

  -- 3. Financial Amounts Check on public.bookings
  -- Canonical constraint name: bookings_amounts_check
  -- Alternative name: bookings_amounts_non_negative
  FOR v_con IN
    SELECT c.conname, c.convalidated, pg_get_constraintdef(c.oid) AS condef
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'bookings'
      AND c.contype = 'c'
      AND (
        c.conname IN ('bookings_amounts_check', 'bookings_amounts_non_negative')
        OR (
          pg_get_constraintdef(c.oid) LIKE '%total_amount >= 0%'
          AND pg_get_constraintdef(c.oid) LIKE '%subtotal >= 0%'
        )
      )
  LOOP
    IF v_con.convalidated THEN
      v_has_bookings_amount_constraint := true;
    ELSE
      EXECUTE format('ALTER TABLE public.bookings VALIDATE CONSTRAINT %I', v_con.conname);
      v_has_bookings_amount_constraint := true;
    END IF;
  END LOOP;

  IF NOT v_has_bookings_amount_constraint THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_amounts_check
      CHECK (total_amount >= 0 AND subtotal >= 0);
  END IF;

  -- 4. Financial Amount Check on public.payments
  -- Canonical constraint name: payments_amount_check
  -- Alternative name: payments_amount_non_negative
  FOR v_con IN
    SELECT c.conname, c.convalidated, pg_get_constraintdef(c.oid) AS condef
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'payments'
      AND c.contype = 'c'
      AND (
        c.conname IN ('payments_amount_check', 'payments_amount_non_negative')
        OR pg_get_constraintdef(c.oid) LIKE '%amount >= 0%'
      )
  LOOP
    IF v_con.convalidated THEN
      v_has_payments_amount_constraint := true;
    ELSE
      EXECUTE format('ALTER TABLE public.payments VALIDATE CONSTRAINT %I', v_con.conname);
      v_has_payments_amount_constraint := true;
    END IF;
  END LOOP;

  IF NOT v_has_payments_amount_constraint THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_amount_check
      CHECK (amount >= 0);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- STEP 3: AUTHORITATIVE PRICING & INTEGRITY TRIGGER
-- Defense-in-depth: Recalculates authoritative pricing directly from public.room_types.
-- Guards against NULL dates, verifies room status on INSERT, and handles
-- stay modifications without blocking administrative room status updates.
-- ----------------------------------------------------------------------------
-- FIX: Security hardening — explicit search_path = public, pg_temp prevents search path hijacking.
CREATE OR REPLACE FUNCTION public.enforce_booking_pricing_and_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_base_price numeric;
  v_max_guests integer;
  v_room_status text;
  v_room_type_status text;
  v_nights integer;
BEGIN
  -- 1. Explicitly reject missing or NULL stay dates
  IF NEW.check_in IS NULL OR NEW.check_out IS NULL THEN
    RAISE EXCEPTION 'Check-in and check-out dates are required'
      USING ERRCODE = '22023';
  END IF;

  -- Require checkout to be strictly after check-in
  IF NEW.check_out <= NEW.check_in THEN
    RAISE EXCEPTION 'Check-out date must be strictly after check-in date'
      USING ERRCODE = '22023';
  END IF;

  v_nights := NEW.check_out - NEW.check_in;

  -- 2. Validate physical room existence, availability, and authoritative room pricing
  IF NEW.room_id IS NULL THEN
    RAISE EXCEPTION 'Physical room_id is required'
      USING ERRCODE = '22023';
  END IF;

  SELECT r.status, rt.base_price, rt.max_guests, rt.status
  INTO v_room_status, v_base_price, v_max_guests, v_room_type_status
  FROM public.rooms r
  JOIN public.room_types rt ON rt.id = r.room_type_id
  WHERE r.id = NEW.room_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid physical room_id specified in reservation: %', NEW.room_id
      USING ERRCODE = '23503';
  END IF;

  -- Verify room status:
  -- On INSERT: Room must be currently 'available'
  -- On UPDATE: Verify availability ONLY if changing physical rooms (allows stay updates on active stays)
  IF TG_OP = 'INSERT' AND v_room_status != 'available' THEN
    RAISE EXCEPTION 'Physical room % is currently not available (status: %)', NEW.room_id, v_room_status
      USING ERRCODE = '22023';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.room_id IS DISTINCT FROM OLD.room_id AND v_room_status != 'available' THEN
    RAISE EXCEPTION 'New physical room % is currently not available (status: %)', NEW.room_id, v_room_status
      USING ERRCODE = '22023';
  END IF;

  -- Room category status check
  IF v_room_type_status IS NOT NULL AND v_room_type_status != 'active' THEN
    RAISE EXCEPTION 'The room category for room % is currently inactive', NEW.room_id
      USING ERRCODE = '22023';
  END IF;

  -- 3. Enforce guest capacity
  IF NEW.guests IS NULL OR NEW.guests < 1 THEN
    RAISE EXCEPTION 'Guest count must be at least 1 person'
      USING ERRCODE = '22023';
  END IF;

  IF v_max_guests IS NOT NULL AND NEW.guests > v_max_guests THEN
    RAISE EXCEPTION 'Guest count (%) exceeds the room maximum occupancy of %', NEW.guests, v_max_guests
      USING ERRCODE = '22023';
  END IF;

  -- 4. Authoritative price recalculation: NEVER trust client-supplied totals
  IF v_base_price IS NULL OR v_base_price <= 0 THEN
    RAISE EXCEPTION 'Invalid room price configuration in catalog'
      USING ERRCODE = '22023';
  END IF;

  NEW.subtotal := v_base_price * v_nights;
  NEW.total_amount := NEW.subtotal;

  -- 5. Default booking status to 'confirmed' if unspecified
  -- FIX: Cast NEW.booking_status to text before calling trim() to prevent
  -- 'function trim(public.booking_status) does not exist' runtime errors on enum columns.
  -- Explicitly cast assignment literal to public.booking_status for type compatibility.
  IF NEW.booking_status IS NULL OR trim(NEW.booking_status::text) = '' THEN
    NEW.booking_status := 'confirmed'::public.booking_status;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_booking_pricing_and_integrity ON public.bookings;
CREATE TRIGGER trg_enforce_booking_pricing_and_integrity
  BEFORE INSERT OR UPDATE OF room_id, check_in, check_out, guests, subtotal, total_amount
  ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_booking_pricing_and_integrity();

-- ----------------------------------------------------------------------------
-- STEP 4: TRUSTED DATABASE RPC — public.create_booking
-- Encapsulates atomic physical room allocation, authoritative pricing,
-- booking record insertion, primary guest record creation, and payment record creation.
-- ----------------------------------------------------------------------------
-- FIX: Security hardening — explicit search_path = public, pg_temp.
-- FIX: Preserved exact parameter signature and argument types to avoid breaking frontend callers
-- (frontend/src/services/bookingService.js) or generating conflicting overloaded RPC signatures.
CREATE OR REPLACE FUNCTION public.create_booking(
  p_room_type_id uuid,
  p_check_in date,
  p_check_out date,
  p_guests_count integer DEFAULT 2,
  p_guest_name text DEFAULT '',
  p_guest_email text DEFAULT '',
  p_guest_phone text DEFAULT '',
  p_special_request text DEFAULT NULL,
  p_payment_method text DEFAULT 'pay_at_hotel',
  p_guest_age integer DEFAULT NULL,
  p_guest_gender text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_today_kolkata date;
  v_nights integer;
  v_room_type_name text;
  v_base_price numeric;
  v_max_guests integer;
  v_room_type_status text;
  v_allocated_room_id uuid;
  v_allocated_room_number text;
  v_allocated_floor_number integer;
  v_subtotal numeric;
  v_total numeric;
  -- FIX: Declared v_booking_status and v_payment_status using exact PostgreSQL enum types
  -- established by schema (public.booking_status and public.payment_status) instead of generic text.
  v_booking_status public.booking_status;
  v_payment_status public.payment_status;
  v_gateway text;
  v_clean_payment_method text;
  v_booking_id uuid;
  v_created_at timestamptz;
  v_payment_id uuid;
  v_formatted_ref_id text;
  v_clean_name text;
  v_clean_email text;
  v_clean_phone text;
  v_clean_special_req text;
BEGIN
  -- 1. Authentication check
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: You must be signed in to make a reservation.'
      USING ERRCODE = '42501';
  END IF;

  -- 2. Explicitly validate stay dates (Asia/Kolkata boundary)
  IF p_check_in IS NULL OR p_check_out IS NULL THEN
    RAISE EXCEPTION 'Check-in and check-out dates are required.'
      USING ERRCODE = '22023';
  END IF;

  v_today_kolkata := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date;
  IF p_check_in < v_today_kolkata THEN
    RAISE EXCEPTION 'Check-in date cannot be in the past.'
      USING ERRCODE = '22023';
  END IF;

  IF p_check_out <= p_check_in THEN
    RAISE EXCEPTION 'Check-out date must be strictly after check-in date.'
      USING ERRCODE = '22023';
  END IF;

  v_nights := p_check_out - p_check_in;
  IF v_nights < 1 THEN
    RAISE EXCEPTION 'Reservation must be for at least 1 night.'
      USING ERRCODE = '22023';
  END IF;

  -- 3. Guest profile validation
  v_clean_name := trim(p_guest_name);
  IF length(v_clean_name) < 2 THEN
    RAISE EXCEPTION 'A valid guest name of at least 2 characters is required.'
      USING ERRCODE = '22023';
  END IF;

  v_clean_email := lower(trim(p_guest_email));
  IF v_clean_email !~ '^[a-zA-Z0-9]+([._%+-][a-zA-Z0-9]+)*@gmail\.com$' THEN
    RAISE EXCEPTION 'A valid @gmail.com email address is required.'
      USING ERRCODE = '22023';
  END IF;

  v_clean_phone := trim(p_guest_phone);
  -- Match standard Indian mobile: 10 digits starting with 6-9, with optional +91 prefix
  IF v_clean_phone !~ '^(\+91[\s-]?)?[6-9]\d{9}$' THEN
    RAISE EXCEPTION 'A valid Indian mobile number starting with 6-9 is required.'
      USING ERRCODE = '22023';
  END IF;

  IF p_guest_age IS NOT NULL AND (p_guest_age < 18 OR p_guest_age > 120) THEN
    RAISE EXCEPTION 'Guest age must be between 18 and 120.'
      USING ERRCODE = '22023';
  END IF;

  IF p_guest_gender IS NOT NULL AND lower(trim(p_guest_gender)) NOT IN ('male', 'female', 'other') THEN
    RAISE EXCEPTION 'Invalid gender choice. Must be Male, Female, or Other.'
      USING ERRCODE = '22023';
  END IF;

  v_clean_special_req := NULLIF(trim(p_special_request), '');
  IF v_clean_special_req IS NOT NULL AND length(v_clean_special_req) > 500 THEN
    RAISE EXCEPTION 'Special requests cannot exceed 500 characters.'
      USING ERRCODE = '22023';
  END IF;

  -- 4. Authoritative Room Configuration
  IF p_room_type_id IS NULL THEN
    RAISE EXCEPTION 'Room category ID is required.'
      USING ERRCODE = '22023';
  END IF;

  SELECT name, base_price, max_guests, status
  INTO v_room_type_name, v_base_price, v_max_guests, v_room_type_status
  FROM public.room_types
  WHERE id = p_room_type_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The selected room category could not be found.'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_room_type_status IS NOT NULL AND v_room_type_status != 'active' THEN
    RAISE EXCEPTION 'The selected room category (%) is currently not active for reservations.', v_room_type_name
      USING ERRCODE = '22023';
  END IF;

  IF p_guests_count IS NULL OR p_guests_count < 1 THEN
    RAISE EXCEPTION 'Guest count must be at least 1 person.'
      USING ERRCODE = '22023';
  END IF;

  IF v_max_guests IS NOT NULL AND p_guests_count > v_max_guests THEN
    RAISE EXCEPTION 'The maximum occupancy for % is % guests.', v_room_type_name, v_max_guests
      USING ERRCODE = '22023';
  END IF;

  -- 5. Authoritative Pricing Calculation
  IF v_base_price IS NULL OR v_base_price <= 0 THEN
    RAISE EXCEPTION 'Invalid room price configuration in catalog.'
      USING ERRCODE = '22023';
  END IF;

  v_subtotal := v_base_price * v_nights;
  v_total := v_subtotal;

  -- 6. Atomic Physical Room Allocation (NULL-Safe NOT EXISTS & Row-Level Locking)
  -- FIX: Preserved status logic matching the authoritative bookings_no_overlap / no_overlapping_bookings
  -- exclusion constraint: active statuses (pending, confirmed, checked_in) block inventory, while
  -- non-blocking statuses (cancelled, completed, checked_out) release inventory.
  -- Concurrency Note: FOR UPDATE OF r SKIP LOCKED prevents race conditions among concurrent callers
  -- selecting available rooms. The GiST exclusion constraint remains the authoritative final defense.
  SELECT r.id, r.room_number, r.floor_number
  INTO v_allocated_room_id, v_allocated_room_number, v_allocated_floor_number
  FROM public.rooms r
  WHERE r.room_type_id = p_room_type_id
    AND r.status = 'available'
    AND NOT EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.room_id = r.id
        AND (b.booking_status IS NULL OR b.booking_status NOT IN ('cancelled', 'completed', 'checked_out'))
        AND daterange(b.check_in, b.check_out, '[)') && daterange(p_check_in, p_check_out, '[)')
    )
  ORDER BY r.room_number ASC
  FOR UPDATE OF r SKIP LOCKED
  LIMIT 1;

  IF v_allocated_room_id IS NULL THEN
    RAISE EXCEPTION 'Sorry, % is fully booked for the selected dates (% to %).',
      v_room_type_name, p_check_in, p_check_out
      USING ERRCODE = 'P0001';
  END IF;

  -- 7. Payment Method Validation & Initial Status Enforcement
  -- Explicit allowlist for supported payment methods
  v_clean_payment_method := lower(trim(COALESCE(p_payment_method, '')));
  IF v_clean_payment_method IN ('pay at hotel', 'pay_at_hotel', 'cash') THEN
    v_gateway := 'pay_at_hotel';
  ELSIF v_clean_payment_method IN ('online', 'card', 'upi', 'netbanking') THEN
    v_gateway := 'online';
  ELSE
    RAISE EXCEPTION 'Invalid payment method: "%". Supported methods are Pay at Hotel, Online, Card, UPI, or NetBanking.', p_payment_method
      USING ERRCODE = '22023';
  END IF;

  -- FIX: Assign enum variables with explicit type casts to public.booking_status and public.payment_status.
  -- Security: All client-initiated reservations create confirmed bookings with PENDING payment.
  -- Clients cannot declare payments as 'paid' during booking creation.
  v_booking_status := 'confirmed'::public.booking_status;
  v_payment_status := 'pending'::public.payment_status;

  -- 8. Insert Booking Record
  -- FIX: The GiST exclusion constraint (bookings_no_overlap / no_overlapping_bookings) is the
  -- final database-level authority against overlapping reservations.
  BEGIN
    INSERT INTO public.bookings (
      user_id,
      room_id,
      check_in,
      check_out,
      guests,
      subtotal,
      total_amount,
      special_request,
      booking_status
    ) VALUES (
      v_user_id,
      v_allocated_room_id,
      p_check_in,
      p_check_out,
      p_guests_count,
      v_subtotal,
      v_total,
      v_clean_special_req,
      v_booking_status
    )
    RETURNING id, created_at INTO v_booking_id, v_created_at;
  EXCEPTION
    WHEN exclusion_violation THEN
      RAISE EXCEPTION 'This room was just reserved by another guest for these dates. Please try different dates or another room.'
        USING ERRCODE = '23P01';
  END;

  -- 9. Insert Primary Guest Details
  -- FIX: BLOCKER — GUEST CONTACT STORAGE INTEGRITY:
  -- The validated guest email (v_clean_email) and phone (v_clean_phone) are validated above but
  -- are NOT persisted here because the existing public.booking_guests table schema has no email
  -- or phone columns, and public.bookings has no guest_email/guest_phone fields.
  -- Per strict execution boundaries:
  --   1. We do NOT silently add columns to public.booking_guests or public.bookings.
  --   2. We do NOT overwrite public.profiles (email/phone), as guest details can differ from the
  --      authenticated booking account holder (e.g. booking for another guest/family member).
  --   3. Contact persistence is formally flagged as a BLOCKER requiring architectural approval.
  INSERT INTO public.booking_guests (
    booking_id,
    full_name,
    age,
    gender
  ) VALUES (
    v_booking_id,
    v_clean_name,
    p_guest_age,
    p_guest_gender
  );

  -- 10. Insert Payment Record (Strictly pending on creation)
  INSERT INTO public.payments (
    booking_id,
    user_id,
    amount,
    currency,
    payment_status,
    gateway
  ) VALUES (
    v_booking_id,
    v_user_id,
    v_total,
    'INR',
    v_payment_status,
    v_gateway
  )
  RETURNING id INTO v_payment_id;

  -- 11. Format Reference ID
  v_formatted_ref_id := 'HAI-' || to_char(v_created_at, 'YYYY') || '-' || upper(substring(v_booking_id::text, 1, 5));

  -- 12. Return Complete Structured Response
  -- FIX: Cast enum variables to text in JSON construction for safe string representation.
  RETURN jsonb_build_object(
    'id', v_booking_id,
    'formattedRefId', v_formatted_ref_id,
    'user_id', v_user_id,
    'room_id', v_allocated_room_id,
    'check_in', p_check_in,
    'check_out', p_check_out,
    'guests', p_guests_count,
    'subtotal', v_subtotal,
    'total_amount', v_total,
    'special_request', v_clean_special_req,
    'booking_status', v_booking_status::text,
    'created_at', v_created_at,
    'rooms', jsonb_build_object(
      'id', v_allocated_room_id,
      'room_number', v_allocated_room_number,
      'floor_number', v_allocated_floor_number,
      'room_types', jsonb_build_object(
        'id', p_room_type_id,
        'name', v_room_type_name,
        'base_price', v_base_price
      )
    ),
    'payment', jsonb_build_object(
      'id', v_payment_id,
      'amount', v_total,
      'currency', 'INR',
      'payment_status', v_payment_status::text,
      'gateway', v_gateway
    ),
    'payment_method', p_payment_method,
    'payment_status', v_payment_status::text
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_booking(
  uuid, date, date, integer, text, text, text, text, text, integer, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_booking(
  uuid, date, date, integer, text, text, text, text, text, integer, text
) TO authenticated;

-- ----------------------------------------------------------------------------
-- STEP 5: DEDICATED CUSTOMER CANCELLATION RPC — public.cancel_booking
-- Security:
--   - Verifies caller authentication and ownership (or verified admin role from public.profiles).
--   - Locks row using SELECT ... FOR UPDATE before inspecting status.
--   - Rejects non-cancellable statuses (allows ONLY 'confirmed' and 'pending').
--   - Mutates ONLY booking_status and updated_at.
--   - Prevents tampering with room_id, stay dates, guest count, or pricing.
-- ----------------------------------------------------------------------------
-- FIX: Security hardening — explicit search_path = public, pg_temp.
CREATE OR REPLACE FUNCTION public.cancel_booking(
  p_booking_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_calling_user_id uuid;
  v_booking_id uuid;
  v_owner_id uuid;
  -- FIX: Declared v_current_status as public.booking_status enum type instead of text.
  v_current_status public.booking_status;
  v_is_admin boolean;
  v_updated_at timestamptz;
BEGIN
  -- 1. Authentication check
  v_calling_user_id := auth.uid();
  IF v_calling_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: You must be signed in to cancel a reservation.'
      USING ERRCODE = '42501';
  END IF;

  -- 2. Input validation
  IF p_booking_id IS NULL THEN
    RAISE EXCEPTION 'Booking ID is required.'
      USING ERRCODE = '22023';
  END IF;

  -- 3. Lock row and verify existence
  -- FIX: Explicit row locking with SELECT ... FOR UPDATE prevents race conditions with concurrent check-ins or status transitions.
  SELECT b.id, b.user_id, b.booking_status
  INTO v_booking_id, v_owner_id, v_current_status
  FROM public.bookings b
  WHERE b.id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found.'
      USING ERRCODE = 'P0002';
  END IF;

  -- 4. Check ownership or verified admin privilege from public.profiles
  -- Does NOT trust client-supplied JWT claims or arbitrary role headers.
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = v_calling_user_id AND role = 'admin'
  ) INTO v_is_admin;

  IF v_owner_id IS DISTINCT FROM v_calling_user_id AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Access denied: You do not have permission to cancel this reservation.'
      USING ERRCODE = '42501';
  END IF;

  -- 5. Validate current status strictly: ONLY 'confirmed' and 'pending' are cancellable
  -- FIX: Enum comparison against allowed labels with text cast for error reporting.
  IF v_current_status IS NULL OR v_current_status NOT IN ('confirmed', 'pending') THEN
    IF v_current_status = 'cancelled' THEN
      RAISE EXCEPTION 'This reservation is already cancelled.'
        USING ERRCODE = '22023';
    ELSIF v_current_status IN ('checked_in', 'checked_out', 'completed') THEN
      RAISE EXCEPTION 'Reservations with status "%" cannot be cancelled.', v_current_status::text
        USING ERRCODE = '22023';
    ELSE
      RAISE EXCEPTION 'Reservation with status "%" cannot be cancelled.', COALESCE(v_current_status::text, 'unknown')
        USING ERRCODE = '22023';
    END IF;
  END IF;

  -- 6. Perform the cancellation update ONLY modifying booking_status and updated_at
  -- FIX: Explicitly cast 'cancelled' to public.booking_status for enum column compatibility.
  v_updated_at := clock_timestamp();
  UPDATE public.bookings
  SET
    booking_status = 'cancelled'::public.booking_status,
    updated_at = v_updated_at
  WHERE id = p_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'booking_status', 'cancelled',
    'updated_at', v_updated_at
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cancel_booking(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_booking(uuid) TO authenticated;

-- ----------------------------------------------------------------------------
-- STEP 6: SECURE ROOM AVAILABILITY RPC — public.get_room_availability
-- Allows clients to query physical room availability across the entire inventory
-- without exposing any guest personal information (PII).
-- ----------------------------------------------------------------------------
-- FIX: Security hardening — explicit search_path = public, pg_temp.
CREATE OR REPLACE FUNCTION public.get_room_availability(
  p_check_in date,
  p_check_out date
)
RETURNS TABLE (
  room_id uuid,
  room_type_id uuid,
  room_number text,
  floor_number integer,
  is_available boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_check_in IS NULL OR p_check_out IS NULL THEN
    RAISE EXCEPTION 'Check-in and check-out dates are required'
      USING ERRCODE = '22023';
  END IF;

  IF p_check_out <= p_check_in THEN
    RAISE EXCEPTION 'Check-out date must be strictly after check-in date'
      USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT
    r.id AS room_id,
    r.room_type_id,
    r.room_number,
    r.floor_number,
    (
      r.status = 'available'
      AND NOT EXISTS (
        SELECT 1
        FROM public.bookings b
        WHERE b.room_id = r.id
          AND (b.booking_status IS NULL OR b.booking_status NOT IN ('cancelled', 'completed', 'checked_out'))
          AND daterange(b.check_in, b.check_out, '[)') && daterange(p_check_in, p_check_out, '[)')
      )
    ) AS is_available
  FROM public.rooms r;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_room_availability(date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_room_availability(date, date) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- STEP 7: ROW LEVEL SECURITY (RLS) LOCKDOWN
-- Explicit cleanup of all legacy policies on bookings, booking_guests, payments.
-- Direct customer REST INSERT and UPDATE are strictly blocked.
-- Customer reads and Admin operations are fully preserved.
-- ----------------------------------------------------------------------------
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 7.1 Clean up legacy policies on the target tables
-- FIX: Explicitly drop known legacy policy names to prevent permissive OR bypasses,
-- followed by a catalog sweep to remove orphaned or template policies.
DO $$
DECLARE
  pol record;
BEGIN
  -- Known legacy policy names from earlier baseline / template configurations
  DROP POLICY IF EXISTS "Allow authenticated insert" ON public.bookings;
  DROP POLICY IF EXISTS "Allow authenticated update" ON public.bookings;
  DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.bookings;
  DROP POLICY IF EXISTS "Users can insert their own bookings" ON public.bookings;
  DROP POLICY IF EXISTS "Enable insert for users" ON public.payments;
  DROP POLICY IF EXISTS "Allow authenticated insert" ON public.payments;
  DROP POLICY IF EXISTS "Allow authenticated insert" ON public.booking_guests;

  -- Sweep existing policies on target tables before installing authoritative policies
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('bookings', 'booking_guests', 'payments')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- 7.2 public.bookings Authoritative RLS Policies
-- Customer SELECT: only own bookings
-- Admin SELECT: all bookings
CREATE POLICY "bookings_select_policy" ON public.bookings
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Direct INSERT: restricted strictly to Admins (customers must use create_booking RPC)
CREATE POLICY "bookings_insert_policy" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Direct UPDATE: restricted strictly to Admins (customers must use cancel_booking RPC)
CREATE POLICY "bookings_update_policy" ON public.bookings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Direct DELETE: restricted strictly to Admins
CREATE POLICY "bookings_delete_policy" ON public.bookings
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7.3 public.booking_guests Authoritative RLS Policies
CREATE POLICY "booking_guests_select_policy" ON public.booking_guests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_guests.booking_id
        AND (
          b.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
          )
        )
    )
  );

CREATE POLICY "booking_guests_insert_policy" ON public.booking_guests
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "booking_guests_update_policy" ON public.booking_guests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "booking_guests_delete_policy" ON public.booking_guests
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7.4 public.payments Authoritative RLS Policies
CREATE POLICY "payments_select_policy" ON public.payments
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "payments_insert_policy" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "payments_update_policy" ON public.payments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "payments_delete_policy" ON public.payments
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- STEP 8: CONTROLLED STAGING VERIFICATION & MANUAL RECOVERY GUIDELINES
-- ============================================================================
-- FIX: Replaced simplistic automatic rollback script with explicit manual recovery
-- prerequisites. An automatic rollback script cannot guarantee safe reversibility
-- without prior-state catalog information, and blindly restoring customer INSERT
-- privileges re-introduces price tampering vulnerabilities.
--
-- PRE-APPLICATION BACKUP PROCEDURE (STAGING / PRODUCTION):
-- Before applying this migration in any environment, capture the active state:
--
-- 1. Backup existing policies:
--    COPY (
--      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
--      FROM pg_policies
--      WHERE schemaname = 'public' AND tablename IN ('bookings', 'booking_guests', 'payments')
--    ) TO STDOUT WITH CSV HEADER;
--
-- 2. Backup existing table constraints:
--    COPY (
--      SELECT conname, contype, convalidated, pg_get_constraintdef(oid)
--      FROM pg_constraint
--      WHERE conrelid IN ('public.bookings'::regclass, 'public.payments'::regclass)
--    ) TO STDOUT WITH CSV HEADER;
--
-- 3. Backup existing RPC definitions:
--    SELECT pg_get_functiondef(oid)
--    FROM pg_proc
--    WHERE proname IN ('create_booking', 'cancel_booking', 'get_room_availability', 'enforce_booking_pricing_and_integrity');
--
-- MANUAL RECOVERY PROCEDURE (IF ROLLBACK IS MANDATED IN STAGING):
-- 1. Restore specific prior policies from pre-migration backup.
-- 2. If reverting RPCs, re-create original function definitions from step 3 above.
-- 3. DO NOT drop validated constraints (bookings_dates_check, bookings_guests_check,
--    bookings_amounts_check, payments_amount_check) if they pre-dated this migration.
-- 4. Never drop bookings_no_overlap or no_overlapping_bookings exclusion constraints.
-- ============================================================================
