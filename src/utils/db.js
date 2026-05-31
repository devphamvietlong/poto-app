// Backend Database API Client & Watering Math Utility

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787/api';

export const SPECIES_CATALOG = [
  {
    id: 'monstera',
    name: 'Monstera Deliciosa',
    speciesName: 'Monstera deliciosa',
    baselineET: 0.15, // Liters per day (150 ml/day)
    minVol: 200,      // ml
    maxVol: 600,      // ml
    desc: 'Known for its dramatic leaf fenestrations. Thrives in bright, indirect sunlight.',
    icon: 'leaf'
  },
  {
    id: 'snake',
    name: 'Snake Plant',
    speciesName: 'Sansevieria trifasciata',
    baselineET: 0.04, // Liters per day (40 ml/day)
    minVol: 100,      // ml
    maxVol: 300,      // ml
    desc: 'An excellent air purifier and nearly indestructible. Tolerates low light and drought.',
    icon: 'shield'
  },
  {
    id: 'fig',
    name: 'Fiddle Leaf Fig',
    speciesName: 'Ficus lyrata',
    baselineET: 0.22, // Liters per day (220 ml/day)
    minVol: 300,      // ml
    maxVol: 800,      // ml
    desc: 'A popular focal point plant. Highly sensitive to drafts and inconsistent watering.',
    icon: 'sprout'
  },
  {
    id: 'pothos',
    name: 'Golden Pothos',
    speciesName: 'Epipremnum aureum',
    baselineET: 0.12, // Liters per day (120 ml/day)
    minVol: 150,      // ml
    maxVol: 450,      // ml
    desc: 'Fast-growing vining plant. Great for hanging baskets and extremely forgiving.',
    icon: 'flower'
  },
  {
    id: 'succulent',
    name: 'Echeveria Succulent',
    speciesName: 'Echeveria elegans',
    baselineET: 0.02, // Liters per day (20 ml/day)
    minVol: 50,       // ml
    maxVol: 120,      // ml
    desc: 'Forms beautiful rosette clusters. Store water in fleshy leaves; needs sandy soil.',
    icon: 'heart'
  }
];

// Helper: Headers containing Auth ID
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  };
  const userId = localStorage.getItem('poto_user_id');
  if (userId) {
    headers['Authorization'] = `Bearer ${userId}`;
  }
  return headers;
};

// Onboard Guest User on load
export async function ensureUserOnboarded() {
  if (!localStorage.getItem('poto_user_id')) {
    try {
      const res = await fetch(`${API_BASE}/user/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turnstileToken: 'mock-token', name: 'Green Thumb' })
      });
      if (res.ok) {
        const guest = await res.json();
        localStorage.setItem('poto_user_id', guest.id);
        // Sync older username and email if stored locally
        const localName = localStorage.getItem('poto_user_name');
        const localEmail = localStorage.getItem('poto_user_email');
        if (localName || localEmail) {
          await updateProfile(localName || 'Green Thumb', localEmail || '');
        }
      }
    } catch (err) {
      console.error('Guest onboarding failed:', err);
    }
  }
}

// Pure function: Calculate watering schedule based on baseline ET and weather adjustment
export function calculateWatering(speciesId, potSize, weatherFactor = 1.0) {
  const species = SPECIES_CATALOG.find(s => s.id === speciesId) || SPECIES_CATALOG[0];
  let potFactor = 1.0;
  let capacity = (species.minVol + species.maxVol) / 2;
  
  if (potSize === 'small') {
    potFactor = 0.85;
    capacity = species.minVol;
  } else if (potSize === 'large') {
    potFactor = 1.15;
    capacity = species.maxVol;
  }
  
  const effectiveET = species.baselineET * potFactor * weatherFactor * 1000; // ml per day
  const intervalDays = capacity / effectiveET;
  
  return {
    intervalDays: Math.max(1, Math.round(intervalDays * 10) / 10),
    capacityMl: Math.round(capacity),
    dailyETMl: Math.round(effectiveET)
  };
}

// Fetch all plants from API
export async function getPlants() {
  await ensureUserOnboarded();
  try {
    const res = await fetch(`${API_BASE}/plants`, {
      headers: getHeaders()
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Error fetching plants:', err);
    return [];
  }
}

// Fetch user stats and profile details from API
export async function getStats() {
  await ensureUserOnboarded();
  try {
    const res = await fetch(`${API_BASE}/user`, {
      headers: getHeaders()
    });
    if (!res.ok) return { bambooCoins: 0, streakWeeks: 0, name: 'Green Thumb', email: '', accountType: 'guest' };
    const user = await res.json();
    return {
      bambooCoins: user.bamboo_coins,
      streakWeeks: user.streak_weeks,
      lastPhotoDate: user.last_photo_date,
      name: user.name,
      email: user.email,
      accountType: user.account_type
    };
  } catch (err) {
    console.error('Error fetching user stats:', err);
    return { bambooCoins: 0, streakWeeks: 0, name: 'Green Thumb', email: '', accountType: 'guest' };
  }
}

// Fetch all community events from API
export async function getEvents() {
  await ensureUserOnboarded();
  try {
    const res = await fetch(`${API_BASE}/events`, {
      headers: getHeaders()
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Error fetching events:', err);
    return [];
  }
}

// Fetch all registered event IDs from API for the user
export async function getEventRegistrations() {
  await ensureUserOnboarded();
  try {
    const res = await fetch(`${API_BASE}/events/registrations`, {
      headers: getHeaders()
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Error fetching event registrations:', err);
    return [];
  }
}

// Fetch all blog guides from API
export async function getBlogs() {
  await ensureUserOnboarded();
  try {
    const res = await fetch(`${API_BASE}/blogs`, {
      headers: getHeaders()
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Error fetching blogs:', err);
    return [];
  }
}

// Add a new plant
export async function addPlant(plant) {
  await ensureUserOnboarded();
  try {
    const res = await fetch(`${API_BASE}/plants`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        name: plant.name,
        speciesId: plant.speciesId,
        potSize: plant.potSize,
        initialPhotoUrl: plant.initialPhotoUrl
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.plant;
  } catch (err) {
    console.error('Error adding plant:', err);
    return null;
  }
}

// Water a plant
export async function waterPlant(plantId) {
  await ensureUserOnboarded();
  try {
    const res = await fetch(`${API_BASE}/plants/${plantId}/water`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error watering plant:', err);
    return null;
  }
}

// Add a photo to a plant
export async function addPhotoToPlant(plantId, photoUrl) {
  await ensureUserOnboarded();
  try {
    const res = await fetch(`${API_BASE}/plants/${plantId}/photo`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ photoUrl })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error uploading photo:', err);
    return null;
  }
}

// Delete plant pot
export async function deletePlant(plantId) {
  await ensureUserOnboarded();
  try {
    const res = await fetch(`${API_BASE}/plants/${plantId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.ok;
  } catch (err) {
    console.error('Error deleting plant:', err);
    return false;
  }
}

// Purchase shop product
export async function purchaseProduct(sku, size, purchaseMethod) {
  await ensureUserOnboarded();
  try {
    const res = await fetch(`${API_BASE}/shop/purchase`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ sku, size, purchaseMethod })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error purchasing product:', err);
    return null;
  }
}

// Fetch all shop products from API
export async function getShopProducts() {
  await ensureUserOnboarded();
  try {
    const res = await fetch(`${API_BASE}/shop`, {
      headers: getHeaders()
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Error fetching shop products:', err);
    return [];
  }
}

// RSVP to community event
export async function rsvpToEvent(eventId) {
  await ensureUserOnboarded();
  try {
    const res = await fetch(`${API_BASE}/events/rsvp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ eventId })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error RSVPing to event:', err);
    return null;
  }
}

// Update profile
export async function updateProfile(name, email) {
  await ensureUserOnboarded();
  try {
    const res = await fetch(`${API_BASE}/user`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ name, email })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error updating user profile:', err);
    return null;
  }
}

// Fallback reward coins method (no-op now since backend endpoints manage transactions)
export async function rewardCoins(amount) {
  return 0;
}
