/**
 * Room Image Mapping Utility
 * Maintains local real room photos for Hotel Ambience Inn independent of Supabase room_images table.
 */

export const DEFAULT_ROOM_IMAGES = {
  'deluxe non ac': [
    '/rooms/deluxe-non-ac/deluxe-non-ac-01-main-room.png',
    '/rooms/deluxe-non-ac/deluxe-non-ac-02-room-tv.png',
    '/rooms/deluxe-non-ac/deluxe-non-ac-03-bathroom.png',
    '/rooms/deluxe-non-ac/deluxe-non-ac-04-bathroom-shower.png',
    '/rooms/deluxe-non-ac/deluxe-non-ac-05-bathroom-basin.png'
  ],
  'deluxe ac': [
    '/rooms/deluxe-ac/deluxe-ac-01-main-room.png',
    '/rooms/deluxe-ac/deluxe-ac-02-tv-ac-wardrobe.png',
    '/rooms/deluxe-ac/deluxe-ac-03-room-bed.png',
    '/rooms/deluxe-ac/deluxe-ac-04-bathroom-toilet.png',
    '/rooms/deluxe-ac/deluxe-ac-05-bathroom-shower.png',
    '/rooms/deluxe-ac/deluxe-ac-06-tv-ac-wardrobe.png',
    '/rooms/deluxe-ac/deluxe-ac-07-bathroom-basin.png'
  ],
  'executive ac': [
    '/rooms/executive-ac/executive-ac-01-main-room.png',
    '/rooms/executive-ac/executive-ac-02-tv-wardrobe-ac.png',
    '/rooms/executive-ac/executive-ac-03-bathroom-shower.png',
    '/rooms/executive-ac/executive-ac-04-bathroom-toilet-basin.png',
    '/rooms/executive-ac/executive-ac-05-study-desk-room.png',
    '/rooms/executive-ac/executive-ac-06-tv-wardrobe-room.png',
    '/rooms/executive-ac/executive-ac-07-bed-lighting.png',
    '/rooms/executive-ac/executive-ac-08-bathroom-towels-mirror.png'
  ]
};

/**
 * Returns canonical local image list for a given room object or room name
 */
export const getCanonicalRoomImages = (room) => {
  if (!room) return DEFAULT_ROOM_IMAGES['deluxe ac'];
  
  const title = (room.title || room.name || room.category || '').toLowerCase();
  
  if (title.includes('non ac') || title.includes('non-ac')) {
    return DEFAULT_ROOM_IMAGES['deluxe non ac'];
  }
  if (title.includes('executive')) {
    return DEFAULT_ROOM_IMAGES['executive ac'];
  }
  if (title.includes('deluxe')) {
    return DEFAULT_ROOM_IMAGES['deluxe ac'];
  }

  // Fallback to room.images if present and non-empty
  if (Array.isArray(room.images) && room.images.length > 0) {
    return room.images;
  }

  return DEFAULT_ROOM_IMAGES['deluxe ac'];
};
