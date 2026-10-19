-- ============================================================================
-- HOTEL AMBIENCE INN — AUDIT CORRECTIONS & LIVE SCHEMA ALIGNMENT PATCH
-- File: backend/supabase/migrations/live_schema_alignment_patch.sql
-- Status: FULLY INCORPORATED INTO 20261019000000_trusted_booking_security_final.sql
-- Purpose: Reference Audit Specification (Do Not Execute Separately)
-- Description:
--   Proposes minimal, safe refinements to align the final migration with confirmed
--   live Supabase schema facts:
--     1. Live enum public.payment_status ('pending', 'paid', 'failed', 'refunded', 'cancelled').
--     2. Live enum public.booking_status ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'completed').
--     3. Live check constraint bookings_amounts_check covering subtotal, tax_amount, discount_amount, total_amount.
--     4. Live exclusion constraint bookings_no_overlap on (room_id, daterange(check_in, check_out, '[)')).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- REFINEMENT 1: Fallback CHECK constraint definition for public.bookings amounts
-- File: backend/supabase/migrations/20261019000000_trusted_booking_security_final.sql
-- Lines: 234-244
--
-- Rationale:
--   In the live database, bookings_amounts_check is already validated and covers:
--     subtotal >= 0, tax_amount >= 0, discount_amount >= 0, total_amount >= 0.
--   The migration's catalog detection in lines 220-232 successfully matches the live
--   constraint via 'total_amount >=' and 'subtotal >=' and skips re-creation.
--   However, if applied in a fresh environment where the constraint is missing, the
--   fallback ADD CONSTRAINT should explicitly cover tax_amount and discount_amount
--   using COALESCE to maintain 100% equivalence with the live schema:
-- ----------------------------------------------------------------------------
/*
PROPOSED DIFF FOR LINES 234-244:
<<<<
  IF NOT v_has_bookings_amount_constraint THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conrelid = v_bookings_oid AND conname = 'bookings_amounts_check'
    ) THEN
      ALTER TABLE public.bookings
        ADD CONSTRAINT bookings_amounts_check
        CHECK (
          total_amount >= 0
          AND subtotal >= 0
          AND COALESCE(tax_amount, 0) >= 0
          AND COALESCE(discount_amount, 0) >= 0
        );
    ELSE
      ALTER TABLE public.bookings VALIDATE CONSTRAINT bookings_amounts_check;
    END IF;
  END IF;
>>>>
*/

-- ----------------------------------------------------------------------------
-- REFINEMENT 2: Documentation header for live enum values
-- File: backend/supabase/migrations/20261019000000_trusted_booking_security_final.sql
-- Lines: 53-59
--
-- Rationale:
--   Explicitly document confirmed live enum labels in the pre-migration diagnostic
--   instructions so operators know exact allowed values before running RPCs:
--     - booking_status: ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'completed')
--     - payment_status: ('pending', 'paid', 'failed', 'refunded', 'cancelled')
-- ----------------------------------------------------------------------------
/*
PROPOSED COMMENT CLARIFICATION FOR LINES 53-59:
<<<<
-- Verify existing enum labels in catalog (Confirmed live values):
--   booking_status: pending, confirmed, checked_in, checked_out, cancelled, completed
--   payment_status: pending, paid, failed, refunded, cancelled
--
-- SELECT t.typname, e.enumlabel
-- FROM pg_type t
-- JOIN pg_enum e ON t.oid = e.enumtypid
-- WHERE t.typname IN ('booking_status', 'payment_status')
-- ORDER BY t.typname, e.enumsortorder;
>>>>
*/
