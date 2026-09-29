# Database Configuration & Schema

This directory holds database scripts and schema definitions for the Hotel Ambience Inn PostgreSQL database hosted on Supabase.

## Database Tables & Entities

- `profiles`: Registered guest and admin account profiles linked to `auth.users`.
- `room_types`: Master catalog of accommodation categories (Deluxe, Executive, Suite, etc.) and nightly pricing.
- `rooms`: Physical room inventory items with floor numbers and operational statuses.
- `bookings`: Reservations linked to guest profiles, room types, stay dates, and pricing.
- `reviews`: Guest feedback and moderation statuses.
- `offers`: Promotional discount codes and validity dates.
- `settings`: Hotel property information and policies.

## Security

Row-Level Security (RLS) policies govern data access based on authenticated user roles (`guest` vs `admin`).
