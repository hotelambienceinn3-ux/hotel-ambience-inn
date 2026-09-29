# Hotel Ambience Inn — Web Application

Hotel Ambience Inn is a boutique luxury hotel reservation system built for high-touch guest hospitality, real-time room availability tracking, direct bookings, and administrative property operations.

## Technology Stack

- **Frontend:** React 18, Vite 5, Tailwind CSS
- **Backend & Database:** Supabase (PostgreSQL, Row-Level Security, Edge API)
- **Authentication:** Supabase Auth (Guest & Admin Role-Based Access)

---

## Project Structure

```
HOTEL-AMBIENCE-INN/
│
├── frontend/                     # React + Vite Application
│   ├── src/
│   │   ├── components/           # Reusable UI Components (Header, Footer, AuthModal, Toast)
│   │   ├── pages/                # Page Views (Home, Rooms, Booking, Dashboards, Gallery, etc.)
│   │   ├── context/              # Global Application State (AppContext)
│   │   ├── services/             # Frontend Service Layer (authService, roomService, bookingService)
│   │   ├── lib/                  # Supabase Client Initialization (supabaseClient.js)
│   │   ├── data/                 # Hotel Information & Static Content
│   │   ├── App.jsx               # Main Content Router
│   │   ├── main.jsx              # Vite React Entry Point
│   │   └── index.css             # Tailwind Design System & Base Styling
│   ├── public/                   # Static Public Assets (emblem.svg, logo.svg)
│   ├── index.html                # HTML Template
│   ├── package.json              # Frontend Dependencies & Scripts
│   ├── vite.config.js            # Vite Configuration
│   ├── tailwind.config.js        # Tailwind Theme Tokens
│   └── postcss.config.js        # PostCSS Configuration
│
├── backend/                      # Supabase Platform Configurations
│   └── supabase/
│       ├── migrations/           # Schema Migrations
│       ├── functions/            # Edge Functions
│       └── README.md
│
├── database/                     # Database Definitions & Documentation
│   └── README.md
│
├── docs/                         # Project Documentation & Design References
│   └── Architecture/             # Architectural References & Design Mockups
│
├── tests/                        # Test Suites
│   ├── frontend/
│   ├── backend/
│   └── manual-testing/
│
├── .env.local                    # Local Environment Credentials (Git-Ignored)
├── .gitignore                    # Git Exclusion Rules
└── README.md                     # Project Guide
```

---

## Environment Configuration

Create a `.env.local` file in the project root directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

*Note: Never commit `.env.local` or expose real database keys in repository source code.*

---

## Development & Build Commands

Run development or build commands from the root directory or inside `frontend/`:

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
# or from root:
# npm run dev
```

### 3. Build for Production
```bash
npm run build
# or from frontend:
# cd frontend && npm run build
```

### 4. Preview Production Build
```bash
npm run preview
```
