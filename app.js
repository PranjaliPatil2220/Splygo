/**
 * SplyGo - Comprehensive Application Controller
 * Integrations: Mapbox GL JS (with Theme Switching), Google Identity Services (OAuth 2.0),
 * OpenWeatherMap Proxy API, Multi-Theme Hot-Swapper & AI Persona Engine.
 */

// ============================================================================
// 1. Dynamic Environment & Client Configuration
// ============================================================================
const SplyConfig = {
  // Can be loaded from /api/config or window or Vite import.meta.env
  googleClientId: (typeof import !== 'undefined' && import.meta && import.meta.env && import.meta.env.VITE_GOOGLE_CLIENT_ID) 
    || window.VITE_GOOGLE_CLIENT_ID 
    || '',
  mapboxToken: (typeof import !== 'undefined' && import.meta && import.meta.env && import.meta.env.VITE_MAPBOX_TOKEN) 
    || window.VITE_MAPBOX_TOKEN 
    || '',
  apiBase: '' // Same origin for FastAPI
};

// ============================================================================
// 2. Application State Management
// ============================================================================
const SplyState = {
  currentTheme: localStorage.getItem('splygo_theme') || 'gaming',
  user: JSON.parse(localStorage.getItem('splygo_user') || 'null'),
  activeCategory: 'all',
  maxBudget: 5,
  showHeatmap: true,
  activeRoute: 'safe', // 'safe' | 'fast'
  escortActive: false,
  escortTimer: null,
  escortSecondsLeft: 45,
  
  // Map Engine State
  mapEngine: 'mapbox', // 'mapbox' with fallback to 'leaflet'
  mapboxMap: null,
  leafletMap: null,
  leafletTileLayer: null,
  markers: [],
  selectedVenue: null,

  // Weather State
  weather: null
};

// ============================================================================
// 3. Urban Geospatial Dataset (Coordinates in [lng, lat] for Mapbox / GeoJSON)
// ============================================================================
const VENUES_DATA = [
  {
    id: 'v1',
    name: 'Neon Tiger Late Night Tacos',
    category: 'food',
    categoryLabel: '2 AM Eats',
    lat: 40.7282,
    lng: -73.9892,
    priceTier: 1,
    priceSymbol: '$',
    status: 'Open till 3:30 AM',
    statusClass: 'status-open',
    hiddenGemScore: 94,
    scores: { safety: 88, cleanliness: 92, value: 98, accessibility: 85, vibe: 96 },
    quote: '"The birria broth at 2 AM on a rainy Tuesday will restore your will to explore."',
    address: '142 St Marks Place',
    pinIcon: '🌮',
    pinClass: 'pin-food'
  },
  {
    id: 'v2',
    name: 'The Alchemist Velvet Speakeasy',
    category: 'hidden',
    categoryLabel: 'Hidden Gem',
    lat: 40.7245,
    lng: -73.9935,
    priceTier: 4,
    priceSymbol: '$$$$',
    status: 'Secret Door Open',
    statusClass: 'status-open',
    hiddenGemScore: 98,
    scores: { safety: 94, cleanliness: 96, value: 84, accessibility: 78, vibe: 99 },
    quote: '"Hidden behind an antique clock shop. Ask for the Lavender Smoke elixir."',
    address: '68 Kenmare St (Knock 3 times)',
    pinIcon: '🍸',
    pinClass: 'pin-hidden'
  },
  {
    id: 'v3',
    name: '1894 Puck Building Heritage Trail',
    category: 'heritage',
    categoryLabel: 'Heritage Spot',
    lat: 40.7248,
    lng: -73.9954,
    priceTier: 1,
    priceSymbol: 'Free',
    status: 'Self-Guided Trail Active',
    statusClass: 'status-open',
    hiddenGemScore: 82,
    scores: { safety: 96, cleanliness: 95, value: 100, accessibility: 92, vibe: 89 },
    quote: '"Historic Romanesque Revival landmark. Point AR camera for 1910 printing press overlay."',
    address: '295 Lafayette St',
    pinIcon: '🏛️',
    pinClass: 'pin-heritage'
  },
  {
    id: 'v4',
    name: 'Synapse Cyber-Roastery & Fiber Hub',
    category: 'food',
    categoryLabel: 'Digital Nomad',
    lat: 40.7208,
    lng: -73.9982,
    priceTier: 2,
    priceSymbol: '$$',
    status: '850 Mbps Fiber Online',
    statusClass: 'status-open',
    hiddenGemScore: 89,
    scores: { safety: 95, cleanliness: 94, value: 91, accessibility: 98, vibe: 94 },
    quote: '"Cold brew poured on tap next to ergonomic standing desks with Gbps fiber."',
    address: '54 Grand Street',
    pinIcon: '⚡',
    pinClass: 'pin-food'
  },
  {
    id: 'v5',
    name: 'Wisteria Secret Zen Courtyard',
    category: 'hidden',
    categoryLabel: 'Hidden Gem',
    lat: 40.7188,
    lng: -73.9912,
    priceTier: 2,
    priceSymbol: '$$',
    status: 'Golden Hour Peak',
    statusClass: 'status-open',
    hiddenGemScore: 97,
    scores: { safety: 97, cleanliness: 98, value: 89, accessibility: 82, vibe: 98 },
    quote: '"Zero street noise. Lush Japanese maples and hand-whisked organic matcha."',
    address: '12 Division Street (Rear Courtyard)',
    pinIcon: '🌸',
    pinClass: 'pin-hidden'
  },
  {
    id: 'v6',
    name: 'Admiralty Executive Rooftop',
    category: 'food',
    categoryLabel: 'Professional Lounge',
    lat: 40.7135,
    lng: -74.0062,
    priceTier: 5,
    priceSymbol: '$$$$$',
    status: 'Acoustics: Low Noise (42dB)',
    statusClass: 'status-open',
    hiddenGemScore: 76,
    scores: { safety: 99, cleanliness: 99, value: 82, accessibility: 96, vibe: 91 },
    quote: '"Ideal for confidential negotiations with panoramic river horizons."',
    address: '88 Wall Street, 45th Floor',
    pinIcon: '💼',
    pinClass: 'pin-food'
  },
  {
    id: 'v7',
    name: 'Grand Station Night Market Cart',
    category: 'food',
    categoryLabel: '2 AM Eats',
    lat: 40.7165,
    lng: -73.9998,
    priceTier: 1,
    priceSymbol: '$',
    status: 'Packing Up in 35m',
    statusClass: 'status-closing',
    hiddenGemScore: 92,
    scores: { safety: 86, cleanliness: 89, value: 99, accessibility: 94, vibe: 95 },
    quote: '"Crisp hand-pinched scallion pancakes grilled fresh on a modified vintage bicycle cart."',
    address: 'Canal St & Mulberry St',
    pinIcon: '🥟',
    pinClass: 'pin-food'
  }
];

// Safety Incidents (Community Reported)
const INCIDENTS_DATA = [
  {
    id: 'inc1',
    type: 'Unlit Alleyway / Broken Lights',
    severity: 3,
    lat: 40.7225,
    lng: -73.9945,
    verified: true,
    time: '18m ago',
    icon: '💡'
  },
  {
    id: 'inc2',
    type: 'Subway Stair Construction Hazard',
    severity: 2,
    lat: 40.7195,
    lng: -73.9965,
    verified: true,
    time: '42m ago',
    icon: '🚧'
  }
];

// GeoJSON Coordinate Paths: [lng, lat]
const ROUTE_DATA = {
  safe: {
    name: 'Safest Illuminated Corridor',
    eta: '16 min',
    distance: '1.2 km',
    safetyScore: '96%',
    coordinates: [
      [-73.9892, 40.7282],
      [-73.9915, 40.7265],
      [-73.9954, 40.7248],
      [-73.9975, 40.7220],
      [-74.0005, 40.7180],
      [-74.0035, 40.7145],
      [-74.0062, 40.7135]
    ]
  },
  fast: {
    name: 'Fastest Direct Shortcut',
    eta: '11 min',
    distance: '0.9 km',
    safetyScore: '68% (Caution)',
    coordinates: [
      [-73.9892, 40.7282],
      [-73.9920, 40.7250],
      [-73.9945, 40.7225], // Passes through dark alley incident
      [-73.9965, 40.7195],
      [-74.0010, 40.7160],
      [-74.0062, 40.7135]
    ]
  }
};

// ============================================================================
// 4. Mapbox Theme Styles & AI Personas
// ============================================================================
const THEMES_CONFIG = {
  gaming: {
    id: 'gaming',
    name: 'Gaming',
    icon: '🎮',
    aiPersonaName: 'Game Master',
    aiSubtitle: 'Dungeon Master Mode',
    aiAvatar: '⚔️',
    mapboxStyle: 'mapbox://styles/mapbox/dark-v11',
    leafletTile: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    greeting: 'Greetings, Traveler! You are in Sector Manhattan. Multiple quests and rare culinary drops detected nearby. Ready to gain exploration XP?',
    responses: {
      dinner: '⚔️ [Quest Unlocked]: Head 300 paces south to Neon Tiger. High mana recovery, Level-4 Birria! Beware: dark alleyway at waypoint Kenmare.',
      safety: '🛡️ Safety Scan: Broadway corridor is heavily shielded with streetlights. Avoid shortcut alley Beta (-15 HP hazard penalty).',
      surprise: '🎲 [Randomized Quest]: Roll for Adventure! Destination: Puck Building Heritage Cache. +250 XP upon arrival!'
    }
  },
  aesthetic: {
    id: 'aesthetic',
    name: 'Aesthetic',
    icon: '🎀',
    aiPersonaName: 'City Muse',
    aiSubtitle: 'Poetic Curator',
    aiAvatar: '✨',
    mapboxStyle: 'mapbox://styles/mapbox/outdoors-v12',
    leafletTile: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    greeting: 'Welcome. Golden hour is painting the city rooftops in warm terracotta. May I guide you toward a quiet courtyard or an artisanal coffee sanctuary?',
    responses: {
      dinner: '✨ A gentle recommendation: tucked away in Division St is a secret wisteria courtyard where matcha is hand-whisked. The acoustics are pure tranquility.',
      safety: '🌿 The cobblestones along Lafayette are soft and well-patrolled tonight. You can stroll peacefully with zero hurry.',
      surprise: '🌸 I have composed an evening reverie for you: begin at the Victorian facade, follow the wisteria scent, and end by the river under the first stars.'
    }
  },
  minimalist: {
    id: 'minimalist',
    name: 'Minimalist',
    icon: '🤍',
    aiPersonaName: 'The Synthesizer',
    aiSubtitle: 'Data Direct',
    aiAvatar: '■',
    mapboxStyle: 'mapbox://styles/mapbox/light-v11',
    leafletTile: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    greeting: 'System ready. Essential urban metrics available. Awaiting single-point query.',
    responses: {
      dinner: '• Option 1: Neon Tiger (320m). Safety: 88%. Open to 03:30. Price: $.\n• Option 2: Synapse Roastery (480m). Safety: 95%. Fast Wi-Fi.',
      safety: 'Illuminated corridor: Route A (16 min, 96% safety index). Direct shortcut: Route B (11 min, 68% index, unlit hazard).',
      surprise: 'Plan synthesized: Point A [Puck Building] -> Point B [Synapse Coffee]. Distance: 850m. Elevation change: 2m.'
    }
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    icon: '💼',
    aiPersonaName: 'Executive Concierge',
    aiSubtitle: 'Corporate GIS Advisory',
    aiAvatar: '📊',
    mapboxStyle: 'mapbox://styles/mapbox/navigation-day-v1',
    leafletTile: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    greeting: 'Good afternoon. Municipal transit index is operating at 94% efficiency. Safety corridors to Financial District are currently optimal.',
    responses: {
      dinner: 'For executive discussions, Admiralty Rooftop on Wall St provides 42dB quiet acoustics and verified private seating. High recommendation.',
      safety: 'The Financial District and Broadway arterials exhibit negligible incident rates (98.2% safety probability). Depart by 19:30 to avoid congestion.',
      surprise: 'Calculated itinerary: Rapid stop at Lafayette landmark followed by executive lounge arrival. Commute ROI: 14 mins conserved.'
    }
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    icon: '⚡',
    aiPersonaName: 'AURA-7',
    aiSubtitle: 'Synthetic Cyber-Intel',
    aiAvatar: '🤖',
    mapboxStyle: 'mapbox://styles/mapbox/dark-v11',
    leafletTile: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    greeting: 'AURA-7 online. Neural satellite uplink confirmed. Scanning city frequency spectrum for bandwidth anomalies and darknet corridors.',
    responses: {
      dinner: '⚡ Target acquired: Synapse Roastery at grid [40.720, -73.998]. 850 Mbps optic stream. High-caffeine fuel confirmed.',
      safety: '⚠️ Tactical warning: Sector Kenmare displays 1 photon failure (broken streetlamp). Engage illuminated arterial corridor Alpha.',
      surprise: '⚡ Executing cyber-itinerary: Infiltrate Puck Heritage archive, recharge at Synapse terminal, synthesize midnight tacos. Guidance locked.'
    }
  }
};

// ============================================================================
// 5. Application Bootstrapping
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  await loadServerConfig();
  initGoogleIdentity();
  initWeatherPulse();
  initMapSystem();
  initAuthUI();
  initHUDInteractions();
  initEscortSimulation();
});

// ============================================================================
// 6. Server Config Loader (Safe Public Keys)
// ============================================================================
async function loadServerConfig() {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      if (data.google_client_id) SplyConfig.googleClientId = data.google_client_id;
      if (data.mapbox_token) SplyConfig.mapboxToken = data.mapbox_token;
      console.log('✅ SplyGo configuration loaded from backend API.');
    }
  } catch (err) {
    console.warn('Backend /api/config unavailable, using local client constants:', err);
  }
}

// ============================================================================
// 7. Google Identity Services (GSI) Authentication Integration
// ============================================================================
function initGoogleIdentity() {
  renderAuthState();

  // Check if Google GSI SDK is loaded on page
  const tryInitGSI = () => {
    if (window.google && google.accounts && google.accounts.id) {
      const isPlaceholder = !SplyConfig.googleClientId || SplyConfig.googleClientId.includes('your_client_id');
      
      if (!isPlaceholder) {
        google.accounts.id.initialize({
          client_id: SplyConfig.googleClientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });

        // Render official Google button into the container
        const btnContainer = document.getElementById('gsiButtonContainer');
        if (btnContainer) {
          btnContainer.innerHTML = '';
          google.accounts.id.renderButton(btnContainer, {
            theme: 'filled_black',
            size: 'large',
            shape: 'pill',
            width: 320,
            text: 'continue_with'
          });
          // Hide fallback button if real GSI button rendered
          const fallbackBtn = document.getElementById('googleAuthBtn');
          if (fallbackBtn) fallbackBtn.style.display = 'none';
        }
      }
    }
  };

  // Attempt immediately or wait for script load
  if (window.google) {
    tryInitGSI();
  } else {
    window.addEventListener('load', tryInitGSI);
  }
}

/**
 * Handles the JWT credential response returned by Google Identity Services
 * Decodes the base64 payload to extract user's profile details.
 */
function handleCredentialResponse(response) {
  if (!response || !response.credential) {
    showToast('Google Sign-In response did not contain credentials.');
    return;
  }

  const payload = parseJwt(response.credential);
  if (!payload) {
    showToast('Failed to parse Google Identity credential.');
    return;
  }

  // Extract verified profile attributes
  const user = {
    id: payload.sub,
    name: payload.name || 'Urban Explorer',
    email: payload.email,
    avatar: payload.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    method: 'google',
    level: 14,
    safetyScore: 99
  };

  SplyState.user = user;
  localStorage.setItem('splygo_user', JSON.stringify(user));
  renderAuthState();
  closeModal('authModal');
  showToast(`Welcome back, ${user.name}! Authenticated with Google.`);
}

/**
 * Standard client-side JWT decoder for Google Identity tokens
 */
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error decoding JWT token:', e);
    return null;
  }
}

function initAuthUI() {
  // User profile pill click opens modal
  const userPill = document.getElementById('userProfilePill');
  if (userPill) userPill.addEventListener('click', () => openAuthModal());

  // Fallback Google Sign-In button click
  const googleBtn = document.getElementById('googleAuthBtn');
  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      simulateGoogleSignIn();
    });
  }

  // Email form submit
  const emailForm = document.getElementById('emailAuthForm');
  if (emailForm) {
    emailForm.addEventListener('submit', (e) => {
      e.preventDefault();
      simulateEmailSignIn();
    });
  }

  // Sign out button
  const signOutBtn = document.getElementById('signOutBtn');
  if (signOutBtn) signOutBtn.addEventListener('click', () => signOut());
}

function renderAuthState() {
  const userPill = document.getElementById('userProfilePill');
  const modalLoggedOut = document.getElementById('authLoggedOutView');
  const modalLoggedIn = document.getElementById('authLoggedInView');

  if (SplyState.user) {
    // Logged In State
    userPill.innerHTML = `
      <img src="${SplyState.user.avatar}" alt="Avatar" class="user-avatar-img">
      <div class="user-pill-info">
        <span class="user-pill-name">${SplyState.user.name}</span>
        <span class="user-pill-status">LVL ${SplyState.user.level || 14} • ${SplyState.user.method.toUpperCase()}</span>
      </div>
    `;

    if (modalLoggedOut) modalLoggedOut.style.display = 'none';
    if (modalLoggedIn) {
      modalLoggedIn.style.display = 'block';
      document.getElementById('profileAvatarImg').src = SplyState.user.avatar;
      document.getElementById('profileNameText').textContent = SplyState.user.name;
      document.getElementById('profileEmailText').textContent = SplyState.user.email;
      document.getElementById('profileMethodBadge').textContent = `Authenticated via ${SplyState.user.method === 'google' ? 'Google OAuth 2.0 (GSI)' : 'Email / Password'}`;
    }
  } else {
    // Guest State
    userPill.innerHTML = `
      <div class="user-avatar-img" style="background:#444; display:flex; align-items:center; justify-content:center; color:#fff; font-size:12px;">👤</div>
      <div class="user-pill-info">
        <span class="user-pill-name">Guest Explorer</span>
        <span class="user-pill-status" style="color:var(--sply-text-muted)">TAP TO SIGN IN</span>
      </div>
    `;

    if (modalLoggedOut) modalLoggedOut.style.display = 'block';
    if (modalLoggedIn) modalLoggedIn.style.display = 'none';
  }
}

function simulateGoogleSignIn() {
  // If user clicks the manual button while client ID is still placeholder:
  const isPlaceholder = !SplyConfig.googleClientId || SplyConfig.googleClientId.includes('your_client_id');
  if (isPlaceholder) {
    showToast('Tip: Set GOOGLE_CLIENT_ID in .env for production Google Identity.');
  }

  const btn = document.getElementById('googleAuthBtn');
  btn.innerHTML = `Connecting Google Identity...`;

  setTimeout(() => {
    const user = {
      name: 'Alex Rivera',
      email: 'alex.rivera.urban@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
      method: 'google',
      level: 14,
      safetyScore: 99
    };
    SplyState.user = user;
    localStorage.setItem('splygo_user', JSON.stringify(user));
    renderAuthState();
    closeModal('authModal');
    showToast('Signed in successfully with Google Account!');
    btn.innerHTML = `<svg class="google-icon-svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg> Sign in with Google`;
  }, 600);
}

function simulateEmailSignIn() {
  const emailInput = document.getElementById('authEmail').value || 'traveler@splygo.com';
  const namePart = emailInput.split('@')[0];
  const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

  const emailUser = {
    name: formattedName,
    email: emailInput,
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
    method: 'email',
    level: 5,
    safetyScore: 92
  };
  SplyState.user = emailUser;
  localStorage.setItem('splygo_user', JSON.stringify(emailUser));
  renderAuthState();
  closeModal('authModal');
  showToast(`Welcome back, ${formattedName}!`);
}

function signOut() {
  // Revoke GSI auto-select
  if (window.google && google.accounts && google.accounts.id) {
    try {
      google.accounts.id.disableAutoSelect();
    } catch (e) {
      // ignore
    }
  }

  SplyState.user = null;
  localStorage.removeItem('splygo_user');
  renderAuthState();
  closeModal('authModal');
  showToast('You have signed out. Browsing as Guest.');
}

function openAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.add('open');
}

// ============================================================================
// 8. OpenWeatherMap Integration (Backend Proxy)
// ============================================================================
async function initWeatherPulse() {
  // Center coordinate of downtown Manhattan
  const defaultLat = 40.7235;
  const defaultLon = -73.9940;
  await fetchWeather(defaultLat, defaultLon);

  // Periodically refresh weather every 10 minutes
  setInterval(() => {
    fetchWeather(defaultLat, defaultLon);
  }, 10 * 60 * 1000);
}

/**
 * Calls backend /api/weather proxy to securely query OpenWeatherMap
 */
async function fetchWeather(lat, lon) {
  const badge = document.getElementById('headerWeatherBadge');
  const textEl = document.getElementById('weatherText');
  const iconEl = document.getElementById('weatherIcon');

  try {
    const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}&units=imperial`);
    if (response.ok) {
      const data = await response.json();
      SplyState.weather = data;

      // Update Header Display
      textEl.textContent = `${data.temp}°F ${data.condition}`;
      iconEl.textContent = getWeatherEmoji(data.icon, data.condition);
      badge.title = `${data.city}: ${data.description} • Feels like ${data.feels_like}°F (${data.source === 'live' ? 'Live OpenWeatherMap' : 'Simulated Radar'})`;
    }
  } catch (error) {
    console.warn('Weather fetch failed, retaining cached or default status:', error);
  }
}

function getWeatherEmoji(iconCode, condition) {
  const cond = (condition || '').toLowerCase();
  if (cond.includes('rain') || cond.includes('drizzle')) return '🌧️';
  if (cond.includes('cloud')) return '⛅';
  if (cond.includes('snow')) return '❄️';
  if (cond.includes('thunder')) return '⛈️';
  if (cond.includes('fog') || cond.includes('mist')) return '🌫️';
  if (iconCode && iconCode.includes('n')) return '🌙';
  return '☀️';
}

// ============================================================================
// 9. Map System (Mapbox GL JS with Theme Styles & Fallback)
// ============================================================================
function initMapSystem() {
  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;

  const defaultCenter = [-73.9940, 40.7235]; // NYC [lng, lat]
  const defaultZoom = 14;

  const hasMapboxLib = (typeof window.mapboxgl !== 'undefined');
  const token = SplyConfig.mapboxToken;
  const isRealMapboxToken = token && !token.includes('your_mapbox') && token.startsWith('pk.');

  if (hasMapboxLib && isRealMapboxToken) {
    // -------------------------------------------------------------
    // Preferred Path: Mapbox GL JS Vector Cartography
    // -------------------------------------------------------------
    SplyState.mapEngine = 'mapbox';
    mapboxgl.accessToken = token;

    const themeConfig = THEMES_CONFIG[SplyState.currentTheme] || THEMES_CONFIG.gaming;

    SplyState.mapboxMap = new mapboxgl.Map({
      container: 'map',
      style: themeConfig.mapboxStyle,
      center: defaultCenter,
      zoom: defaultZoom,
      attributionControl: false
    });

    // Add Navigation Controls
    SplyState.mapboxMap.addControl(new mapboxgl.NavigationControl(), 'top-right');

    SplyState.mapboxMap.on('load', () => {
      renderMapboxLayers();
      renderVenueMarkers();
    });

    // Weather trigger on pan/zoom end
    SplyState.mapboxMap.on('moveend', () => {
      const center = SplyState.mapboxMap.getCenter();
      fetchWeather(center.lat, center.lng);
    });

    console.log('🗺️ Mapbox GL JS engine initialized.');
  } else {
    // -------------------------------------------------------------
    // Resilient Fallback: Leaflet GIS Cartography (No Token Required)
    // -------------------------------------------------------------
    SplyState.mapEngine = 'leaflet';
    initLeafletFallback(defaultCenter, defaultZoom);

    // Display a subtle non-blocking notice for the developer
    showMapboxNotice();
  }
}

function showMapboxNotice() {
  const mapContainer = document.querySelector('.sply-viewport');
  if (!mapContainer || document.getElementById('mapboxNotice')) return;

  const notice = document.createElement('div');
  notice.id = 'mapboxNotice';
  notice.className = 'mapbox-token-notice';
  notice.innerHTML = `
    <span>🗺️ Active: Leaflet GIS Mode. Add your <strong>MAPBOX_TOKEN</strong> in <code>.env</code> to activate Mapbox 3D vector tiles.</span>
    <button onclick="this.parentElement.remove()" style="background:none; border:none; color:#bbb; cursor:pointer;">✕</button>
  `;
  mapContainer.appendChild(notice);
}

function initLeafletFallback(center, zoom) {
  if (typeof L === 'undefined') return;

  SplyState.leafletMap = L.map('map', {
    center: [center[1], center[0]], // Leaflet is [lat, lng]
    zoom: zoom,
    zoomControl: false,
    attributionControl: false
  });

  L.control.zoom({ position: 'topright' }).addTo(SplyState.leafletMap);
  updateLeafletTiles(SplyState.currentTheme);
  renderLeafletLayers();
  renderVenueMarkers();

  SplyState.leafletMap.on('moveend', () => {
    const c = SplyState.leafletMap.getCenter();
    fetchWeather(c.lat, c.lng);
  });
}

function updateLeafletTiles(themeId) {
  if (!SplyState.leafletMap) return;
  const config = THEMES_CONFIG[themeId] || THEMES_CONFIG.gaming;
  if (SplyState.leafletTileLayer) {
    SplyState.leafletMap.removeLayer(SplyState.leafletTileLayer);
  }
  SplyState.leafletTileLayer = L.tileLayer(config.leafletTile, {
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(SplyState.leafletMap);
}

// ----------------------------------------------------------------------------
// Mapbox Layers: Safe & Fastest Routes + Safety Heatmap
// ----------------------------------------------------------------------------
function renderMapboxLayers() {
  const map = SplyState.mapboxMap;
  if (!map) return;

  // 1. Routes GeoJSON Source
  const routesGeoJSON = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { id: 'safe', name: 'Safest Illuminated Corridor' },
        geometry: { type: 'LineString', coordinates: ROUTE_DATA.safe.coordinates }
      },
      {
        type: 'Feature',
        properties: { id: 'fast', name: 'Fastest Direct Shortcut' },
        geometry: { type: 'LineString', coordinates: ROUTE_DATA.fast.coordinates }
      }
    ]
  };

  if (!map.getSource('sply-routes')) {
    map.addSource('sply-routes', { type: 'geojson', data: routesGeoJSON });

    // Safe Route Layer (Green Glow)
    map.addLayer({
      id: 'route-safe-glow',
      type: 'line',
      source: 'sply-routes',
      filter: ['==', 'id', 'safe'],
      paint: {
        'line-color': '#39ff14',
        'line-width': SplyState.activeRoute === 'safe' ? 8 : 3,
        'line-opacity': SplyState.activeRoute === 'safe' ? 0.95 : 0.25,
        'line-blur': 1
      }
    });

    // Fastest Route Layer (Amber Warning)
    map.addLayer({
      id: 'route-fast-line',
      type: 'line',
      source: 'sply-routes',
      filter: ['==', 'id', 'fast'],
      paint: {
        'line-color': '#ff9f43',
        'line-width': SplyState.activeRoute === 'fast' ? 7 : 3,
        'line-opacity': SplyState.activeRoute === 'fast' ? 0.95 : 0.25,
        'line-dasharray': [2, 2]
      }
    });
  } else {
    map.getSource('sply-routes').setData(routesGeoJSON);
    updateMapboxRouteActiveState();
  }

  // 2. Safety Heatmap GeoJSON Source
  const heatmapGeoJSON = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { type: 'safe', color: '#39ff14' },
        geometry: { type: 'Point', coordinates: [-73.9930, 40.7250] }
      },
      {
        type: 'Feature',
        properties: { type: 'safe', color: '#00f0ff' },
        geometry: { type: 'Point', coordinates: [-74.0050, 40.7140] }
      },
      {
        type: 'Feature',
        properties: { type: 'caution', color: '#ff9f43' },
        geometry: { type: 'Point', coordinates: [-73.9945, 40.7225] }
      }
    ]
  };

  if (!map.getSource('sply-heatmap')) {
    map.addSource('sply-heatmap', { type: 'geojson', data: heatmapGeoJSON });

    map.addLayer({
      id: 'heatmap-circles',
      type: 'circle',
      source: 'sply-heatmap',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 40, 16, 120],
        'circle-color': ['get', 'color'],
        'circle-opacity': SplyState.showHeatmap ? 0.18 : 0,
        'circle-stroke-width': SplyState.showHeatmap ? 1.5 : 0,
        'circle-stroke-color': ['get', 'color'],
        'circle-stroke-opacity': SplyState.showHeatmap ? 0.6 : 0
      }
    });
  } else {
    map.setLayoutProperty('heatmap-circles', 'visibility', SplyState.showHeatmap ? 'visible' : 'none');
  }
}

function updateMapboxRouteActiveState() {
  const map = SplyState.mapboxMap;
  if (!map || !map.getLayer('route-safe-glow')) return;

  map.setPaintProperty('route-safe-glow', 'line-width', SplyState.activeRoute === 'safe' ? 8 : 3);
  map.setPaintProperty('route-safe-glow', 'line-opacity', SplyState.activeRoute === 'safe' ? 0.95 : 0.25);

  map.setPaintProperty('route-fast-line', 'line-width', SplyState.activeRoute === 'fast' ? 7 : 3);
  map.setPaintProperty('route-fast-line', 'line-opacity', SplyState.activeRoute === 'fast' ? 0.95 : 0.25);
}

// ----------------------------------------------------------------------------
// Leaflet Fallback Layers
// ----------------------------------------------------------------------------
let leafletRouteSafe = null;
let leafletRouteFast = null;
let leafletHeatmapCircles = [];

function renderLeafletLayers() {
  const map = SplyState.leafletMap;
  if (!map) return;

  // Clear existing
  if (leafletRouteSafe) map.removeLayer(leafletRouteSafe);
  if (leafletRouteFast) map.removeLayer(leafletRouteFast);
  leafletHeatmapCircles.forEach(c => map.removeLayer(c));
  leafletHeatmapCircles = [];

  // Convert [lng, lat] to Leaflet [lat, lng]
  const safeCoords = ROUTE_DATA.safe.coordinates.map(pt => [pt[1], pt[0]]);
  const fastCoords = ROUTE_DATA.fast.coordinates.map(pt => [pt[1], pt[0]]);

  leafletRouteSafe = L.polyline(safeCoords, {
    color: SplyState.activeRoute === 'safe' ? '#39ff14' : 'rgba(57, 255, 20, 0.25)',
    weight: SplyState.activeRoute === 'safe' ? 6 : 3
  }).addTo(map);

  leafletRouteFast = L.polyline(fastCoords, {
    color: SplyState.activeRoute === 'fast' ? '#ff9f43' : 'rgba(255, 159, 67, 0.25)',
    weight: SplyState.activeRoute === 'fast' ? 6 : 3,
    dashArray: '4, 8'
  }).addTo(map);

  if (SplyState.showHeatmap) {
    const c1 = L.circle([40.7250, -73.9930], { color: '#39ff14', fillOpacity: 0.14, radius: 320, weight: 1 }).addTo(map);
    const c2 = L.circle([40.7140, -74.0050], { color: '#00f0ff', fillOpacity: 0.14, radius: 280, weight: 1 }).addTo(map);
    const c3 = L.circle([40.7225, -73.9945], { color: '#ff9f43', fillOpacity: 0.18, radius: 180, weight: 1 }).addTo(map);
    leafletHeatmapCircles.push(c1, c2, c3);
  }
}

// ----------------------------------------------------------------------------
// Venue & Hazard Marker Placement (Custom HTML Elements)
// ----------------------------------------------------------------------------
function renderVenueMarkers() {
  // Clear old markers
  SplyState.markers.forEach(m => {
    if (m.remove) m.remove();
  });
  SplyState.markers = [];

  const filteredVenues = VENUES_DATA.filter(v => {
    const matchCategory = (SplyState.activeCategory === 'all' || v.category === SplyState.activeCategory);
    const matchBudget = (v.priceTier <= SplyState.maxBudget);
    return matchCategory && matchBudget;
  });

  filteredVenues.forEach(venue => {
    const pinEl = document.createElement('div');
    pinEl.className = `sply-custom-pin ${venue.pinClass}`;
    pinEl.innerHTML = venue.pinIcon;
    pinEl.title = `${venue.name} (${venue.priceSymbol})`;

    pinEl.addEventListener('click', () => {
      openVenueDetails(venue);
    });

    if (SplyState.mapEngine === 'mapbox' && SplyState.mapboxMap) {
      const marker = new mapboxgl.Marker({ element: pinEl })
        .setLngLat([venue.lng, venue.lat])
        .addTo(SplyState.mapboxMap);
      SplyState.markers.push(marker);
    } else if (SplyState.leafletMap) {
      const customIcon = L.divIcon({
        html: pinEl.outerHTML,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      const marker = L.marker([venue.lat, venue.lng], { icon: customIcon }).addTo(SplyState.leafletMap);
      marker.on('click', () => openVenueDetails(venue));
      SplyState.markers.push(marker);
    }
  });

  // Incident markers
  if (SplyState.activeCategory === 'all' || SplyState.activeCategory === 'safety') {
    INCIDENTS_DATA.forEach(inc => {
      const incEl = document.createElement('div');
      incEl.className = 'sply-custom-pin pin-hazard';
      incEl.innerHTML = inc.icon;
      incEl.title = `${inc.type} • ${inc.time}`;

      if (SplyState.mapEngine === 'mapbox' && SplyState.mapboxMap) {
        const popup = new mapboxgl.Popup({ offset: 20 })
          .setHTML(`<strong>${inc.type}</strong><br>Reported ${inc.time} • Severity ${inc.severity}/5`);
        const marker = new mapboxgl.Marker({ element: incEl })
          .setLngLat([inc.lng, inc.lat])
          .setPopup(popup)
          .addTo(SplyState.mapboxMap);
        SplyState.markers.push(marker);
      } else if (SplyState.leafletMap) {
        const customIcon = L.divIcon({
          html: incEl.outerHTML,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });
        const marker = L.marker([inc.lat, inc.lng], { icon: customIcon }).addTo(SplyState.leafletMap);
        marker.bindPopup(`<strong>${inc.type}</strong><br>Reported ${inc.time} • Severity ${inc.severity}/5`);
        SplyState.markers.push(marker);
      }
    });
  }
}

// ============================================================================
// 10. Theme Engine & Hot-Swapper
// ============================================================================
function initTheme() {
  setTheme(SplyState.currentTheme, false);

  const themeButtons = document.querySelectorAll('.theme-pill-btn');
  themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const themeId = btn.getAttribute('data-theme');
      setTheme(themeId, true);
    });
  });
}

function setTheme(themeId, triggerAudio = true) {
  if (!THEMES_CONFIG[themeId]) themeId = 'gaming';
  SplyState.currentTheme = themeId;
  localStorage.setItem('splygo_theme', themeId);

  // Update Body CSS Token Class
  document.body.className = `theme-${themeId}`;

  // Update Active Navigation Pill
  document.querySelectorAll('.theme-pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-theme') === themeId);
  });

  // Switch Mapbox GL Style or Leaflet Tiles
  if (SplyState.mapEngine === 'mapbox' && SplyState.mapboxMap) {
    const config = THEMES_CONFIG[themeId];
    SplyState.mapboxMap.setStyle(config.mapboxStyle);
    SplyState.mapboxMap.once('style.load', () => {
      renderMapboxLayers();
      renderVenueMarkers();
    });
  } else if (SplyState.leafletMap) {
    updateLeafletTiles(themeId);
    renderLeafletLayers();
  }

  // Update AI Persona & Audio
  updateAIPersona(themeId);
  if (triggerAudio) playThemeChime(themeId);
}

function updateAIPersona(themeId) {
  const config = THEMES_CONFIG[themeId];
  const avatarEl = document.getElementById('aiAvatar');
  const nameEl = document.getElementById('aiPersonaName');
  const subtitleEl = document.getElementById('aiPersonaSubtitle');
  const chatBodyEl = document.getElementById('aiChatBody');

  if (avatarEl) avatarEl.textContent = config.aiAvatar;
  if (nameEl) nameEl.textContent = config.aiPersonaName;
  if (subtitleEl) subtitleEl.textContent = config.aiSubtitle;

  if (chatBodyEl) {
    chatBodyEl.innerHTML = `
      <div class="ai-msg ai-msg-bot">
        <strong>${config.aiPersonaName}:</strong> ${config.greeting}
      </div>
    `;
  }
}

function playThemeChime(themeId) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (themeId === 'gaming') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (themeId === 'aesthetic') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (themeId === 'cyberpunk') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    }
  } catch (e) {
    // Audio Context blocked or not allowed
  }
}

// ============================================================================
// 11. Venue Details Slide-Out Drawer
// ============================================================================
function openVenueDetails(venue) {
  SplyState.selectedVenue = venue;
  const sheet = document.getElementById('venueDetailSheet');

  document.getElementById('sheetVenueName').textContent = venue.name;
  document.getElementById('sheetCategory').textContent = `${venue.categoryLabel} • ${venue.priceSymbol}`;
  document.getElementById('sheetStatus').textContent = venue.status;
  document.getElementById('sheetStatus').className = `sheet-status-tag ${venue.statusClass}`;
  document.getElementById('sheetQuote').textContent = venue.quote;
  document.getElementById('sheetAddress').textContent = venue.address;

  // 5 Radar/Bar Indices
  document.getElementById('scoreSafety').textContent = `${venue.scores.safety}%`;
  document.getElementById('scoreCleanliness').textContent = `${venue.scores.cleanliness}%`;
  document.getElementById('scoreValue').textContent = `${venue.scores.value}%`;
  document.getElementById('scoreAccessibility').textContent = `${venue.scores.accessibility}%`;
  document.getElementById('scoreVibe').textContent = `${venue.scores.vibe}%`;

  sheet.classList.add('open');

  // Center Map Viewport
  if (SplyState.mapEngine === 'mapbox' && SplyState.mapboxMap) {
    SplyState.mapboxMap.flyTo({ center: [venue.lng, venue.lat], zoom: 15.5, speed: 1.2 });
  } else if (SplyState.leafletMap) {
    SplyState.leafletMap.panTo([venue.lat, venue.lng]);
  }

  // Update weather for venue coordinate
  fetchWeather(venue.lat, venue.lng);
}

function closeVenueDetails() {
  const sheet = document.getElementById('venueDetailSheet');
  if (sheet) sheet.classList.remove('open');
}

// ============================================================================
// 12. HUD Interactions & Filtering
// ============================================================================
function initHUDInteractions() {
  // Category Chips
  document.querySelectorAll('.cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      SplyState.activeCategory = chip.getAttribute('data-cat');
      renderVenueMarkers();
    });
  });

  // Budget Slider
  const budgetSlider = document.getElementById('budgetSlider');
  const budgetBadge = document.getElementById('budgetValueBadge');
  if (budgetSlider) {
    budgetSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      SplyState.maxBudget = val;
      const symbols = ['$', '$$', '$$$', '$$$$', '$$$$$'];
      budgetBadge.textContent = symbols[val - 1];
      renderVenueMarkers();
    });
  }

  // Safety Heatmap Toggle
  const heatmapBtn = document.getElementById('toggleHeatmapBtn');
  if (heatmapBtn) {
    heatmapBtn.addEventListener('click', () => {
      SplyState.showHeatmap = !SplyState.showHeatmap;
      heatmapBtn.classList.toggle('active', SplyState.showHeatmap);
      if (SplyState.mapEngine === 'mapbox') {
        renderMapboxLayers();
      } else {
        renderLeafletLayers();
      }
    });
  }

  // Route selector cards
  document.getElementById('routeSafeCard').addEventListener('click', () => setActiveRoute('safe'));
  document.getElementById('routeFastCard').addEventListener('click', () => setActiveRoute('fast'));

  // Search input filter
  const searchInput = document.getElementById('hudSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      SplyState.markers.forEach((m, idx) => {
        const v = VENUES_DATA[idx];
        if (v) {
          const match = v.name.toLowerCase().includes(query) || v.categoryLabel.toLowerCase().includes(query);
          if (m.getElement) {
            m.getElement().style.display = match ? 'flex' : 'none';
          } else if (m.setOpacity) {
            m.setOpacity(match ? 1 : 0.15);
          }
        }
      });
    });
  }

  // "Surprise Me" Itinerary Generator
  const surpriseBtn = document.getElementById('surpriseMeBtn');
  if (surpriseBtn) {
    surpriseBtn.addEventListener('click', () => triggerSurpriseItinerary());
  }

  // AI Chat Send & Prompt Chips
  const aiSendBtn = document.getElementById('aiSendBtn');
  const aiInput = document.getElementById('aiChatInput');
  if (aiSendBtn && aiInput) {
    const handleSend = () => {
      const text = aiInput.value.trim();
      if (!text) return;
      addUserMessage(text);
      aiInput.value = '';
      respondAsPersona(text);
    };

    aiSendBtn.addEventListener('click', handleSend);
    aiInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSend();
    });
  }

  document.querySelectorAll('.ai-chip-prompt').forEach(chip => {
    chip.addEventListener('click', () => {
      const promptText = chip.getAttribute('data-prompt');
      addUserMessage(promptText);
      respondAsPersona(promptText);
    });
  });

  // Incident reporting modal
  const reportBtn = document.getElementById('reportIncidentBtn');
  if (reportBtn) {
    reportBtn.addEventListener('click', () => {
      document.getElementById('incidentModal').classList.add('open');
    });
  }

  const incidentForm = document.getElementById('incidentForm');
  if (incidentForm) {
    incidentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const type = document.getElementById('incidentType').value;
      
      let centerLat = 40.7235;
      let centerLng = -73.9940;
      if (SplyState.mapEngine === 'mapbox' && SplyState.mapboxMap) {
        const c = SplyState.mapboxMap.getCenter();
        centerLat = c.lat;
        centerLng = c.lng;
      } else if (SplyState.leafletMap) {
        const c = SplyState.leafletMap.getCenter();
        centerLat = c.lat;
        centerLng = c.lng;
      }

      INCIDENTS_DATA.push({
        id: 'inc_' + Date.now(),
        type: type,
        severity: 3,
        lat: centerLat,
        lng: centerLng,
        verified: true,
        time: 'Just now',
        icon: '⚠️'
      });
      renderVenueMarkers();
      closeModal('incidentModal');
      showToast('Incident reported and pinned to community map!');
    });
  }
}

function setActiveRoute(mode) {
  SplyState.activeRoute = mode;
  document.getElementById('routeSafeCard').classList.toggle('active', mode === 'safe');
  document.getElementById('routeFastCard').classList.toggle('active', mode === 'fast');

  if (SplyState.mapEngine === 'mapbox') {
    updateMapboxRouteActiveState();
    const coords = ROUTE_DATA[mode].coordinates;
    const bounds = coords.reduce((b, coord) => b.extend(coord), new mapboxgl.LngLatBounds(coords[0], coords[0]));
    SplyState.mapboxMap.fitBounds(bounds, { padding: 60 });
  } else if (SplyState.leafletMap) {
    renderLeafletLayers();
    const path = ROUTE_DATA[mode].coordinates.map(pt => [pt[1], pt[0]]);
    SplyState.leafletMap.fitBounds(L.polyline(path).getBounds(), { padding: [50, 50] });
  }
}

function addUserMessage(text) {
  const chatBody = document.getElementById('aiChatBody');
  const msg = document.createElement('div');
  msg.className = 'ai-msg ai-msg-user';
  msg.textContent = text;
  chatBody.appendChild(msg);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function respondAsPersona(query) {
  const chatBody = document.getElementById('aiChatBody');
  const theme = THEMES_CONFIG[SplyState.currentTheme];

  setTimeout(() => {
    let reply = '';
    const q = query.toLowerCase();
    if (q.includes('eat') || q.includes('dinner') || q.includes('food')) {
      reply = theme.responses.dinner;
    } else if (q.includes('safe') || q.includes('walk') || q.includes('security')) {
      reply = theme.responses.safety;
    } else if (q.includes('surprise') || q.includes('itinerary')) {
      reply = theme.responses.surprise;
    } else {
      reply = `[${theme.aiPersonaName}]: Perimeter scanned. Weather is ${SplyState.weather ? SplyState.weather.temp + '°F ' + SplyState.weather.condition : 'optimal'}. Head towards the illuminated Safe Route!`;
    }

    const botMsg = document.createElement('div');
    botMsg.className = 'ai-msg ai-msg-bot';
    botMsg.innerHTML = `<strong>${theme.aiPersonaName}:</strong> ${reply.replace(/\n/g, '<br>')}`;
    chatBody.appendChild(botMsg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }, 350);
}

function triggerSurpriseItinerary() {
  const randomVenue = VENUES_DATA[Math.floor(Math.random() * VENUES_DATA.length)];
  openVenueDetails(randomVenue);
  showToast(`🎲 Surprise Itinerary generated: ${randomVenue.name}!`);

  const chatBody = document.getElementById('aiChatBody');
  if (chatBody) {
    const theme = THEMES_CONFIG[SplyState.currentTheme];
    const botMsg = document.createElement('div');
    botMsg.className = 'ai-msg ai-msg-bot';
    botMsg.innerHTML = `<strong>${theme.aiPersonaName}:</strong> ✨ Surprise Itinerary locked! Waypoint set to <em>${randomVenue.name}</em> (${randomVenue.priceSymbol}). Enjoy!`;
    chatBody.appendChild(botMsg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }
}

// ============================================================================
// 13. "Walk with Me" Active Escort Simulation
// ============================================================================
function initEscortSimulation() {
  const escortToggle = document.getElementById('toggleEscortBtn');
  const escortIcon = document.getElementById('escortPulseIcon');
  const escortStatusText = document.getElementById('escortStatusText');

  if (escortToggle) {
    escortToggle.addEventListener('click', () => {
      SplyState.escortActive = !SplyState.escortActive;
      if (SplyState.escortActive) {
        escortToggle.textContent = 'Armed (Active)';
        escortToggle.classList.add('sply-btn-danger');
        escortIcon.classList.add('active-pulse');
        escortStatusText.textContent = 'Active check-in every 45s';
        startEscortTimer();
        showToast('🛡️ Walk with Me escort armed. Emergency contacts on standby.');
      } else {
        stopEscortTimer();
        escortToggle.textContent = 'Arm Escort';
        escortToggle.classList.remove('sply-btn-danger');
        escortIcon.classList.remove('active-pulse');
        escortStatusText.textContent = 'Standby mode';
        showToast('Walk with Me companion disarmed.');
      }
    });
  }

  const safeConfirmBtn = document.getElementById('confirmSafeBtn');
  if (safeConfirmBtn) {
    safeConfirmBtn.addEventListener('click', () => {
      SplyState.escortSecondsLeft = 45;
      closeModal('escortCheckinModal');
      showToast('Check-in confirmed! You are safe.');
    });
  }
}

function startEscortTimer() {
  SplyState.escortSecondsLeft = 30; // 30s demonstration interval
  clearInterval(SplyState.escortTimer);
  SplyState.escortTimer = setInterval(() => {
    SplyState.escortSecondsLeft--;
    if (SplyState.escortSecondsLeft <= 0) {
      clearInterval(SplyState.escortTimer);
      const modal = document.getElementById('escortCheckinModal');
      if (modal) modal.classList.add('open');
    }
  }, 1000);
}

function stopEscortTimer() {
  clearInterval(SplyState.escortTimer);
}

// ============================================================================
// 14. Utilities & Toast Notifications
// ============================================================================
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
}

function showToast(message) {
  let toast = document.getElementById('splyToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'splyToast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--sply-surface);
      color: var(--sply-text);
      border: 1px solid var(--sply-primary);
      box-shadow: var(--sply-glow);
      padding: 12px 18px;
      border-radius: var(--sply-radius);
      z-index: 3000;
      font-size: 0.88rem;
      font-weight: 600;
      transition: all 250ms ease;
      opacity: 0;
      transform: translateY(12px);
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
  }, 3400);
}
