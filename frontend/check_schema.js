import { createClient } from '@supabase/supabase-js';

const url = 'https://jxueptqxtnbdohmobadu.supabase.co';
const key = 'sb_publishable_bM5H0ha4QLTORIZ6aJGMMQ_RClVnrMx';

async function checkSchema() {
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    const spec = await res.json();
    console.log('--- BOOKINGS PROPERTIES ---');
    console.log(spec.definitions?.bookings?.properties);
    console.log('--- PROFILES PROPERTIES ---');
    console.log(spec.definitions?.profiles?.properties);
    console.log('--- BOOKING_GUESTS PROPERTIES ---');
    console.log(spec.definitions?.booking_guests?.properties);
  } catch (err) {
    console.error('Error fetching OpenAPI spec:', err);
  }
}

checkSchema();
